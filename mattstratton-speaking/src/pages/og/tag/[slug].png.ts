import type { APIRoute } from 'astro';
import { renderOgCard } from '../../../lib/og-card';
import { allTags } from '../../../lib/tags';

// One OG card per tag, keyed by the tag slug to match /tag/[slug].astro.
export async function getStaticPaths() {
  return allTags().map((tag) => ({
    params: { slug: tag.slug },
    props: { name: tag.name, kind: tag.kind, count: tag.count },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { name, kind, count } = props as { name: string; kind: 'topic' | 'tech'; count: number };
  const png = await renderOgCard({
    title: name,
    subtitle: `${count} talk${count === 1 ? '' : 's'}`,
    badge: kind === 'tech' ? 'TECH' : 'TOPIC',
  });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
