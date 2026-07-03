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
