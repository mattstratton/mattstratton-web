import type { CollectionEntry } from 'astro:content';

export type Talk = CollectionEntry<'talks'>;

// A canonical "talk" = one abstract, delivered one or more times. The grouping
// key is `notistSlug`, which Notist shares across re-deliveries of the same
// abstract (106 deliveries collapse to 41 abstracts). No stored field needed —
// the identity is derived from data we already have.
export interface TalkGroup {
  slug: string; // notistSlug — also the /talk/{slug} URL
  title: string; // canonical title (taken from the most recent delivery)
  deliveries: Talk[]; // every delivery of this abstract, newest first
  count: number;
}

// Group all talk deliveries by notistSlug. Deliveries within a group are sorted
// newest-first so deliveries[0] is the natural "representative" delivery.
export function groupTalks(talks: Talk[]): Map<string, TalkGroup> {
  const buckets = new Map<string, Talk[]>();
  for (const talk of talks) {
    const slug = talk.data.notistSlug;
    if (!buckets.has(slug)) buckets.set(slug, []);
    buckets.get(slug)!.push(talk);
  }

  const groups = new Map<string, TalkGroup>();
  for (const [slug, list] of buckets) {
    const deliveries = [...list].sort(
      (a, b) => b.data.presentedOn.getTime() - a.data.presentedOn.getTime(),
    );
    groups.set(slug, {
      slug,
      title: deliveries[0].data.title,
      deliveries,
      count: deliveries.length,
    });
  }
  return groups;
}
