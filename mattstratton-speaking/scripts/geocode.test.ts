import { test } from 'node:test';
import assert from 'node:assert/strict';
import { geocode } from './geocode.ts';

const fakeFetch = (body: unknown, ok = true): typeof fetch =>
  (async () => ({ ok, json: async () => body })) as unknown as typeof fetch;

test('geocode returns the top hit', async () => {
  const f = fakeFetch([{ lat: '-37.8136', lon: '144.9631', display_name: 'Melbourne VIC, Australia' }]);
  assert.deepEqual(await geocode('Melbourne', f), {
    lat: -37.8136, lng: 144.9631, displayName: 'Melbourne VIC, Australia',
  });
});

test('geocode returns null on empty results', async () => {
  assert.equal(await geocode('nowhere', fakeFetch([])), null);
});

test('geocode returns null on non-OK response', async () => {
  assert.equal(await geocode('x', fakeFetch([], false)), null);
});
