import { test } from 'node:test';
import assert from 'node:assert/strict';
import { slideOnePath, thumbnailPath, makeThumbnail } from './thumbnail.ts';

test('path helpers resolve under public/', () => {
  assert.ok(slideOnePath('2026-foo').endsWith('public/slides/2026-foo/1.webp'));
  assert.ok(thumbnailPath('2026-foo').endsWith('public/thumbnails/2026-foo.webp'));
});

test('makeThumbnail returns null when slide 1 is absent', async () => {
  assert.equal(await makeThumbnail('does-not-exist-xyz'), null);
});
