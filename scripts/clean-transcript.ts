import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { wordCount } from './lib/vtt.ts';
import { rawPath, servedPath, fidelityCheck, type Fidelity } from './lib/transcript-clean.ts';

const manifestPath = (root: string) => resolve(root, 'src/data/transcripts.json');

type Manifest = Record<string, { words: number; cleaned?: true }>;

/** Archive the raw transcript (once) and return its text for cleaning. */
export async function prepare(id: string, root: string): Promise<{ raw: string }> {
  const archive = rawPath(root, id);
  if (!existsSync(archive)) {
    await copyFile(servedPath(root, id), archive);
  }
  return { raw: await readFile(archive, 'utf8') };
}

/** Fidelity-check the cleaned text; on pass, write it + flag the manifest. */
export async function finalize(
  id: string,
  cleanedText: string,
  root: string,
): Promise<{ fidelity: Fidelity; written: boolean }> {
  const raw = await readFile(rawPath(root, id), 'utf8');
  const fidelity = fidelityCheck(wordCount(raw), wordCount(cleanedText));
  if (!fidelity.ok) return { fidelity, written: false };

  await writeFile(servedPath(root, id), cleanedText);

  const mPath = manifestPath(root);
  const manifest = JSON.parse(await readFile(mPath, 'utf8')) as Manifest;
  manifest[id] = { words: wordCount(cleanedText), cleaned: true };
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  await writeFile(mPath, JSON.stringify(sorted, null, 2) + '\n');

  return { fidelity, written: true };
}
