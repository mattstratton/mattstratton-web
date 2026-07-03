/**
 * Convert an authored bio (HTML) into the three formats the /bio page offers
 * for copy-paste, mirroring Notist's Text / HTML / Markdown tabs. Handles the
 * small tag set our bios use: <p> <a> <code> <strong> <em> <br>.
 */
export interface BioFormats {
  text: string;
  html: string;
  markdown: string;
}

const ENTITIES: Record<string, string> = {
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&#39;': "'",
  '&rsquo;': '’',
  '&mdash;': '—',
  '&nbsp;': ' ',
};

function decode(s: string): string {
  return s.replace(/&[a-z#0-9]+;/gi, (m) => ENTITIES[m] ?? m);
}

/** Strip to plain text: paragraphs become blank-line-separated. */
export function htmlToText(html: string): string {
  return decode(
    html
      .replace(/<\/p>\s*<p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Convert to Markdown: links, code, emphasis, paragraphs. */
export function htmlToMarkdown(html: string): string {
  return decode(
    html
      .replace(/<a\s+[^>]*href="([^"]*)"[^>]*>(.*?)<\/a>/gi, '[$2]($1)')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<(strong|b)>(.*?)<\/\1>/gi, '**$2**')
      .replace(/<(em|i)>(.*?)<\/\1>/gi, '_$2_')
      .replace(/<\/p>\s*<p>/gi, '\n\n')
      .replace(/<br\s*\/?>/gi, '  \n')
      .replace(/<[^>]+>/g, ''),
  )
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/** Build all three formats from a canonical HTML source. */
export function toFormats(html: string): BioFormats {
  return { text: htmlToText(html), html: html.trim(), markdown: htmlToMarkdown(html) };
}

/** Wrap a plain-text bio (no markup) as all three formats. */
export function plainFormats(text: string): BioFormats {
  return { text, html: `<p>${text}</p>`, markdown: text };
}
