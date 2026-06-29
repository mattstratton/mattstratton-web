import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  detectFormat,
  splitFrontmatter,
  parseSimpleToml,
  toArray,
  cleanBody,
  buildPermalink,
  normalizeFrontmatter,
} from './migrate-posts.ts';

test('detectFormat distinguishes YAML and TOML', () => {
  assert.equal(detectFormat('---\ntitle: x\n---\nbody'), 'yaml');
  assert.equal(detectFormat('+++\ntitle = "x"\n+++\nbody'), 'toml');
});

test('splitFrontmatter splits on first delimiter pair only', () => {
  const raw = '---\ntitle: x\n---\nbody with --- inside\nmore';
  const { fm, body } = splitFrontmatter(raw, 'yaml');
  assert.equal(fm, 'title: x');
  assert.equal(body, 'body with --- inside\nmore');
});

test('splitFrontmatter tolerates +++ inside TOML body', () => {
  const raw = '+++\ntitle = "x"\n+++\nrock +++ paper';
  const { body } = splitFrontmatter(raw, 'toml');
  assert.equal(body, 'rock +++ paper');
});

test('parseSimpleToml reads key = "value" and dates', () => {
  const o = parseSimpleToml('title = "Take Care"\ndate = 2020-06-02T08:30:40-05:00\nauthor = "Matt"');
  assert.equal(o.title, 'Take Care');
  assert.equal(o.author, 'Matt');
  assert.equal(o.date, '2020-06-02T08:30:40-05:00');
});

test('toArray unwraps single-item block sequences and handles missing', () => {
  assert.deepEqual(toArray(['Meta']), ['Meta']);
  assert.deepEqual(toArray(['no']), ['no']);
  assert.deepEqual(toArray('Personal'), ['Personal']);
  assert.deepEqual(toArray(undefined), []);
  assert.deepEqual(toArray([28227752]), ['28227752']);
});

test('cleanBody strips kramdown attribute lists', () => {
  assert.equal(cleanBody('### Heading {.title}'), '### Heading ');
  assert.equal(cleanBody('[x][1]{.snap_shots}{.tt-flickr}'), '[x][1]');
  assert.equal(cleanBody('no attrs here'), 'no attrs here');
});

test('buildPermalink strips slashes / synthesizes fallback', () => {
  assert.equal(buildPermalink('/life-in-general/da-twins', 'x'), 'life-in-general/da-twins');
  assert.equal(buildPermalink('/life-in-general/100', 'x'), 'life-in-general/100');
  assert.equal(buildPermalink(undefined, 'take-care-of-yourself'), 'post/take-care-of-yourself');
  assert.equal(buildPermalink('', 'foo'), 'post/foo');
});

test('normalizeFrontmatter builds the clean allowlisted object', () => {
  const clean = normalizeFrontmatter(
    {
      title: 'Da Twins',
      author: 'Matt Stratton',
      layout: 'post', // dropped
      date: '2007-10-16T09:36:00+00:00',
      url: '/life-in-general/da-twins',
      dsq_thread_id: [28227752],
      categories: ['Personal'],
      aktt_notify_twitter: ['no'], // dropped
    },
    'fallback',
  );
  assert.equal(clean.title, 'Da Twins');
  assert.equal(clean.permalink, 'life-in-general/da-twins');
  assert.equal(clean.disqusThreadId, '28227752');
  assert.deepEqual(clean.categories, ['Personal']);
  assert.equal(clean.legacy, true);
  assert.ok(!('layout' in clean));
  assert.ok(!('aktt_notify_twitter' in clean));
});
