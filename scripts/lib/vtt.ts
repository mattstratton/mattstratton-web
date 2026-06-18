/**
 * WebVTT → readable plain text.
 *
 * YouTube auto-caption VTT is a rolling 2-line window: every phrase appears once
 * as a timed line (`word<00:00:04.020><c> right</c>…`) and again as a de-timed
 * echo on the next cue. Stripping inline tags makes consecutive lines identical,
 * so a per-line "skip if same as last kept line" dedup collapses the redundancy
 * to clean prose (a 420KB VTT becomes ~45KB of text). Manual/human VTT (no inline
 * tags, no echo) passes through unharmed — the dedup is a no-op on it.
 */

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&nbsp;': ' ',
};

function decode(s: string): string {
  return s.replace(/&(amp|lt|gt|quot|#39|nbsp);/g, (m) => ENTITIES[m] ?? m);
}

export function cleanVtt(raw: string): string {
  const lines: string[] = [];
  let last: string | null = null;

  for (const rawLine of raw.split(/\r?\n/)) {
    // Skip headers, cue-timing lines, and NOTE/STYLE blocks.
    if (/^(WEBVTT|Kind:|Language:|NOTE|STYLE)/.test(rawLine)) continue;
    if (rawLine.includes('-->')) continue;
    // A bare numeric cue identifier (some VTT dialects).
    if (/^\d+$/.test(rawLine.trim())) continue;

    // Drop inline timestamp/styling tags (<00:00:04.020>, <c>, </c>, <c.colorXX>).
    const text = decode(rawLine.replace(/<[^>]+>/g, ''))
      .replace(/\s+/g, ' ')
      .trim();

    if (!text) continue;
    if (text === last) continue; // collapse the rolling-window echo
    lines.push(text);
    last = text;
  }

  return lines.join('\n');
}

/** Word count of cleaned transcript text. */
export function wordCount(text: string): number {
  const t = text.trim();
  return t ? t.split(/\s+/).length : 0;
}
