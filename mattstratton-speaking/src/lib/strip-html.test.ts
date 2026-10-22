import { test } from 'node:test';
import assert from 'node:assert/strict';
import { stripTags } from './strip-html';

test('stripTags removes plain tags', () => {
  assert.equal(stripTags('a <b>bold</b> <c.color>x</c>'), 'a bold x');
});

test('stripTags leaves no tag behind on nested/malformed input', () => {
  for (const input of ['<<b>script>alert(1)', '<scr<b>ipt>x</scr</b>ipt>', '<<<a>>>b', '<a<b>>c']) {
    assert.doesNotMatch(stripTags(input), /<[^>]+>/, input);
  }
});
