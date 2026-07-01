# /fitness UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Break the single-page `/fitness` dashboard into a landing page plus detail pages (records, per-exercise, per-workout), make everything clickable, and show a 🏅 badge on personal-record sets.

**Architecture:** Extend the existing TDD'd `src/lib/liftosaur.ts` with a few small pure functions (workout mapping/sorting, year grouping, PR-badge lookup, per-exercise filtering), then rewrite `src/pages/fitness/index.astro` into a condensed landing page and add four new Astro pages/routes that consume those functions. No new dependencies, no changes to the `workouts` content collection schema or the build-time loader.

**Tech Stack:** Astro 5 content collections, `node --test` + `tsx` for unit tests (see `package.json`'s `test` script), Tailwind CSS v4 utility classes matching the existing design system.

## Global Constraints

- Reuse `slugify` from `src/lib/posts.ts` — do not write a second slugify function (confirmed during brainstorming that it already produces correct, collision-free slugs for this dataset's exercise names).
- `MAIN_LIFTS` is a hardcoded list: `['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']` — exact string matches, no fuzzy matching.
- No new PR-derivation concept: "was this workout a PR for exercise X" is exactly `workout.date === computePersonalRecords(workouts).find(pr => pr.exercise === X).date`.
- Every new pure function in `src/lib/liftosaur.ts` gets a test in `src/lib/liftosaur.test.ts` written and watched failing before implementation (TDD, per this repo's established pattern in the same file).
- Astro `.astro` pages in this repo are not unit tested — verify them via `npm run build` (page count / spot-check output) and a manual `npm run dev` browser pass, matching how every other page in this repo is verified.
- Follow the existing `getStaticPaths` + `props` convention used by `src/pages/tags/[slug].astro`: compute everything once inside `getStaticPaths`, pass fully-formed data via `props`, do not re-fetch/re-compute inside the page body.

---

### Task 1: `sortedWorkouts` + `MAIN_LIFTS` in `src/lib/liftosaur.ts`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `ParsedWorkout` (already defined in this file).
- Produces: `export const MAIN_LIFTS: string[]`; `export function sortedWorkouts(entries: CollectionEntry<'workouts'>[]): ParsedWorkout[]` — every later page task calls this instead of duplicating the `entries.map(...).sort(...)` currently inline in `src/pages/fitness/index.astro`.

- [ ] **Step 1: Write the failing test**

Add to `src/lib/liftosaur.test.ts`, right after the existing imports (extend the import line rather than adding a second one):

```ts
import {
  parseWorkoutText,
  computePersonalRecords,
  computeTrend,
  sparklinePoints,
  sortedWorkouts,
  MAIN_LIFTS,
  type ParsedWorkout,
} from './liftosaur.ts';
```

Then add at the end of the file:

```ts
test('MAIN_LIFTS is the fixed set of headline exercises', () => {
  assert.deepEqual(MAIN_LIFTS, ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']);
});

test('sortedWorkouts maps collection entries to ParsedWorkout, newest first', () => {
  const entries = [
    {
      id: '1',
      data: {
        date: new Date('2026-01-01T00:00:00.000Z'),
        program: 'P',
        dayName: 'D',
        durationSeconds: 60,
        exercises: [],
      },
    },
    {
      id: '2',
      data: {
        date: new Date('2026-01-08T00:00:00.000Z'),
        program: 'P',
        dayName: 'D',
        durationSeconds: 60,
        exercises: [],
      },
    },
  ] as Parameters<typeof sortedWorkouts>[0];

  const workouts = sortedWorkouts(entries);
  assert.deepEqual(workouts.map((w) => w.id), ['2', '1']);
  assert.equal(workouts[0].date, '2026-01-08T00:00:00.000Z');
  assert.equal(workouts[0].program, 'P');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `SyntaxError: The requested module './liftosaur.ts' does not provide an export named 'sortedWorkouts'` (or `MAIN_LIFTS`).

- [ ] **Step 3: Write minimal implementation**

In `src/lib/liftosaur.ts`, change the top import line:

```ts
import type { Loader } from 'astro/loaders';
```

to:

```ts
import type { Loader } from 'astro/loaders';
import type { CollectionEntry } from 'astro:content';
```

(This is a type-only import — it's erased by `tsx` at compile time, so it does not attempt to resolve the `astro:content` virtual module under the plain `node --test` runner. `src/lib/posts.ts` already relies on this same pattern.)

Then add, right after the `ParsedWorkout` interface definition:

```ts
// The four lifts that matter most, shown on the /fitness landing page. Exact
// string matches against Liftosaur exercise names — no fuzzy matching.
export const MAIN_LIFTS = ['Squat', 'Bench Press', 'Deadlift', 'Overhead Press'];

// Maps `workouts` content-collection entries to ParsedWorkout (Date -> ISO
// string) and sorts newest first. Every /fitness page uses this instead of
// duplicating the mapping/sort inline.
export function sortedWorkouts(entries: CollectionEntry<'workouts'>[]): ParsedWorkout[] {
  return entries
    .map((e) => ({ id: e.id, ...e.data, date: e.data.date.toISOString() }))
    .sort((a, b) => b.date.localeCompare(a.date));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green (including the pre-existing ones).

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add sortedWorkouts + MAIN_LIFTS to liftosaur lib"
```

---

### Task 2: `groupWorkoutsByYear`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `ParsedWorkout[]` (already sorted or not — this function sorts internally).
- Produces: `export function groupWorkoutsByYear(workouts: ParsedWorkout[]): [number, ParsedWorkout[]][]` — used by `src/pages/fitness/workouts/index.astro` (Task 8) to render the year-grouped archive, mirroring `groupByYear` in `src/lib/posts.ts` but workout-shaped (that function is typed to `CollectionEntry<'posts'>` and isn't reusable here without generics that aren't worth it for this little logic).

- [ ] **Step 1: Write the failing test**

Add to the import line in `src/lib/liftosaur.test.ts`:

```ts
import {
  parseWorkoutText,
  computePersonalRecords,
  computeTrend,
  sparklinePoints,
  sortedWorkouts,
  groupWorkoutsByYear,
  MAIN_LIFTS,
  type ParsedWorkout,
} from './liftosaur.ts';
```

Add at the end of the file:

```ts
test('groupWorkoutsByYear groups by year, descending, workouts newest first within a year', () => {
  const workouts = [
    workout('2025-03-01T00:00:00.000Z', 'Squat', [[5, 100]]),
    workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 110]]),
    workout('2025-01-01T00:00:00.000Z', 'Squat', [[5, 90]]),
  ];
  const grouped = groupWorkoutsByYear(workouts);
  assert.deepEqual(
    grouped.map(([year]) => year),
    [2026, 2025],
  );
  assert.deepEqual(
    grouped[1][1].map((w) => w.date),
    ['2025-03-01T00:00:00.000Z', '2025-01-01T00:00:00.000Z'],
  );
});
```

(This reuses the `workout(date, exercise, sets)` helper already defined earlier in the test file for the PR/trend tests.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `does not provide an export named 'groupWorkoutsByYear'`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/liftosaur.ts`, after `sortedWorkouts`:

```ts
// Groups workouts by calendar year (descending), each year's workouts newest
// first — the /fitness/workouts/ archive page renders one section per year,
// mirroring the pattern used by the /post/ archive.
export function groupWorkoutsByYear(workouts: ParsedWorkout[]): [number, ParsedWorkout[]][] {
  const sorted = [...workouts].sort((a, b) => b.date.localeCompare(a.date));
  const years = new Map<number, ParsedWorkout[]>();
  for (const w of sorted) {
    const year = new Date(w.date).getFullYear();
    if (!years.has(year)) years.set(year, []);
    years.get(year)!.push(w);
  }
  return [...years.entries()].sort((a, b) => b[0] - a[0]);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add groupWorkoutsByYear to liftosaur lib"
```

---

### Task 3: `exerciseIsPR` + `workoutHasPR`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `ParsedWorkout`, `PersonalRecord[]` (both already defined).
- Produces: `export function exerciseIsPR(workout: ParsedWorkout, exerciseName: string, records: PersonalRecord[]): boolean`; `export function workoutHasPR(workout: ParsedWorkout, records: PersonalRecord[]): boolean`. Used by every page that renders a 🏅 (main landing page recent-workouts rows, workout archive rows, workout detail page, exercise detail page).

- [ ] **Step 1: Write the failing test**

Add to the import line:

```ts
import {
  parseWorkoutText,
  computePersonalRecords,
  computeTrend,
  sparklinePoints,
  sortedWorkouts,
  groupWorkoutsByYear,
  exerciseIsPR,
  workoutHasPR,
  MAIN_LIFTS,
  type ParsedWorkout,
} from './liftosaur.ts';
```

Add at the end of the file:

```ts
test('exerciseIsPR is true only for the workout that first set the record', () => {
  const older = workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]);
  const pr = workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]);
  const later = workout('2026-01-15T00:00:00.000Z', 'Squat', [[5, 110]]); // repeats the PR weight
  const records = computePersonalRecords([older, pr, later]);

  assert.equal(exerciseIsPR(pr, 'Squat', records), true);
  assert.equal(exerciseIsPR(older, 'Squat', records), false);
  assert.equal(exerciseIsPR(later, 'Squat', records), false);
});

test('exerciseIsPR is false for an exercise with no record at all', () => {
  const w = workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]);
  assert.equal(exerciseIsPR(w, 'Bench Press', []), false);
});

test('workoutHasPR is true if any exercise in the workout was a PR that day', () => {
  const w = {
    id: 'multi',
    date: '2026-01-08T00:00:00.000Z',
    program: 'P',
    dayName: 'D',
    durationSeconds: 60,
    exercises: [
      { name: 'Squat', sets: [{ reps: 5, weight: 110, unit: 'lb' as const }] },
      { name: 'Bench Press', sets: [{ reps: 5, weight: 80, unit: 'lb' as const }] },
    ],
  };
  const records = [
    { exercise: 'Squat', weight: 110, unit: 'lb' as const, reps: 5, date: '2026-01-08T00:00:00.000Z' },
    { exercise: 'Bench Press', weight: 90, unit: 'lb' as const, reps: 5, date: '2025-12-01T00:00:00.000Z' },
  ];
  assert.equal(workoutHasPR(w, records), true);
});

test('workoutHasPR is false when no exercise in the workout matches its PR date', () => {
  const w = workout('2026-01-01T00:00:00.000Z', 'Squat', [[5, 100]]);
  const records = [{ exercise: 'Squat', weight: 110, unit: 'lb' as const, reps: 5, date: '2026-01-08T00:00:00.000Z' }];
  assert.equal(workoutHasPR(w, records), false);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `does not provide an export named 'exerciseIsPR'`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/liftosaur.ts`, after `groupWorkoutsByYear`:

```ts
// True when this workout is the one where `exerciseName`'s current PR was
// first set (computePersonalRecords already keeps the earliest date on ties).
export function exerciseIsPR(workout: ParsedWorkout, exerciseName: string, records: PersonalRecord[]): boolean {
  const record = records.find((r) => r.exercise === exerciseName);
  return record != null && record.date === workout.date;
}

// True when any exercise logged in this workout was a PR that day.
export function workoutHasPR(workout: ParsedWorkout, records: PersonalRecord[]): boolean {
  return workout.exercises.some((ex) => exerciseIsPR(workout, ex.name, records));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add exerciseIsPR + workoutHasPR to liftosaur lib"
```

---

### Task 4: `workoutsForExercise`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `ParsedWorkout[]`.
- Produces: `export function workoutsForExercise(workouts: ParsedWorkout[], exerciseName: string): ParsedWorkout[]` — used by `src/pages/fitness/exercises/[slug].astro` (Task 7) for that exercise's full history list. Mirrors the existing `postsForTerm` pattern in `src/lib/posts.ts` (filter a collection by a matching name).

- [ ] **Step 1: Write the failing test**

Add to the import line:

```ts
import {
  parseWorkoutText,
  computePersonalRecords,
  computeTrend,
  sparklinePoints,
  sortedWorkouts,
  groupWorkoutsByYear,
  exerciseIsPR,
  workoutHasPR,
  workoutsForExercise,
  MAIN_LIFTS,
  type ParsedWorkout,
} from './liftosaur.ts';
```

Add at the end of the file:

```ts
test('workoutsForExercise returns only workouts containing that exercise, order preserved', () => {
  const squatDay = workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]);
  const benchDay = workout('2026-01-05T00:00:00.000Z', 'Bench Press', [[5, 80]]);
  const workouts = [squatDay, benchDay];
  assert.deepEqual(workoutsForExercise(workouts, 'Squat'), [squatDay]);
});

test('workoutsForExercise returns an empty array when the exercise was never logged', () => {
  const w = workout('2026-01-08T00:00:00.000Z', 'Squat', [[5, 110]]);
  assert.deepEqual(workoutsForExercise([w], 'Bench Press'), []);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `does not provide an export named 'workoutsForExercise'`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/liftosaur.ts`, after `workoutHasPR`:

```ts
// Workouts that logged the given exercise at all, in the input's existing order.
export function workoutsForExercise(workouts: ParsedWorkout[], exerciseName: string): ParsedWorkout[] {
  return workouts.filter((w) => w.exercises.some((ex) => ex.name === exerciseName));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green (should be ~30 tests total across the file at this point).

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add workoutsForExercise to liftosaur lib"
```

---

### Task 5: Rewrite `/fitness/` landing page

**Files:**
- Modify: `src/pages/fitness/index.astro` (full rewrite)

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords`, `computeTrend`, `sparklinePoints`, `workoutHasPR`, `MAIN_LIFTS` from `../../lib/liftosaur`; `slugify` from `../../lib/posts`.

- [ ] **Step 1: Replace the full file contents**

Replace all of `src/pages/fitness/index.astro` with:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../layouts/Base.astro';
import {
  sortedWorkouts,
  computePersonalRecords,
  computeTrend,
  sparklinePoints,
  workoutHasPR,
  MAIN_LIFTS,
} from '../../lib/liftosaur';
import { slugify } from '../../lib/posts';

const entries = await getCollection('workouts');
const workouts = sortedWorkouts(entries);
const prs = computePersonalRecords(workouts);
const prByExercise = new Map(prs.map((pr) => [pr.exercise, pr]));

const mainLifts = MAIN_LIFTS.map((name) => ({
  name,
  slug: slugify(name),
  pr: prByExercise.get(name),
  trend: computeTrend(workouts, name),
}));

const recent = workouts.slice(0, 5);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtDuration = (seconds: number) => `${Math.round(seconds / 60)} min`;
const fmtSet = (reps: number, weight: number, unit: string) => `${reps}×${weight}${unit}`;

const SPARK_W = 160;
const SPARK_H = 32;
---

<Base
  title="Fitness · Matty Stratton"
  description="Workout history, personal records, and lift trends, pulled from Liftosaur."
>
  <section class="border-b-2 border-ink pb-8">
    <p class="label">Off the clock</p>
    <h1 class="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-balance">Fitness</h1>
    <p class="mt-6 max-w-2xl text-lg leading-relaxed text-ink-soft">
      Workout history, personal records, and lift trends, pulled from
      {' '}<a href="https://www.liftosaur.com" rel="noopener" class="underline decoration-accent-bright decoration-2 underline-offset-4">Liftosaur</a>,
      where I actually log the workouts. This page rebuilds on a schedule, not live, so it may lag your latest session by up to a day.
    </p>
  </section>

  {workouts.length === 0 ? (
    <p class="mt-8 text-ink-soft">No workout data yet — check back after the next build.</p>
  ) : (
    <>
      <section class="mt-12">
        <div class="flex items-baseline justify-between">
          <h2 class="font-display text-2xl font-semibold">Main lifts</h2>
          <a href="/fitness/records/" class="label transition-colors hover:text-accent">All records →</a>
        </div>
        <ul class="mt-4 grid gap-6 sm:grid-cols-2">
          {mainLifts.map((lift) => (
            <li class="border-b border-rule pb-4">
              <a href={`/fitness/exercises/${lift.slug}/`} class="group block">
                <p class="font-medium decoration-accent-bright decoration-2 underline-offset-4 group-hover:underline">{lift.name}</p>
                {lift.pr ? (
                  <>
                    <p class="text-ink-soft">{fmtSet(lift.pr.reps, lift.pr.weight, lift.pr.unit)} · {fmtDate(lift.pr.date)}</p>
                    <svg
                      viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
                      width={SPARK_W}
                      height={SPARK_H}
                      class="mt-2 text-accent"
                      role="img"
                      aria-label={`${lift.name} top weight trend`}
                    >
                      <polyline points={sparklinePoints(lift.trend, SPARK_W, SPARK_H)} fill="none" stroke="currentColor" stroke-width="2" />
                    </svg>
                  </>
                ) : (
                  <p class="text-ink-soft">No data yet</p>
                )}
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section class="mt-12">
        <div class="flex items-baseline justify-between">
          <h2 class="font-display text-2xl font-semibold">Recent workouts</h2>
          <a href="/fitness/workouts/" class="label transition-colors hover:text-accent">All workouts →</a>
        </div>
        <ul class="mt-4">
          {recent.map((w) => (
            <li class="border-b border-rule py-3">
              <a href={`/fitness/workouts/${w.id}/`} class="group flex flex-wrap items-baseline justify-between gap-x-4">
                <h3 class="font-display text-lg font-medium decoration-accent-bright decoration-2 underline-offset-4 group-hover:underline">
                  {w.dayName} — {w.program}{workoutHasPR(w, prs) && <span aria-label="Personal record set"> 🏅</span>}
                </h3>
                <p class="text-sm text-ink-soft">{fmtDate(w.date)} · {fmtDuration(w.durationSeconds)}</p>
              </a>
            </li>
          ))}
        </ul>
      </section>
    </>
  )}

  <section class="mt-12 text-ink-soft">
    <p>
      Full history lives on my{' '}
      <a href="https://www.liftosaur.com/profile/wucedumzcg" rel="noopener" class="underline decoration-accent-bright decoration-2 underline-offset-4">Liftosaur profile</a>.
      Gear notes are on the{' '}
      <a href="https://notes.mattstratton.com/public/garage-gym/" rel="noopener" class="underline decoration-accent-bright decoration-2 underline-offset-4">garage gym page</a>{' '}
      of my digital garden.
    </p>
  </section>
</Base>
```

- [ ] **Step 2: Build and spot-check**

Run: `npm run build`
Expected: build succeeds, no errors. Then run:

```bash
grep -o '<h2 class="font-display text-2xl font-semibold">[^<]*' dist/fitness/index.html
```

Expected output: `Main lifts` and `Recent workouts` (not `Personal records` / `Trends` — those moved off this page).

- [ ] **Step 3: Commit**

```bash
git add src/pages/fitness/index.astro
git commit -m "Condense /fitness landing page to main lifts + recent workouts"
```

---

### Task 6: `/fitness/records/` — full PR table

**Files:**
- Create: `src/pages/fitness/records/index.astro`

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords` from `../../../lib/liftosaur`; `slugify` from `../../../lib/posts`.

- [ ] **Step 1: Create the file**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import { sortedWorkouts, computePersonalRecords } from '../../../lib/liftosaur';
import { slugify } from '../../../lib/posts';

const entries = await getCollection('workouts');
const workouts = sortedWorkouts(entries);
const prs = computePersonalRecords(workouts).sort((a, b) => a.exercise.localeCompare(b.exercise));

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtSet = (reps: number, weight: number, unit: string) => `${reps}×${weight}${unit}`;
---

<Base
  title="All records · Fitness · Matty Stratton"
  description="Every personal record across every exercise, pulled from Liftosaur."
>
  <section class="border-b-2 border-ink pb-8">
    <p class="label"><a href="/fitness/" class="hover:text-accent">Fitness</a> / Records</p>
    <h1 class="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-balance">All records</h1>
  </section>

  <table class="mt-8 w-full border-collapse text-left">
    <thead>
      <tr class="border-b-2 border-ink text-sm text-ink-soft">
        <th class="py-2 pr-4 font-normal">Exercise</th>
        <th class="py-2 pr-4 font-normal">Best set</th>
        <th class="py-2 font-normal">Date</th>
      </tr>
    </thead>
    <tbody>
      {prs.map((pr) => (
        <tr class="border-b border-rule">
          <td class="py-2 pr-4 font-medium">
            <a href={`/fitness/exercises/${slugify(pr.exercise)}/`} class="decoration-accent-bright decoration-2 underline-offset-4 hover:underline">{pr.exercise}</a>
          </td>
          <td class="py-2 pr-4">{fmtSet(pr.reps, pr.weight, pr.unit)}</td>
          <td class="py-2 text-ink-soft">{fmtDate(pr.date)}</td>
        </tr>
      ))}
    </tbody>
  </table>
</Base>
```

- [ ] **Step 2: Build and check for slug collisions**

Run: `npm run build`
Expected: build succeeds. Then verify no two exercises produced the same slug (would silently overwrite one page with another):

```bash
grep -oE 'href="/fitness/exercises/[^"]*"' dist/fitness/records/index.html | sort | uniq -d
```

Expected: empty output (no duplicate hrefs). If any duplicates appear, two exercise names slugified to the same string — this is a real data collision, stop and report it rather than silently overwriting a page.

- [ ] **Step 3: Commit**

```bash
git add src/pages/fitness/records/index.astro
git commit -m "Add /fitness/records/ full PR table page"
```

---

### Task 7: `/fitness/exercises/[slug]/` — per-exercise detail

**Files:**
- Create: `src/pages/fitness/exercises/[slug].astro`

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords`, `computeTrend`, `sparklinePoints`, `workoutsForExercise`, `exerciseIsPR` from `../../../lib/liftosaur`; `slugify` from `../../../lib/posts`.

- [ ] **Step 1: Create the file**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import {
  sortedWorkouts,
  computePersonalRecords,
  computeTrend,
  sparklinePoints,
  workoutsForExercise,
  exerciseIsPR,
} from '../../../lib/liftosaur';
import { slugify } from '../../../lib/posts';

export async function getStaticPaths() {
  const entries = await getCollection('workouts');
  const workouts = sortedWorkouts(entries);
  const prs = computePersonalRecords(workouts);
  return prs.map((pr) => ({
    params: { slug: slugify(pr.exercise) },
    props: {
      pr,
      trend: computeTrend(workouts, pr.exercise),
      history: workoutsForExercise(workouts, pr.exercise),
      prs,
    },
  }));
}

const { pr, trend, history, prs } = Astro.props;
const exercise = pr.exercise;

const SPARK_W = 480;
const SPARK_H = 120;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtSet = (reps: number, weight: number, unit: string) => `${reps}×${weight}${unit}`;
---

<Base
  title={`${exercise} · Fitness · Matty Stratton`}
  description={`Trend and full history for ${exercise}, pulled from Liftosaur.`}
>
  <section class="border-b-2 border-ink pb-8">
    <p class="label">
      <a href="/fitness/" class="hover:text-accent">Fitness</a> / <a href="/fitness/records/" class="hover:text-accent">Records</a> / {exercise}
    </p>
    <h1 class="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-balance">{exercise}</h1>
    <p class="mt-4 text-lg text-ink-soft">Current PR: {fmtSet(pr.reps, pr.weight, pr.unit)} on {fmtDate(pr.date)}</p>
  </section>

  {trend.length > 1 && (
    <section class="mt-8">
      <svg
        viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
        width={SPARK_W}
        height={SPARK_H}
        class="w-full max-w-xl text-accent"
        role="img"
        aria-label={`${exercise} top weight trend`}
      >
        <polyline points={sparklinePoints(trend, SPARK_W, SPARK_H)} fill="none" stroke="currentColor" stroke-width="2" />
      </svg>
    </section>
  )}

  <section class="mt-12">
    <h2 class="font-display text-2xl font-semibold">Full history</h2>
    <ul class="mt-4">
      {history.map((w) => {
        const ex = w.exercises.find((e) => e.name === exercise)!;
        return (
          <li class="border-b border-rule py-3">
            <div class="flex flex-wrap items-baseline justify-between gap-x-4">
              <p>
                {ex.sets.map((s) => fmtSet(s.reps, s.weight, s.unit)).join(', ')}
                {exerciseIsPR(w, exercise, prs) && <span aria-label="Personal record set"> 🏅</span>}
              </p>
              <a href={`/fitness/workouts/${w.id}/`} class="text-sm text-ink-soft hover:text-accent">{fmtDate(w.date)}</a>
            </div>
          </li>
        );
      })}
    </ul>
  </section>
</Base>
```

- [ ] **Step 2: Build and spot-check**

Run: `npm run build`
Expected: build succeeds. Then confirm one page was generated per PR-bearing exercise:

```bash
ls dist/fitness/exercises | wc -l
grep -c "font-medium" dist/fitness/records/index.html
```

Expected: the two counts are consistent (one exercise directory per row in the records table — exact numbers will match whatever's in the live dataset, the point is they're equal, not off by one).

Then spot-check one page renders real content:

```bash
grep -o "Current PR:[^<]*" dist/fitness/exercises/squat/index.html
```

Expected: a real PR line, e.g. `Current PR: 5×255lb on Mar 13, 2025`.

- [ ] **Step 3: Commit**

```bash
git add src/pages/fitness/exercises/
git commit -m "Add /fitness/exercises/[slug]/ per-exercise detail page"
```

---

### Task 8: `/fitness/workouts/` — compact year-grouped archive

**Files:**
- Create: `src/pages/fitness/workouts/index.astro`

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords`, `groupWorkoutsByYear`, `workoutHasPR` from `../../../lib/liftosaur`.

- [ ] **Step 1: Create the file**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import { sortedWorkouts, computePersonalRecords, groupWorkoutsByYear, workoutHasPR } from '../../../lib/liftosaur';

const entries = await getCollection('workouts');
const workouts = sortedWorkouts(entries);
const prs = computePersonalRecords(workouts);
const byYear = groupWorkoutsByYear(workouts);

const fmtDate = (iso: string) => new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
const fmtDuration = (seconds: number) => `${Math.round(seconds / 60)} min`;
---

<Base title="All workouts · Fitness · Matty Stratton" description="Full workout history, pulled from Liftosaur.">
  <section class="border-b-2 border-ink pb-8">
    <p class="label"><a href="/fitness/" class="hover:text-accent">Fitness</a> / Workouts</p>
    <h1 class="mt-4 font-display text-5xl font-semibold leading-[0.95] tracking-tight text-balance">
      {workouts.length.toLocaleString()} workouts
    </h1>
    <nav class="mt-6 flex flex-wrap gap-x-3 gap-y-1" aria-label="Jump to year">
      {byYear.map(([year]) => (
        <a href={`#y${year}`} class="label transition-colors hover:text-accent">{year}</a>
      ))}
    </nav>
  </section>

  {byYear.map(([year, yearWorkouts]) => (
    <section id={`y${year}`} class="mt-10 scroll-mt-20">
      <h2 class="font-display text-3xl font-semibold tabular-nums">{year}</h2>
      <ul class="mt-3">
        {yearWorkouts.map((w) => (
          <li class="flex items-center justify-between gap-4 border-b border-rule py-2.5">
            <a href={`/fitness/workouts/${w.id}/`} class="decoration-accent-bright decoration-2 underline-offset-4 hover:underline">
              {fmtDate(w.date)} — {w.dayName} — {w.program}{workoutHasPR(w, prs) && <span aria-label="Personal record set"> 🏅</span>}
            </a>
            <span class="label shrink-0 normal-case tracking-normal text-ink-soft">{fmtDuration(w.durationSeconds)}</span>
          </li>
        ))}
      </ul>
    </section>
  ))}
