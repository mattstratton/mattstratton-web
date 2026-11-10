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
      title: 'Databases, data infrastructure, and the AI you build on top.',
      subtitle: 'Writing and building from Matty Stratton, backed by 20+ years of infrastructure.',
      badge: 'WRITING',
    },
    writing: {
      title: 'Writing',
      subtitle: 'Postgres internals, building with AI, and everything else, browsable by topic.',
      badge: 'WRITING',
    },
    post: {
      title: 'The archive',
      subtitle: `${postCount.toLocaleString()} posts of personal writing, going back to 2001.`,
      badge: 'ARCHIVE',
    },
    newsletter: {
      title: 'Uncommitted',
      subtitle: 'Monthly dispatches on databases, building with AI, and whatever else.',
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
      subtitle: 'Databases, building with AI, and 25 years of writing.',
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
