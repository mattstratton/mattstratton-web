/**
 * Cross-post a selected dev.to article into the mattstratton.com `writing`
 * collection: rehosts images, delinks Liquid-tag embeds, maps dev.to tags to
 * topics, and sets the source post's canonical_url to the new mattstratton.com
 * URL — in one pass, so a single commit can update both sides atomically.
 *
 * Deliberately manual/curated, not a bulk pipeline: writes files only, never
 * runs git. Eligible posts are opt-in (`crosspost: true`) and must already be
 * git-owned (have an `id`). Create-only: refuses to touch a writing entry that
 * already exists, so a later run can never clobber manual edits.
 *
 * Run: npm run crosspost -- <devto-filename> [--slug x] [--pub-date x] [--override-canonical] [--skip-if-exists]
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import YAML from 'yaml';

const ROOT = fileURLToPath(new URL('..', import.meta.url));
const DEVTO_POSTS_DIR = join(ROOT, 'mattstratton-dev-to', 'posts');
const WRITING_DIR = join(ROOT, 'src', 'content', 'writing');
const PUBLIC_WRITING_DIR = join(ROOT, 'public', 'writing');

// ── Pure helpers (unit-tested in crosspost-devto.test.ts) ───────────────────

/** Split YAML frontmatter from body on the first `---` delimiter pair only. */
export function splitFrontmatter(raw: string): { fm: string; body: string } {
  const lines = raw.split('\n');
  if (lines[0]?.trim() !== '---') throw new Error('no opening frontmatter delimiter');
  let end = -1;
  for (let i = 1; i < lines.length; i++) {
    if (lines[i]?.trim() === '---') { end = i; break; }
  }
  if (end === -1) throw new Error('no closing frontmatter delimiter');
  return { fm: lines.slice(1, end).join('\n'), body: lines.slice(end + 1).join('\n') };
}

/**
 * Strip dev.to's random slug suffix (e.g. `-1fce`, `-265j`, `-cel`) from a
 * filename, if present. Only strips when at least 3 word segments would
 * remain, to avoid mangling short git-native filenames like `zshrc-tour.md`
 * (2 segments — never touched by dev.to's slug generator) into `zshrc`.
 * This is a heuristic, not a guarantee — always confirm the result.
 */
export function deriveSlug(filename: string): string {
  const base = filename.replace(/\.md$/, '');
  const segments = base.split('-');
  const last = segments[segments.length - 1];
  if (segments.length >= 4 && /^[a-z0-9]{2,4}$/.test(last)) {
    return segments.slice(0, -1).join('-');
  }
  return base;
}

/** dev.to's `tags` field is sometimes a single string, sometimes an array,
 *  sometimes comma-separated — normalize to a trimmed, non-empty string[]. */
export function tagsToTopics(tags: unknown): string[] {
  if (tags == null) return [];
  const raw = Array.isArray(tags) ? tags.map(String) : String(tags).split(',');
  return raw.map((t) => t.trim()).filter((t) => t.length > 0);
}

export interface PubDateResult { date: Date; source: 'frontmatter' | 'cli' | 'git' | 'today'; }

/** Priority: existing frontmatter date > CLI override > git first-commit date > today. */
export function resolvePubDate(fmDate: unknown, cliOverride: string | undefined, gitDateFallback: string | undefined): PubDateResult {
  if (typeof fmDate === 'string' && fmDate.trim()) return { date: new Date(fmDate), source: 'frontmatter' };
  if (cliOverride) return { date: new Date(cliOverride), source: 'cli' };
  if (gitDateFallback) return { date: new Date(gitDateFallback), source: 'git' };
  return { date: new Date(), source: 'today' };
}

/** Every `![alt](url)` in the body, plus cover_image if present, deduped. */
export function extractImageUrls(body: string, coverImage: string | undefined): string[] {
  const urls = new Set<string>();
  if (coverImage) urls.add(coverImage);
  const re = /!\[[^\]]*\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(body))) urls.add(m[1]);
  return [...urls];
}

