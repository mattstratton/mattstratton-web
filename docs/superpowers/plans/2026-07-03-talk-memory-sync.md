# Talk Memory Sync Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Every talk delivery in this repo becomes a searchable memory record in Matt's personal `me` memory engine (title, event, abstract, transcript when available), backfilled once for all 106 talks and kept in sync going forward via a new `resync-talk-memory` skill that `add-talk` and `transcript-cleanup` call.

**Architecture:** Pure, unit-tested builder functions turn a talk's content file + event + transcript + tags into a `{tree, name, content, meta}` memory payload. A thin script reads the repo files and calls the builders. A new skill (`resync-talk-memory`) is the only thing that actually calls the `me` MCP tool — `add-talk` and `transcript-cleanup` invoke it instead of duplicating logic.

**Tech Stack:** Astro 5, TypeScript (strict), Node 20, `tsx`, `node:test`, the `me` MCP server (`mcp__me__me_memory_create`).

## Global Constraints

- **Node 20**, Astro 5. Do not upgrade.
- **Memory tree:** `~/talks/{year}` (tree) + `{id}` (name), where `{id}` is the talk's content-file id (filename without `.md`) — addressable as `~/talks/{year}/{id}`.
- **Idempotency:** every `mcp__me__me_memory_create` call uses `on_conflict: 'replace'` — re-running for any talk at any time is always safe.
- **Backfill scope:** all 106 talks, not just the 30 with cleaned transcripts. Talks without a transcript still get a memory (title/event/abstract only); talks without an event reference still get a memory (metadata omits event fields).
- **Topic metadata:** include `topics`/`tech` in `meta` only when `src/data/tags.json` has an entry for the talk's `notistSlug`; omit both keys entirely otherwise. No new tag generation.
- **`resync-talk-memory` never touches the repo** — it only writes to the memory engine. Nothing to commit for a memory-only run.
- Add commit co-author trailer to every commit: `Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `scripts/lib/memory-sync.ts` — pure builders: `talkYear`, `talkMemoryTree`, `buildTalkMemoryContent`, `buildTalkMemoryMeta`.
- `scripts/lib/memory-sync.test.ts` — unit tests.
- `scripts/resync-talk-memory.ts` — `prepareTalkMemory(id, root)`: reads the talk/event/transcript/tags files, returns the memory payload.
- `scripts/resync-talk-memory.test.ts` — unit tests (temp-dir fixtures).
- `.claude/skills/resync-talk-memory/SKILL.md` — the skill that calls `prepareTalkMemory` and upserts into memory.

**Modify:**
- `.claude/skills/add-talk/SKILL.md` — call `resync-talk-memory` as a final step.
- `.claude/skills/transcript-cleanup/SKILL.md` — call `resync-talk-memory` per cleaned transcript.
- `src/content/talks/f8dw3L.md` — fix missing `video` field (unrelated bug, fixed here to double as the resync validation case).

---

## Task 1: `memory-sync.ts` builders

**Files:**
- Create: `scripts/lib/memory-sync.ts`
- Create: `scripts/lib/memory-sync.test.ts`

**Interfaces:**
- Consumes: `stripHtml(html: string): string` from `src/lib/strip-html.ts` (existing).
- Produces:
  - `interface TalkFrontmatter { notistId?: string; title: string; notistSlug: string; presentedOn: string; event?: string; abstractHtml?: string; video?: { provider: 'youtube' | 'vimeo'; id: string } | null }`
  - `interface EventFrontmatter { name: string; location?: string }`
  - `interface TalkTags { topics: string[]; tech: string[] }`
  - `talkYear(presentedOn: string): number`
  - `talkMemoryTree(year: number): string`
  - `buildTalkMemoryContent(talk: TalkFrontmatter, event: EventFrontmatter | null, transcriptText: string | null): string`
  - `buildTalkMemoryMeta(id: string, talk: TalkFrontmatter, event: EventFrontmatter | null, url: string, hasTranscript: boolean, tags: TalkTags | undefined): Record<string, unknown>`

- [ ] **Step 1: Write the failing test**

Create `scripts/lib/memory-sync.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './memory-sync.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/lib/memory-sync.ts`:

