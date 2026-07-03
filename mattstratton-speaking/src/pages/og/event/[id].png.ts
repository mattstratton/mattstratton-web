import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgCard } from '../../../lib/og-card';

// One OG card per event, keyed by the lowercase notistEventId so the URL lines up
// with the event page route (src/pages/event/[id].astro) and its image path.
export async function getStaticPaths() {
  const [events, talks] = [await getCollection('events'), await getCollection('talks')];
  return events.map((event) => {
    const count = talks.filter((t) => t.data.event?.id === event.id).length;
    return {
      params: { id: event.data.notistEventId.toLowerCase() },
      props: {
        name: event.data.name,
        location: event.data.location ?? null,
        date: event.data.date?.toISOString() ?? null,
        count,
      },
    };
  });
}

export const GET: APIRoute = async ({ props }) => {
  const { name, location, date, count } = props as {
    name: string;
    location: string | null;
    date: string | null;
    count: number;
  };
  const year = date ? String(new Date(date).getFullYear()) : null;
  const subtitle = [location, year, `${count} talk${count === 1 ? '' : 's'}`]
    .filter(Boolean)
    .join(' · ');
  const png = await renderOgCard({ title: name, subtitle, badge: 'EVENT' });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