/** Rewrite every occurrence of a mapped original URL/path to its new local path. */
export function rewriteImageReferences(
  body: string,
  coverImage: string | undefined,
  urlMap: Map<string, string>,
): { body: string; coverImage: string | undefined } {
  let newBody = body;
  for (const [orig, local] of urlMap) newBody = newBody.split(orig).join(local);
  const newCover = coverImage != null && urlMap.has(coverImage) ? urlMap.get(coverImage) : coverImage;
  return { body: newBody, coverImage: newCover };
}

/** dev.to wraps some images in its own resize proxy (media2.dev.to/dynamic/image/.../<url-encoded original>) —
 *  unwrap to the real origin URL so filename derivation and downloads target the actual asset. */
export function unwrapMedia2Url(url: string): string {
  const m = url.match(/^https?:\/\/media2\.dev\.to\/dynamic\/image\/[^/]*\/(https?%3A%2F%2F.+)$/i);
  if (!m) return url;
  try { return decodeURIComponent(m[1]); } catch { return url; }
}

const IMAGE_EXT_RE = /\.(png|jpe?g|gif|webp|svg)$/i;

/** Derive a sane local filename from an image URL or relative path. */
export function deriveImageFilename(url: string, fallbackIndex: number): string {
  const real = unwrapMedia2Url(url);
  try {
    const u = new URL(real, 'https://placeholder.invalid');
    const last = decodeURIComponent(u.pathname.split('/').pop() || '');
    if (last && IMAGE_EXT_RE.test(last)) return last;
  } catch { /* not a valid URL shape, fall through */ }
  return `image-${fallbackIndex}.png`;
}

/** Only two Liquid-tag embed types are in use anywhere in the archive — delink
 *  both to plain markdown links rather than building embed components. */
export function delinkEmbeds(body: string): string {
  return body
    .replace(/\{%\s*youtube\s+([\w-]+)\s*%\}/g, '[Watch on YouTube](https://www.youtube.com/watch?v=$1)')
    .replace(/\{%\s*twitter\s+(\d+)\s*%\}/g, '[View the original post](https://twitter.com/i/web/status/$1)');
}

/**
 * Set (or insert) `canonical_url` in a raw YAML frontmatter block via targeted
 * line replacement, WITHOUT parsing+re-stringifying the whole block. Round-tripping
 * through `YAML.stringify` silently drops quotes from scalars like an ISO date
 * (`date: '2020-01-30T21:33:31Z'` -> `date: 2020-01-30T21:33:31Z`) that don't need
 * them under this library's own YAML 1.2 core schema — but dev.to's Ruby backend
 * parses that unquoted scalar as a native Time object and its safe-loader rejects
 * it (`Tried to load unspecified class: Time`, HTTP 422). Editing only the one
 * line we actually mean to change avoids touching any other field's formatting.
 */
export function setCanonicalUrl(fmRaw: string, url: string): string {
  const quoted = `canonical_url: '${url}'`;
  if (/^canonical_url:.*$/m.test(fmRaw)) {
    return fmRaw.replace(/^canonical_url:.*$/m, quoted);
  }
  return `${fmRaw.replace(/\n$/, '')}\n${quoted}`;
}

/** Refuse (unless overridden) if the post's existing canonical_url points anywhere
 *  other than dev.to itself — that means its true canonical predates dev.to (Medium,
 *  a tigerdata.com blog post, etc.) and deciding where canonical should point is a
 *  human judgment call, not a mechanical default. */
export function checkCanonicalHost(existingCanonicalUrl: string | undefined, override: boolean): void {
  if (!existingCanonicalUrl) return;
  let host: string;
  try { host = new URL(existingCanonicalUrl).hostname; } catch { return; }
  if (host === 'dev.to' || host.endsWith('.dev.to')) return;
  if (override) return;
  throw new Error(
    `existing canonical_url points to ${host}, not dev.to — this post's true canonical may be elsewhere. ` +
    `Decide manually whether the new writing entry's canonicalUrl should point there instead, and whether ` +
    `dev.to's canonical_url should be touched at all. Re-run with --override-canonical to proceed anyway.`,
  );
}

