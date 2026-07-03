/**
 * Speaker-kit headshot processor for /bio.
 *
 * Mirrors Notist's "Photos for publication": each headshot is offered at several
 * sizes so event organizers grab the resolution they need. Drop a full-res
 * headshot at public/headshots/{name}.{png,jpg} and this generates a size ladder
 * (JPEG, for broad publication compatibility) plus a manifest the bio page reads.
 * The original file stays as the highest-quality download.
 *
 * Workflow: add public/headshots/{name}.png → npm run headshots → list {name} in
 * src/data/bio.ts → commit public/headshots/.
 *
 * Run: npm run headshots            (only missing)
 *      npm run headshots -- --force (regenerate all)
 */
import { readdir, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve, dirname, extname, basename } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIR = resolve(ROOT, 'public/headshots');
const MANIFEST = resolve(ROOT, 'src/data/headshots.json');
const FORCE = process.argv.includes('--force');

// Notist-style ladder, by width. Heights stay proportional to each source.
const RUNGS = [
  { label: 'Thumb', width: 600 },
  { label: 'Medium', width: 1200 },
  { label: 'Large', width: 1600 },
];
const QUALITY = 86;

type SizeEntry = { label: string; src: string; w: number; h: number };

async function main() {
  if (!existsSync(DIR)) {
    console.log('No public/headshots/ directory — nothing to do.');
    await write({});
    return;
  }
  // Sources are the original PNG/JPG (not our generated -NNN.jpg ladder files).
  const sources = (await readdir(DIR)).filter(
    (f) => /\.(png|jpe?g)$/i.test(f) && !/-\d+\.jpe?g$/i.test(f),
  );
  if (!sources.length) {
    console.log('No source headshots in public/headshots/.');
    await write({});
    return;
  }

  const manifest: Record<string, { sizes: SizeEntry[]; original: SizeEntry }> = {};
  console.log(`Processing ${sources.length} headshot(s)…`);

  for (const file of sources) {
    const name = basename(file, extname(file));
    const img = sharp(resolve(DIR, file));
    const meta = await img.metadata();
    const srcW = meta.width ?? 0;
    const srcH = meta.height ?? 0;

    const sizes: SizeEntry[] = [];
    for (const rung of RUNGS) {
      if (rung.width >= srcW) continue; // never upscale
      const out = `${name}-${rung.width}.jpg`;
      const h = Math.round((srcH / srcW) * rung.width);
      if (!existsSync(resolve(DIR, out)) || FORCE) {
        await sharp(resolve(DIR, file))
          .resize({ width: rung.width, withoutEnlargement: true })
          .jpeg({ quality: QUALITY, mozjpeg: true })
          .toFile(resolve(DIR, out));
      }
      sizes.push({ label: `${rung.label} (${rung.width}×${h})`, src: `/headshots/${out}`, w: rung.width, h });
    }
    const original: SizeEntry = {
      label: `Original (${srcW}×${srcH})`,
      src: `/headshots/${file}`,
      w: srcW,
      h: srcH,
    };
    manifest[name] = { sizes, original };
    console.log(`  ${name}: ${sizes.length} size(s) + original (${srcW}×${srcH})`);
  }

  await write(manifest);
  console.log('Done.');
}

async function write(manifest: object) {
  await mkdir(dirname(MANIFEST), { recursive: true });
  await writeFile(MANIFEST, JSON.stringify(manifest, null, 2) + '\n');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
