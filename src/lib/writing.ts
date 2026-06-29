import type { CollectionEntry } from 'astro:content';
import { externalFieldGuide } from '../data/field-guide';

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

/** A field-guide entry, whether a native post (on-site) or an external link. */
export interface GuideItem {
  title: string;
  description: string;
  href: string;
  external: boolean;
}

/**
 * The full field guide: native writing posts + external tigerdata.com links
 * (src/data/field-guide.ts), merged and grouped by the 4-part arc. Native posts
 * lead each part; external links follow. Parts with no items are dropped.
 */
export function buildFieldGuide(native: CollectionEntry<'writing'>[]) {
  const pub = publishedWriting(native);
  const groups = PARTS.map((p) => {
    const nat: GuideItem[] = pub
      .filter((e) => e.data.part === p.key)
      .map((e) => ({ title: e.data.title, description: e.data.description, href: `/writing/${e.id}/`, external: false }));
    const ext: GuideItem[] = externalFieldGuide
      .filter((l) => l.part === p.key)
      .map((l) => ({ title: l.title, description: l.description, href: l.url, external: true }));
    return { key: p.key, label: p.label, blurb: p.blurb, items: [...nat, ...ext] };
  }).filter((g) => g.items.length > 0);

  const ungrouped: GuideItem[] = pub
    .filter((e) => !e.data.part)
    .map((e) => ({ title: e.data.title, description: e.data.description, href: `/writing/${e.id}/`, external: false }));

  return { groups, ungrouped };
}