```ts
import { stripHtml } from '../../src/lib/strip-html';

export interface TalkFrontmatter {
  notistId?: string;
  title: string;
  notistSlug: string;
  presentedOn: string;
  event?: string;
  abstractHtml?: string;
  video?: { provider: 'youtube' | 'vimeo'; id: string } | null;
}

export interface EventFrontmatter {
  name: string;
  location?: string;
}

export interface TalkTags {
  topics: string[];
  tech: string[];
}

/** Year of a talk's `presentedOn` frontmatter string — no Date/timezone parsing. */
export function talkYear(presentedOn: string): number {
  const m = presentedOn.match(/^(\d{4})/);
  if (!m) throw new Error(`unparseable presentedOn: ${presentedOn}`);
  return Number(m[1]);
}

export function talkMemoryTree(year: number): string {
  return `~/talks/${year}`;
}

export function buildTalkMemoryContent(
  talk: TalkFrontmatter,
  event: EventFrontmatter | null,
  transcriptText: string | null,
): string {
  const date = talk.presentedOn.slice(0, 10);
  const lines = [
    talk.title,
    event
      ? `Delivered at ${event.name}, ${event.location ?? 'Unknown location'} — ${date}`
      : `Delivered — ${date}`,
  ];
  if (talk.abstractHtml) {
    lines.push('', 'Abstract:', stripHtml(talk.abstractHtml));
  }
  if (transcriptText) {
    lines.push('', 'Transcript:', transcriptText.trim());
  }
  return lines.join('\n');
}

export function buildTalkMemoryMeta(
  id: string,
  talk: TalkFrontmatter,
  event: EventFrontmatter | null,
  url: string,
  hasTranscript: boolean,
  tags: TalkTags | undefined,
): Record<string, unknown> {
  const meta: Record<string, unknown> = {
    notistId: id,
    year: talkYear(talk.presentedOn),
    presentedOn: talk.presentedOn,
    hasVideo: !!talk.video,
    hasTranscript,
    url,
  };
  if (event) {
    meta.event = event.name;
    if (event.location) meta.eventLocation = event.location;
  }
  if (talk.video) {
    meta.videoProvider = talk.video.provider;
    meta.videoId = talk.video.id;
  }
  if (tags) {
    meta.topics = tags.topics;
    meta.tech = tags.tech;
  }
  return meta;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (9 new tests).

- [ ] **Step 5: Commit**

```bash
git add scripts/lib/memory-sync.ts scripts/lib/memory-sync.test.ts
git commit -m "$(cat <<'EOF'
feat: talk-memory content/meta builders

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 2: `resync-talk-memory.ts` — `prepareTalkMemory`

**Files:**
- Create: `scripts/resync-talk-memory.ts`
- Create: `scripts/resync-talk-memory.test.ts`

**Interfaces:**
- Consumes: `talkYear`, `talkMemoryTree`, `buildTalkMemoryContent`, `buildTalkMemoryMeta`, `TalkFrontmatter`, `EventFrontmatter`, `TalkTags` (Task 1); `talkUrl` from `src/lib/talk-url.ts` (existing, signature `talkUrl(talk: { id: string; data: { notistId?: string; notistSlug: string; presentedOn: Date } }): string`).
- Produces:
  - `interface TalkMemoryPayload { tree: string; name: string; content: string; meta: Record<string, unknown> }`
  - `prepareTalkMemory(id: string, root: string): Promise<TalkMemoryPayload | { error: 'not-found' }>`

- [ ] **Step 1: Write the failing test**

Create `scripts/resync-talk-memory.test.ts`:

```ts
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './resync-talk-memory.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/resync-talk-memory.ts`:

```ts
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { parse as parseYaml } from 'yaml';
import { talkUrl } from '../src/lib/talk-url';
import {
  buildTalkMemoryContent,
  buildTalkMemoryMeta,
  talkMemoryTree,
  talkYear,
  type TalkFrontmatter,
  type EventFrontmatter,
  type TalkTags,
} from './lib/memory-sync.ts';

async function readFrontmatter<T>(path: string): Promise<T | null> {
  if (!existsSync(path)) return null;
  const text = await readFile(path, 'utf8');
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  if (!m) return null;
  return parseYaml(m[1]) as T;
}

export interface TalkMemoryPayload {
  tree: string;
  name: string;
  content: string;
  meta: Record<string, unknown>;
}

export async function prepareTalkMemory(
  id: string,
  root: string,
): Promise<TalkMemoryPayload | { error: 'not-found' }> {
  const talk = await readFrontmatter<TalkFrontmatter>(resolve(root, 'src/content/talks', `${id}.md`));
  if (!talk) return { error: 'not-found' };

  const event = talk.event
    ? await readFrontmatter<EventFrontmatter>(resolve(root, 'src/content/events', `${talk.event}.md`))
    : null;

  const transcriptPath = resolve(root, 'public/transcripts', `${id}.txt`);
  const transcriptText = existsSync(transcriptPath) ? await readFile(transcriptPath, 'utf8') : null;

  const allTags = JSON.parse(
    await readFile(resolve(root, 'src/data/tags.json'), 'utf8'),
  ) as Record<string, TalkTags>;
  const tags = allTags[talk.notistSlug];

  const url = `https://speaking.mattstratton.com${talkUrl({
    id,
    data: { notistId: talk.notistId, notistSlug: talk.notistSlug, presentedOn: new Date(talk.presentedOn) },
  })}`;

  return {
    tree: talkMemoryTree(talkYear(talk.presentedOn)),
    name: id,
    content: buildTalkMemoryContent(talk, event, transcriptText),
    meta: buildTalkMemoryMeta(id, talk, event, url, transcriptText !== null, tags),
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (3 new tests; 12 total).

- [ ] **Step 5: Commit**

```bash
git add scripts/resync-talk-memory.ts scripts/resync-talk-memory.test.ts
git commit -m "$(cat <<'EOF'
feat: prepareTalkMemory reads a talk's files into a memory payload

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 3: `resync-talk-memory` skill + live proof

