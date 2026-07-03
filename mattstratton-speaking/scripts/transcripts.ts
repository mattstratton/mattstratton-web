/**
 * Transcript generation — fetches captions for talks that have a video and
 * commits a clean, readable transcript per talk:
 *
 *   video {provider,id}  --yt-dlp (tmp VTT)--> cleanVtt --> public/transcripts/{notistId}.txt
 *
 * WHY this exists: videos are the one asset class the site doesn't own — a
 * YouTube/Vimeo id pointing at someone else's server. If that video dies, the
 * talk's content dies with it. A committed transcript is the durable archival
 * record that survives, and it doubles as deep search material.
 *
 * Runs LOCALLY (needs `yt-dlp`), pre-commit — NOT in the deploy build. The raw
 * VTT is fetched to a temp dir and discarded; only the cleaned .txt is committed
 * (the rolling-window VTT is ~10x larger and its only extra — timestamps — is
 * useless once the video it indexes is gone). Writes src/data/transcripts.json
 * so pages/search know which talks have a transcript without touching the FS.
 *
 * Idempotent + manual-edit-safe: a talk with an existing .txt is left untouched
 * (no re-fetch, no clobber), so hand-corrected transcripts and manually-dropped
 * ones (e.g. Vimeo, or videos with no captions) survive re-runs. --force re-fetches.
 *
 * Run: npm run transcripts                 (only talks missing a transcript)
 *      npm run transcripts -- --force      (re-fetch + overwrite everything)
 *      npm run transcripts -- --limit=3    (sample the first N video talks)
 */
import { readdir, readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { parse as parseYaml } from 'yaml';
import { cleanVtt, wordCount } from './lib/vtt.ts';

const execFileAsync = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const TALKS_DIR = resolve(ROOT, 'src/content/talks');
const OUT_DIR = resolve(ROOT, 'public/transcripts'); // committed + served
const MANIFEST = resolve(ROOT, 'src/data/transcripts.json');

const FORCE = process.argv.includes('--force');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]) || Infinity;
const CONCURRENCY = 4; // modest — these are network calls to YouTube/Vimeo

interface VideoTalk {
  notistId: string;
  provider: 'youtube' | 'vimeo';
  videoId: string;
}

const videoUrl = (t: VideoTalk) =>
  t.provider === 'youtube'
    ? `https://www.youtube.com/watch?v=${t.videoId}`
    : `https://vimeo.com/${t.videoId}`;

/** Read every talk file, return those with a video reference. */
async function videoTalks(): Promise<VideoTalk[]> {
  const files = (await readdir(TALKS_DIR)).filter((f) => f.endsWith('.md'));
  const out: VideoTalk[] = [];
  for (const f of files) {
    const src = await readFile(resolve(TALKS_DIR, f), 'utf8');
    const fm = src.match(/^---\n([\s\S]*?)\n---/);
    if (!fm) continue;
    const data = parseYaml(fm[1]) as {
      notistId?: string;
      video?: { provider?: 'youtube' | 'vimeo'; id?: string } | null;
    };
    if (data?.notistId && data.video?.provider && data.video?.id) {
      out.push({ notistId: data.notistId, provider: data.video.provider, videoId: String(data.video.id) });
    }
  }
  return out.sort((a, b) => a.notistId.localeCompare(b.notistId));
}

/** Fetch captions to a temp dir and return cleaned text, or null if none exist. */
async function fetchTranscript(talk: VideoTalk): Promise<string | null> {
  const tmp = join(tmpdir(), `transcript-${process.pid}-${talk.notistId}`);
  await mkdir(tmp, { recursive: true });
  try {
    await execFileAsync(
      'yt-dlp',
      [
        '--skip-download',
        '--write-auto-subs',
        '--write-subs',
        '--sub-langs',
        'en.*',
        '--sub-format',
        'vtt',
        '--no-warnings',
        '-o',
        join(tmp, '%(id)s.%(ext)s'),
        videoUrl(talk),
      ],
      { maxBuffer: 64 * 1024 * 1024 },
    ).catch(() => undefined); // a video with no captions isn't an error

    const vtts = (await readdir(tmp)).filter((f) => f.endsWith('.vtt'));
    if (!vtts.length) return null;
    // Prefer the original auto-caption track (en-orig) over a translated one.
    const pick = vtts.find((f) => /orig/.test(f)) ?? vtts.sort((a, b) => a.length - b.length)[0];
    const cleaned = cleanVtt(await readFile(join(tmp, pick), 'utf8'));
    return cleaned.trim() ? cleaned : null;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

/** Bounded-concurrency pool (mirrors scripts/rasterize.ts). */
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await worker(items[i++]);
  });
  await Promise.all(runners);
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  const all = await videoTalks();
  const talks = all.slice(0, LIMIT);
  console.log(
    `${all.length} talk(s) with video; processing ${talks.length}${FORCE ? ' (force re-fetch)' : ''}, ${CONCURRENCY} at a time…`,
  );

  // Start from existing transcripts so untouched talks stay in the manifest.
  const manifest: Record<string, { words: number }> = existsSync(MANIFEST)
    ? JSON.parse(await readFile(MANIFEST, 'utf8'))
    : {};

  let fetched = 0;
  let missing = 0;

  await pool(talks, CONCURRENCY, async (talk) => {
    const dest = resolve(OUT_DIR, `${talk.notistId}.txt`);

    // Existing transcript: keep it (manual-edit-safe), just refresh its word count.
    // Spread the existing entry so the transcript-cleanup `cleaned` flag survives.
    if (existsSync(dest) && !FORCE) {
      manifest[talk.notistId] = { ...manifest[talk.notistId], words: wordCount(await readFile(dest, 'utf8')) };
      return;
    }

    const text = await fetchTranscript(talk);
    if (!text) {
      missing++;
      process.stdout.write(`  ${talk.notistId}: no captions available\n`);
      return;
    }
    await writeFile(dest, text + '\n');
    // Fresh raw fetch — intentionally does NOT carry over a stale `cleaned` flag.
    manifest[talk.notistId] = { words: wordCount(text) };
    fetched++;
    process.stdout.write(`  ${talk.notistId}: ${manifest[talk.notistId].words} words\n`);
  });

  // Sort the manifest by id for a stable, diff-friendly file.
  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

  console.log(
    `Done. ${fetched} fetched, ${missing} without captions, ${Object.keys(sorted).length} transcripts total.`,
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