</Base>
```

- [ ] **Step 2: Build and spot-check**

Run: `npm run build`
Expected: build succeeds. Then confirm total workout count matches the header text and at least one 🏅 shows up somewhere in the archive (this dataset has real PRs in it):

```bash
grep -o "[0-9,]* workouts" dist/fitness/workouts/index.html | head -1
grep -c "🏅" dist/fitness/workouts/index.html
```

Expected: the count matches the number of entries in the `workouts` collection, and the 🏅 count is greater than 0.

- [ ] **Step 3: Commit**

```bash
git add src/pages/fitness/workouts/index.astro
git commit -m "Add /fitness/workouts/ compact year-grouped archive"
```

---

### Task 9: `/fitness/workouts/[id]/` — single workout detail

**Files:**
- Create: `src/pages/fitness/workouts/[id].astro`

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords`, `exerciseIsPR` from `../../../lib/liftosaur`.

- [ ] **Step 1: Create the file**

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import { sortedWorkouts, computePersonalRecords, exerciseIsPR } from '../../../lib/liftosaur';

export async function getStaticPaths() {
  const entries = await getCollection('workouts');
  const workouts = sortedWorkouts(entries);
  const prs = computePersonalRecords(workouts);
  return workouts.map((workout) => ({
    params: { id: workout.id },
    props: { workout, prs },
  }));
}