**Files:**
- Create: `.claude/skills/resync-talk-memory/SKILL.md`

**Interfaces:**
- Consumes: `prepareTalkMemory` (Task 2); `mcp__me__me_memory_create` (existing MCP tool, params `content`, `tree`, `name`, `meta`, `on_conflict`).

- [ ] **Step 1: Write the skill document**

Create `.claude/skills/resync-talk-memory/SKILL.md`:

````markdown
---
name: resync-talk-memory
description: Rebuild one talk's (or every talk's) searchable memory record in the `me` memory engine from its current content file, event, transcript, and tags. Use when a talk's video/slides/metadata changes outside add-talk or transcript-cleanup, when validating the talk-memory sync design, or to run the initial backfill of all talks. Accepts one talk id or --all.
---

# resync-talk-memory

Rebuild a talk's memory record in Matt's personal `me` memory engine so agents
outside this repo can find what he's talked about. This is the shared
primitive `add-talk` and `transcript-cleanup` call after they change a talk;
invoke it directly for any other edit (fixing a missing video, correcting an
abstract, etc.) or to backfill every talk.

## Targets

- A named talk → that talk's `{id}` (the content-file filename in
  `src/content/talks/`, without `.md`).
- `--all` → every `{id}` in `src/content/talks/`.

## Per talk

1. `prepareTalkMemory(id, process.cwd())` (from `scripts/resync-talk-memory.ts`)
   — reads the talk, its event, transcript (if any), and `tags.json` entry (if
   any), and returns `{ tree, name, content, meta }`. Run it via tsx, e.g.
   `node --import tsx -e "import('./scripts/resync-talk-memory.ts').then(m=>m.prepareTalkMemory('<id>', process.cwd())).then(r=>console.log(JSON.stringify(r)))"`.
2. If the result is `{ error: 'not-found' }`, report it and skip — don't guess.
3. Otherwise call `mcp__me__me_memory_create` with the returned `tree`, `name`,
   `content`, `meta`, plus `on_conflict: 'replace'`. This is always safe to
   re-run: replacing an unchanged talk produces an identical record.

## `--all`

106 talks means 106 sequential MCP calls would be slow. List every `.md`
filename in `src/content/talks/` (minus `.md`), split into a handful of
batches (e.g. 6 batches of ~18), and dispatch one subagent per batch to run
steps 1–3 for its slice. Collect and report: total created/updated, and any
`not-found` ids.

## Notes / out of scope

- Writes only to the `me` memory engine — never touches the repo, so there's
  nothing to commit or PR.
- Deleting a talk's memory when a talk is removed from the repo is out of
  scope (no talk-deletion workflow exists today).
- Writing content (blog posts, articles) into memory is a separate, unscoped
  future project.
````

- [ ] **Step 2: Prove it on one real talk with a transcript**

Run:

```bash
node --import tsx -e "import('./scripts/resync-talk-memory.ts').then(m=>m.prepareTalkMemory('1di0B1', process.cwd())).then(r=>console.log(JSON.stringify(r, null, 2)))"
```

Expected: prints a `{ tree: '~/talks/2023', name: '1di0B1', content, meta }`
object; `content` contains the title `Databases: A History of Places to Put
Your Stuff`, a `Transcript:` section, and `meta.hasVideo === true`,
`meta.videoId === 'TEZhDsJXQeY'`.

Then call `mcp__me__me_memory_create` with that exact `tree`, `name`,
`content`, `meta`, and `on_conflict: 'replace'`. Confirm success, then verify
with `mcp__me__me_memory_get` (using the returned id) that `tree` is
`~/talks/2023`, `name` is `1di0B1`, and `meta.videoId` is `TEZhDsJXQeY`.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/resync-talk-memory/SKILL.md
git commit -m "$(cat <<'EOF'
feat: add resync-talk-memory skill

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 4: Hook `add-talk` into `resync-talk-memory`

