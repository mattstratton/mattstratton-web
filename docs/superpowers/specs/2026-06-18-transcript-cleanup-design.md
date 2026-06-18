# Design: `transcript-cleanup` skill (part of #2)

**Date:** 2026-06-18
**Status:** Approved (design); pending implementation plan
**Issue:** [#2 — add Claude skills for content updating](https://github.com/mattstratton/mattstratton-speaking/issues/2) — second of several content skills (after `add-talk`).

## Problem

`scripts/transcripts.ts` fetches video auto-captions and `cleanVtt` strips timing
cues and dedupes the rolling-caption echo — but the result is still wall-of-text
ASR sludge: lowercase, no punctuation, mangled proper nouns ("Kubernetes" →
"communities", "PagerDuty" → "pager duty"), disfluencies, and pre/post-talk
chatter ("be sure to grab some more pizza", "wave at me in the livestream"). A
script can't fix that; an LLM can. `Transcript.astro` calls this artifact "the
durable record that survives the video" — so making it actually readable serves
the north star directly. 30 raw transcripts exist today (longest ~12,400 words).

This skill turns a raw transcript into a clean, **faithful** one. Fidelity beats
prettiness: this is a durable archive, so cleaning must never reword, summarize,
or invent — only fix mechanics and trim non-talk content.

## Decisions (locked during brainstorming)

| Decision | Choice |
|---|---|
| Who cleans | Claude, via `SKILL.md` (no API key, no new dependency — matches `add-talk`) |
| Pass strategy | Single pass per transcript (longest ~12.4k words / ~16k tokens; no chunking — YAGNI) |
| Raw handling | Archive raw → committed, non-served `transcripts-raw/{id}.txt`; cleaned → served `public/transcripts/{id}.txt` |
| Edit scope | Fix mechanics (punctuation, casing, proper nouns, paragraphs) + drop disfluencies and clearly-non-talk boilerplate. **Never reword, summarize, or invent.** |
| Fidelity gate | Word-count band `[0.5, 1.05]` of raw (flag over-trim / invention) + human spot-check + raw archived for reversibility |
| Invocation | Single talk **or** `--all` sweep of uncleaned transcripts; fidelity-gated |
| Fetch script | `scripts/transcripts.ts` untouched |

> **Note on the transcript key (`{id}`):** transcript files and the manifest are
> keyed by the same id the rest of the site uses for a talk's assets. This spec
> uses `{id}` generically; it composes with the `add-talk` branch's
> `notistId → talk.id` decouple (where that lands, the key is `talk.id`; on its
> own, it's `notistId` — they're equal for every existing talk).

## File model

- **`transcripts-raw/{id}.txt`** — raw auto-caption text. **Committed, NOT served**
  (lives outside `public/`). The durable source of truth: cleanup re-runs from it,
  so we never depend on the video still existing. Created at clean-time by copying
  the current `public/transcripts/{id}.txt` *before* overwriting — no upfront bulk
  migration; it happens per-talk on first clean.
- **`public/transcripts/{id}.txt`** — for uncleaned talks, the raw text (as today);
  after cleanup, the cleaned text. Always the served / downloadable / search-indexed
  artifact.
- **`src/data/transcripts.json`** — entries gain `cleaned: true` and the post-clean
  word count: `{ words: number, cleaned?: true }`.

## Components

### 1. `.claude/skills/transcript-cleanup/SKILL.md`

Orchestration + the cleaning ruleset. Flow:

1. Resolve target(s): a named talk, or `--all` (every talk with a transcript whose
   manifest entry lacks `cleaned: true`).
2. For each: call `prepare(id, root)` (archives raw, returns the raw text).
3. **Clean** the raw text in one pass per the ruleset below (this is the LLM work).
4. Call `finalize(id, cleanedText, root)` → runs the fidelity check, and on pass
   writes the cleaned text + sets the manifest flag. On fail, surface the
   before/after sample + ratio for the user to decide (accept / re-clean / skip).
5. After the batch: `npm run build`, then show `git status` + diff and offer a PR.

**Cleaning ruleset (verbatim intent for the skill):**
- DO: add sentence punctuation and capitalization; restore obvious proper nouns
  (Kubernetes, PagerDuty, DevOps, AWS, etc.); break into paragraphs separated by a
  blank line; remove disfluencies (um, uh, repeated false starts); remove clearly
  non-talk boilerplate (room logistics, "wave at the livestream", housekeeping,
  sponsor/raffle chatter).
- DO NOT: reword or paraphrase actual talk content; summarize or compress;
  add transitions or sentences that weren't said; change technical claims; reorder
  content.
- When unsure whether something is "the talk" or "chatter," KEEP it.

### 2. `scripts/lib/transcript-clean.ts` (unit-tested)

- `rawPath(id: string): string` → `transcripts-raw/{id}.txt`
- `servedPath(id: string): string` → `public/transcripts/{id}.txt`
- word counts reuse the existing `wordCount` export from `scripts/lib/vtt.ts`
- `fidelityCheck(rawWords: number, cleanWords: number): { ok: boolean; ratio: number; reason?: string }`
  — `ratio = cleanWords / rawWords`; `ok` when `0.5 ≤ ratio ≤ 1.05`; else `reason`
  is `'over-trimmed'` (`<0.5`) or `'expanded — possible invention'` (`>1.05`).

### 3. `scripts/clean-transcript.ts` (unit-tested; the skill calls these)

- `prepare(id: string, root: string): Promise<{ raw: string }>` — if
  `transcripts-raw/{id}.txt` doesn't exist, copy the current served file there;
  return the raw text (read from the archive).
- `finalize(id: string, cleanedText: string, root: string): Promise<{ fidelity: { ok: boolean; ratio: number; reason?: string }; written: boolean }>`
  — compute fidelity vs the archived raw; if `ok`, write `cleanedText` to the served
  path and set `transcripts.json[id] = { words: <clean word count>, cleaned: true }`
  (preserving other entries, keys written sorted); return `{ fidelity, written: ok }`.
  When not `ok`, do not write — return `{ fidelity, written: false }` so the skill
  can surface it.

### 4. `src/lib/transcripts.ts`

- `toParagraphs(text)` — **self-detecting**: if `text` contains a blank line
  (`\n\s*\n`), split into paragraphs on blank lines (cleaned format); otherwise fall
  back to the existing 8-caption-line grouping (raw format). Keeps both raw and
  cleaned transcripts rendering correctly during the transition.
- Add `isCleaned(id: string): boolean` reading the manifest `cleaned` flag.

### 5. `src/components/Transcript.astro`

Disclaimer varies on `isCleaned(id)`:
- cleaned → "Lightly edited for readability from the video's captions."
- raw → the existing "Auto-generated from the video's captions — expect transcription quirks."

(The page passes the transcript id, already available where `readTranscript` is called.)

## Data flow

```
public/transcripts/{id}.txt (raw, today)
   │ prepare(): copy → transcripts-raw/{id}.txt (archive, once)
   ▼
Claude cleans in one pass (conservative ruleset)      ← SKILL.md
   │ finalize(cleanedText)
   ▼
fidelityCheck(rawWords, cleanWords) ∈ [0.5, 1.05]?
   │ pass → write + manifest cleaned:true     │ fail → surface sample for review
   ▼
public/transcripts/{id}.txt (clean, \n\n paragraphs)
   ▼
build: toParagraphs detects clean · softened disclaimer · search/deep-index use clean text
```

## Edge cases

- **`--force` re-fetch clobbering a cleaned file:** `npm run transcripts -- --force`
  would overwrite a cleaned served file with fresh raw and leave a stale `cleaned`
  flag. Documented in `SKILL.md`: re-run cleanup after a forced re-fetch. (Rare,
  manual; not worth complicating the fetch script.)
- **Already cleaned:** `--all` skips talks whose manifest entry has `cleaned: true`;
  a single-talk run on an already-clean talk re-cleans from the archived raw.
- **No transcript:** if `public/transcripts/{id}.txt` is absent, the skill reports
  "no transcript for {id}" and stops (nothing to clean).

## Testing

- **Unit (`scripts/lib/transcript-clean.ts`):** `fidelityCheck` band — pass at
  ratio 1.0, fail `over-trimmed` at 0.3, fail `expanded` at 1.3, edges 0.5 and 1.05
  inclusive; path helpers.
- **Unit (`scripts/clean-transcript.ts`):** temp-dir fixture — `prepare` archives
  raw and returns text; second `prepare` doesn't re-archive; `finalize` with a
  passing clean writes the served file + sets `cleaned: true` + preserves other
  manifest entries; `finalize` with an over-trimmed clean returns `written: false`
  and does not write.
- **Unit (`src/lib/transcripts.ts`):** `toParagraphs` splits on blank lines for
  cleaned text; falls back to 8-line grouping for raw (no blank lines).
- **Guardrail:** `npm run build` after the lib/component change.
- **Proof:** clean 1–2 real transcripts through the skill this session; confirm the
  page renders with real paragraphs + the softened disclaimer.

## Scope (YAGNI)

**In:** clean raw transcripts (single + `--all`), archive raw, fidelity gate, render
adaptation, disclaimer. **Out:** fetching transcripts (`transcripts.ts` / future
`attach-video`), translation, speaker diarization, re-editing already-clean
transcripts, chunking long transcripts.

## Open questions

None outstanding.
