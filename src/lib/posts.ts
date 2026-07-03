import type { CollectionEntry } from 'astro:content';
import { collectTaxonomy as collectTaxonomyGeneric, entriesForTerm, slugify } from './taxonomy';

export { slugify };
export type { TaxoTerm } from './taxonomy';

/** All legacy posts, newest first. */
export function sortedPosts(posts: CollectionEntry<'posts'>[]) {
  return [...posts].sort((a, b) => b.data.date.getTime() - a.data.date.getTime());
}

/** Build a slug→term registry for a taxonomy field, with post counts. */
export function collectTaxonomy(
  posts: CollectionEntry<'posts'>[],
  field: 'categories' | 'tags',
) {
  return collectTaxonomyGeneric(posts, (p) => p.data[field]);
}

/** Posts whose taxonomy field contains a term matching the given slug. */
export function postsForTerm(
  posts: CollectionEntry<'posts'>[],
  field: 'categories' | 'tags',
  slug: string,
) {
  return sortedPosts(entriesForTerm(posts, (p) => p.data[field], slug));
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
