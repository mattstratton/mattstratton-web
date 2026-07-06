import type { CollectionEntry } from 'astro:content';
import { externalFieldGuide } from '../data/field-guide';
import { collectTaxonomy, entriesForTerm } from './taxonomy';

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

/** A topic-taggable item, whether a native post (on-site) or an external tigerdata.com link. */
export interface TopicItem {
  title: string;
  href: string;
  pubDate?: Date;
  external: boolean;
  topics: string[];
}

/** Native + external entries merged into one topic-taggable shape, for taxonomy purposes. */
function allTopicItems(entries: CollectionEntry<'writing'>[]): TopicItem[] {
  const nativeItems: TopicItem[] = publishedWriting(entries).map((e) => ({
    title: e.data.title,
    href: `/writing/${e.id}/`,
    pubDate: e.data.pubDate,
    external: false,
    topics: e.data.topics,
  }));
  const externalItems: TopicItem[] = externalFieldGuide.map((l) => ({
    title: l.title,
    href: l.url,
    external: true,
    topics: l.topics ?? [],
  }));
  return [...nativeItems, ...externalItems];
}

/** All distinct topics across published writing + external field-guide links, alphabetical, with counts. */
export function collectTopics(entries: CollectionEntry<'writing'>[]) {
  return collectTaxonomy(allTopicItems(entries), (i) => i.topics);
}

/** Writing/field-guide items (native or external) tagged with the given topic slug, newest first. */
export function writingForTopic(entries: CollectionEntry<'writing'>[], slug: string) {
  return entriesForTerm(allTopicItems(entries), (i) => i.topics, slug);
}

/** A field-guide entry, whether a native post (on-site) or an external link. */
export interface GuideItem {
  title: string;
  description: string;
  href: string;
  external: boolean;
  image?: string;
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
      .map((e) => ({ title: e.data.title, description: e.data.description, href: `/writing/${e.id}/`, external: false, image: e.data.heroImage }));
    const ext: GuideItem[] = externalFieldGuide
      .filter((l) => l.part === p.key)
      .map((l) => ({ title: l.title, description: l.description, href: l.url, external: true, image: l.image }));
    return { key: p.key, label: p.label, blurb: p.blurb, items: [...nat, ...ext] };
  }).filter((g) => g.items.length > 0);

  const ungrouped: GuideItem[] = pub
    .filter((e) => !e.data.part)
    .map((e) => ({ title: e.data.title, description: e.data.description, href: `/writing/${e.id}/`, external: false, image: e.data.heroImage }));

  return { groups, ungrouped };
}
