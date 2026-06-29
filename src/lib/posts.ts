import type { CollectionEntry } from 'astro:content';

/** Hugo-compatible urlize: lowercase, drop apostrophes, non-alnum → hyphen. */
export function slugify(s: string): string {
  return s
    .toLowerCase()
    .trim()
    .replace(/['']/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

/** All legacy posts, newest first. */
export function sortedPosts(posts: CollectionEntry<'posts'>[]) {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

export interface TaxoTerm { name: string; slug: string; count: number; }

/** Build a slug→term registry for a taxonomy field, with post counts. */
export function collectTaxonomy(
  posts: CollectionEntry<'posts'>[],
  field: 'categories' | 'tags',
): TaxoTerm[] {
  const bySlug = new Map<string, TaxoTerm>();
  for (const p of posts) {
    for (const name of p.data[field]) {
      const slug = slugify(name);
      if (!slug) continue;
      const term = bySlug.get(slug);
      if (term) term.count++;
      else bySlug.set(slug, { name, slug, count: 1 });
    }
  }
  return [...bySlug.values()].sort((a, b) => a.name.localeCompare(b.name));
}

/** Posts whose taxonomy field contains a term matching the given slug. */
export function postsForTerm(
  posts: CollectionEntry<'posts'>[],
  field: 'categories' | 'tags',
  slug: string,
) {
  return sortedPosts(posts.filter((p) => p.data[field].some((n) => slugify(n) === slug)));
}

/** Group posts by year (descending) for the archive listing. */
export function groupByYear(posts: CollectionEntry<'posts'>[]) {
  const sorted = sortedPosts(posts);
  const years = new Map<number, CollectionEntry<'posts'>[]>();
  for (const p of sorted) {
    const y = p.data.date.getFullYear();
    if (!years.has(y)) years.set(y, []);
    years.get(y)!.push(p);
  }
  return [...years.entries()].sort((a, b) => b[0] - a[0]);
}
