import type { CollectionEntry } from 'astro:content';

// The 4-part field-guide arc (matty-writing-plan.md). Order + labels drive the
// grouped /writing index.
export const PARTS = [
  { key: 'mechanics', label: 'What’s happening inside Postgres', blurb: 'Understanding the mechanics before diagnosing symptoms.' },
  { key: 'limits', label: 'Why you’re hitting the wall', blurb: 'The performance limits you run into and why.' },
  { key: 'traps', label: 'The traps', blurb: 'Things you’ll try that won’t fix it.' },
  { key: 'decision', label: 'The decision', blurb: 'Architectural honesty about what to do next.' },
] as const;

export type PartKey = (typeof PARTS)[number]['key'];

/** Visible (non-draft) writing entries, newest first. */
export function publishedWriting(entries: CollectionEntry<'writing'>[]) {
  return entries
    .filter((e) => !e.data.draft)
    .sort((a, b) => b.data.pubDate.getTime() - a.data.pubDate.getTime());
}

/** Group entries by part key, preserving PARTS order; ungrouped entries last. */
export function groupByPart(entries: CollectionEntry<'writing'>[]) {
  const groups = PARTS.map((p) => ({
    ...p,
    entries: entries.filter((e) => e.data.part === p.key),
  })).filter((g) => g.entries.length > 0);
  const ungrouped = entries.filter((e) => !e.data.part);
  return { groups, ungrouped };
}
