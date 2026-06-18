# transcript-cleanup Skill Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A `transcript-cleanup` Claude skill that turns raw auto-caption transcripts into clean, faithful ones — archiving the raw, gating on fidelity, and rendering/labeling cleaned transcripts correctly.

**Architecture:** Claude does the cleaning (via `SKILL.md`); deterministic file I/O and the fidelity gate live in small tested helpers. Raw is archived to a committed, non-served `transcripts-raw/{id}.txt`; the cleaned text becomes the served `public/transcripts/{id}.txt`. A manifest `cleaned` flag drives a self-detecting paragraph renderer and a softened disclaimer.

**Tech Stack:** Astro 5, TypeScript (strict), Node 20, `tsx`, `node:test`. Reuses `wordCount` from `scripts/lib/vtt.ts`.

## Global Constraints

- **Node 20**, Astro 5. Do not upgrade.
- **Fidelity beats prettiness** — cleaning fixes mechanics + trims non-talk content; it must never reword, summarize, or invent. The fidelity band is **`0.5 ≤ cleanWords/rawWords ≤ 1.05`**.
- **Raw is the durable source of truth** — committed at `transcripts-raw/{id}.txt`, outside `public/` (not served).
- **Served/searchable/downloadable transcript** is always `public/transcripts/{id}.txt`.
- **`{id}`** is the transcript key the site already uses (on this branch, `notistId`; equals `talk.id` for every existing talk).
- This branch is **off `main`** (no `add-talk` decouple) — callers reference `notistId`.
- **No `test` script yet on `main`** — add it (same runner as the add-talk branch). Zero new deps.
- **Add commit co-author trailer** to every commit: `Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>`.

---

## File Structure

**Create:**
- `scripts/lib/transcript-clean.ts` — `rawPath`, `servedPath`, `fidelityCheck`.
- `scripts/lib/transcript-clean.test.ts` — unit tests.
- `scripts/clean-transcript.ts` — `prepare`, `finalize` (the skill calls these).
- `scripts/clean-transcript.test.ts` — unit tests.
- `src/lib/transcripts.test.ts` — `toParagraphs` unit tests.
- `.claude/skills/transcript-cleanup/SKILL.md` — interview/orchestration + ruleset.

**Modify:**
- `package.json` — add `test` script.
- `src/lib/transcripts.ts` — self-detecting `toParagraphs`, new `isCleaned`.
- `src/components/Transcript.astro` — `cleaned` prop + variable disclaimer.
- `src/pages/[id]/[slug].astro` — pass `cleaned={isCleaned(d.notistId)}`.
- `src/pages/talk/[slug].astro` — pass `cleaned={isCleaned(transcriptId)}`.
- `scripts/transcripts.ts` — preserve the `cleaned` flag when rewriting manifest entries.

---

## Task 1: `transcript-clean.ts` helpers + test runner

**Files:**
- Create: `scripts/lib/transcript-clean.ts`
- Create: `scripts/lib/transcript-clean.test.ts`
- Modify: `package.json`

**Interfaces:**
- Produces: `rawPath(root: string, id: string): string` → `{root}/transcripts-raw/{id}.txt`; `servedPath(root: string, id: string): string` → `{root}/public/transcripts/{id}.txt`; `fidelityCheck(rawWords: number, cleanWords: number): { ok: boolean; ratio: number; reason?: string }` — `ratio = cleanWords/rawWords`, `ok` when `0.5 ≤ ratio ≤ 1.05`, else `reason` is `'over-trimmed'` (`<0.5`) or `'expanded — possible invention'` (`>1.05`). `rawWords === 0` → `{ ok: false, ratio: 0, reason: 'empty raw' }`.

- [ ] **Step 1: Add the `test` script to `package.json`**

In `"scripts"`, after `"headshots"`, add:

```json
    "test": "find scripts src/lib -name '*.test.ts' -exec node --import tsx --test {} +"
```

- [ ] **Step 2: Write the failing test**

Create `scripts/lib/transcript-clean.test.ts`:

```ts
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
```

- [ ] **Step 3: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './transcript-clean.ts'`.

- [ ] **Step 4: Write minimal implementation**

Create `scripts/lib/transcript-clean.ts`:

```ts
import { resolve } from 'node:path';

/** Raw archive — committed, NOT served (lives outside public/). */
export function rawPath(root: string, id: string): string {
  return resolve(root, 'transcripts-raw', `${id}.txt`);
}

/** Served / downloadable / search-indexed transcript. */
export function servedPath(root: string, id: string): string {
  return resolve(root, 'public/transcripts', `${id}.txt`);
}

export interface Fidelity {
  ok: boolean;
  ratio: number;
  reason?: string;
}

