import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  talkYear,
  talkMemoryTree,
  buildTalkMemoryContent,
  buildTalkMemoryMeta,
  type TalkFrontmatter,
  type EventFrontmatter,
} from './memory-sync.ts';

const TALK: TalkFrontmatter = {
  notistId: '1TVpT6',
  title: 'Zero Trust is for Networks, Not Your Teams',
  notistSlug: 'zero-trust-is-for-networks-not-your-teams',
  presentedOn: '2023-04-04T08:00:00',
  event: '0SaoHZ',
  abstractHtml: '<p>Hello world.</p>',
  video: { provider: 'youtube', id: 'abc123' },
};

const EVENT: EventFrontmatter = {
  name: 'DevOps Talks Melbourne 2023',
  location: 'Melbourne VIC, Australia',
};

test('talkYear extracts the year from an ISO-ish presentedOn string', () => {
  assert.equal(talkYear('2023-04-04T08:00:00'), 2023);
});

test('talkYear rejects an unparseable string', () => {
  assert.throws(() => talkYear('not-a-date'));
});

test('talkMemoryTree formats the year-scoped tree path', () => {
  assert.equal(talkMemoryTree(2023), '~/talks/2023');
});

test('buildTalkMemoryContent: full talk with event, abstract, transcript', () => {
  const content = buildTalkMemoryContent(TALK, EVENT, 'Full talk text here.');
  assert.equal(
    content,
    [
      'Zero Trust is for Networks, Not Your Teams',
      'Delivered at DevOps Talks Melbourne 2023, Melbourne VIC, Australia — 2023-04-04',
      '',
      'Abstract:',
      'Hello world.',
      '',
      'Transcript:',
      'Full talk text here.',
    ].join('\n'),
  );
});

test('buildTalkMemoryContent: no event falls back to a bare "Delivered" line', () => {
  const content = buildTalkMemoryContent(TALK, null, null);
  assert.equal(content.split('\n')[1], 'Delivered — 2023-04-04');
});

test('buildTalkMemoryContent: no transcript omits the Transcript section', () => {
  const content = buildTalkMemoryContent(TALK, EVENT, null);
  assert.ok(!content.includes('Transcript:'));
});

test('buildTalkMemoryContent: no abstract omits the Abstract section', () => {
  const content = buildTalkMemoryContent({ ...TALK, abstractHtml: undefined }, EVENT, null);
  assert.ok(!content.includes('Abstract:'));
});

test('buildTalkMemoryMeta: full field set', () => {
  const tags = { topics: ['Culture & Teams'], tech: [] };
  const meta = buildTalkMemoryMeta(
    '1TVpT6',
    TALK,
    EVENT,
    'https://speaking.mattstratton.com/1tvpt6/zero-trust-is-for-networks-not-your-teams',
    true,
    tags,
  );
  assert.deepEqual(meta, {
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

test('buildTalkMemoryMeta: omits event/video/tag fields when absent', () => {
  const meta = buildTalkMemoryMeta(
    'noEvent1',
    { ...TALK, video: null },
    null,
    'https://speaking.mattstratton.com/2026/no-event-talk',
    false,
    undefined,
  );
  assert.deepEqual(meta, {
    notistId: 'noEvent1',
    year: 2023,
    presentedOn: '2023-04-04T08:00:00',
    hasVideo: false,
    hasTranscript: false,
    url: 'https://speaking.mattstratton.com/2026/no-event-talk',
  });
});