export interface WritingFrontmatterInput {
  title: string;
  description: string;
  pubDate: Date;
  topics: string[];
  heroImage?: string;
}

/** Assembles the new `writing` entry's frontmatter. Deliberately never sets
 *  `canonicalUrl` (mattstratton.com is becoming canonical, not deferring
 *  elsewhere) or `part` (reserved for the curated Postgres arc only). */
export function buildWritingFrontmatter(input: WritingFrontmatterInput): Record<string, unknown> {
  const fm: Record<string, unknown> = {
    title: input.title,
    description: input.description,
    pubDate: input.pubDate.toISOString().slice(0, 10),
    topics: input.topics,
    draft: false,
  };
  if (input.heroImage) fm.heroImage = input.heroImage;
  return fm;
}

// ── Driver ───────────────────────────────────────────────────────────────────

function parseArgs(argv: string[]) {
  const positional: string[] = [];
  const opts: { slug?: string; pubDate?: string; overrideCanonical: boolean; skipIfExists: boolean } = {
    overrideCanonical: false,
    skipIfExists: false,
  };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--slug') opts.slug = argv[++i];
    else if (a === '--pub-date') opts.pubDate = argv[++i];
    else if (a === '--override-canonical') opts.overrideCanonical = true;
    else if (a === '--skip-if-exists') opts.skipIfExists = true;
    else positional.push(a);
  }
  return { file: positional[0], ...opts };
}

function listEligiblePosts(): string[] {
  return readdirSync(DEVTO_POSTS_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => {
      try {
        const { fm } = splitFrontmatter(readFileSync(join(DEVTO_POSTS_DIR, f), 'utf8'));
        const parsed = YAML.parse(fm) as Record<string, unknown>;
        return !!parsed.id && parsed.crosspost === true;
      } catch { return false; }
    });
}

async function downloadImage(url: string, destPath: string): Promise<void> {
  const res = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0 (compatible; mattstratton-crosspost-script/1.0)' } });
  if (!res.ok) throw new Error(`failed to download ${url}: HTTP ${res.status}`);
  writeFileSync(destPath, Buffer.from(await res.arrayBuffer()));
}

function gitFirstCommitDate(absPath: string): string | undefined {
  try {
    const rel = relative(ROOT, absPath);
    const out = execFileSync('git', ['log', '--follow', '--diff-filter=A', '--format=%aI', '--', rel], { cwd: ROOT, encoding: 'utf8' });
    const dates = out.trim().split('\n').filter(Boolean);
    return dates.length ? dates[dates.length - 1] : undefined;
  } catch {
    return undefined;
  }
}

