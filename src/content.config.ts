import { defineCollection } from 'astro:content';
import { z } from 'astro/zod';
import { glob } from 'astro/loaders';
import { buttondownLoader } from './lib/buttondown';
import { liftosaurLoader } from './lib/liftosaur';

// The living home for all of Matt's current writing on mattstratton.com — not
// just Postgres. Separate from the legacy `posts` archive (added in the
// post-migration phase, frozen at 2001–2020): clean /writing/<slug> URLs,
// required description, evergreen metadata. `topics` is the universal tag
// mechanism; `part` below is a special-cased curated arc, not the whole story.
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // The curated 4-part Postgres arc (mechanics -> limits -> traps -> decision).
    // Optional and Postgres-specific — most entries won't set this; everything
    // else is tagged via `topics` instead.
    part: z.enum(['mechanics', 'limits', 'traps', 'decision']).optional(),
    topics: z.array(z.string()).default([]),
    draft: z.boolean().default(false),
    // Set when the canonical version lives elsewhere (e.g. a tigerdata.com cross-post).
    canonicalUrl: z.string().url().optional(),
    heroImage: z.string().optional(),
  }),
});

// The 2,630-post legacy archive (2001–2020), bulk-converted from Hugo by
// scripts/migrate-posts.ts. `permalink` is load-bearing: it carries the exact
// Hugo URL and drives src/pages/[...permalink].astro. Do NOT name a field `slug`
// (the glob loader would treat it as the entry id). Liberal schema — these are
// 25 years of WordPress-era posts.
const posts = defineCollection({
  loader: glob({ pattern: ['**/*.md', '!**/_quarantine/**'], base: './src/content/posts' }),
  schema: z.object({
    title: z.string(),
    date: z.coerce.date(),
    permalink: z.string(),
    author: z.string().default('Matt Stratton'),
    description: z.string().optional(),
    image: z.string().optional(),
    categories: z.array(z.string()).default([]),
    tags: z.array(z.string()).default([]),
    disqusThreadId: z.string().optional(),
    // True when `image` also appears inline in the body — the post page then skips
    // the top hero (the body shows it) but the archive list still uses it as a thumb.
    heroInBody: z.boolean().default(false),
    legacy: z.boolean().default(true),
  }),
});

// Newsletter archive, pulled from Buttondown at build time (see src/lib/buttondown.ts).
const newsletter = defineCollection({
  loader: buttondownLoader(),
  schema: z.object({
    subject: z.string(),
    slug: z.string(),
    publishDate: z.coerce.date(),
    bodyHtml: z.string(),
    excerpt: z.string().default(''),
  }),
});

// Workout history for the /fitness page, pulled from Liftosaur at build time
// (see src/lib/liftosaur.ts). Entry id is the Liftosaur workout id.
const workouts = defineCollection({
  loader: liftosaurLoader(),
  schema: z.object({
    date: z.coerce.date(),
    program: z.string(),
    dayName: z.string(),
    durationSeconds: z.number(),
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
  }),
});

export const collections = { writing, posts, newsletter, workouts };
