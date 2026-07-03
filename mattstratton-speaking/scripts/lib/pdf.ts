/**
 * Shared PDF optimization. Notist exports (and many Keynote/PowerPoint exports)
 * embed images at far higher resolution than slides ever display, producing
 * wildly bloated files. We keep the full-res original as a durable archive and
 * commit a downsampled web copy that is visually identical on screen.
 *
 * Runs LOCALLY (needs Ghostscript), before git — never in the Netlify build.
 * Used by both the one-time Notist ingest and the ongoing `npm run optimize`
 * path for new decks after Notist is gone.
 */
import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import { dirname } from 'node:path';

const execFileAsync = promisify(execFile);

export const PDF_DPI = 300;

let gsChecked = false;
let gsAvailable = false;

export async function hasGhostscript(): Promise<boolean> {
  if (gsChecked) return gsAvailable;
  gsChecked = true;
  try {
    await execFileAsync('gs', ['--version']);
    gsAvailable = true;
  } catch {
    gsAvailable = false;
    console.warn('  ! Ghostscript (gs) not found — committing PDFs un-optimized.');
  }
  return gsAvailable;
}

/**
 * Optimize `src` into `dest` at PDF_DPI. Idempotent (skips if dest exists unless
 * force). Falls back to copying the original through if gs is missing or the
 * "optimized" output would be larger, so the pipeline always produces a usable PDF.
 */
export async function optimizePdf(src: string, dest: string, force = false): Promise<boolean> {
  if (existsSync(dest) && !force) return true;
  await mkdir(dirname(dest), { recursive: true });

  if (!(await hasGhostscript())) {
    await writeFile(dest, await readFile(src));
    return true;
  }
  try {
    await execFileAsync('gs', [
      '-dNOPAUSE', '-dBATCH', '-dQUIET', '-sDEVICE=pdfwrite',
      '-dPDFSETTINGS=/printer',
      '-dDownsampleColorImages=true', `-dColorImageResolution=${PDF_DPI}`,
      '-dDownsampleGrayImages=true', `-dGrayImageResolution=${PDF_DPI}`,
      '-dAutoFilterColorImages=false', '-dColorImageFilter=/DCTEncode',
      `-sOutputFile=${dest}`, src,
    ]);
    // Some already-lean PDFs grow under re-encoding; keep the smaller one.
    const [s, d] = [await readFile(src), await readFile(dest)];
    if (d.length >= s.length) await writeFile(dest, s);
    return true;
  } catch (err) {
    console.warn(`  ! gs optimize failed for ${src}: ${(err as Error).message}`);
    await writeFile(dest, await readFile(src));
    return true;
  }
}
