# Fitness Chart & Workout Detail Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make the exercise trend chart meaningful (labeled, dual-metric: top weight + estimated 1RM) and give the workout detail page real visual signal (failed/partial/met set styling, per-exercise volume bars).

**Architecture:** Extend `src/lib/liftosaur.ts` with more small pure functions (parsing the previously-discarded `target:` segment, comparing actual-vs-target reps, computing volume and estimated 1RM), then update the two `.astro` pages that consume them. No new dependencies.

**Tech Stack:** Astro 5 content collections, `node --test` + `tsx`, Tailwind CSS v4.

## Global Constraints

- Every new pure function in `src/lib/liftosaur.ts` gets a test in `src/lib/liftosaur.test.ts`, written and watched failing before implementation (this file's established TDD pattern).
- **Do not commit or push the two page changes (Tasks 6 and 7) until the user has reviewed them running locally via `npm run dev`** — this was an explicit instruction. Lib-layer tasks (1–5) are safe to commit immediately per usual (pure, tested, no visible behavior change until the pages wire them in). Task 8 is the local review checkpoint; only after the user signs off there do Tasks 6–7 get committed.
- Reuse existing helpers — don't duplicate `parseSets`, `computeTrend`, or the `workout(date, exercise, sets)` test helper already in `liftosaur.test.ts`.

---

### Task 1: Parse `targetSets` and register the schema field

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Modify: `src/content.config.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: existing `parseSets(segment: string): WorkoutSet[]` (unchanged — it already ignores the `target:` label text and trailing `(80%)` annotations since it only matches the `NxR weight(lb|kg)` pattern anywhere in the string).
- Produces: `WorkoutExercise` gains a `targetSets: WorkoutSet[]` field, populated by `parseWorkoutText`. Every later task and page that reads `WorkoutExercise` sees this field.

- [ ] **Step 1: Write the failing test**

Add `SAMPLE`'s existing Squat exercise line already has both a completed and target segment (`Squat / 2x5 147.5lb, 1x6 147.5lb / warmup: ... / target: 2x5 147.5lb, 1x5+ 147.5lb`). Add this test right after the existing `'parseWorkoutText parses completed sets, ignoring warmup and target'` test in `src/lib/liftosaur.test.ts`:

```ts
test('parseWorkoutText parses targetSets from the target: segment', () => {
  const w = parseWorkoutText(1, SAMPLE);
  assert.deepEqual(w.exercises[0].targetSets, [
    { reps: 5, weight: 147.5, unit: 'lb' },
    { reps: 5, weight: 147.5, unit: 'lb' },
    { reps: 5, weight: 147.5, unit: 'lb' },
  ]);
});
```

(Three entries: the target segment is `2x5 147.5lb, 1x5+ 147.5lb` — two sets of 5, plus one more set of 5 from the `1x5+` AMRAP-minimum group, same expansion rule `parseSets` already applies to the completed segment.)

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `targetSets` is `undefined` on the actual object (property doesn't exist yet), assertion mismatch.

- [ ] **Step 3: Write minimal implementation**

In `src/lib/liftosaur.ts`, update the `WorkoutExercise` interface:

```ts
export interface WorkoutExercise {
  name: string;
  sets: WorkoutSet[];
  targetSets: WorkoutSet[];
}
```

Update `parseExerciseLine`:

```ts
function parseExerciseLine(line: string): WorkoutExercise {
  const segments = line.trim().split(' / ');
  const name = segments[0];
  const completedSegment = segments.find((s) => !s.startsWith('warmup:') && !s.startsWith('target:') && s !== name);
  const targetSegment = segments.find((s) => s.startsWith('target:'));
  return {
    name,
    sets: completedSegment ? parseSets(completedSegment) : [],
    targetSets: targetSegment ? parseSets(targetSegment) : [],
  };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Update the content collection schema**

In `src/content.config.ts`, find the `workouts` collection's `exercises` field schema (the `z.array(z.object({ name: z.string(), sets: z.array(...) }))` block) and add `targetSets` alongside `sets`:

```ts
    exercises: z.array(
      z.object({
        name: z.string(),
        sets: z.array(
          z.object({
            reps: z.number(),
            weight: z.number(),
            unit: z.enum(['lb', 'kg']),
          }),
        ),
        targetSets: z.array(
          z.object({
            reps: z.number(),
            weight: z.number(),
            unit: z.enum(['lb', 'kg']),
          }),
        ),
      }),
    ),
```

No change needed in `liftosaurLoader()` in `src/lib/liftosaur.ts` — it already passes `exercises: parsed.exercises` through wholesale, so the new field flows through automatically once it's on `ParsedWorkout`.

- [ ] **Step 6: Build to confirm the schema accepts real data**

Run: `npm run build`
Expected: succeeds, no schema validation errors (would show as a content collection error mentioning `targetSets` if the shape didn't match).

- [ ] **Step 7: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts src/content.config.ts
git commit -m "Parse targetSets from Liftosaur's target: segment"
```

---

### Task 2: `setStatus`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `WorkoutSet` (unchanged).
- Produces: `export type SetStatus = 'failed' | 'partial' | 'met'`; `export function setStatus(actual: WorkoutSet, target: WorkoutSet | undefined): SetStatus`. Used by the workout detail page (Task 7) to style each set.

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
  exerciseIsPR,
  workoutHasPR,
  workoutsForExercise,
  setStatus,
  MAIN_LIFTS,
  type ParsedWorkout,
} from './liftosaur.ts';
```

Add at the end of the file:

```ts
test('setStatus is failed when zero reps were completed', () => {
  assert.equal(setStatus({ reps: 0, weight: 125, unit: 'lb' }, { reps: 10, weight: 125, unit: 'lb' }), 'failed');
});

test('setStatus is partial when reps fall short of target', () => {
  assert.equal(setStatus({ reps: 6, weight: 125, unit: 'lb' }, { reps: 10, weight: 125, unit: 'lb' }), 'partial');
});

test('setStatus is met when reps hit or exceed target', () => {
  assert.equal(setStatus({ reps: 10, weight: 125, unit: 'lb' }, { reps: 10, weight: 125, unit: 'lb' }), 'met');
  assert.equal(setStatus({ reps: 6, weight: 147.5, unit: 'lb' }, { reps: 5, weight: 147.5, unit: 'lb' }), 'met');
});

test('setStatus is met when there is no target to compare against', () => {
  assert.equal(setStatus({ reps: 5, weight: 100, unit: 'lb' }, undefined), 'met');
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `does not provide an export named 'setStatus'`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/liftosaur.ts`, after `workoutsForExercise`:

```ts
export type SetStatus = 'failed' | 'partial' | 'met';

// Compares a completed set to its planned target: 'failed' when zero reps
// were done, 'partial' when some reps were done but short of target, 'met'
// otherwise (hits, exceeds, or AMRAP-overachieves — also the default when
// there's no target to compare against, since nothing was missed).
export function setStatus(actual: WorkoutSet, target: WorkoutSet | undefined): SetStatus {
  if (actual.reps === 0) return 'failed';
  if (target && actual.reps < target.reps) return 'partial';
  return 'met';
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add setStatus to liftosaur lib"
```

---

### Task 3: `exerciseVolume`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `WorkoutExercise`.
- Produces: `export function exerciseVolume(exercise: WorkoutExercise): number`. Used by the workout detail page (Task 7) for the per-exercise volume bar.

- [ ] **Step 1: Write the failing test**

Add `exerciseVolume` to the import line (same block as Task 2, extend it):

```ts
  setStatus,
  exerciseVolume,
  MAIN_LIFTS,
```

Add at the end of the file:

```ts
test('exerciseVolume sums reps times weight across completed sets', () => {
  const ex = {
    name: 'Squat',
    sets: [
      { reps: 5, weight: 100, unit: 'lb' as const },
      { reps: 5, weight: 100, unit: 'lb' as const },
    ],
    targetSets: [],
  };
  assert.equal(exerciseVolume(ex), 1000);
});

test('exerciseVolume is zero for a failed exercise with no completed reps', () => {
  const ex = {
    name: 'Bench Press',
    sets: [
      { reps: 0, weight: 125, unit: 'lb' as const },
      { reps: 0, weight: 125, unit: 'lb' as const },
    ],
    targetSets: [],
  };
  assert.equal(exerciseVolume(ex), 0);
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `does not provide an export named 'exerciseVolume'`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/liftosaur.ts`, after `setStatus`:

```ts
// Total volume (reps × weight, summed across completed sets) for one exercise.
export function exerciseVolume(exercise: WorkoutExercise): number {
  return exercise.sets.reduce((sum, s) => sum + s.reps * s.weight, 0);
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add exerciseVolume to liftosaur lib"
```

---

### Task 4: `computeEst1RM` + `computeEst1RMTrend`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `WorkoutSet`, `ParsedWorkout`, `TrendPoint` (all existing).
- Produces: `export function computeEst1RM(set: WorkoutSet): number`; `export function computeEst1RMTrend(workouts: ParsedWorkout[], exerciseName: string): TrendPoint[]`. Used by the exercise detail page (Task 6).

- [ ] **Step 1: Write the failing test**

Add to the import line:

```ts
  exerciseVolume,
  computeEst1RM,
  computeEst1RMTrend,
  MAIN_LIFTS,
```

Add at the end of the file:

```ts
test('computeEst1RM applies the Epley formula, rounded to the nearest whole unit', () => {
  assert.equal(computeEst1RM({ reps: 5, weight: 100, unit: 'lb' }), 117); // 100 * (1 + 5/30) = 116.67 -> 117
  assert.equal(computeEst1RM({ reps: 1, weight: 200, unit: 'lb' }), 207); // 200 * (1 + 1/30) = 206.67 -> 207
});

test('computeEst1RMTrend picks the highest-estimating set per workout, not necessarily the top-weight set', () => {
  const w = workout('2026-01-01T00:00:00.000Z', 'Squat', [
    [1, 245],
    [10, 200],
  ]);
  const topWeightTrend = computeTrend([w], 'Squat');
  const est1RMTrend = computeEst1RMTrend([w], 'Squat');
  assert.equal(topWeightTrend[0].weight, 245); // heaviest single set
  assert.equal(est1RMTrend[0].weight, 267); // 200 * (1 + 10/30) = 266.67 -> 267, beats 245 * (1 + 1/30) = 253
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `does not provide an export named 'computeEst1RM'`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/liftosaur.ts`, after `exerciseVolume`:

```ts
// Epley formula estimated one-rep max for a single set, rounded to the
// nearest whole unit for display.
export function computeEst1RM(set: WorkoutSet): number {
  return Math.round(set.weight * (1 + set.reps / 30));
}

// Estimated 1RM per workout for a given exercise — the highest-estimating
// set that day, which isn't always the same set as the top raw weight (a
// higher-rep set at slightly lower weight can estimate a higher 1RM).
// Sorted oldest to newest, same shape/ordering as computeTrend.
export function computeEst1RMTrend(workouts: ParsedWorkout[], exerciseName: string): TrendPoint[] {
  const points: TrendPoint[] = [];
  for (const workout of workouts) {
    const exercise = workout.exercises.find((e) => e.name === exerciseName);
    if (!exercise || exercise.sets.length === 0) continue;
    const best = Math.max(...exercise.sets.map(computeEst1RM));
    points.push({ date: workout.date, weight: best });
  }
  return points.sort((a, b) => a.date.localeCompare(b.date));
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green.

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add computeEst1RM + computeEst1RMTrend to liftosaur lib"
```

---

### Task 5: `dualSparklinePoints`

**Files:**
- Modify: `src/lib/liftosaur.ts`
- Test: `src/lib/liftosaur.test.ts`

**Interfaces:**
- Consumes: `TrendPoint[]` (existing).
- Produces: `export interface DualSparkline { a: string; b: string; min: number; max: number }`; `export function dualSparklinePoints(seriesA: TrendPoint[], seriesB: TrendPoint[], width: number, height: number): DualSparkline`. Used by the exercise detail page (Task 6) to render both lines on one shared axis plus the axis labels.

- [ ] **Step 1: Write the failing test**

Add to the import line:

```ts
  computeEst1RM,
  computeEst1RMTrend,
  dualSparklinePoints,
  MAIN_LIFTS,
```

Add at the end of the file:

```ts
test('dualSparklinePoints scales both series to one shared min/max', () => {
  const a = [
    { date: 'x', weight: 100 },
    { date: 'y', weight: 200 },
  ];
  const b = [
    { date: 'x', weight: 100 },
    { date: 'y', weight: 300 },
  ];
  const result = dualSparklinePoints(a, b, 100, 20);
  assert.equal(result.min, 100);
  assert.equal(result.max, 300);
  assert.equal(result.a, '0,20 100,10');
  assert.equal(result.b, '0,20 100,0');
});

test('dualSparklinePoints returns empty strings and zero range for no data', () => {
  assert.deepEqual(dualSparklinePoints([], [], 100, 20), { a: '', b: '', min: 0, max: 0 });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: FAIL — `does not provide an export named 'dualSparklinePoints'`.

- [ ] **Step 3: Write minimal implementation**

Add to `src/lib/liftosaur.ts`, after `sparklinePoints`:

```ts
export interface DualSparkline {
  a: string;
  b: string;
  min: number;
  max: number;
}

// Like sparklinePoints, but scales two series to one shared min/max so they
// can be plotted on the same axes and compared directly. Assumes both series
// share the same length/x-positions (true for computeTrend/computeEst1RMTrend
// run against the same workouts for the same exercise).
export function dualSparklinePoints(
  seriesA: TrendPoint[],
  seriesB: TrendPoint[],
  width: number,
  height: number,
): DualSparkline {
  const values = [...seriesA, ...seriesB].map((p) => p.weight);
  if (values.length === 0) return { a: '', b: '', min: 0, max: 0 };

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min;

  const toPoints = (series: TrendPoint[]) => {
    if (series.length === 0) return '';
    if (series.length === 1) return `0,${height / 2}`;
    return series
      .map((point, i) => {
        const x = (i / (series.length - 1)) * width;
        const y = range === 0 ? height / 2 : height - ((point.weight - min) / range) * height;
        return `${x},${y}`;
      })
      .join(' ');
  };

  return { a: toPoints(seriesA), b: toPoints(seriesB), min, max };
}
```

- [ ] **Step 4: Run test to verify it passes**

Run: `node --import tsx --test src/lib/liftosaur.test.ts`
Expected: PASS, all tests green (should be ~40 tests total in this file now).

- [ ] **Step 5: Commit**

```bash
git add src/lib/liftosaur.ts src/lib/liftosaur.test.ts
git commit -m "Add dualSparklinePoints to liftosaur lib"
```

---

### Task 6: Exercise detail page — labeled dual-line chart

**Files:**
- Modify: `src/pages/fitness/exercises/[slug].astro` (full rewrite)

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords`, `computeTrend`, `computeEst1RMTrend`, `dualSparklinePoints`, `workoutsForExercise`, `exerciseIsPR` from `../../../lib/liftosaur`; `slugify` from `../../../lib/posts`.

**Do not commit this task yet — see Global Constraints. Build and leave the change staged/uncommitted for Task 8's local review.**

- [ ] **Step 1: Replace the full file contents**

Replace all of `src/pages/fitness/exercises/[slug].astro` with:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import {
  sortedWorkouts,
  computePersonalRecords,
  computeTrend,
  computeEst1RMTrend,
  dualSparklinePoints,
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
      est1RMTrend: computeEst1RMTrend(workouts, pr.exercise),
      history: workoutsForExercise(workouts, pr.exercise),
      prs,
    },
  }));
}

