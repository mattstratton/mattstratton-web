import data from '../data/tags.json';

// Two tag axes, curated per abstract (notistSlug) in src/data/tags.json:
//   topics — what the talk is about (Incident Response, The Human Side, …)
//   tech   — concrete tools it features (Kubernetes, Pulumi, PagerDuty, …)
// Tags live on the abstract, so all deliveries of a talk share them.
export type TagKind = 'topic' | 'tech';

export interface TagInfo {
  name: string;
  kind: TagKind;
  slug: string;
  count: number; // distinct talks (abstracts) carrying this tag
}

const bySlug = data as Record<string, { topics: string[]; tech: string[] }>;

/** URL-safe slug for a tag name: "Cloud Native & Kubernetes" → "cloud-native-kubernetes". */
export function tagSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export function topicsFor(talkSlug: string): string[] {
  return bySlug[talkSlug]?.topics ?? [];
}
export function techFor(talkSlug: string): string[] {
  return bySlug[talkSlug]?.tech ?? [];
}
/** All tag names for a talk (topics then tech) — used by the search index. */
export function tagsFor(talkSlug: string): string[] {
  const t = bySlug[talkSlug];
  return t ? [...t.topics, ...t.tech] : [];
}

// Registry of every distinct tag, with its kind and how many talks use it.
const registry = (() => {
  const acc = new Map<string, { name: string; kind: TagKind; talks: Set<string> }>();
  const add = (name: string, kind: TagKind, talkSlug: string) => {
    const key = tagSlug(name);
    if (!acc.has(key)) acc.set(key, { name, kind, talks: new Set() });
    acc.get(key)!.talks.add(talkSlug);
  };
  for (const [talkSlug, t] of Object.entries(bySlug)) {
    for (const name of t.topics) add(name, 'topic', talkSlug);
    for (const name of t.tech) add(name, 'tech', talkSlug);
  }
  const out = new Map<string, TagInfo>();
  for (const [slug, v] of acc) out.set(slug, { name: v.name, kind: v.kind, slug, count: v.talks.size });
  return out;
})();

/** Tags of a kind (or all), sorted by frequency then name. */
export function allTags(kind?: TagKind): TagInfo[] {
  return [...registry.values()]
    .filter((t) => !kind || t.kind === kind)
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
}

export function tagBySlug(slug: string): TagInfo | undefined {
  return registry.get(slug);
}

/** Abstract (notistSlug) values carrying the given tag slug. */
export function talkSlugsForTag(slug: string): Set<string> {
  const out = new Set<string>();
  for (const [talkSlug, t] of Object.entries(bySlug)) {
    if ([...t.topics, ...t.tech].some((n) => tagSlug(n) === slug)) out.add(talkSlug);
  }
  return out;
}
