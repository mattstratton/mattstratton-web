/**
 * Convert Notist-authored abstract HTML to plain, indexable text.
 *
 * Runs at build time (Node) inside the search-index endpoint, so it can stay a
 * small dependency-free regex pass — the abstracts are simple HTML (`<p>`,
 * `<a>`, `<strong>`, lists), not arbitrary documents, so no DOM parser is
 * warranted. Tags are dropped, a handful of common named entities are decoded
 * so matches read naturally, and whitespace is collapsed.
 */
export function stripHtml(html: string): string {
  return html
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&#39;|&rsquo;|&lsquo;|&apos;/g, "'")
    .replace(/&quot;|&ldquo;|&rdquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–')
    .replace(/&hellip;/g, '…')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&') // decode last so the above entities aren't mangled
    .replace(/\s+/g, ' ')
    .trim();
}
