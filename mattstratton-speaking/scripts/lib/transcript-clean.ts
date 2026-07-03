import { resolve } from 'node:path';

/** Raw archive — committed, NOT served (lives outside public/). */
export function rawPath(root: string, id: string): string {
  return resolve(root, 'transcripts-raw', `${id}.txt`);
}

/** Served / downloadable / search-indexed transcript. */
export function servedPath(root: string, id: string): string {
  return resolve(root, 'public/transcripts', `${id}.txt`);
}

export interface Fidelity {
  ok: boolean;
  ratio: number;
  reason?: string;
}

// Automated safety net behind the human spot-check. Cleaning removes filler +
// boilerplate (ratio < 1 expected), so the floor catches over-trimming and the
// ceiling catches invented text.
export function fidelityCheck(rawWords: number, cleanWords: number): Fidelity {
  if (rawWords === 0) return { ok: false, ratio: 0, reason: 'empty raw' };
  const ratio = cleanWords / rawWords;
  if (ratio < 0.5) return { ok: false, ratio, reason: 'over-trimmed' };
  if (ratio > 1.05) return { ok: false, ratio, reason: 'expanded — possible invention' };
  return { ok: true, ratio };
}