const { pr, trend, est1RMTrend, history, prs } = Astro.props;
const exercise = pr.exercise;

const SPARK_W = 480;
const SPARK_H = 160;
const chart = dualSparklinePoints(trend, est1RMTrend, SPARK_W, SPARK_H);

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
      <div class="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h2 class="font-display text-lg font-medium">Top weight vs. estimated 1RM ({pr.unit})</h2>
        <p class="label text-ink-soft">
          <span class="text-accent">— top weight</span>
          &nbsp;&nbsp;
          <span class="text-accent-bright">╌╌ est. 1RM</span>
        </p>
      </div>
      <div class="mt-3 flex items-stretch gap-3">
        <div class="flex flex-col justify-between py-1 text-sm text-ink-soft" style={`height: ${SPARK_H}px`}>
          <span>{chart.max}</span>
          <span>{chart.min}</span>
        </div>
        <svg
          viewBox={`0 0 ${SPARK_W} ${SPARK_H}`}
          width={SPARK_W}
          height={SPARK_H}
          class="w-full max-w-xl"
          role="img"
          aria-label={`${exercise} top weight and estimated 1RM trend, ranging from ${chart.min} to ${chart.max} ${pr.unit}`}
        >
          <polyline points={chart.a} fill="none" stroke="currentColor" stroke-width="2" class="text-accent" />
          <polyline points={chart.b} fill="none" stroke="currentColor" stroke-width="2" stroke-dasharray="4 3" class="text-accent-bright" />
        </svg>
      </div>
      <div class="mt-1 flex justify-between pl-[2.5rem] text-sm text-ink-soft">
        <span>{fmtDate(trend[0].date)}</span>
        <span>{fmtDate(trend[trend.length - 1].date)}</span>
      </div>
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
Expected: build succeeds. Then confirm the chart title and axis values render:

