# Fitness OG Cards Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give every `/fitness` page a real Open Graph link-preview image instead of silently falling back to the sitewide `/og/default.png`.

**Architecture:** Extend the existing satori/sharp OG card system (`src/lib/og-card.ts`, unchanged) with two route-level additions: three new entries in the existing static-page card map, and one new dynamic route for per-exercise cards. Then wire an `image` prop into each of the 5 `/fitness` pages.

**Tech Stack:** Astro API routes (`.png.ts`), satori + sharp (already a dependency, no new packages).

## Global Constraints

- No changes to `src/lib/og-card.ts` — `renderOgCard({title, subtitle, eyebrow, badge})` is already generic enough for every card this plan needs.
- **Bespoke cards** for `/fitness/`, `/fitness/records/`, `/fitness/workouts/` (the archive index), and all 48 `/fitness/exercises/[slug]/` pages.
- **Shared card** for all 170 `/fitness/workouts/[id]/` pages — they reuse `/og/fitness.png` (the landing page's card), not a unique render each. This mirrors the existing precedent: the 2,630-post legacy archive shares `/og/default.png` rather than getting bespoke cards, because that many satori renders "would balloon the build" (see the comment already in `src/pages/og/[page].png.ts`).
- All fitness cards use `badge: 'FITNESS'` and the sitewide default eyebrow (no override) — same visual family as every other card on the site.
- These are Astro API routes, not `.astro` pages — this repo doesn't unit-test either kind (no test files exist for `og/[page].png.ts` or `og/writing/[slug].png.ts` today); verification here is build output inspection, matching that existing convention.

---

### Task 1: Add fitness entries to the static-page OG card map

**Files:**
- Modify: `src/pages/og/[page].png.ts`

**Interfaces:**
- Consumes: `getCollection` from `astro:content` (already imported in this file), `renderOgCard` from `../../lib/og-card` (already imported).
- Produces: three new PNG routes — `/og/fitness.png`, `/og/fitness-records.png`, `/og/fitness-workouts.png` — that Task 3's page edits will point their `image` props at.

- [ ] **Step 1: Add a workout count alongside the existing post count**

In `src/pages/og/[page].png.ts`, change:

```ts
export async function getStaticPaths() {
  const postCount = (await getCollection('posts')).length;
```

to:

```ts
export async function getStaticPaths() {
  const postCount = (await getCollection('posts')).length;
  const workoutCount = (await getCollection('workouts')).length;
```

- [ ] **Step 2: Add the three fitness entries to the `pages` map**

Change:

```ts
    newsletter: {
      title: 'Uncommitted',
      subtitle: 'Monthly dispatches on Postgres internals and performance.',
      badge: 'NEWSLETTER',
    },
    default: {
```

to:

```ts
    newsletter: {
      title: 'Uncommitted',
      subtitle: 'Monthly dispatches on Postgres internals and performance.',
      badge: 'NEWSLETTER',
    },
    fitness: {
      title: 'Fitness',
      subtitle: 'Workout history, personal records, and lift trends, pulled from Liftosaur.',
      badge: 'FITNESS',
    },
    'fitness-records': {
      title: 'All records',
      subtitle: 'Every personal record across every exercise, pulled from Liftosaur.',
      badge: 'FITNESS',
    },
    'fitness-workouts': {
      title: 'All workouts',
      subtitle: `${workoutCount.toLocaleString()} workouts, pulled from Liftosaur.`,
      badge: 'FITNESS',
    },
    default: {
```

- [ ] **Step 3: Build and confirm the three new PNGs are generated**

Run: `npm run build`
Expected: succeeds. Then:

```bash
ls dist/og/fitness.png dist/og/fitness-records.png dist/og/fitness-workouts.png
```

Expected: all three files exist.

- [ ] **Step 4: Commit**

```bash
git add src/pages/og/[page].png.ts
git commit -m "Add fitness OG card entries to the static-page card map"
```

---

### Task 2: Per-exercise OG cards

**Files:**
- Create: `src/pages/og/fitness/exercises/[slug].png.ts` (mirrors the existing `src/pages/og/writing/[slug].png.ts`)

**Interfaces:**
- Consumes: `sortedWorkouts`, `computePersonalRecords` from `../../../../lib/liftosaur`; `slugify` from `../../../../lib/posts`; `renderOgCard` from `../../../../lib/og-card` (all existing, no changes). Note the four `../` levels — this file lives three directories deep under `src/pages/` (`og/fitness/exercises/`), one deeper than `og/writing/`.
- Produces: one PNG route per exercise, e.g. `/og/fitness/exercises/squat.png`, that Task 3's exercise page edit points its `image` prop at.

- [ ] **Step 1: Create the file**

```ts
import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgCard } from '../../../../lib/og-card';
import { sortedWorkouts, computePersonalRecords } from '../../../../lib/liftosaur';
import { slugify } from '../../../../lib/posts';

// Per-exercise OG cards for /fitness/exercises/[slug]/ — low volume (48 exercises),
// each with genuinely differentiated content (a real PR) worth a bespoke card.
export async function getStaticPaths() {
  const entries = await getCollection('workouts');
  const workouts = sortedWorkouts(entries);
  const prs = computePersonalRecords(workouts);
  const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  return prs.map((pr) => ({
    params: { slug: slugify(pr.exercise) },
    props: { title: pr.exercise, subtitle: `PR: ${pr.reps}×${pr.weight}${pr.unit} on ${fmtDate(pr.date)}` },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle } = props as { title: string; subtitle: string };
  const png = await renderOgCard({ title, subtitle, badge: 'FITNESS' });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
```

- [ ] **Step 2: Build and confirm one card per exercise**

Run: `npm run build`
Expected: succeeds. Then:

```bash
find dist/og/fitness/exercises -name "*.png" | wc -l
```

Expected: matches the exercise count from `dist/fitness/exercises` (48 as of this session's data — confirm it matches `ls dist/fitness/exercises | wc -l` exactly, since both are generated from the same `computePersonalRecords` call).

- [ ] **Step 3: Spot-check one card's content**

There's no text-extraction check for a PNG, so instead confirm the route resolved real data (not an empty/placeholder title) by checking the file exists and has a plausible size (a rendered 1200×630 PNG with text should be well over a few KB, not near-empty):

```bash
ls -la dist/og/fitness/exercises/squat.png
```

Expected: a file size in the tens-of-KB range (consistent with other cards, e.g. `dist/og/writing/*.png`), not 0 or near-0 bytes.

- [ ] **Step 4: Commit**

```bash
git add src/pages/og/fitness/
git commit -m "Add per-exercise OG cards"
```

---

### Task 3: Wire `image` props into the 5 fitness pages

**Files:**
- Modify: `src/pages/fitness/index.astro`
- Modify: `src/pages/fitness/records/index.astro`
- Modify: `src/pages/fitness/workouts/index.astro`
- Modify: `src/pages/fitness/exercises/[slug].astro`
- Modify: `src/pages/fitness/workouts/[id].astro`

**Interfaces:**
- Consumes: the `image` prop already defined on `Base.astro` (`image?: string | null`, existing — no changes to the layout itself). `slugify` is already imported in `exercises/[slug].astro`.

- [ ] **Step 1: `src/pages/fitness/index.astro`**

Change:

```astro
<Base
  title="Fitness · Matty Stratton"
  description="Workout history, personal records, and lift trends, pulled from Liftosaur."
>
```

to:

```astro
<Base
  title="Fitness · Matty Stratton"
  description="Workout history, personal records, and lift trends, pulled from Liftosaur."
  image="/og/fitness.png"
>
```

- [ ] **Step 2: `src/pages/fitness/records/index.astro`**

Change:

```astro
<Base
  title="All records · Fitness · Matty Stratton"
  description="Every personal record across every exercise, pulled from Liftosaur."
>
```

to:

```astro
<Base
  title="All records · Fitness · Matty Stratton"
  description="Every personal record across every exercise, pulled from Liftosaur."
  image="/og/fitness-records.png"
>
```

- [ ] **Step 3: `src/pages/fitness/workouts/index.astro`**

Change:

```astro
<Base title="All workouts · Fitness · Matty Stratton" description="Full workout history, pulled from Liftosaur.">
```

to:

```astro
<Base
  title="All workouts · Fitness · Matty Stratton"
  description="Full workout history, pulled from Liftosaur."
  image="/og/fitness-workouts.png"
>
```

- [ ] **Step 4: `src/pages/fitness/exercises/[slug].astro`**

Change:

```astro
<Base
  title={`${exercise} · Fitness · Matty Stratton`}
  description={`Trend and full history for ${exercise}, pulled from Liftosaur.`}
>
```

to:

```astro
<Base
  title={`${exercise} · Fitness · Matty Stratton`}
  description={`Trend and full history for ${exercise}, pulled from Liftosaur.`}
  image={`/og/fitness/exercises/${slugify(exercise)}.png`}
>
```

- [ ] **Step 5: `src/pages/fitness/workouts/[id].astro`**

Change:

```astro
<Base
  title={`${workout.dayName} — ${fmtDate(workout.date)} · Fitness · Matty Stratton`}
  description={`Workout detail for ${workout.dayName} on ${fmtDate(workout.date)}.`}
>
```

to:

```astro
<Base
  title={`${workout.dayName} — ${fmtDate(workout.date)} · Fitness · Matty Stratton`}
  description={`Workout detail for ${workout.dayName} on ${fmtDate(workout.date)}.`}
  image="/og/fitness.png"
>
```

- [ ] **Step 6: Build and verify the meta tags**

Run: `npm run build`
Expected: succeeds. Then:

```bash
grep -o '<meta property="og:image" content="[^"]*"' dist/fitness/index.html
grep -o '<meta property="og:image" content="[^"]*"' dist/fitness/records/index.html
grep -o '<meta property="og:image" content="[^"]*"' dist/fitness/workouts/index.html
grep -o '<meta property="og:image" content="[^"]*"' dist/fitness/exercises/squat/index.html
grep -o '<meta property="og:image" content="[^"]*"' dist/fitness/workouts/*/index.html | head -1
```

Expected: each shows the correct absolute URL — `.../og/fitness.png`, `.../og/fitness-records.png`, `.../og/fitness-workouts.png`, `.../og/fitness/exercises/squat.png`, and any workout detail page showing `.../og/fitness.png` (the shared fallback).

- [ ] **Step 7: Full verification**

```bash
npm test
```

Expected: all tests pass (this task touches no lib code, so the count should be unchanged from before this plan started).

- [ ] **Step 8: Commit**

```bash
git add src/pages/fitness/
git commit -m "Wire OG card images into /fitness pages"
```
