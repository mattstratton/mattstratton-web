# /fitness enhancements: meaningful trend chart + failed-set visibility

## Context

After using the redesigned `/fitness` pages, two gaps stood out:
1. The exercise trend chart (e.g. `/fitness/exercises/squat/`) is a bare, unlabeled squiggle — no values, no indication of what's plotted (max weight? 1RM?).
2. The workout detail page is visually flat, and doesn't surface a real signal that's sitting in the raw Liftosaur data: some sets fail outright (0 reps against a real target) or come up short, and none of that is shown today.

Investigated during brainstorming: pulling real history confirmed the raw workout text already includes a `target:` segment per exercise (currently parsed and discarded) that can be directly compared against the completed segment. One real example from this dataset: `Bench Press / 3x0 125lb / ... / target: 3x10 125lb` — three sets of zero reps against a target of ten, a genuine failed exercise already present in the data.

## Scope decision

The richer, labeled, dual-metric chart applies only to `/fitness/exercises/[slug]/` (the detail page). The small main-lift sparklines on the `/fitness/` landing page stay as simple single-line (top weight) teasers — they're meant to be glanceable, not detailed, and a legend/axis-label treatment doesn't fit their size.

## Data/lib layer (`src/lib/liftosaur.ts`)

- **`WorkoutExercise` gains `targetSets: WorkoutSet[]`.** `parseExerciseLine` already isolates the `target:` segment to skip it; instead, run it through the existing `parseSets()` (which already strips the AMRAP `+` suffix and ignores trailing `(80%)` percentage annotations without any regex changes) to produce structured target sets, same shape as completed sets.
- **`setStatus(actual: WorkoutSet, target: WorkoutSet | undefined): 'failed' | 'partial' | 'met'`** — pure function: `'failed'` when `actual.reps === 0`, `'partial'` when `0 < actual.reps < target.reps`, `'met'` otherwise (includes AMRAP overachievement and the no-target-available case, since there's nothing to have missed).
- **`exerciseVolume(exercise: WorkoutExercise): number`** — `Σ (reps × weight)` over completed sets. Used for the workout detail page's per-exercise volume bars.
- **`computeEst1RM(set: WorkoutSet): number`** — Epley formula, `weight × (1 + reps / 30)`, rounded to the nearest whole unit for display. Exposed as its own function since it's independently testable and needed by the next function.
- **`computeEst1RMTrend(workouts: ParsedWorkout[], exerciseName: string): TrendPoint[]`** — mirrors `computeTrend`, but for each workout takes the set with the *highest estimated 1RM* (not necessarily the same set that had the top raw weight — a higher-rep set at slightly lower weight can estimate higher). Reuses the existing `TrendPoint` shape.
- **`dualSparklinePoints(seriesA: TrendPoint[], seriesB: TrendPoint[], width: number, height: number): { a: string; b: string; min: number; max: number }`** — like `sparklinePoints`, but scales both series to one shared min/max (computed across both) so they're visually comparable on the same axes, and returns that shared range so the page can render axis labels from it.

All of the above are pure functions, TDD'd in `src/lib/liftosaur.test.ts` exactly like every existing function in this module.

## Exercise detail page (`/fitness/exercises/[slug].astro`)

- Replace the single-line chart with `dualSparklinePoints(computeTrend(...), computeEst1RMTrend(...), W, H)`.
- Add above the chart: a title ("Top weight vs. estimated 1RM (lb)").
- Add around the chart: y-axis min/max value labels (from `dualSparklinePoints`'s returned range), x-axis oldest/newest date labels (from the trend data's first/last entries), and a small text legend distinguishing the two lines (e.g. solid stroke for top weight, dashed `stroke-dasharray` for estimated 1RM).

## Workout detail page (`/fitness/workouts/[id].astro`)

- Per exercise, compute `exerciseVolume` and render a bar (a `<div>` with width `%` relative to the session's highest-volume exercise) next to the exercise name — an at-a-glance view of which lift dominated the session.
- Per completed set, compute `setStatus(actual, exercise.targetSets[i])` (positional comparison — Liftosaur's actual and target segments are always the same length in this dataset since they represent the same planned sets, but a defensive `targetSets[i]` lookup handles a missing/short target array without throwing) and style accordingly: strikethrough + red text for `failed`, amber text for `partial`, unchanged/normal for `met`.

## Verification

1. Every new pure function gets a RED-then-GREEN unit test in `src/lib/liftosaur.test.ts`, including the real "3 sets of 0 reps against a target of 10" shape confirmed in this dataset.
2. `npm run build` — confirm no crashes on exercises with only one trend point (existing edge case, already guarded) and on workouts with unusual target/actual length mismatches.
3. **Manual local review with the user before any commit or push**: run `npm run dev`, view `/fitness/exercises/squat/` (or another main lift) and at least one workout known to contain a failed set, confirm the chart reads clearly and the failed/partial/met styling looks right. Only commit after that sign-off.
4. `npm test` full suite green, archive (`src/content/posts`) untouched.
