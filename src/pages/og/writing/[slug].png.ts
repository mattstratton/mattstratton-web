import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgCard } from '../../../lib/og-card';

// Per-writing-post OG cards (the active, low-volume collection — worth bespoke cards).
export async function getStaticPaths() {
  const entries = await getCollection('writing', (e) => !e.data.draft);
  return entries.map((entry) => ({
    params: { slug: entry.id },
    props: { title: entry.data.title, subtitle: entry.data.description },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle } = props as { title: string; subtitle: string };
  const png = await renderOgCard({ title, subtitle, badge: 'WRITING' });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
