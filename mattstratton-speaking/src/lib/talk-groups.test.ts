import { test } from 'node:test';
import assert from 'node:assert/strict';
import { canonicalSlug, groupTalks, type Talk } from './talk-groups.ts';

// Minimal structural fixtures — groupTalks only reads id/data.{notistSlug,title,presentedOn}.
const mk = (id: string, notistSlug: string, title: string, iso: string) =>
  ({ id, data: { notistSlug, title, presentedOn: new Date(iso) } }) as unknown as Talk;

test('canonicalSlug aliases the curly-apostrophe variant, passes others through', () => {
  assert.equal(
    canonicalSlug('dont-panic-effective-incident-response'),
    'don-t-panic-effective-incident-response',
  );
  assert.equal(canonicalSlug('some-other-talk'), 'some-other-talk');
});

test('groupTalks merges the two apostrophe slug families into one canonical talk', () => {
  const talks = [
    mk('ToIStL', 'don-t-panic-effective-incident-response', "Don't Panic", '2019-01-01'),
    mk('ZY1ufK', 'don-t-panic-effective-incident-response', "Don't Panic", '2020-01-01'),
    mk('oBTWQ8', 'don-t-panic-effective-incident-response', "Don't Panic", '2021-01-01'),
    mk('VhGnmc', 'dont-panic-effective-incident-response', 'Don’t Panic', '2022-01-01'),
    mk('zzzzzz', 'some-other-talk', 'Other', '2023-01-01'),
  ];
  const groups = groupTalks(talks);

  const panic = groups.get('don-t-panic-effective-incident-response');
  assert.ok(panic, 'canonical group exists under the straight-apostrophe slug');
  assert.equal(panic.count, 4, 'all four deliveries collapse into one group');
  assert.equal(panic.slug, 'don-t-panic-effective-incident-response');
  assert.equal(groups.get('dont-panic-effective-incident-response'), undefined, 'no split variant group');
  assert.equal(groups.get('some-other-talk')?.count, 1, 'unrelated talk untouched');
});
