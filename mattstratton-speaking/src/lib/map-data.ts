import { tagSlug, type TagInfo } from './tags';

/** Visible dot radius, in map viewBox units. Shared by the map and the legend. */
export function dotRadius(count: number): number {
  return 4 + Math.sqrt(count) * 1.5;
}

export interface EventInput {
  id: string;
  notistEventId: string;
  name: string;
  location?: string;
  date?: Date;
  latitude?: number;
  longitude?: number;
}

export interface TalkInput {
  notistSlug: string;
  eventId?: string;
}

export interface MapPoint {
  id: string;
  x: number;
  y: number;
  r: number;
  name: string;
  location: string;
  href: string;
  talkCount: number;
  year: number | null;
  tags: string[];
}

export interface VirtualEvent {
  id: string;
  name: string;
  href: string;
  year: number | null;
  tags: string[];
}

export interface MapData {
  points: MapPoint[];
  virtual: VirtualEvent[];
  years: number[];
  tags: TagInfo[];
}

export interface BuildMapDataOptions {
  project: (lonLat: [number, number]) => [number, number] | null;
  tagsFor: (notistSlug: string) => string[];
  tagBySlug: (slug: string) => TagInfo | undefined;
}

/**
 * Joins events + talks into everything the map page and legend need.
 * `project`/`tagsFor`/`tagBySlug` are injected (not imported directly) so
 * this stays unit-testable without real geo math or the real tag registry.
 */
export function buildMapData(events: EventInput[], talks: TalkInput[], options: BuildMapDataOptions): MapData {
  const { project, tagsFor, tagBySlug } = options;

  const talkCount = new Map<string, number>();
  const tagSlugsByEvent = new Map<string, Set<string>>();
  for (const t of talks) {
    if (!t.eventId) continue;
    talkCount.set(t.eventId, (talkCount.get(t.eventId) ?? 0) + 1);
    const set = tagSlugsByEvent.get(t.eventId) ?? new Set<string>();
    for (const name of tagsFor(t.notistSlug)) set.add(tagSlug(name));
    tagSlugsByEvent.set(t.eventId, set);
  }

  const points: MapPoint[] = [];
  const virtual: VirtualEvent[] = [];
  const yearSet = new Set<number>();
  const tagSlugSet = new Set<string>();

  for (const e of events) {
    const count = talkCount.get(e.id) ?? 0;
    const tags = [...(tagSlugsByEvent.get(e.id) ?? [])];
    const year = e.date ? e.date.getFullYear() : null;
    const href = `/event/${e.notistEventId.toLowerCase()}`;
    const hasCoords = typeof e.latitude === 'number' && typeof e.longitude === 'number';

    if (hasCoords) {
      const xy = project([e.longitude as number, e.latitude as number]);
      if (!xy) continue; // unplottable projection artifact — drop silently, matches prior behavior
      if (year !== null) yearSet.add(year);
      for (const s of tags) tagSlugSet.add(s);
      points.push({
        id: e.id,
        x: xy[0],
        y: xy[1],
        r: dotRadius(count),
        name: e.name,
        location: e.location ?? '',
        href,
        talkCount: count,
        year,
        tags,
      });
    } else {
      if (year !== null) yearSet.add(year);
      for (const s of tags) tagSlugSet.add(s);
      virtual.push({ id: e.id, name: e.name, href, year, tags });
    }
  }

  const years = [...yearSet].sort((a, b) => b - a);
  const tags = [...tagSlugSet]
    .map((slug) => tagBySlug(slug))
    .filter((t): t is TagInfo => Boolean(t))
    .sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));

  return { points, virtual, years, tags };
}
