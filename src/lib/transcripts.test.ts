import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toParagraphs } from './transcripts.ts';

test('cleaned text: splits on blank lines into real paragraphs', () => {
  const clean = 'First paragraph here.\n\nSecond paragraph here.';
  assert.deepEqual(toParagraphs(clean), ['First paragraph here.', 'Second paragraph here.']);
});

test('raw text: groups caption lines (no blank lines) by perPara', () => {
  const raw = Array.from({ length: 10 }, (_, i) => `line${i}`).join('\n');
  const paras = toParagraphs(raw);
  assert.equal(paras.length, 2); // 10 lines / 8 per para
  assert.equal(paras[0], 'line0 line1 line2 line3 line4 line5 line6 line7');
});
