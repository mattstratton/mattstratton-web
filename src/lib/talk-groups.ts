import type { CollectionEntry } from 'astro:content';

export type Talk = CollectionEntry<'talks'>;

// Notist slugified one talk's apostrophe inconsistently across deliveries, so
// the same abstract arrived under two slugs ("don-t-..." for the straight quote,
// "dont-..." for the curly one). Alias the variant onto the canonical slug so
// all four deliveries group as one talk. Explicit (not a blanket punctuation
// strip) — it's the only affected talk in the corpus and won't collapse two
// genuinely-distinct talks. Anything building a /talk/{slug} link from a raw
// notistSlug must route through this too. See issue #13.
const SLUG_ALIASES: Record<string, string> = {
  'dont-panic-effective-incident-response': 'don-t-panic-effective-incident-response',
};

/** Map a raw notistSlug to its canonical /talk/{slug}. Identity for most slugs. */
export function canonicalSlug(notistSlug: string): string {
  return SLUG_ALIASES[notistSlug] ?? notistSlug;
}

// A canonical "talk" = one abstract, delivered one or more times. The grouping
// key is the canonical notistSlug, which Notist shares across re-deliveries of
// the same abstract. No stored field needed — derived from data we already have.
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
    const slug = canonicalSlug(talk.data.notistSlug);
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