async function main() {
  const { file, slug: slugOverride, pubDate: pubDateOverride, overrideCanonical, skipIfExists } = parseArgs(process.argv.slice(2));

  if (!file) {
    const eligible = listEligiblePosts();
    console.log('Usage: npm run crosspost -- <devto-filename> [--slug x] [--pub-date x] [--override-canonical] [--skip-if-exists]\n');
    console.log(eligible.length ? 'Eligible posts (crosspost: true, has id):' : 'No eligible posts found (need crosspost: true and an existing id).');
    for (const f of eligible) console.log(`  - ${f}`);
    process.exitCode = eligible.length ? 0 : 1;
    return;
  }

  const filename = file.endsWith('.md') ? file : `${file}.md`;
  const sourcePath = join(DEVTO_POSTS_DIR, filename);
  if (!existsSync(sourcePath)) throw new Error(`not found: ${sourcePath}`);

  const raw = readFileSync(sourcePath, 'utf8');
  const { fm: fmRaw, body } = splitFrontmatter(raw);
  const fm = YAML.parse(fmRaw) as Record<string, unknown>;

  if (!fm.id) throw new Error(`${filename} has no id — not git-owned yet, cannot crosspost.`);
  if (fm.crosspost !== true) throw new Error(`${filename} is not flagged for crosspost — add \`crosspost: true\` to its frontmatter first.`);

  const slug = slugOverride || deriveSlug(filename);
  const targetPath = join(WRITING_DIR, `${slug}.md`);
  if (existsSync(targetPath)) {
    if (skipIfExists) {
      console.log(`${targetPath} already exists — skipping (--skip-if-exists).`);
      return;
    }
    throw new Error(`${targetPath} already exists — already crossposted, or a slug collision. Use --slug to disambiguate.`);
  }
  checkCanonicalHost(typeof fm.canonical_url === 'string' ? fm.canonical_url : undefined, overrideCanonical);
  console.log(`Derived slug: ${slug} (from ${filename}) — confirm this reads well as a URL before committing.`);

  const { date: pubDate, source } = resolvePubDate(fm.date, pubDateOverride, gitFirstCommitDate(sourcePath));
  if (source !== 'frontmatter') console.warn(`⚠ pubDate resolved via "${source}" fallback: ${pubDate.toISOString().slice(0, 10)} — verify before committing.`);

  const topics = tagsToTopics(fm.tags);
  for (const t of topics) if (t.length < 5) console.warn(`⚠ topic "${t}" looks short/truncated — verify/expand manually.`);

  const coverImageRaw = typeof fm.cover_image === 'string' ? fm.cover_image : undefined;
  const imageUrls = extractImageUrls(body, coverImageRaw);
  const urlMap = new Map<string, string>();
  const destDir = join(PUBLIC_WRITING_DIR, slug);
  if (imageUrls.length) mkdirSync(destDir, { recursive: true });

  let idx = 1;
  for (const orig of imageUrls) {
    const isRemote = /^https?:\/\//i.test(orig);
    const localFilename = deriveImageFilename(orig, idx++);
    const destPath = join(destDir, localFilename);
    if (isRemote) {
      await downloadImage(unwrapMedia2Url(orig), destPath);
    } else {
      copyFileSync(join(DEVTO_POSTS_DIR, orig.replace(/^\.\//, '')), destPath);
    }
    urlMap.set(orig, `/writing/${slug}/${localFilename}`);
  }

  const { body: rewrittenBody, coverImage: rewrittenCover } = rewriteImageReferences(body, coverImageRaw, urlMap);
  const delinkedBody = delinkEmbeds(rewrittenBody);
  const finalBody = delinkedBody.trim();

  const newFm = buildWritingFrontmatter({
    title: String(fm.title ?? slug),
    description: String(fm.description ?? ''),
    pubDate,
    topics,
    heroImage: rewrittenCover,
  });
  const newFile = `---\n${YAML.stringify(newFm, { lineWidth: 0 }).trimEnd()}\n---\n\n${finalBody}\n`;
  mkdirSync(WRITING_DIR, { recursive: true });
  writeFileSync(targetPath, newFile, 'utf8');

  const mattstrattonUrl = `https://www.mattstratton.com/writing/${slug}/`;
  const updatedSource = `---\n${setCanonicalUrl(fmRaw, mattstrattonUrl)}\n---\n${body}`;
  writeFileSync(sourcePath, updatedSource, 'utf8');

  console.log(`\nWrote ${relative(ROOT, targetPath)}`);
  console.log(`Updated ${relative(ROOT, sourcePath)}: canonical_url → ${mattstrattonUrl}`);
  console.log('\nReview before committing:');
  console.log('  - Slug reads well as a URL');
  console.log('  - Topic tags are real words, not truncated dev.to slugs');
  console.log('  - Body doesn\'t carry dev.to-specific framing ("this platform", "comment below", etc.)');
  console.log('  - Rehosted images downloaded correctly and look right');
  console.log('  - `part` is left unset unless this genuinely belongs in the Postgres field guide arc');
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  main().catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  });
}
