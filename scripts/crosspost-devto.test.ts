import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  splitFrontmatter,
  deriveSlug,
  tagsToTopics,
  resolvePubDate,
  extractImageUrls,
  rewriteImageReferences,
  unwrapMedia2Url,
  deriveImageFilename,
  delinkEmbeds,
  checkCanonicalHost,
  buildWritingFrontmatter,
  setCanonicalUrl,
} from './crosspost-devto.ts';

test('splitFrontmatter splits on first delimiter pair only', () => {
  const raw = '---\ntitle: x\n---\nbody with --- inside';
  const { fm, body } = splitFrontmatter(raw);
  assert.equal(fm, 'title: x');
  assert.equal(body, 'body with --- inside');
});

test('deriveSlug strips dev.to random suffixes but not real filenames', () => {
  assert.equal(deriveSlug('zshrc-tour.md'), 'zshrc-tour', 'no suffix to strip — git-native, 2 segments');
  assert.equal(deriveSlug('the-monorepo-song-1fce.md'), 'the-monorepo-song');
  assert.equal(
    deriveSlug('hot-takes-myths-and-fake-news---why-everyone-is-wrong-about-devops-except-for-me-265j.md'),
    'hot-takes-myths-and-fake-news---why-everyone-is-wrong-about-devops-except-for-me',
  );
  assert.equal(deriveSlug('on-trying-new-things-cel.md'), 'on-trying-new-things', 'pure-letter suffix, not digit-anchored');
});

test('tagsToTopics handles array, single string, comma-separated string, and missing', () => {
  assert.deepEqual(tagsToTopics(['shell', 'zsh']), ['shell', 'zsh']);
  assert.deepEqual(tagsToTopics('humo'), ['humo']);
  assert.deepEqual(tagsToTopics('postgres, database'), ['postgres', 'database']);
  assert.deepEqual(tagsToTopics(undefined), []);
  assert.deepEqual(tagsToTopics(null), []);
});

test('resolvePubDate prioritizes frontmatter, then CLI override, then git, then today', () => {
  const withFm = resolvePubDate('2020-01-30', '2021-01-01', '2019-01-01T00:00:00Z');
  assert.equal(withFm.source, 'frontmatter');

  const withCli = resolvePubDate(undefined, '2021-01-01', '2019-01-01T00:00:00Z');
  assert.equal(withCli.source, 'cli');

  const withGit = resolvePubDate(undefined, undefined, '2019-01-01T00:00:00Z');
  assert.equal(withGit.source, 'git');

  const withNeither = resolvePubDate(undefined, undefined, undefined);
  assert.equal(withNeither.source, 'today');
});

test('extractImageUrls dedupes and includes cover_image plus inline images', () => {
  const body = '![](https://a.example/x.png)\n\nSome text\n\n![alt](https://a.example/x.png)\n![](./assets/local.png)';
  const urls = extractImageUrls(body, 'https://a.example/cover.png');
  assert.deepEqual(urls, ['https://a.example/cover.png', 'https://a.example/x.png', './assets/local.png']);
});

test('rewriteImageReferences rewrites both body references and a matching cover_image', () => {
  const body = 'See ![](https://a.example/x.png) here.';
  const map = new Map([['https://a.example/x.png', '/writing/my-slug/x.png']]);
  const { body: newBody, coverImage } = rewriteImageReferences(body, 'https://a.example/x.png', map);
  assert.equal(newBody, 'See ![](/writing/my-slug/x.png) here.');
  assert.equal(coverImage, '/writing/my-slug/x.png');
});

test('rewriteImageReferences leaves an unmapped cover_image untouched', () => {
  const { coverImage } = rewriteImageReferences('no images here', './assets/local.png', new Map());
  assert.equal(coverImage, './assets/local.png');
});

test('unwrapMedia2Url extracts the real origin URL from dev.to\'s resize proxy', () => {
  const inner = 'https://dev-to-uploads.s3.amazonaws.com/i/abc123.png';
  const wrapped = `https://media2.dev.to/dynamic/image/width_800/${encodeURIComponent(inner)}`;
  assert.equal(unwrapMedia2Url(wrapped), inner);
});

test('unwrapMedia2Url leaves ordinary URLs unchanged', () => {
  const plain = 'https://dev-to-uploads.s3.amazonaws.com/i/abc123.png';
  assert.equal(unwrapMedia2Url(plain), plain);
});

test('deriveImageFilename handles a wrapped media2.dev.to cover without mangling it', () => {
  const inner = 'https://dev-to-uploads.s3.amazonaws.com/i/abc123.png';
  const wrapped = `https://media2.dev.to/dynamic/image/width_800/${encodeURIComponent(inner)}`;
  assert.equal(deriveImageFilename(wrapped, 1), 'abc123.png');
});

