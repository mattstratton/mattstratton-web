# Design: sync talks into personal memory (memory engine `me`)

**Date:** 2026-07-03
**Status:** Approved (design); pending implementation plan

## Problem

Matt has 106 conference talks fully modeled in this repo (`src/content/talks`,
`src/content/events`, `public/transcripts`, `src/data/tags.json`) but that
knowledge is invisible to any agent working outside this repo. When Matt works
with an agent elsewhere and it would help to know "what has Matt said about
X before," there's no way to find out short of searching this repo directly.

The `me` MCP server (memory engine) gives Matt a personal, semantically
searchable memory store, independent of any one repo or session. This project
makes every talk delivery a searchable memory record, keeps it in sync as
talks are added or transcripts are cleaned, and leaves room for a future phase
that does the same for Matt's writing.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Scope of backfill | All 106 talks now, not just the 30 with cleaned transcripts |
| Memory granularity | One memory per talk (title + abstract + metadata + transcript, if any, in one blob) |
| Tree structure | `~/talks/{year}` (tree) + `{notistId}` (name) → addressable as `~/talks/{year}/{notistId}` |
| Topic metadata | Include `topics`/`tech` from `src/data/tags.json` when a talk has an entry; omit otherwise. No new tag generation. |
| Ongoing sync | New `resync-talk-memory` skill is the single primitive; `add-talk` and `transcript-cleanup` call it as their last step instead of duplicating logic |
| Idempotency | `on_conflict: 'replace'` on every upsert — safe to re-run for any talk at any time |
| Writing (phase 2) | Out of scope for this spec. Deferred until Matt identifies where his writing content actually lives. Tree would sit alongside as `~/writing/{year}/{slug}`. |

## Memory shape

