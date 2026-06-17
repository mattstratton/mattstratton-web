/**
 * Slide rasterization — turns committed slide sources into the WebP images the
 * in-page slide browser displays:
 *
 *   public/slides/{id}.pdf  --pdftoppm PNG--> --sharp 1280px--> public/slides/{id}/{n}.webp
 *   slides/{id}/*.png       --sharp 1280px-->                   public/slides/{id}/{n}.webp
 *
 * Runs LOCALLY (needs `pdftoppm` from poppler), pre-commit — NOT in the deploy
 * build, because no static host (Netlify/CF/Vercel) ships poppler. The generated
 * WebP are committed to git, so the deploy build is just `astro build`: fast,
 * host-agnostic, no external tools. The download PDF (slides/{id}.pdf) is a
 * separate, higher-res artifact; these viewer images are kept light.
 *
 * Writes src/data/slide-counts.json so pages know each deck's slide count without
 * reading the filesystem. Incremental: skips decks already rendered unless --force.
 * Decks render concurrently (pdftoppm is single-threaded but CPU-bound).
 *
 * Run: npm run rasterize            (only missing)
 *      npm run rasterize -- --force (re-render everything)
 */
import { readdir, mkdir, writeFile, rm } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { resolve, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { tmpdir } from 'node:os';
import { cpus } from 'node:os';
import sharp from 'sharp';

const execFileAsync = promisify(execFile);
const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SLIDES_OUT = resolve(ROOT, 'public/slides'); // optimized PDFs live here too (served)
const IMG_SRC = resolve(ROOT, 'slides'); // committed PNG source for image-only talks
const COUNTS_FILE = resolve(ROOT, 'src/data/slide-counts.json');
const FORCE = process.argv.includes('--force');

const RASTER_DPI = 150; // pdftoppm render resolution before downscaling
const WEBP_WIDTH = 1280; // viewer image width — crisp in-page, light to ship
const WEBP_QUALITY = 75;
const CONCURRENCY = Math.max(2, cpus().length - 1);

const numeric = (a: string, b: string) =>
  (a.match(/\d+/)?.[0] ?? '0').padStart(8, '0').localeCompare(
    (b.match(/\d+/)?.[0] ?? '0').padStart(8, '0'),
  );

async function pngToWebp(pngPath: string, outPath: string) {
  await sharp(pngPath).resize({ width: WEBP_WIDTH, withoutEnlargement: true }).webp({ quality: WEBP_QUALITY }).toFile(outPath);
}

/** Run async tasks with a bounded concurrency pool. */
async function pool<T>(items: T[], limit: number, worker: (item: T) => Promise<void>) {
  let i = 0;
  const runners = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (i < items.length) {
      const item = items[i++];
      await worker(item);
    }
  });
  await Promise.all(runners);
}

/** Render a PDF to a directory of sequential WebP slides. Returns slide count. */
async function rasterizePdf(pdfPath: string, outDir: string): Promise<number> {
  const tmp = join(tmpdir(), `slides-${process.pid}-${Math.abs(hash(pdfPath))}`);
  await mkdir(tmp, { recursive: true });
  try {
    // pdftoppm -> tmp/page-1.png, page-2.png, …
    await execFileAsync('pdftoppm', ['-r', String(RASTER_DPI), '-png', pdfPath, join(tmp, 'page')]);
    const pages = (await readdir(tmp)).filter((f) => f.endsWith('.png')).sort(numeric);
    await mkdir(outDir, { recursive: true });
    let n = 0;
    for (const p of pages) {
      n++;
      await pngToWebp(join(tmp, p), join(outDir, `${n}.webp`));
    }
    return n;
  } finally {
    await rm(tmp, { recursive: true, force: true });
  }
}

/** Convert a committed dir of PNG slides (image-only talks) to WebP. */
async function convertImageDir(srcDir: string, outDir: string): Promise<number> {
  const pngs = (await readdir(srcDir)).filter((f) => f.toLowerCase().endsWith('.png')).sort(numeric);
  await mkdir(outDir, { recursive: true });
  let n = 0;
  for (const p of pngs) {
    n++;
    await pngToWebp(join(srcDir, p), join(outDir, `${n}.webp`));
  }
  return n;
}

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return h;
}

async function main() {
  // PDFs (optimized, served) live in public/slides/*.pdf; image-only sources in slides/.
  const pdfs = existsSync(SLIDES_OUT)
    ? (await readdir(SLIDES_OUT, { withFileTypes: true }))
        .filter((e) => e.isFile() && e.name.endsWith('.pdf'))
        .map((e) => e.name)
    : [];
  const imageDirs = existsSync(IMG_SRC)
    ? (await readdir(IMG_SRC, { withFileTypes: true })).filter((e) => e.isDirectory()).map((e) => e.name)
    : [];

  if (!pdfs.length && !imageDirs.length) {
    console.log('No slide sources found — nothing to rasterize.');
    await writeManifest({});
    return;
  }

  console.log(
    `Rasterizing ${pdfs.length} PDF deck(s) + ${imageDirs.length} image deck(s) to ${WEBP_WIDTH}px webp, ${CONCURRENCY} at a time${FORCE ? ' (force)' : ''}…`,
  );

  const counts: Record<string, number> = {};
  let rendered = 0;

  const decks = [
    ...pdfs.map((pdf) => ({ id: pdf.replace(/\.pdf$/, ''), kind: 'pdf' as const, src: resolve(SLIDES_OUT, pdf) })),
    ...imageDirs.map((id) => ({ id, kind: 'images' as const, src: resolve(IMG_SRC, id) })),
  ];

  await pool(decks, CONCURRENCY, async (deck) => {
    const outDir = resolve(SLIDES_OUT, deck.id);
    if (existsSync(outDir) && !FORCE) {
      counts[deck.id] = (await readdir(outDir)).filter((f) => f.endsWith('.webp')).length;
      return;
    }
    counts[deck.id] =
      deck.kind === 'pdf' ? await rasterizePdf(deck.src, outDir) : await convertImageDir(deck.src, outDir);
    rendered++;
    process.stdout.write(`  ${deck.id}: ${counts[deck.id]} slides${deck.kind === 'images' ? ' (from images)' : ''}\n`);
  });

  await writeManifest(counts);
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  console.log(`Done. ${rendered} deck(s) rendered, ${Object.keys(counts).length} total, ${total} slides.`);
}

async function writeManifest(counts: Record<string, number>) {
  await mkdir(dirname(COUNTS_FILE), { recursive: true });
  await writeFile(COUNTS_FILE, JSON.stringify(counts, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
