import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { parse } from 'yaml';
import { scaffold, type NewTalk, type NewEvent } from './scaffold-talk.ts';

async function fixture() {
  const root = await mkdtemp(join(tmpdir(), 'scaffold-'));
  await mkdir(resolve(root, 'src/content/talks'), { recursive: true });
  await mkdir(resolve(root, 'src/content/events'), { recursive: true });
  await mkdir(resolve(root, 'src/data'), { recursive: true });
  await writeFile(resolve(root, 'src/data/tags.json'), '{\n  "existing-talk": { "topics": ["X"], "tech": [] }\n}\n');
  return root;
}

const talk: NewTalk = {
  id: '2026-escaping-iiot', title: 'Escaping: IIoT Pilot Purgatory', notistSlug: 'escaping-iiot',
  presentedOn: '2026-05-12T08:00:00', eventId: 'kubecon-eu-2026',
  abstractHtml: '<p>One.</p>\n<p>Two.</p>', slideSource: 'pdf', slidesPdf: '/slides/2026-escaping-iiot.pdf',
  slideImageCount: 0, video: null, thumbnail: '/thumbnails/2026-escaping-iiot.webp',
  topics: ['DevOps'], tech: ['Kubernetes'],
};
const event: NewEvent = {
  id: 'kubecon-eu-2026', notistEventId: 'kubecon-eu-2026', name: 'KubeCon EU 2026',
  date: '2026-05-12T08:00:00', location: 'London, United Kingdom', latitude: 51.5072, longitude: -0.1276,
};

test('scaffold writes talk + event files and merges tags', async () => {
  const root = await fixture();
  const out = await scaffold(talk, event, root);

  const talkMd = await readFile(out.talkFile, 'utf8');
  const fm = parse(talkMd.split('---')[1]);
  assert.equal(fm.notistId, undefined, 'new talks carry no notistId');
  assert.equal(fm.notistSlug, 'escaping-iiot');
  assert.equal(fm.event, 'kubecon-eu-2026');
  assert.equal(fm.slidesPdf, '/slides/2026-escaping-iiot.pdf');

  assert.ok(out.eventFile && (await readFile(out.eventFile, 'utf8')).includes('KubeCon EU 2026'));

  const tags = JSON.parse(await readFile(resolve(root, 'src/data/tags.json'), 'utf8'));
  assert.deepEqual(tags['escaping-iiot'], { topics: ['DevOps'], tech: ['Kubernetes'] });
  assert.ok('existing-talk' in tags, 'existing tag entries preserved');
});

test('scaffold skips event file when referencing an existing event', async () => {
  const root = await fixture();
  const out = await scaffold(talk, null, root);
  assert.equal(out.eventFile, undefined);
});
