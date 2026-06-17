/**
 * Notist -> Astro ingest.
 *
 * One-time but idempotent + re-runnable migration. Reads the Notist export index
 * (mattstratton.json), then for every presentation fetches the per-talk JSON, the
 * event JSON, and resolves the video (which is NOT in the JSON — it lives behind a
 * notist.ninja proxy in the rendered HTML). Downloads all assets locally so the
 * final site has zero dependency on noti.st / on.notist.cloud / notist.ninja.
 *
 * Outputs:
 *   src/content/talks/{id}.md       talk frontmatter
 *   src/content/events/{eventId}.md event frontmatter
 *   slides/{id}.pdf                 committed PDF (source of truth, 84 talks)
 *   slides/{id}/{n}.png             committed image-only slide sets (9 talks, no PDF)
 *   public/thumbnails/{id}.{ext}    committed thumbnails (85 talks)
 *
 * Raw Notist responses are cached under scripts/.cache/ so re-runs are offline-fast.
 * Hand edits: a top-level `manual:` frontmatter key is preserved verbatim across runs.
 *
 * Run: npm run ingest   (add --refresh to bypass cache, --limit=N to sample)
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml, stringify as stringifyYaml } from 'yaml';
import { optimizePdf } from './lib/pdf.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CACHE = resolve(ROOT, 'scripts/.cache');
const TALKS_DIR = resolve(ROOT, 'src/content/talks');
const EVENTS_DIR = resolve(ROOT, 'src/content/events');
const PUBLIC_SLIDES = resolve(ROOT, 'public/slides'); // committed + served: optimized PDFs + webp
const SLIDES_DIR = resolve(ROOT, 'slides'); // committed source for image-only talks (no PDF)
const ORIGINALS_DIR = resolve(ROOT, 'originals'); // gitignored: full-res Notist exports
const THUMBS_DIR = resolve(ROOT, 'public/thumbnails');

const REFRESH = process.argv.includes('--refresh');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1] ?? 0);

const UA = 'mattstratton-speaking-ingest/1.0 (+https://speaking.mattstratton.com)';

type Json = any;

// ---------- fetching with on-disk cache ----------

function cacheKey(url: string): string {
  return url.replace(/[^a-z0-9]+/gi, '_').slice(0, 180);
}

async function fetchText(url: string, ext = 'txt'): Promise<string | null> {
  const file = resolve(CACHE, `${cacheKey(url)}.${ext}`);
  if (!REFRESH && existsSync(file)) return readFile(file, 'utf8');
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.warn(`  ! ${res.status} ${url}`);
      return null;
    }
    const text = await res.text();
    await mkdir(CACHE, { recursive: true });
    await writeFile(file, text);
    return text;
  } catch (err) {
    console.warn(`  ! fetch failed ${url}: ${(err as Error).message}`);
    return null;
  }
}

async function fetchJson(url: string): Promise<Json | null> {
  const text = await fetchText(url, 'json');
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    console.warn(`  ! bad JSON ${url}`);
    return null;
  }
}

async function downloadBinary(url: string, dest: string): Promise<boolean> {
  if (existsSync(dest) && !REFRESH) return true;
  try {
    const res = await fetch(url, { headers: { 'User-Agent': UA } });
    if (!res.ok) {
      console.warn(`  ! ${res.status} ${url}`);
      return false;
    }
    const buf = Buffer.from(await res.arrayBuffer());
    await mkdir(dirname(dest), { recursive: true });
    await writeFile(dest, buf);
    return true;
  } catch (err) {
    console.warn(`  ! download failed ${url}: ${(err as Error).message}`);
    return false;
  }
}

// ---------- video resolution (HTML -> notist.ninja proxy -> provider id) ----------

async function resolveVideo(
  selfUrl: string,
): Promise<{ provider: 'youtube' | 'vimeo'; id: string } | null> {
  const html = await fetchText(selfUrl, 'html');
  if (!html) return null;
  // The video iframe carries class "embedded-video" and points at notist.ninja.
  if (!/embedded-video/.test(html)) return null;
  const embed = html.match(/notist\.ninja\/embed\/(\w+)/);
  if (!embed) return null;
  const proxy = await fetchText(`https://notist.ninja/embed/${embed[1]}`, 'html');
  if (!proxy) return null;
  const yt = proxy.match(/youtube(?:-nocookie)?\.com\/embed\/([\w-]+)/);
  if (yt) return { provider: 'youtube', id: yt[1] };
  const vm = proxy.match(/player\.vimeo\.com\/video\/(\d+)/);
  if (vm) return { provider: 'vimeo', id: vm[1] };
  // e.g. SpeakerDeck-era slide embeds reuse the embedded-video class — not a video.
  return null;
}

// ---------- frontmatter write (idempotent, preserves `manual:`) ----------

function cleanDate(s?: string | null): string | undefined {
  if (!s) return undefined;
  // Notist uses "YYYY-MM-DD HH:MM:SS"; emit ISO so zod z.coerce.date() is happy.
  return s.replace(' ', 'T');
}

async function writeContent(dir: string, id: string, managed: Record<string, unknown>) {
  const file = resolve(dir, `${id}.md`);
  let manual: unknown;
  if (existsSync(file)) {
    const existing = await readFile(file, 'utf8');
    const m = existing.match(/^---\n([\s\S]*?)\n---/);
    if (m) {
      try {
        manual = (parseYaml(m[1]) as Record<string, unknown> | null)?.manual;
      } catch {
        /* ignore unparseable existing frontmatter */
      }
    }
  }
  const data = manual !== undefined ? { ...managed, manual } : managed;
  const yaml = stringifyYaml(data, { lineWidth: 0 }).trimEnd();
  await mkdir(dir, { recursive: true });
  await writeFile(file, `---\n${yaml}\n---\n`);
}