```bash
grep -o "Top weight vs. estimated 1RM[^<]*" dist/fitness/exercises/squat/index.html
grep -oE '<polyline points="[^"]{0,40}' dist/fitness/exercises/squat/index.html
```

Expected: the title line, and two non-empty `polyline points="..."` attributes (both lines have real coordinate data, not empty strings).

**Do not commit.** Leave this change in the working tree for Task 8.

---

### Task 7: Workout detail page — set status styling + volume bars

**Files:**
- Modify: `src/pages/fitness/workouts/[id].astro` (full rewrite)

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords`, `exerciseIsPR`, `exerciseVolume`, `setStatus` from `../../../lib/liftosaur`.

**Do not commit this task yet — see Global Constraints. Build and leave the change staged/uncommitted for Task 8's local review.**

- [ ] **Step 1: Replace the full file contents**

Replace all of `src/pages/fitness/workouts/[id].astro` with:

```astro
---
import { getCollection } from 'astro:content';
import Base from '../../../layouts/Base.astro';
import { sortedWorkouts, computePersonalRecords, exerciseIsPR, exerciseVolume, setStatus } from '../../../lib/liftosaur';

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
const maxVolume = Math.max(...workout.exercises.map(exerciseVolume), 1);

const fmtDate = (iso: string) =>
  new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
