import { test } from 'node:test';
import assert from 'node:assert/strict';
import { rawPath, servedPath, fidelityCheck } from './transcript-clean.ts';

test('path helpers resolve raw (non-served) and served locations', () => {
  assert.ok(rawPath('/r', 'abc').endsWith('/r/transcripts-raw/abc.txt'));
  assert.ok(servedPath('/r', 'abc').endsWith('/r/public/transcripts/abc.txt'));
});

test('fidelityCheck passes inside the band (inclusive edges)', () => {
  assert.deepEqual(fidelityCheck(100, 100), { ok: true, ratio: 1 });
  assert.equal(fidelityCheck(100, 50).ok, true);   // 0.5 edge
  assert.equal(fidelityCheck(100, 105).ok, true);  // 1.05 edge
});

test('fidelityCheck flags over-trim and expansion', () => {
  const lo = fidelityCheck(100, 30);
  assert.equal(lo.ok, false);
  assert.equal(lo.reason, 'over-trimmed');
  const hi = fidelityCheck(100, 130);
  assert.equal(hi.ok, false);
  assert.equal(hi.reason, 'expanded — possible invention');
});

test('fidelityCheck handles empty raw', () => {
  assert.deepEqual(fidelityCheck(0, 0), { ok: false, ratio: 0, reason: 'empty raw' });
});