// ---------- main ----------

async function main() {
  const index = JSON.parse(await readFile(resolve(ROOT, 'mattstratton.json'), 'utf8'));
  let presentations: Json[] = index.data[0].relationships.data;
  if (LIMIT > 0) presentations = presentations.slice(0, LIMIT);

  console.log(`Ingesting ${presentations.length} presentations${REFRESH ? ' (refresh)' : ''}…\n`);

  const eventsSeen = new Map<string, Json>(); // notistEventId -> event attributes
  const eventRefByTalk = new Map<string, string>();
  const redirects: string[] = []; // bare /{id} -> canonical /{id}/{slug}
  const stats = {
    talks: 0,
    pdf: 0,
    imageSlides: 0,
    noSlides: 0,
    video: 0,
    thumbs: 0,
    resources: 0,
  };

  for (const p of presentations) {
    const id = String(p.id).replace(/^pr_/, '');
    const selfUrl: string = p.links.self;
    const slug = selfUrl.replace(/\/+$/, '').split('/').pop()!;
    // Lowercase: Netlify normalizes mixed-case requests to lowercase before
    // matching, and our canonical pages are emitted lowercase. Bare /{id} → page.
    redirects.push(`/${id.toLowerCase()} /${id.toLowerCase()}/${slug} 301`);
    process.stdout.write(`• ${id} ${p.attributes.title.slice(0, 60)}\n`);

    const related: string = p.links.related; // https://noti.st/mattstratton/{id}.json
    const talkDoc = await fetchJson(related);
    const a = talkDoc?.data?.[0]?.attributes ?? {};

    // --- event (dedupe) ---
    let eventId: string | undefined;
    if (p.links.event) {
      const ev = await fetchJson(p.links.event);
      const er = ev?.data?.[0];
      if (er) {
        eventId = String(er.id).replace(/^ev_/, '');
        if (!eventsSeen.has(eventId)) eventsSeen.set(eventId, er.attributes);
        eventRefByTalk.set(id, eventId);
      }
    }

    // --- slides: PDF preferred, else Notist pre-rendered images, else none ---
    let slideSource: 'pdf' | 'images' | 'none' = 'none';
    let slidesPdf: string | null = null;
    let slideImageCount = 0;

    // Notist returns download="/" (not a real URL) for talks with no uploaded PDF —
    // e.g. the SpeakerDeck-era decks. Only treat an absolute http(s) URL as a PDF.
    if (typeof a.download === 'string' && a.download.startsWith('http')) {
      // Full-res original -> archive (gitignored); 300dpi optimized copy -> served public/slides/.
      const original = resolve(ORIGINALS_DIR, `${id}.pdf`);
      const ok = await downloadBinary(a.download, original);
      if (ok && (await optimizePdf(original, resolve(PUBLIC_SLIDES, `${id}.pdf`), REFRESH))) {
        slideSource = 'pdf';
        slidesPdf = `/slides/${id}.pdf`;
        stats.pdf++;
      }
    }
    if (slideSource === 'none') {
      const slides: Json[] = a.slidedeck?.data?.[0]?.slides ?? [];
      const imageUrls = slides.map((s) => s.image).filter(Boolean);
      if (imageUrls.length) {
        let n = 0;
        for (const url of imageUrls) {
          n++;
          await downloadBinary(url, resolve(SLIDES_DIR, id, `${n}.png`));
        }
        slideSource = 'images';
        slideImageCount = n;
        stats.imageSlides++;
      }
    }
    if (slideSource === 'none') stats.noSlides++;

    // --- thumbnail (image may be null) ---
    let thumbnail: string | null = null;
    const imgSrc: string | undefined = p.attributes.image?.src;
    if (imgSrc) {
      const ext = extname(new URL(imgSrc).pathname) || '.png';
      const ok = await downloadBinary(imgSrc, resolve(THUMBS_DIR, `${id}${ext}`));
      if (ok) {
        thumbnail = `/thumbnails/${id}${ext}`;
        stats.thumbs++;
      }
    }

    // --- video (HTML -> proxy) ---
    const video = await resolveVideo(selfUrl);
    if (video) stats.video++;

    // --- resources ---
    const resources = (a.resources?.data ?? [])
      .map((r: Json) => ({ title: r.title, url: r.url }))
      .filter((r: Json) => r.title && r.url);
    if (resources.length) stats.resources++;

    await writeContent(TALKS_DIR, id, {
      notistId: id,
      title: p.attributes.title,
      notistSlug: slug,
      presentedOn: cleanDate(p.attributes.presented_on),
      publishedOn: cleanDate(p.attributes.published_on),
      timezone: p.attributes.timezone,
      event: eventId,
      abstractHtml: a.blurb?.html ?? undefined,
      slideSource,
      slidesPdf,
      slideImageCount,
      video,
      resources,
      thumbnail,
    });
    stats.talks++;
  }

  // --- write events ---
  for (const [eventId, ev] of eventsSeen) {
    const lat = ev.latitude != null ? Number(ev.latitude) : undefined;
    const lon = ev.longitude != null ? Number(ev.longitude) : undefined;
    await writeContent(EVENTS_DIR, eventId, {
      notistEventId: eventId,
      name: ev.title,
      date: cleanDate(ev.starts_on),
      location: ev.address || undefined,
      url: ev.url || undefined,
      // Captured for a future map (issue #1). Guard against 0/NaN junk values.
      latitude: Number.isFinite(lat) && lat !== 0 ? lat : undefined,
      longitude: Number.isFinite(lon) && lon !== 0 ? lon : undefined,
    });
  }

  // Netlify URL-compat redirects: bare /{id} -> canonical /{id}/{slug}.
  const redirectsFile = resolve(ROOT, 'public/_redirects');
  await mkdir(dirname(redirectsFile), { recursive: true });
  await writeFile(
    redirectsFile,
    `# Generated by scripts/ingest.ts — Notist URL compatibility.\n` +
      `# Bare presentation id redirects to the canonical /{id}/{slug} page.\n` +
      redirects.join('\n') + '\n',
  );

  console.log(`\nDone.`);
  console.log(`  talks written:   ${stats.talks}`);
  console.log(`  events written:  ${eventsSeen.size}`);
  console.log(`  PDF slides:      ${stats.pdf}`);
  console.log(`  image slides:    ${stats.imageSlides}`);
  console.log(`  no slides:       ${stats.noSlides}`);
  console.log(`  videos resolved: ${stats.video}`);
  console.log(`  thumbnails:      ${stats.thumbs}`);
  console.log(`  with resources:  ${stats.resources}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
