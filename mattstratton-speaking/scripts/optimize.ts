/**
 * Standalone PDF optimizer — the Notist-independent on-ramp for new decks.
 *
 * After Notist is gone, adding a talk's slides is:
 *   1. drop the full-res export at  originals/{name}.pdf
 *   2. run  npm run optimize  (then npm run rasterize for viewer images)
 *   3. commit the generated  public/slides/{name}.pdf  (originals/ stays gitignored)
 *
 * Processes every originals/*.pdf into public/slides/*.pdf at PDF_DPI. Idempotent:
 * skips files already optimized unless --force. (The Notist migration uses the
 * same optimizer via scripts/ingest.ts; this is for ongoing use.)
 *
 * Run: npm run optimize            (only new/missing)
 *      npm run optimize -- --force (re-optimize everything)
 */
import { readdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { statSync } from 'node:fs';
import { optimizePdf, PDF_DPI } from './lib/pdf.ts';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const ORIGINALS_DIR = resolve(ROOT, 'originals');
const SLIDES_DIR = resolve(ROOT, 'public/slides'); // committed + served
const FORCE = process.argv.includes('--force');

async function main() {
  if (!existsSync(ORIGINALS_DIR)) {
    console.log('No originals/ directory — nothing to optimize.');
    return;
  }
  const pdfs = (await readdir(ORIGINALS_DIR)).filter((f) => f.toLowerCase().endsWith('.pdf'));
  if (!pdfs.length) {
    console.log('No PDFs in originals/.');
    return;
  }
  console.log(`Optimizing ${pdfs.length} PDF(s) to ${PDF_DPI}dpi${FORCE ? ' (force)' : ''}…`);

  let done = 0;
  let saved = 0;
  for (const name of pdfs) {
    const src = resolve(ORIGINALS_DIR, name);
    const dest = resolve(SLIDES_DIR, name);
    const before = statSync(src).size;
    await optimizePdf(src, dest, FORCE);
    const after = statSync(dest).size;
    saved += before - after;
    done++;
    console.log(`  ${name}: ${(before / 1e6).toFixed(1)}MB → ${(after / 1e6).toFixed(1)}MB`);
  }
  console.log(`Done. ${done} file(s), reclaimed ${(saved / 1e6).toFixed(0)}MB vs originals.`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
