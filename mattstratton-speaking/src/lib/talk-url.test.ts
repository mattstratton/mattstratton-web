import { test } from 'node:test';
import assert from 'node:assert/strict';
import { talkRouteParams, talkUrl } from './talk-url.ts';

const legacy = {
  id: '13jkRV',
  data: { notistId: '13jkRV', notistSlug: 'hot-takes', presentedOn: new Date('2019-05-30') },
};
const fresh = {
  id: '2026-escaping-iiot',
  data: { notistSlug: 'escaping-iiot', presentedOn: new Date('2026-05-12') },
};

test('legacy talk: lowercased notistId is the URL id segment', () => {
  assert.deepEqual(talkRouteParams(legacy), { id: '13jkrv', slug: 'hot-takes' });
  assert.equal(talkUrl(legacy), '/13jkrv/hot-takes');
});

test('new talk: presentedOn year is the URL id segment', () => {
  assert.deepEqual(talkRouteParams(fresh), { id: '2026', slug: 'escaping-iiot' });
  assert.equal(talkUrl(fresh), '/2026/escaping-iiot');
});
