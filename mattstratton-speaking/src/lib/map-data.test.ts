import { test } from 'node:test';
import assert from 'node:assert/strict';
import { dotRadius, buildMapData, type EventInput, type TalkInput } from './map-data.ts';
import type { TagInfo } from './tags.ts';

test('dotRadius grows sublinearly with talk count', () => {
  assert.equal(dotRadius(0), 4);
  assert.equal(dotRadius(1), 5.5);
  assert.equal(dotRadius(4), 7);
});

const MELBOURNE: EventInput = {
  id: '0SaoHZ',
  notistEventId: '0SaoHZ',
  name: 'DevOps Talks Melbourne 2023',
  location: 'Melbourne VIC, Australia',
  date: new Date('2023-04-04T08:00:00'),
  latitude: -37.813628,
  longitude: 144.963058,
};

const ZURICH_VIRTUAL: EventInput = {
  id: '2cJjuw',
  notistEventId: '2cJjuw',
  name: 'DevOps Meetup Zürich',
  location: 'Virtual',
  date: new Date('2020-05-18T08:00:00'),
};

const identityProject = (lonLat: [number, number]): [number, number] => lonLat;
const noTags = () => [] as string[];
const noTagLookup = () => undefined;

test('buildMapData projects a geocoded event into a point', () => {
  const { points, virtual } = buildMapData([MELBOURNE], [], {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points.length, 1);
  assert.equal(virtual.length, 0);
  assert.equal(points[0].x, 144.963058);
  assert.equal(points[0].y, -37.813628);
  assert.equal(points[0].href, '/event/0saohz');
  assert.equal(points[0].talkCount, 0);
  assert.equal(points[0].r, dotRadius(0));
  assert.equal(points[0].year, 2023);
});

test('buildMapData puts an event with no coordinates in virtual, not points', () => {
  const { points, virtual } = buildMapData([ZURICH_VIRTUAL], [], {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points.length, 0);
  assert.equal(virtual.length, 1);
  assert.equal(virtual[0].name, 'DevOps Meetup Zürich');
  assert.equal(virtual[0].year, 2020);
});

test('buildMapData drops a point whose projection returns null, without treating it as virtual', () => {
  const { points, virtual } = buildMapData([MELBOURNE], [], {
    project: () => null,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points.length, 0);
  assert.equal(virtual.length, 0);
});

test('buildMapData does not leak year/tags from unplottable events into facet lists', () => {
  const eventWithCoords: EventInput = { ...MELBOURNE, id: 'unplottable-event', date: new Date('2023-06-15T00:00:00') };
  const talks: TalkInput[] = [{ notistSlug: 'talk-a', eventId: 'unplottable-event' }];
  const registry: Record<string, TagInfo> = {
    kubernetes: { name: 'Kubernetes', kind: 'tech', slug: 'kubernetes', count: 1 },
  };
  const { points, virtual, years, tags } = buildMapData([eventWithCoords], talks, {
    project: () => null, // projection fails for this event
    tagsFor: () => ['Kubernetes'],
    tagBySlug: (slug) => registry[slug],
  });
  assert.equal(points.length, 0);
  assert.equal(virtual.length, 0);
  assert.deepEqual(years, []); // 2023 should NOT be in years
  assert.deepEqual(tags.map((t) => t.slug), []); // kubernetes should NOT be in tags
});

test('buildMapData counts talks per event via the event reference', () => {
  const talks: TalkInput[] = [
    { notistSlug: 'talk-a', eventId: '0SaoHZ' },
    { notistSlug: 'talk-b', eventId: '0SaoHZ' },
    { notistSlug: 'talk-c', eventId: 'some-other-event' },
  ];
  const { points } = buildMapData([MELBOURNE], talks, {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points[0].talkCount, 2);
  assert.equal(points[0].r, dotRadius(2));
});

test('buildMapData treats a missing date as a null year', () => {
  const noDate: EventInput = { ...MELBOURNE, id: 'no-date', date: undefined };
  const { points } = buildMapData([noDate], [], {
    project: identityProject,
    tagsFor: noTags,
    tagBySlug: noTagLookup,
  });
  assert.equal(points[0].year, null);
});

test('buildMapData unions and dedupes tags across every talk delivered at an event', () => {
  const talks: TalkInput[] = [
    { notistSlug: 'talk-a', eventId: '0SaoHZ' },
    { notistSlug: 'talk-b', eventId: '0SaoHZ' },
  ];
  const tagsBySlug: Record<string, string[]> = {
    'talk-a': ['Incident Response', 'Kubernetes'],
    'talk-b': ['Kubernetes', 'On Call'],
  };
  const registry: Record<string, TagInfo> = {
    'incident-response': { name: 'Incident Response', kind: 'topic', slug: 'incident-response', count: 1 },
    kubernetes: { name: 'Kubernetes', kind: 'tech', slug: 'kubernetes', count: 2 },
    'on-call': { name: 'On Call', kind: 'topic', slug: 'on-call', count: 1 },
  };
  const { points, tags } = buildMapData([MELBOURNE], talks, {
    project: identityProject,
    tagsFor: (slug) => tagsBySlug[slug] ?? [],
    tagBySlug: (slug) => registry[slug],
  });
  assert.deepEqual([...points[0].tags].sort(), ['incident-response', 'kubernetes', 'on-call']);
  assert.equal(tags.length, 3);
});

test('buildMapData returns distinct years descending and only tags present in the dataset', () => {
  const olderEvent: EventInput = { ...MELBOURNE, id: 'older', date: new Date('2019-01-01T00:00:00') };
  const talks: TalkInput[] = [{ notistSlug: 'talk-a', eventId: '0SaoHZ' }];
  const registry: Record<string, TagInfo> = {
    kubernetes: { name: 'Kubernetes', kind: 'tech', slug: 'kubernetes', count: 1 },
    unused: { name: 'Unused', kind: 'topic', slug: 'unused', count: 0 },
  };
  const { years, tags } = buildMapData([MELBOURNE, olderEvent], talks, {
    project: identityProject,
    tagsFor: () => ['Kubernetes'],
    tagBySlug: (slug) => registry[slug],
  });
  assert.deepEqual(years, [2023, 2019]);
  assert.deepEqual(tags.map((t) => t.slug), ['kubernetes']);
});