// Automated safety net behind the human spot-check. Cleaning removes filler +
// boilerplate (ratio < 1 expected), so the floor catches over-trimming and the
// ceiling catches invented text.
export function fidelityCheck(rawWords: number, cleanWords: number): Fidelity {
  if (rawWords === 0) return { ok: false, ratio: 0, reason: 'empty raw' };
  const ratio = cleanWords / rawWords;
  if (ratio < 0.5) return { ok: false, ratio, reason: 'over-trimmed' };
  if (ratio > 1.05) return { ok: false, ratio, reason: 'expanded — possible invention' };
  return { ok: true, ratio };
}
```

- [ ] **Step 5: Run test to verify it passes**

Run: `npm test`
Expected: PASS (4 tests).

- [ ] **Step 6: Commit**

```bash
git add scripts/lib/transcript-clean.ts scripts/lib/transcript-clean.test.ts package.json
git commit -m "feat: transcript-clean path + fidelity helpers + test runner

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 2: `clean-transcript.ts` — prepare + finalize

**Files:**
- Create: `scripts/clean-transcript.ts`
- Create: `scripts/clean-transcript.test.ts`

**Interfaces:**
- Consumes: `rawPath`, `servedPath`, `fidelityCheck` (Task 1); `wordCount` from `scripts/lib/vtt.ts`.
- Produces:
  - `prepare(id: string, root: string): Promise<{ raw: string }>` — if the raw archive doesn't exist, copy the current served file to it (one-time archive); return the raw text read from the archive.
  - `finalize(id: string, cleanedText: string, root: string): Promise<{ fidelity: Fidelity; written: boolean }>` — compute fidelity (archived raw words vs `cleanedText` words); if `ok`, write `cleanedText` to the served path and set `transcripts.json[id] = { words: <clean words>, cleaned: true }` (preserve other entries, write keys sorted); if not `ok`, write nothing. `written === fidelity.ok`.

- [ ] **Step 1: Write the failing test**

