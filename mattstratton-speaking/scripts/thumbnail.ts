import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

export function slideOnePath(talkId: string): string {
  return resolve(ROOT, 'public/slides', talkId, '1.webp');
}

export function thumbnailPath(talkId: string): string {
  return resolve(ROOT, 'public/thumbnails', `${talkId}.webp`);
}

// Derive a 16:9 thumbnail from the first rasterized slide. Returns the served
// path to store in frontmatter, or null when the talk has no slides (the page
// already degrades gracefully — 21 legacy talks have no thumbnail).
export async function makeThumbnail(talkId: string): Promise<string | null> {
  const src = slideOnePath(talkId);
  if (!existsSync(src)) return null;
  await sharp(src).resize(640, 360, { fit: 'cover' }).webp({ quality: 80 }).toFile(thumbnailPath(talkId));
  return `/thumbnails/${talkId}.webp`;
}
