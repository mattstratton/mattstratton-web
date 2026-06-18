/**
 * PDF text-layer → clean searchable text.
 *
 * pdftotext emits one form-feed (\f) per page and, for decks built from certain
 * Mac fonts, leaks Mac-Roman punctuation as Latin-1 lookalikes (DonÕt, ÒquoteÓ).
 * We normalize those (and any real curly punctuation) to ASCII so search matches
 * what people actually type, keep page boundaries as paragraph breaks, and drop
 * the whitespace noise slides are full of.
 */

// Mac-Roman punctuation codepoints that surface as these Latin-1 chars.
const MOJIBAKE: Record<string, string> = {
  Ò: '"', // U+00D2 → left double quote
  Ó: '"', // U+00D3 → right double quote
  Ô: "'", // U+00D4 → left single quote
  Õ: "'", // U+00D5 → right single quote
  É: '...', // U+00C9 → ellipsis
  Ð: '-', // U+00D0 → en dash
  Ñ: '-', // U+00D1 → em dash
};

export function cleanPdfText(raw: string): string {
  const pages: string[] = [];
  for (const page of raw.split('\f')) {
    const normalized = page
      .replace(/[ÒÓÔÕÉÐÑ]/g, (c) => MOJIBAKE[c] ?? c)
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, '-')
      .replace(/…/g, '...');
    const lines = normalized
      .split('\n')
      .map((l) => l.replace(/\s+/g, ' ').trim())
      .filter(Boolean);
    if (lines.length) pages.push(lines.join('\n'));
  }
  return pages.join('\n\n').trim();
}