Create `scripts/clean-transcript.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, writeFile, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { resolve, join } from 'node:path';
import { prepare, finalize } from './clean-transcript.ts';

const RAW = Array.from({ length: 40 }, (_, i) => `line ${i} words here now`).join('\n');

async function fixture(id: string) {
  const root = await mkdtemp(join(tmpdir(), 'tclean-'));
  await mkdir(resolve(root, 'public/transcripts'), { recursive: true });
  await mkdir(resolve(root, 'transcripts-raw'), { recursive: true });
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
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — `Cannot find module './clean-transcript.ts'`.

- [ ] **Step 3: Write minimal implementation**

Create `scripts/clean-transcript.ts`:

```ts
import { copyFile, readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { wordCount } from './lib/vtt.ts';
import { rawPath, servedPath, fidelityCheck, type Fidelity } from './lib/transcript-clean.ts';

const manifestPath = (root: string) => resolve(root, 'src/data/transcripts.json');

type Manifest = Record<string, { words: number; cleaned?: true }>;

/** Archive the raw transcript (once) and return its text for cleaning. */
export async function prepare(id: string, root: string): Promise<{ raw: string }> {
  const archive = rawPath(root, id);
  if (!existsSync(archive)) {
    await copyFile(servedPath(root, id), archive);
  }
  return { raw: await readFile(archive, 'utf8') };
}

/** Fidelity-check the cleaned text; on pass, write it + flag the manifest. */
export async function finalize(
  id: string,
  cleanedText: string,
  root: string,
): Promise<{ fidelity: Fidelity; written: boolean }> {
  const raw = await readFile(rawPath(root, id), 'utf8');
  const fidelity = fidelityCheck(wordCount(raw), wordCount(cleanedText));
  if (!fidelity.ok) return { fidelity, written: false };

  await writeFile(servedPath(root, id), cleanedText);

  const mPath = manifestPath(root);
  const manifest = JSON.parse(await readFile(mPath, 'utf8')) as Manifest;
  manifest[id] = { words: wordCount(cleanedText), cleaned: true };
  const sorted = Object.fromEntries(Object.keys(manifest).sort().map((k) => [k, manifest[k]]));
  await writeFile(mPath, JSON.stringify(sorted, null, 2) + '\n');

  return { fidelity, written: true };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (3 new tests; 7 total).

- [ ] **Step 5: Commit**

```bash
git add scripts/clean-transcript.ts scripts/clean-transcript.test.ts
git commit -m "feat: clean-transcript prepare/finalize (archive raw, fidelity gate, manifest)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 3: Render + label cleaned transcripts

**Files:**
- Modify: `src/lib/transcripts.ts` (`toParagraphs`, add `isCleaned`)
- Create: `src/lib/transcripts.test.ts`
- Modify: `src/components/Transcript.astro`
- Modify: `src/pages/[id]/[slug].astro`
- Modify: `src/pages/talk/[slug].astro`
- Modify: `scripts/transcripts.ts` (preserve `cleaned` flag)

**Interfaces:**
- Consumes: the manifest `cleaned` flag written by Task 2.
- Produces: `toParagraphs(text: string, perPara?: number): string[]` — splits on blank lines when present (cleaned), else groups `perPara` caption lines (raw, unchanged default 8); `isCleaned(id: string): boolean`. `Transcript.astro` gains optional prop `cleaned?: boolean`.

- [ ] **Step 1: Write the failing test for `toParagraphs`**

Create `src/lib/transcripts.test.ts`:

```ts
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { toParagraphs } from './transcripts.ts';

test('cleaned text: splits on blank lines into real paragraphs', () => {
  const clean = 'First paragraph here.\n\nSecond paragraph here.';
  assert.deepEqual(toParagraphs(clean), ['First paragraph here.', 'Second paragraph here.']);
});

test('raw text: groups caption lines (no blank lines) by perPara', () => {
  const raw = Array.from({ length: 10 }, (_, i) => `line${i}`).join('\n');
  const paras = toParagraphs(raw);
  assert.equal(paras.length, 2);            // 10 lines / 8 per para
  assert.equal(paras[0], 'line0 line1 line2 line3 line4 line5 line6 line7');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `npm test`
Expected: FAIL — the cleaned-text case fails (current `toParagraphs` always groups by line).

- [ ] **Step 3: Update `toParagraphs` + add `isCleaned`**

In `src/lib/transcripts.ts`, replace the `toParagraphs` function with:

```ts
/**
 * Group transcript text into readable paragraphs. Cleaned transcripts already
 * have real paragraphs separated by a blank line — split on those. Raw caption
 * transcripts have no structure, so fall back to grouping `perPara` lines.
 */
export function toParagraphs(text: string, perPara = 8): string[] {
  if (/\n\s*\n/.test(text)) {
    return text.split(/\n\s*\n/).map((p) => p.replace(/\s+/g, ' ').trim()).filter(Boolean);
  }
  const lines = text.split('\n').filter(Boolean);
  const paras: string[] = [];
  for (let i = 0; i < lines.length; i += perPara) {
    paras.push(lines.slice(i, i + perPara).join(' '));
  }
  return paras;
}
```

Then add `isCleaned` next to `hasTranscript` (the file already has `const counts = manifest as Record<string, { words: number }>;` — widen that cast to include the flag):

```ts
const counts = manifest as Record<string, { words: number; cleaned?: true }>;

export function isCleaned(notistId: string): boolean {
  return counts[notistId]?.cleaned === true;
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `npm test`
Expected: PASS (2 new tests; 9 total).

- [ ] **Step 5: Add the `cleaned` prop + variable disclaimer to `Transcript.astro`**

In `src/components/Transcript.astro`, change the Props interface and destructure:

```ts
interface Props {
  text: string;
  words: number;
  downloadHref: string;
  cleaned?: boolean;
}
const { text, words, downloadHref, cleaned = false } = Astro.props;
```

Replace the disclaimer sentence (the text before the Download link) with:

```astro
      {cleaned
        ? 'Lightly edited for readability from the video’s captions.'
        : 'Auto-generated from the video’s captions — expect transcription quirks.'}
```

- [ ] **Step 6: Pass `cleaned` from both caller pages**

In `src/pages/[id]/[slug].astro`, add `isCleaned` to the transcripts import:

```ts
import { readTranscript, transcriptWords, isCleaned } from '../../lib/transcripts';
```
and update the `<Transcript ... />` usage to include:

```astro
      <Transcript text={transcript} words={transcriptWords(d.notistId)} downloadHref={`/transcripts/${d.notistId}.txt`} cleaned={isCleaned(d.notistId)} />
```

In `src/pages/talk/[slug].astro`, add `isCleaned` to the import:

```ts
import { readTranscript, transcriptWords, isCleaned } from '../../lib/transcripts';
```
and update the `<Transcript ... />` usage (inside the `transcript && transcriptId` block):

```astro
      <Transcript text={transcript} words={transcriptWords(transcriptId)} downloadHref={`/transcripts/${transcriptId}.txt`} cleaned={isCleaned(transcriptId)} />
```

- [ ] **Step 7: Preserve the `cleaned` flag in `scripts/transcripts.ts`**

A re-run of the fetch script rewrites manifest entries and would otherwise drop
`cleaned`. Preserve it. Change the two manifest-write lines (the preserved-file
path and the freshly-fetched path) from `manifest[talk.notistId] = { words: … }` to
spread the existing entry first:

```ts
manifest[talk.notistId] = { ...manifest[talk.notistId], words: wordCount(await readFile(dest, 'utf8')) };
```
```ts
manifest[talk.notistId] = { ...manifest[talk.notistId], words: wordCount(text) };
```

- [ ] **Step 8: Type-check + build**

Run: `npx astro check && npm run build 2>&1 | tail -3`
Expected: 0 errors; 268 pages built. (No transcript is cleaned yet, so every disclaimer still reads the raw variant — behavior unchanged.)

- [ ] **Step 9: Commit**

```bash
git add src/lib/transcripts.ts src/lib/transcripts.test.ts src/components/Transcript.astro src/pages/[id]/[slug].astro src/pages/talk/[slug].astro scripts/transcripts.ts
git commit -m "feat: render + label cleaned transcripts (paragraphs, disclaimer, flag)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Task 4: `SKILL.md` + clean 1–2 real transcripts (proof)

**Files:**
- Create: `.claude/skills/transcript-cleanup/SKILL.md`

**Interfaces:**
- Consumes: `prepare`/`finalize` (Task 2), the rendering/flag work (Task 3).

- [ ] **Step 1: Write the skill document**

Create `.claude/skills/transcript-cleanup/SKILL.md`:

````markdown
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
````

- [ ] **Step 2: Prove it on one real transcript**

Pick a short real transcript and run the flow. Example (replace `<id>` with an actual file from `public/transcripts/`, e.g. the smallest):

```bash
ls -S public/transcripts/*.txt | tail -1   # smallest transcript → pick its id
```

Then, for that `<id>`: run `prepare`, clean the returned raw text per the ruleset (produce real paragraphs separated by blank lines), and run `finalize`:

```bash
node --import tsx -e "import('./scripts/clean-transcript.ts').then(m=>m.prepare('<id>', process.cwd())).then(r=>process.stdout.write(r.raw))"
# (clean the text, then:)
node --import tsx -e "import('./scripts/clean-transcript.ts').then(m=>m.finalize('<id>', \`<CLEANED TEXT>\`, process.cwd())).then(r=>console.log(JSON.stringify(r.fidelity)))"
```

Expected: `finalize` reports `ok: true`; `transcripts-raw/<id>.txt` exists; `public/transcripts/<id>.txt` is the cleaned text; `src/data/transcripts.json["<id>"].cleaned === true`.

- [ ] **Step 3: Build + verify the cleaned page**

Run:
```bash
npx astro check && npm run build 2>&1 | tail -2
node -e "const m=require('./src/data/transcripts.json'); console.log('cleaned count:', Object.values(m).filter(e=>e.cleaned).length)"
```
Expected: 0 errors; 268 pages; cleaned count ≥ 1. Spot-check the talk's page HTML in `dist/` shows multiple `<p>` paragraphs and "Lightly edited" rather than "expect transcription quirks".

- [ ] **Step 4: Commit**

```bash
git add .claude/skills/transcript-cleanup/SKILL.md transcripts-raw public/transcripts src/data/transcripts.json
git commit -m "feat: transcript-cleanup skill + clean first real transcript (part of #2)

Co-Authored-By: Claude Opus 4.8 (1M context) <noreply@anthropic.com>"
```

---

## Self-Review

**Spec coverage:**
- Claude cleans via SKILL.md, single pass — Task 4. ✓
- Archive raw → `transcripts-raw/{id}.txt`, serve clean — Task 2 (`prepare`/`finalize`). ✓
- Edit scope ruleset (mechanics + trim, never reword) — Task 4 SKILL.md. ✓
- Fidelity band `[0.5, 1.05]` + flag — Task 1 (`fidelityCheck`) + Task 2 (gate). ✓
- Single + `--all` invocation — Task 4. ✓
- Render adaptation (`toParagraphs` self-detect) — Task 3. ✓
- Disclaimer varies on cleaned — Task 3 (`isCleaned` + `Transcript.astro` + callers). ✓
- Manifest `cleaned` flag set (Task 2) + preserved on re-fetch (Task 3 step 7). ✓
- Build guardrail + clean 1–2 as proof — Tasks 3 & 4. ✓
- Edge cases (`--force` clobber, already-cleaned skip, no transcript) — Task 4 SKILL.md. ✓

**Placeholder scan:** No TBD/TODO; code complete in every code step; commands have expected output. (`<id>`/`<CLEANED TEXT>` in Task 4 are runtime values the operator fills — inherent to a proof step, not plan placeholders.)

**Type consistency:** `Fidelity`, `rawPath`, `servedPath`, `fidelityCheck` (Task 1) reused in Task 2. `prepare`/`finalize` (Task 2) referenced by Task 4. `toParagraphs`/`isCleaned` (Task 3) consumed by `Transcript.astro` + both pages. Manifest shape `{ words, cleaned? }` consistent across Tasks 2 & 3.
