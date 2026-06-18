---
name: transcript-cleanup
description: Turn a talk's raw auto-caption transcript into a clean, faithful, readable one — fixing mechanics and trimming non-talk chatter, never rewording or inventing. Use when the user says "clean up the transcript", "fix this transcript", "the transcript is messy", or wants to polish captured captions. Accepts one talk id or --all to sweep every uncleaned transcript.
---

# transcript-cleanup

Turn raw auto-caption transcripts into clean, **faithful** ones. Raw is archived
and stays the source of truth; the cleaned text becomes the served transcript.
Fidelity beats prettiness — this is a durable archive.

## Targets

- A named talk → that transcript's `{id}` (the transcript filename in
  `public/transcripts/`).
- `--all` → every `{id}` in `src/data/transcripts.json` whose entry lacks
  `cleaned: true`.

## Per transcript

1. `prepare(id, process.cwd())` (from `scripts/clean-transcript.ts`) — archives the
   raw to `transcripts-raw/{id}.txt` and returns the raw text. Run it via tsx, e.g.
   `node --import tsx -e "import('./scripts/clean-transcript.ts').then(m=>m.prepare('<id>', process.cwd())).then(r=>process.stdout.write(r.raw))"`.
2. **Clean the raw text yourself** (this is the work), applying the ruleset below.
3. `finalize(id, cleanedText, process.cwd())` — fidelity-checks and, on pass, writes
   the clean text + sets the manifest flag. If `written` is false, show the
   before/after sample + `fidelity.reason` and ask the user: accept anyway (they can
   widen scope), re-clean, or skip. Never bypass the gate silently.

## Cleaning ruleset

- **DO:** add sentence punctuation + capitalization; restore obvious proper nouns
  (Kubernetes, PagerDuty, DevOps, AWS, …); split into paragraphs separated by a
  **blank line**; remove disfluencies (um, uh, repeated false starts); remove
  clearly non-talk boilerplate (room logistics, "wave at the livestream",
  housekeeping, raffle/sponsor chatter).
- **DO NOT:** reword or paraphrase talk content; summarize or compress; add
  sentences that weren't said; change technical claims; reorder content.
- **When unsure** whether something is "the talk" or "chatter," KEEP it.

## After the batch

`npm run build`, confirm a cleaned page renders with real paragraphs and the
"Lightly edited…" disclaimer, then show `git status` + diff and offer a PR. Never
commit without the user's sign-off.

## Notes / out of scope

- A `--force` re-fetch (`npm run transcripts -- --force`) overwrites a cleaned file
  with fresh raw — re-run cleanup afterward.
- Fetching transcripts, translation, speaker diarization, and re-editing already
  clean transcripts are out of scope.
