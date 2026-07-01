# /fitness UX redesign: detail pages, main lifts, PR badges

## Context

The initial `/fitness` page (built earlier in this same work) dumped everything onto one page: a full PR table for every exercise, every trend sparkline, and full workout history with every exercise/set spelled out. In practice that's "many, many lists of words" requiring a lot of scrolling, with nothing clickable. This redesign breaks it into a landing page plus detail pages, following the pattern the site already uses for its 2,630-post archive (`/post/`): compact, scannable rows on list pages, full detail only one click away.

Three concrete asks drove this:
1. Everything should be clickable through to more detail (exercise → full trend + history, workout → full breakdown).
2. The main page should show only the four lifts that matter most (Squat, Bench Press, Deadlift, Overhead Press), with full records/exercise lists moved to their own pages.
3. Workout listings should show a 🏅 badge next to any lift that was a personal record that day.

Confirmed during brainstorming: Liftosaur's API doesn't expose a stable, constructible URL to a specific program (program-sharing links are generated on-demand in the app, not derivable from an ID) — so linking workout program names to Liftosaur is explicitly out of scope, not an oversight.

## Routes

- `/fitness/` — landing page. Four main-lift cards (name, current PR, mini trend sparkline, both linked to the exercise page), last 5 workouts as compact rows (date, day/program, duration, single 🏅 if the workout contains any PR), links to "All records" and "All workouts."
- `/fitness/records/` — full table of every exercise + current PR (today's homepage table, moved here). Exercise name links to `/fitness/exercises/[slug]/`.
- `/fitness/exercises/[slug]/` — one page per exercise: header with current PR, full-size trend chart, and complete history of every logged set for that exercise (newest first), with 🏅 on the PR-setting entry.
- `/fitness/workouts/` — full workout archive, compact rows grouped by year (mirrors `groupByYear` used by `/post/`): date, day/program, duration, single 🏅 if the workout contains any PR. No inline exercise/set data.
- `/fitness/workouts/[id]/` — single workout detail: the full exercise/set breakdown that's on today's homepage, with 🏅 next to any exercise that was a PR that day. `id` is the raw Liftosaur workout id already used as the collection entry id.

## Data/lib layer (`src/lib/liftosaur.ts`)

Extends the existing TDD'd module rather than replacing it:
- `MAIN_LIFTS` — hardcoded `['Squat', 'Bench Press', 'Deadlift', 'Overhead Press']`. These are exact-string matches confirmed against real Liftosaur data already pulled during implementation — no fuzzy matching needed.
- **No new slugify function.** `src/lib/posts.ts` already exports a `slugify()` (lowercase, strip apostrophes, non-alphanumeric → hyphen) built for the legacy archive's category/tag slugs — it produces the right result for exercise names too (e.g. `"Bicep Curl, Barbell"` → `"bicep-curl-barbell"`). Import and reuse it rather than duplicating.
- **No new PR-derivation logic.** `computePersonalRecords` already returns, per exercise, the date the record was *first* set (ties keep the earliest date — already tested). A workout "contains a PR" for an exercise exactly when `workout.date === personalRecords[exercise].date`. This is a plain lookup done at render time in the pages that need it, not a new lib function, since it's a one-line comparison against data that already exists.

## Pages

- `src/pages/fitness/index.astro` — rewritten to the condensed landing page described above. Reuses `computePersonalRecords`, `computeTrend`, `sparklinePoints` filtered to `MAIN_LIFTS`.
- `src/pages/fitness/records/index.astro` — today's full PR table, moved here, exercise names linked via `slugify` (from `src/lib/posts.ts`).
- `src/pages/fitness/exercises/[slug].astro` — `getStaticPaths()` over `computePersonalRecords(workouts).map(pr => slugify(pr.exercise))`, each page filters the full `workouts` collection to that exercise for its trend + history.
- `src/pages/fitness/workouts/index.astro` — compact archive grouped by year. `groupByYear` in `src/lib/posts.ts` is typed specifically to `CollectionEntry<'posts'>` (`p.data.date`, `p.data[field]`), so it isn't directly reusable for workout entries without generics that don't pull their weight for ~5 lines of logic. Write a small local grouping (same year-descending pattern, workout-shaped) in the page itself rather than force an unrelated coupling between the two collections.
- `src/pages/fitness/workouts/[id].astro` — `getStaticPaths()` over the `workouts` collection by entry id, renders full detail for that one workout.

## Verification

1. Spot-check `slugify` (existing, already tested in `src/lib/posts.ts`) against a few real exercise names from this dataset (e.g. "Bicep Curl, Barbell", "Standing Calf Raise") to confirm no collisions before wiring up routes.
2. `npm run build` — confirm all new dynamic routes generate the expected number of static pages (one per exercise, one per workout) and none crash on edge cases (e.g. an exercise with only one logged set, for trend rendering).
3. `npm run dev` + browser check: click through main page → exercise page → back, main page → workout detail → back, records page → exercise page. Confirm 🏅 shows only on the workout/exercise-history row matching the recorded PR date, not on every occurrence of the max weight.
4. `npm test` still green (including the `migrate-posts.ts` regression test from earlier in this session).