const fmtDuration = (seconds: number) => `${Math.round(seconds / 60)} min`;
const fmtSet = (reps: number, weight: number, unit: string) => `${reps}×${weight}${unit}`;

const statusClass = {
  failed: 'text-red-600 line-through decoration-2',
  partial: 'text-accent-bright',
  met: '',
} as const;
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
        <div class="mt-2 h-1.5 w-full max-w-xs rounded-full bg-panel" role="presentation">
          <div class="h-1.5 rounded-full bg-accent" style={`width: ${(exerciseVolume(ex) / maxVolume) * 100}%`}></div>
        </div>
        <p class="mt-2 text-ink-soft">
          {ex.sets.map((s, i) => (
            <>
              <span class={statusClass[setStatus(s, ex.targetSets[i])]}>{fmtSet(s.reps, s.weight, s.unit)}</span>
              {i < ex.sets.length - 1 && ', '}
            </>
          ))}
        </p>
      </li>
    ))}
  </ul>
</Base>
```

- [ ] **Step 2: Build and spot-check**

Run: `npm run build`
Expected: build succeeds. Then find a workout known to contain a failed set (the 2025-10-27 Bench Press `3x0 125lb` example from brainstorming) and confirm the styling applied:

```bash
grep -rl "3×0125lb\|3×0lb\|0×125lb" dist/fitness/workouts/*/index.html 2>/dev/null
```

If that exact grep doesn't hit (formatting may render as `0×125lb` per `fmtSet`'s `${reps}×${weight}${unit}` template), instead directly find the workout by date:

```bash
grep -rl "Oct 27, 2025" dist/fitness/workouts/*/index.html
```

Open the matched file and confirm the `text-red-600 line-through` classes appear on that Bench Press set's `<span>`.

**Do not commit.** Leave this change in the working tree for Task 8.

---

### Task 8: Local review, then commit

**Files:** none (verification + the deferred commits from Tasks 6–7)

- [ ] **Step 1: Run the full unit test suite**

Run: `npm test`
Expected: all tests pass (Tasks 1–5's new tests plus every pre-existing test, including the `migrate-posts.ts` regression test).

- [ ] **Step 2: Start the dev server**

Run: `npm run dev` (note whatever port it picks — 4321 may be in use from a prior session).

- [ ] **Step 3: Walk through the changes with the user**

Together, in a browser:
1. Open `/fitness/exercises/squat/` (or another main lift) — confirm the chart has a title, two visually distinct lines (solid vs. dashed), y-axis min/max labels, and x-axis date-range labels that all make sense against the "Full history" list below it.
2. Find a workout with a known failed or partial set (e.g. the Oct 27, 2025 Bench Press `3x0 125lb` example, or any other one from the archive) at `/fitness/workouts/[id]/` and confirm the failed/partial styling reads clearly, and that a met set looks unchanged from before.
3. Confirm the volume bars render sensibly (the heaviest-volume exercise in a session should have the widest bar).

**This is the checkpoint from Global Constraints — do not proceed to Step 4 until the user has actually looked at this and approved.**

- [ ] **Step 4: Commit the page changes (only after user sign-off)**

```bash
git add src/pages/fitness/exercises/ src/pages/fitness/workouts/
git commit -m "Add labeled dual-metric trend chart and failed-set styling to /fitness detail pages"
```

- [ ] **Step 5: Final full verification**

```bash
npm test
npm run build
```

Expected: both succeed, matching Task 8 Step 1's results (nothing should have changed since — this just confirms the working tree is in the same good state after committing).