**Tree:** `~/talks/{year}`
**Name:** `{notistId}` (the talk's content-file id / filename stem)
**On conflict:** `replace`

**Content** (single text blob):

```
{title}
Delivered at {event.name}, {event.location} — {presentedOn, YYYY-MM-DD}

Abstract:
{abstract, HTML stripped to plain text}

Transcript:
{cleaned transcript text, if public/transcripts/{id}.txt exists}
```

The `Transcript:` section is omitted entirely (not left empty) when no
transcript file exists for the talk. Virtual events render as `Delivered at
{event.name}, Virtual` (no location coordinates to lose — matches the existing
map-page convention for `location: "Virtual"`).

**Metadata (`meta`):**

| Key | Type | Notes |
|---|---|---|
| `notistId` | string | matches the talk's content-file id |
| `year` | number | `presentedOn` year |
| `event` | string | event name |
| `eventLocation` | string \| undefined | omitted for talks with no event reference |
| `presentedOn` | string (ISO date) | |
| `hasVideo` | boolean | |
| `videoProvider` | `'youtube' \| 'vimeo'` \| undefined | omitted when `hasVideo` is false |
| `videoId` | string \| undefined | omitted when `hasVideo` is false |
| `hasTranscript` | boolean | |
| `topics` | string[] \| undefined | from `tags.json`, omitted if no entry |
| `tech` | string[] \| undefined | from `tags.json`, omitted if no entry |
| `url` | string | `https://speaking.mattstratton.com{talkUrl(talk)}` |

## Components

### 1. `scripts/lib/memory-sync.ts` (unit-tested, pure functions)

- `buildTalkMemoryContent(talk, event, transcriptText: string | null): string`
  — builds the blob above. Strips HTML tags from `abstractHtml` to plain text
  (reuse an existing stripper if the repo has one; otherwise a small regex
  strip is enough — this is prose for embedding, not rendered HTML).
- `buildTalkMemoryMeta(talk, event, hasTranscript, tags: {topics: string[], tech: string[]} | undefined): Record<string, unknown>`
  — builds the metadata table above, omitting undefined-valued keys (don't
  write `null`/`""` placeholders into `meta`).
- `talkMemoryTree(year: number): string` → `` `~/talks/${year}` ``
- `talkMemoryName(id: string): string` → `id` (trivial passthrough, kept for
  call-site clarity / future-proofing)

### 2. `scripts/resync-talk-memory.ts` (unit-tested; the skill calls this)

- `prepareTalkMemory(id: string, root: string): Promise<{ tree: string; name: string; content: string; meta: Record<string, unknown> } | { error: 'not-found' }>`
  — reads `src/content/talks/{id}.md`, resolves the `event` reference from
  `src/content/events/{eventId}.md` if present, reads
  `public/transcripts/{id}.txt` if present, looks up `src/data/tags.json` by
  `notistSlug`, and returns the full payload ready to hand to
  `mcp__me__me_memory_create`. Returns `{ error: 'not-found' }` if no talk file
  exists for `id` (the skill surfaces this rather than guessing).

This mirrors the existing `scripts/lib/*` + `scripts/*.ts` split used by
`transcript-cleanup` (`scripts/lib/transcript-clean.ts` +
`scripts/clean-transcript.ts`): pure/testable logic in a script, the actual
MCP tool call made by the skill itself (scripts have no MCP client).

### 3. `.claude/skills/resync-talk-memory/SKILL.md` (new skill)

Orchestration only — thin by design:

1. Resolve target(s): a single talk id, or `--all` (every talk in
   `src/content/talks`).
2. For each id: run `prepareTalkMemory(id, process.cwd())` via `tsx`.
3. If `{ error: 'not-found' }`, report and skip.
4. Otherwise call `mcp__me__me_memory_create` with the returned
   `{ tree, name, content, meta }` plus `on_conflict: 'replace'`.
5. For `--all`, batch across a handful of parallel subagents (repo has 106
   talks; sequential one-at-a-time MCP calls would be needlessly slow) — each
   subagent takes a slice of ids and runs steps 2–4 for its slice.
6. Report a summary: created/updated count, any `not-found` ids.

No git branch, no PR — this skill only writes to the memory engine, never to
the repo. Nothing to commit.

### 4. `add-talk` skill (existing, amended)

After step 8 in the "Write + verify + commit" section (PR offered/created),
add a final step: run `resync-talk-memory` for the newly-created talk's id.

### 5. `transcript-cleanup` skill (existing, amended)

After a transcript passes the fidelity gate and is written (per-transcript, in
the existing loop — not batched at the end, so a partial `--all` run still
syncs everything it actually cleaned), run `resync-talk-memory` for that
talk's id.

## Data flow

```
src/content/talks/{id}.md ──┐
src/content/events/{id}.md ─┼─▶ prepareTalkMemory(id) ─▶ {tree, name, content, meta}
public/transcripts/{id}.txt ┤         │
src/data/tags.json ─────────┘         ▼
                              mcp__me__me_memory_create
                              (on_conflict: replace)
                                       │
                                       ▼
                         ~/talks/{year}/{notistId} memory record
```

## Edge cases

- **No event reference:** `eventLocation` omitted from `meta`; content's
  "Delivered at" line uses just the event name (or is dropped entirely if
  `event` itself is absent — rare/nonexistent today per the 93-events-for-106-talks
  count, but the code must not crash on it).
- **No transcript:** `Transcript:` section omitted from content; `hasTranscript: false`.
  Re-running `resync-talk-memory` after a transcript is later cleaned picks it
  up via `on_conflict: replace` — no separate "add transcript" path needed.
  This is also how the `Shifting Left Securely` video fix gets validated:
  fix the frontmatter, run `resync-talk-memory` for that one id, confirm the
  memory record's `hasVideo`/`videoId` update.
- **No tags.json entry:** `topics`/`tech` omitted from `meta` entirely (not
  empty arrays) — keeps `meta` filters clean (`meta: {topics: [...]}` querying
  only matches talks that actually have that key).
- **Re-running on an unchanged talk:** idempotent — `on_conflict: replace`
  overwrites with identical content, no error, no duplicate.
- **Talk id not found:** `prepareTalkMemory` returns `{ error: 'not-found' }`;
  skill reports it and moves on (relevant for typos in a single-id invocation).

## Testing

- **Unit (`scripts/lib/memory-sync.ts`):** `buildTalkMemoryContent` — with/without
  transcript, with/without event, HTML-stripped abstract; `buildTalkMemoryMeta` —
  full field set, omitted-when-absent fields (video, tags, eventLocation);
  `talkMemoryTree` year formatting.
- **Unit (`scripts/resync-talk-memory.ts`):** `prepareTalkMemory` against fixture
  content files — happy path returns the right shape; missing talk id returns
  `{ error: 'not-found' }`; missing transcript file omits the section; tags.json
  lookup by `notistSlug` (hit and miss).
- **Guardrail:** `npm test` (existing suite) stays green.
- **Proof (this session, manual):**
  1. Run `resync-talk-memory --all`, confirm a `me_memory_count` on `~/talks`
     returns 106.
  2. Spot-check 2–3 records via `me_memory_get`/`me_memory_search` — one with a
     transcript, one without, one with tags.json topics.
  3. Fix the `Shifting Left Securely` talk's missing video field, run
     `resync-talk-memory` for just that id, confirm the memory record's
     `hasVideo`/`videoId` reflect the fix.

## Scope (YAGNI)

**In:** one-time backfill of all 106 talks, `resync-talk-memory` skill,
`add-talk`/`transcript-cleanup` hooks, `on_conflict: replace` idempotency.

**Out:** writing content (phase 2, unscoped — needs a source location first),
auto-generated topic tags, transcript chunking/splitting into multiple
memories, a "delete talk" sync path (no talk deletion workflow exists in this
repo today), syncing `resources` links or slide assets into memory content.

## Open questions

None outstanding.