const { workout, prs } = Astro.props;

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtDuration = (seconds: number) => `${Math.round(seconds / 60)} min`;
const fmtSet = (reps: number, weight: number, unit: string) => `${reps}×${weight}${unit}`;
---

<Base
  title={`${workout.dayName} — ${fmtDate(workout.date)} · Fitness · Matty Stratton`}
  description={`Workout detail for ${workout.dayName} on ${fmtDate(workout.date)}.`}
>
  <section class="border-b-2 border-ink pb-8">
    <p class="label"><a href="/fitness/" class="hover:text-accent">Fitness</a> / <a href="/fitness/workouts/" class="hover:text-accent">Workouts</a></p>
    <h1 class="mt-4 font-display text-4xl font-semibold leading-[0.95] tracking-tight text-balance sm:text-5xl">
      {workout.dayName} — {workout.program}
    </h1>
    <p class="mt-4 text-lg text-ink-soft">{fmtDate(workout.date)} · {fmtDuration(workout.durationSeconds)}</p>
  </section>

  <ul class="mt-8">
    {workout.exercises.map((ex) => (
      <li class="border-b border-rule py-4">
        <h2 class="font-display text-lg font-medium">
          {ex.name}{exerciseIsPR(workout, ex.name, prs) && <span aria-label="Personal record set"> 🏅</span>}
        </h2>
        <p class="mt-1 text-ink-soft">{ex.sets.map((s) => fmtSet(s.reps, s.weight, s.unit)).join(', ')}</p>
      </li>
    ))}
  </ul>
