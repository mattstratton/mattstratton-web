import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';
import { buttondownLoader } from './lib/buttondown';

// The evergreen Postgres "field guide" authored on mattstratton.com going
// forward. Separate from the legacy `posts` archive (added in the post-migration
// phase): clean /writing/<slug> URLs, required description, evergreen metadata.
const writing = defineCollection({
  loader: glob({ pattern: '**/*.{md,mdx}', base: './src/content/writing' }),
  schema: z.object({
    title: z.string(),
    description: z.string(),
    pubDate: z.coerce.date(),
    updatedDate: z.coerce.date().optional(),
    // The 4-part arc from matty-writing-plan.md. Optional so standalone pieces
    // can exist outside the guide structure.
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

export const collections = { writing, posts, newsletter };