**Files:**
- Modify: `.claude/skills/add-talk/SKILL.md`

**Interfaces:**
- Consumes: `resync-talk-memory` skill (Task 3).

- [ ] **Step 1: Add the resync step**

In `.claude/skills/add-talk/SKILL.md`, find this text at the end of the
"Write + verify + commit" section:

```
4. Show `git status` + diff. Then branch → commit (with the co-author trailer) →
   offer to open a PR. **Never commit without the user's sign-off.**
```

Replace it with:

```
4. Show `git status` + diff. Then branch → commit (with the co-author trailer) →
   offer to open a PR. **Never commit without the user's sign-off.**
5. **Resync memory** — run the `resync-talk-memory` skill for `talk.id` so the
   new talk becomes searchable in the `me` memory engine.
```

- [ ] **Step 2: Verify the file reads correctly**

Run: `grep -A1 "Resync memory" .claude/skills/add-talk/SKILL.md`
Expected: prints the new step 5 line and its skill-reference sentence.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/add-talk/SKILL.md
git commit -m "$(cat <<'EOF'
feat: add-talk resyncs the new talk's memory record

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 5: Hook `transcript-cleanup` into `resync-talk-memory`

**Files:**
- Modify: `.claude/skills/transcript-cleanup/SKILL.md`

**Interfaces:**
- Consumes: `resync-talk-memory` skill (Task 3).

- [ ] **Step 1: Add the resync step to the per-transcript loop**

In `.claude/skills/transcript-cleanup/SKILL.md`, find the "Per transcript"
section:

```
## Per transcript

1. `prepare(id, process.cwd())` (from `scripts/clean-transcript.ts`) — archives the
   raw to `transcripts-raw/{id}.txt` and returns the raw text. Run it via tsx, e.g.
   `node --import tsx -e "import('./scripts/clean-transcript.ts').then(m=>m.prepare('<id>', process.cwd())).then(r=>process.stdout.write(r.raw))"`.
2. **Clean the raw text yourself** (this is the work), applying the ruleset below.
3. `finalize(id, cleanedText, process.cwd())` — fidelity-checks and, on pass, writes
   the clean text + sets the manifest flag. If `written` is false, show the
   before/after sample + `fidelity.reason` and ask the user: accept anyway (they can
   widen scope), re-clean, or skip. Never bypass the gate silently.
```

Replace it with:

```
## Per transcript

1. `prepare(id, process.cwd())` (from `scripts/clean-transcript.ts`) — archives the
   raw to `transcripts-raw/{id}.txt` and returns the raw text. Run it via tsx, e.g.
   `node --import tsx -e "import('./scripts/clean-transcript.ts').then(m=>m.prepare('<id>', process.cwd())).then(r=>process.stdout.write(r.raw))"`.
2. **Clean the raw text yourself** (this is the work), applying the ruleset below.
3. `finalize(id, cleanedText, process.cwd())` — fidelity-checks and, on pass, writes
   the clean text + sets the manifest flag. If `written` is false, show the
   before/after sample + `fidelity.reason` and ask the user: accept anyway (they can
   widen scope), re-clean, or skip. Never bypass the gate silently.
4. **Resync memory** — if `written` was `true`, run the `resync-talk-memory`
   skill for `id` so the memory record picks up the cleaned transcript. Do
   this per-transcript (not batched at the end) so a partial `--all` run still
   syncs everything it actually cleaned.
```

- [ ] **Step 2: Verify the file reads correctly**

Run: `grep -A2 "Resync memory" .claude/skills/transcript-cleanup/SKILL.md`
Expected: prints the new step 4 and its two following lines.

- [ ] **Step 3: Commit**

