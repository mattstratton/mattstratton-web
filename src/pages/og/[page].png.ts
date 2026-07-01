import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgCard } from '../../lib/og-card';

// OG cards for static pages + a `default` fallback that Base.astro points at when
// a page sets no image. Per-legacy-post cards are intentionally NOT generated
// (2,630 satori renders would balloon the build) — archive posts share /og/default.png.
export async function getStaticPaths() {
  const postCount = (await getCollection('posts')).length;
  const workoutCount = (await getCollection('workouts')).length;

  const pages: Record<string, { title: string; subtitle: string; badge: string }> = {
    home: {
      title: 'Postgres, performance, and the tradeoffs nobody warns you about.',
      subtitle: 'Writing from Matty Stratton, backed by 20+ years of infrastructure.',
      badge: 'WRITING',
    },
    writing: {
      title: 'Writing on Postgres',
      subtitle: 'An evergreen field guide to Postgres internals and performance tradeoffs.',
      badge: 'FIELD GUIDE',
    },
    post: {
      title: 'The archive',
      subtitle: `${postCount.toLocaleString()} posts of personal writing, going back to 2001.`,
      badge: 'ARCHIVE',
    },
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
      title: 'Matty Stratton',
      subtitle: 'Postgres, performance, and 25 years of writing.',
      badge: 'WRITING',
    },
  };

  return Object.entries(pages).map(([page, data]) => ({ params: { page }, props: data }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle, badge } = props as { title: string; subtitle: string; badge: string };
  const png = await renderOgCard({ title, subtitle, badge });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
