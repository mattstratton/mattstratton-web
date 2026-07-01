# OG cards for /fitness pages

## Context

None of the `/fitness` pages set an `image` prop on `<Base>`, so every link preview for the whole section — landing page, records, exercises, workouts — silently falls back to the sitewide `/og/default.png`. The rest of the site already has a working, cheap pattern for this (satori + sharp, `src/lib/og-card.ts`), used by the homepage, `/writing/`, `/post/`, `/newsletter/`, and per-`writing`-entry cards. This just extends that existing pattern to `/fitness`, following the volume-based precedent the repo already set: the 2,630-post legacy archive intentionally shares one generic card rather than generating one per post, because "2,630 satori renders would balloon the build" (per the comment in `src/pages/og/[page].png.ts`).

## Scope

- **Bespoke cards** for: `/fitness/` (landing), `/fitness/records/`, `/fitness/workouts/` (archive index), and all 48 `/fitness/exercises/[slug]/` pages. Low page count, genuinely differentiated content (an exercise's PR is worth showing).
- **Shared card** for all 170 `/fitness/workouts/[id]/` pages: they reuse the landing page's `/og/fitness.png` rather than getting a unique card each. Mirrors the legacy-post precedent — high page count, low differentiation (a single workout doesn't have much more to show than a date), and avoiding 170 near-duplicate renders.
- No changes needed to `src/lib/og-card.ts` — `renderOgCard({title, subtitle, eyebrow, badge})` is already generic enough. This is purely two route files plus wiring `image` props into the 5 existing `.astro` pages.

## Routes

- **`src/pages/og/[page].png.ts`** — add three entries to the existing `pages` map, alongside `home`/`writing`/`post`/`newsletter`/`default`:
  - `fitness`: title "Fitness", subtitle "Workout history, personal records, and lift trends, pulled from Liftosaur." (matches the landing page's existing meta description).
  - `fitness-records`: title "All records", subtitle "Every personal record across every exercise, pulled from Liftosaur."
  - `fitness-workouts`: title "All workouts", subtitle `"${workoutCount.toLocaleString()} workouts, pulled from Liftosaur."` — `workoutCount` computed via `(await getCollection('workouts')).length`, the same way this file already computes `postCount` for the `post` entry.
  - All three use `badge: 'FITNESS'`.
- **`src/pages/og/fitness/exercises/[slug].png.ts`** (new file, mirrors `src/pages/og/writing/[slug].png.ts`'s structure) — `getStaticPaths` fetches `workouts`, runs `sortedWorkouts` + `computePersonalRecords` (both already in `src/lib/liftosaur.ts`), and for each PR: `params: { slug: slugify(pr.exercise) }`, `props: { title: pr.exercise, subtitle: "PR: {reps}×{weight}{unit} on {date}" }`, `badge: 'FITNESS'`. Date formatted the same way as every other date on `/fitness` (`toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' })`, e.g. "Mar 13, 2025"). Date formatting and the `{reps}×{weight}{unit}` template are inlined here (this file is a `.ts` API route, not an `.astro` page, so it can't import the `fmtSet`/`fmtDate` closures already living in the exercise page — they're tiny enough to duplicate rather than extract into a shared module for two call sites).

## Wiring into the pages

Each of the 5 `.astro` pages gets an `image` prop added to its `<Base>` call:
- `src/pages/fitness/index.astro` → `image="/og/fitness.png"`
- `src/pages/fitness/records/index.astro` → `image="/og/fitness-records.png"`
- `src/pages/fitness/workouts/index.astro` → `image="/og/fitness-workouts.png"`
- `src/pages/fitness/exercises/[slug].astro` → `image={`/og/fitness/exercises/${slugify(exercise)}.png`}`
- `src/pages/fitness/workouts/[id].astro` → `image="/og/fitness.png"` (the shared fallback)

## Verification

1. `npm run build` — confirm it succeeds and generates exactly 48 files under `dist/og/fitness/exercises/` (one per exercise, matching the existing PR count) plus the 3 new top-level fitness cards under `dist/og/`.
2. Spot-check one exercise card's PNG exists and one `.astro` page's rendered HTML has the right `<meta property="og:image">` pointing at the corresponding `/og/...` path.
3. `npm test` still green, `src/content/posts` untouched (standard checks carried over from every prior round this session).