```bash
git add .claude/skills/transcript-cleanup/SKILL.md
git commit -m "$(cat <<'EOF'
feat: transcript-cleanup resyncs memory per cleaned transcript

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

## Task 6: Backfill all 106 talks

**Files:** none (memory-engine writes only; no repo changes, no commit).

**Interfaces:**
- Consumes: `resync-talk-memory` skill (Task 3).

- [ ] **Step 1: List every talk id**

Run: `ls src/content/talks/*.md | xargs -n1 basename | sed 's/\.md$//' | wc -l`
Expected: `106`.

- [ ] **Step 2: Run the backfill**

Invoke the `resync-talk-memory` skill with `--all` (per its own instructions:
batch the 106 ids across a handful of subagents, each running
`prepareTalkMemory` + `mcp__me__me_memory_create` with `on_conflict: 'replace'`
for its slice).

- [ ] **Step 3: Verify the count**

Call `mcp__me__me_memory_count` with `tree: '~/talks/*'`.
Expected: `count` is `106`.

- [ ] **Step 4: Spot-check a few records**

Call `mcp__me__me_memory_search` with `tree: '~/talks/*'`, `semantic: 'devops
culture and trust'`, `limit: 3`. Expected: results include talks whose
abstracts plausibly match (e.g. "Zero Trust is for Networks, Not Your Teams").

Call `mcp__me__me_memory_get` for one talk with a transcript (e.g. `1di0B1`,
addressable via a `tree: '~/talks/2023'`, `meta: {notistId: '1di0B1'}` search)
and confirm its `content` includes a `Transcript:` section and `meta.topics`
is present if `tags.json` has an entry for it.

No commit — this task only writes to the memory engine.

---

## Task 7: Fix `Shifting Left Securely`'s missing video (resync validation)

**Files:**
- Modify: `src/content/talks/f8dw3L.md`

**Interfaces:**
- Consumes: `resync-talk-memory` skill (Task 3).

This is an unrelated pre-existing bug (the talk is missing its video), fixed
here because it doubles as a live validation of the resync path for a talk
edited outside `add-talk`/`transcript-cleanup`.

- [ ] **Step 1: Fix the frontmatter**

In `src/content/talks/f8dw3L.md`, change:

```
video: null
```

to:

```
video:
  provider: youtube
  id: Qf1-CRT0pvY
```

(from `https://www.youtube.com/watch?v=Qf1-CRT0pvY&t=178s`)

- [ ] **Step 2: Verify the site still builds**

Run: `npx astro check && npm run build 2>&1 | tail -3`
Expected: 0 errors; the `Shifting Left Securely` talk page now renders a video
embed.

- [ ] **Step 3: Commit the frontmatter fix**

```bash
git add src/content/talks/f8dw3L.md
git commit -m "$(cat <<'EOF'
fix: add missing video to Shifting Left Securely

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

- [ ] **Step 4: Resync and verify the memory record picks it up**

Run:

```bash
node --import tsx -e "import('./scripts/resync-talk-memory.ts').then(m=>m.prepareTalkMemory('f8dw3L', process.cwd())).then(r=>console.log(JSON.stringify(r.meta)))"
```

Expected: `hasVideo: true`, `videoProvider: 'youtube'`, `videoId: 'Qf1-CRT0pvY'`.

Then call `mcp__me__me_memory_create` with the resulting `tree`, `name`,
`content`, `meta`, `on_conflict: 'replace'` (upserting over the Task 6
backfill record). Verify with `mcp__me__me_memory_get` that the stored
`meta.videoId` is now `Qf1-CRT0pvY`.

No further commit — this step only updates the memory engine.

---

## Self-Review

**Spec coverage:**
- Backfill scope: all 106 talks — Task 6. ✓
- One memory per talk, content/meta shape — Task 1. ✓
- Tree `~/talks/{year}` + name `{id}` — Task 1 (`talkMemoryTree`) + Task 2 (`name: id`). ✓
- topics/tech included only when present in `tags.json` — Task 1 (`buildTalkMemoryMeta`), tested both ways. ✓
- `resync-talk-memory` as shared primitive; `add-talk`/`transcript-cleanup` call it — Tasks 3, 4, 5. ✓
- `on_conflict: 'replace'` idempotency — Task 3 SKILL.md instructions, exercised in Tasks 3/6/7. ✓
- Writing (phase 2) — explicitly out of scope, not touched by any task. ✓
- Shifting Left Securely video fix as resync validation — Task 7. ✓

**Placeholder scan:** no TBD/TODO; every code step has complete code; every
command has an expected result. `<id>` in Task 3's tsx one-liner is a
documentation placeholder inside the *skill* the operator fills at call time —
inherent to the skill doc, not a plan placeholder (Task 3 Step 2 itself uses
the real id `1di0B1`, and Task 7 Step 4 uses the real id `f8dw3L`).

**Type consistency:** `TalkFrontmatter`, `EventFrontmatter`, `TalkTags`,
`talkYear`, `talkMemoryTree`, `buildTalkMemoryContent`, `buildTalkMemoryMeta`
(Task 1) are imported with matching names/signatures in Task 2. `TalkMemoryPayload`
and `prepareTalkMemory` (Task 2) are referenced by name in the Task 3 SKILL.md
and the Task 3/7 proof commands.
