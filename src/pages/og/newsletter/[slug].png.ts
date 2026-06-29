import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgCard } from '../../../lib/og-card';

// Per-issue OG cards for the newsletter archive (low volume, like writing posts —
// worth a bespoke card each).
export async function getStaticPaths() {
  const issues = await getCollection('newsletter');
  return issues.map((issue) => ({
    params: { slug: issue.id },
    props: { title: issue.data.subject, subtitle: issue.data.excerpt },
  }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle } = props as { title: string; subtitle: string };
  const png = await renderOgCard({ title, subtitle, badge: 'NEWSLETTER' });
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
