import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { prepare, finalize } from './clean-transcript.ts';

const RAW = Array.from({ length: 40 }, (_, i) => `line ${i} words here now`).join('\n');

async function fixture(id: string) {
  const root = await mkdtemp(join(tmpdir(), 'tclean-'));
  await mkdir(resolve(root, 'public/transcripts'), { recursive: true });
  // NOTE: deliberately do NOT pre-create transcripts-raw/ — prepare() must mkdir it.
  await mkdir(resolve(root, 'src/data'), { recursive: true });
  await writeFile(resolve(root, 'public/transcripts', `${id}.txt`), RAW);
  await writeFile(resolve(root, 'src/data/transcripts.json'), '{\n  "other": { "words": 10 }\n}\n');
  return root;
}

test('prepare archives raw once and returns it', async () => {
  const root = await fixture('t1');
  const { raw } = await prepare('t1', root);
  assert.equal(raw, RAW);
  const archived = await readFile(resolve(root, 'transcripts-raw/t1.txt'), 'utf8');
  assert.equal(archived, RAW);

  // Second prepare must not clobber an edited archive.
  await writeFile(resolve(root, 'transcripts-raw/t1.txt'), 'EDITED ARCHIVE');
  const again = await prepare('t1', root);
  assert.equal(again.raw, 'EDITED ARCHIVE');
});

test('finalize writes clean + sets cleaned flag when fidelity passes', async () => {
  const root = await fixture('t2');
  await prepare('t2', root);
  // ~200 words raw; a clean of similar length stays in the band.
  const clean = 'Para one sentence.\n\n' + Array.from({ length: 180 }, () => 'word').join(' ');
  const res = await finalize('t2', clean, root);
  assert.equal(res.written, true);
  assert.equal(res.fidelity.ok, true);

  assert.equal(await readFile(resolve(root, 'public/transcripts/t2.txt'), 'utf8'), clean);
  const m = JSON.parse(await readFile(resolve(root, 'src/data/transcripts.json'), 'utf8'));
  assert.equal(m['t2'].cleaned, true);
  assert.ok(m['t2'].words > 0);
  assert.deepEqual(m['other'], { words: 10 }, 'other entries preserved');
});

test('finalize refuses to write an over-trimmed clean', async () => {
  const root = await fixture('t3');
  await prepare('t3', root);
  const res = await finalize('t3', 'too short.', root);
  assert.equal(res.written, false);
  assert.equal(res.fidelity.reason, 'over-trimmed');
  // served file untouched (still raw), manifest has no t3 entry
  assert.equal(await readFile(resolve(root, 'public/transcripts/t3.txt'), 'utf8'), RAW);
  const m = JSON.parse(await readFile(resolve(root, 'src/data/transcripts.json'), 'utf8'));
  assert.equal(m['t3'], undefined);
});
