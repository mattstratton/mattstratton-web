/**
 * Slide-text extraction — pulls the text layer out of each committed PDF deck so
 * slide content is searchable (and survives as plain text):
 *
 *   public/slides/{id}.pdf  --pdftotext--> cleanPdfText --> public/slides/{id}.txt
 *
 * WHY: 76 decks carry text the search index couldn't see. Extracting it makes
 * "that talk where I had a slide about X" findable, and is a durable plaintext
 * fallback alongside the committed PDF. Feeds the same deep-index.json the
 * transcripts use (search inside talks).
 *
 * Runs LOCALLY (needs `pdftotext` from poppler — already a dep via rasterize's
 * pdftoppm), pre-commit — NOT in the deploy build. Writes src/data/slide-text.json
 * so pages/search know which decks have extractable text without the FS.
 *
 * Idempotent + manual-edit-safe: a deck with an existing .txt is left untouched
 * (image-only PDFs with no text layer are skipped and reported). --force redoes.
 *
 * Run: npm run slide-text                (only decks missing extracted text)
 *      npm run slide-text -- --force     (re-extract everything)
 *      npm run slide-text -- --limit=3   (sample the first N decks)
 */
import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { cpus } from 'node:os';
import { cleanPdfText } from './lib/pdf-text.ts';

const execFileAsync = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLIDES_DIR = resolve(ROOT, 'public/slides'); // committed PDFs + their .txt
const MANIFEST = resolve(ROOT, 'src/data/slide-text.json');

const FORCE = process.argv.includes('--force');
const LIMIT = Number(process.argv.find((a) => a.startsWith('--limit='))?.split('=')[1]) || Infinity;
const CONCURRENCY = Math.max(2, cpus().length - 1);

const wordCount = (text: string) => {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
};

/** Run async tasks with a bounded concurrency pool (mirrors rasterize.ts). */
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) await worker(items[i++]);
  });
  await Promise.all(runners);
}

async function main() {
  if (!existsSync(SLIDES_DIR)) {
    console.log('No public/slides/ directory — nothing to extract.');
    return;
  }
  const pdfs = (await readdir(SLIDES_DIR))
    .filter((f) => f.endsWith('.pdf'))
    .sort()
    .slice(0, LIMIT);

  console.log(`${pdfs.length} PDF deck(s) to process${FORCE ? ' (force re-extract)' : ''}, ${CONCURRENCY} at a time…`);

  const manifest: Record<string, { words: number }> = existsSync(MANIFEST)
    ? JSON.parse(await readFile(MANIFEST, 'utf8'))
    : {};

  let extracted = 0;
  let empty = 0;

  await pool(pdfs, CONCURRENCY, async (pdf) => {
    const id = pdf.replace(/\.pdf$/, '');
    const dest = resolve(SLIDES_DIR, `${id}.txt`);

    // Existing extraction: keep it (manual-edit-safe), just refresh word count.
    if (existsSync(dest) && !FORCE) {
      manifest[id] = { words: wordCount(await readFile(dest, 'utf8')) };
      return;
    }

    const { stdout } = await execFileAsync('pdftotext', ['-q', resolve(SLIDES_DIR, pdf), '-'], {
      maxBuffer: 64 * 1024 * 1024,
    });
    const text = cleanPdfText(stdout);
    if (!text) {
      empty++;
      delete manifest[id];
      process.stdout.write(`  ${id}: no text layer (image-only PDF)\n`);
      return;
    }
    await writeFile(dest, text + '\n');
    manifest[id] = { words: wordCount(text) };
    extracted++;
    process.stdout.write(`  ${id}: ${manifest[id].words} words\n`);
  });

  const sorted = Object.fromEntries(Object.entries(manifest).sort(([a], [b]) => a.localeCompare(b)));
  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(sorted, null, 2) + '\n');

  console.log(`Done. ${extracted} extracted, ${empty} without a text layer, ${Object.keys(sorted).length} decks with text.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
