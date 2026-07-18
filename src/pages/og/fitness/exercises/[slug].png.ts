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
    new Date(iso).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'America/Chicago' });
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