</Base>
```

- [ ] **Step 2: Build and spot-check**

Run: `npm run build`
Expected: build succeeds. Then confirm one page per workout:

```bash
find dist/fitness/workouts -mindepth 1 -maxdepth 1 -type d | wc -l
```

Expected: matches the total workout count from Task 8's check (each workout id got its own directory, plus the `index.html` archive is not a directory so it's not double-counted).

- [ ] **Step 3: Commit**

```bash
git add src/pages/fitness/workouts/
git commit -m "Add /fitness/workouts/[id]/ single workout detail page"
```

---

### Task 10: Full verification pass

**Files:** none (verification only)

- [ ] **Step 1: Run the full unit test suite**

Run: `npm test`
Expected: all tests pass, including the pre-existing `migrate-posts.ts` regression test (confirms `src/content/posts` is untouched) and every `liftosaur.test.ts` test added in Tasks 1–4.

- [ ] **Step 2: Full production build**

Run: `npm run build`
Expected: succeeds, no errors, pagefind indexing completes.

- [ ] **Step 3: Manual browser walkthrough**

Run: `npm run dev`, then in a browser (or via the claude-in-chrome tool):
1. Open `/fitness/` — confirm only 4 main-lift cards + last 5 workouts show (no giant tables).
2. Click a main-lift card → lands on `/fitness/exercises/<slug>/` with a full-size trend chart and complete history.
3. Click "All records →" → lands on `/fitness/records/`, click an exercise name → lands on its detail page.
4. Click "All workouts →" → lands on `/fitness/workouts/`, grouped by year with jump links.
5. Click a workout row → lands on `/fitness/workouts/[id]/` with full exercise/set breakdown.
6. Confirm at least one 🏅 appears somewhere (main page recent list, workouts archive, a workout detail page, or an exercise history row) and that it appears only on the specific date the record was set — not on every later day the same weight was repeated.

Expected: every click-through works, no dead links, 🏅 placement matches the PR dates confirmed by the `exerciseIsPR`/`workoutHasPR` unit tests.

- [ ] **Step 4: Final commit (if any fixups were needed during the walkthrough)**

```bash
git add -A
git commit -m "Fix up /fitness UX redesign after manual verification"
```

(Skip this commit if Step 3 found nothing to fix.)
