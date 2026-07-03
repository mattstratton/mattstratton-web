/** Hugo-compatible urlize: lowercase, drop apostrophes, non-alnum → hyphen. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export interface TaxoTerm { name: string; slug: string; count: number; }

/** Build a slug→term registry across entries, with counts, given a term extractor. */
export function collectTaxonomy<T>(entries: T[], getTerms: (entry: T) => string[]): TaxoTerm[] {
  const bySlug = new Map<string, TaxoTerm>();
  for (const entry of entries) {
    for (const name of getTerms(entry)) {
      const slug = slugify(name);
      if (!slug) continue;
      const term = bySlug.get(slug);
      if (term) term.count++;
      else bySlug.set(slug, { name, slug, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Entries whose terms contain one matching the given slug. */
export function entriesForTerm<T>(entries: T[], getTerms: (entry: T) => string[], slug: string): T[] {
  return entries.filter((entry) => getTerms(entry).some((n) => slugify(n) === slug));
}