test('deriveImageFilename handles a relative local cover image', () => {
  assert.equal(deriveImageFilename('./assets/zshrc-tour-cover.png', 1), 'zshrc-tour-cover.png');
});

test('deriveImageFilename falls back to a generated name for an opaque URL', () => {
  assert.equal(deriveImageFilename('https://example.com/no-extension-here', 3), 'image-3.png');
});

test('setCanonicalUrl replaces an existing canonical_url line in place, leaving every other line byte-for-byte untouched (regression: full YAML re-stringify used to drop quotes from date, which dev.to\'s Ruby YAML parser then rejects as an unquoted Time scalar)', () => {
  const fmRaw = "title: The Monorepo Song\npublished: true\ntags:\n  - humo\ncanonical_url: 'https://dev.to/mattstratton/the-monorepo-song-1fce'\nid: 251917\ndate: '2020-01-30T21:33:31Z'";
  const result = setCanonicalUrl(fmRaw, 'https://www.mattstratton.com/writing/the-monorepo-song/');
  assert.match(result, /^canonical_url: 'https:\/\/www\.mattstratton\.com\/writing\/the-monorepo-song\/'$/m);
  assert.match(result, /^date: '2020-01-30T21:33:31Z'$/m, 'date quoting must be preserved untouched');
  assert.match(result, /^id: 251917$/m);
  assert.equal(result.split('\n').length, fmRaw.split('\n').length, 'line count unchanged - only the one line was replaced');
});

test('setCanonicalUrl appends a new canonical_url line when none exists yet', () => {
  const fmRaw = "title: zshrc tour\npublished: true\nid: 4043143";
  const result = setCanonicalUrl(fmRaw, 'https://www.mattstratton.com/writing/zshrc-tour/');
  assert.match(result, /^canonical_url: 'https:\/\/www\.mattstratton\.com\/writing\/zshrc-tour\/'$/m);
  assert.match(result, /^id: 4043143$/m);
});

test('delinkEmbeds converts youtube and twitter Liquid tags to plain links', () => {
  const body = 'Watch this:\n\n{% youtube uts4RmxU1SQ %}\n\nAlso see:\n\n{% twitter 1300912445201022981 %}';
  const result = delinkEmbeds(body);
  assert.match(result, /\[Watch on YouTube\]\(https:\/\/www\.youtube\.com\/watch\?v=uts4RmxU1SQ\)/);
  assert.match(result, /\[View the original post\]\(https:\/\/twitter\.com\/i\/web\/status\/1300912445201022981\)/);
});

test('delinkEmbeds leaves a post with zero embeds untouched byte-for-byte', () => {
  const body = 'Just a regular post with no embeds at all.';
  assert.equal(delinkEmbeds(body), body);
});

test('checkCanonicalHost passes for a dev.to-self canonical or no canonical at all', () => {
  assert.doesNotThrow(() => checkCanonicalHost(undefined, false));
  assert.doesNotThrow(() => checkCanonicalHost('https://dev.to/mattstratton/some-post', false));
});

test('checkCanonicalHost throws for a third-party canonical unless overridden', () => {
  assert.throws(() => checkCanonicalHost('https://www.tigerdata.com/blog/postgres-extensions-cheat-sheet', false));
  assert.throws(() => checkCanonicalHost('https://medium.com/@mattstratton/foo', false));
  assert.doesNotThrow(() => checkCanonicalHost('https://medium.com/@mattstratton/foo', true));
});

test('buildWritingFrontmatter never sets canonicalUrl or part (regression guard)', () => {
  const fm = buildWritingFrontmatter({
    title: 'Test',
    description: 'A test post',
    pubDate: new Date('2026-07-01'),
    topics: ['shell', 'zsh'],
    heroImage: '/writing/test/cover.png',
  });
  assert.equal('canonicalUrl' in fm, false);
  assert.equal('part' in fm, false);
  assert.equal(fm.title, 'Test');
  assert.equal(fm.pubDate, '2026-07-01');
  assert.deepEqual(fm.topics, ['shell', 'zsh']);
  assert.equal(fm.draft, false);
  assert.equal(fm.heroImage, '/writing/test/cover.png');
});

test('buildWritingFrontmatter omits heroImage when there is none', () => {
  const fm = buildWritingFrontmatter({
    title: 'Test',
    description: 'A test post',
    pubDate: new Date('2026-07-01'),
    topics: [],
  });
  assert.equal('heroImage' in fm, false);
});
