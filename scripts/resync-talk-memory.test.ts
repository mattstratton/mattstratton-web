import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { prepareTalkMemory } from './resync-talk-memory.ts';

async function fixture(opts: {
  id: string;
  talkFrontmatter: string;
  eventId?: string;
  eventFrontmatter?: string;
  transcriptText?: string;
  tags?: Record<string, { topics: string[]; tech: string[] }>;
}): Promise<string> {
  const root = await mkdtemp(join(tmpdir(), 'resync-'));
  await mkdir(resolve(root, 'src/content/talks'), { recursive: true });
  await mkdir(resolve(root, 'src/content/events'), { recursive: true });
  await mkdir(resolve(root, 'public/transcripts'), { recursive: true });
  await mkdir(resolve(root, 'src/data'), { recursive: true });
  await writeFile(
    resolve(root, 'src/content/talks', `${opts.id}.md`),
    `---\n${opts.talkFrontmatter}\n---\n`,
  );
  if (opts.eventId && opts.eventFrontmatter) {
    await writeFile(
      resolve(root, 'src/content/events', `${opts.eventId}.md`),
      `---\n${opts.eventFrontmatter}\n---\n`,
    );
  }
  if (opts.transcriptText !== undefined) {
    await writeFile(resolve(root, 'public/transcripts', `${opts.id}.txt`), opts.transcriptText);
  }
  await writeFile(resolve(root, 'src/data/tags.json'), JSON.stringify(opts.tags ?? {}, null, 2) + '\n');
  return root;
}

test('prepareTalkMemory: full talk with event, transcript, tags, legacy notistId', async () => {
  const root = await fixture({
    id: '1TVpT6',
    talkFrontmatter: [
      'notistId: 1TVpT6',
      'title: Zero Trust is for Networks, Not Your Teams',
      'notistSlug: zero-trust-is-for-networks-not-your-teams',
      'presentedOn: 2023-04-04T08:00:00',
      'event: 0SaoHZ',
      'abstractHtml: <p>Hello world.</p>',
      'video:',
      '  provider: youtube',
      '  id: abc123',
    ].join('\n'),
    eventId: '0SaoHZ',
    eventFrontmatter: ['name: DevOps Talks Melbourne 2023', 'location: Melbourne VIC, Australia'].join('\n'),
    transcriptText: 'Full talk text here.',
    tags: { 'zero-trust-is-for-networks-not-your-teams': { topics: ['Culture & Teams'], tech: [] } },
  });

  const result = await prepareTalkMemory('1TVpT6', root);
  assert.ok(!('error' in result));
  const payload = result as Exclude<typeof result, { error: 'not-found' }>;

  assert.equal(payload.tree, '~/talks/2023');
  assert.equal(payload.name, '1TVpT6');
  assert.ok(payload.content.startsWith('Zero Trust is for Networks, Not Your Teams\n'));
  assert.ok(payload.content.includes('Transcript:\nFull talk text here.'));
  assert.deepEqual(payload.meta, {
    notistId: '1TVpT6',
    year: 2023,
    presentedOn: '2023-04-04T08:00:00',
    hasVideo: true,
    hasTranscript: true,
    url: 'https://speaking.mattstratton.com/1tvpt6/zero-trust-is-for-networks-not-your-teams',
    event: 'DevOps Talks Melbourne 2023',
    eventLocation: 'Melbourne VIC, Australia',
    videoProvider: 'youtube',
    videoId: 'abc123',
    topics: ['Culture & Teams'],
    tech: [],
  });
});

test('prepareTalkMemory: new talk (no notistId, no event, no transcript, no tags)', async () => {
  const root = await fixture({
    id: '2026-no-event-talk',
    talkFrontmatter: [
      'title: A New Talk',
      'notistSlug: no-event-talk',
      'presentedOn: 2026-05-12T08:00:00',
    ].join('\n'),
  });

  const result = await prepareTalkMemory('2026-no-event-talk', root);
  assert.ok(!('error' in result));
  const payload = result as Exclude<typeof result, { error: 'not-found' }>;

  assert.equal(payload.tree, '~/talks/2026');
  assert.equal(payload.name, '2026-no-event-talk');
  assert.equal(payload.content, 'A New Talk\nDelivered — 2026-05-12');
  assert.deepEqual(payload.meta, {
    notistId: '2026-no-event-talk',
    year: 2026,
    presentedOn: '2026-05-12T08:00:00',
    hasVideo: false,
    hasTranscript: false,
    url: 'https://speaking.mattstratton.com/2026/no-event-talk',
  });
});

test('prepareTalkMemory: unknown id returns not-found', async () => {
  const root = await fixture({
    id: 'exists',
    talkFrontmatter: ['title: Exists', 'notistSlug: exists', 'presentedOn: 2020-01-01T08:00:00'].join('\n'),
  });
  const result = await prepareTalkMemory('missing', root);
  assert.deepEqual(result, { error: 'not-found' });
});
