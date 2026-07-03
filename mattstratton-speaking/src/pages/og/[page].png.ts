import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { renderOgCard } from '../../lib/og-card';

// OG cards for the static (non-talk) pages, plus a `default` fallback that
// Base.astro points at when a page sets no image. Counts are computed from the
// content collection so the cards stay in step with the real archive.
export async function getStaticPaths() {
  const talks = await getCollection('talks');
  const total = talks.length;
  const videoCount = talks.filter((t) => t.data.video).length;
  const years = talks.map((t) => t.data.presentedOn.getFullYear());
  const since = years.length ? Math.min(...years) : 2012;
  const mappedCount = (await getCollection('events')).filter(
    (e) => typeof e.data.latitude === 'number' && typeof e.data.longitude === 'number',
  ).length;

  const pages: Record<string, { title: string; subtitle: string; badge: string }> = {
    home: {
      title: 'DevOps, teams, and the human side of software.',
      subtitle: `Every conference talk Matty Stratton has given since ${since}.`,
      badge: 'SPEAKING',
    },
    talks: {
      title: 'Talks',
      subtitle: `Every talk Matty Stratton has given — ${total} of them, going back to ${since}.`,
      badge: 'ARCHIVE',
    },
    videos: {
      title: 'Talks on video',
      subtitle: `${videoCount} of Matty Stratton's talks that someone caught on video.`,
      badge: 'VIDEO',
    },
    bio: {
      title: 'Bio & Speaker Kit',
      subtitle: 'Speaker bio, headshots, and links — ready for event organizers to grab and go.',
      badge: 'PRESS',
    },
    map: {
      title: 'Where I’ve spoken',
      subtitle: `Matty Stratton has spoken at ${mappedCount} venues around the world.`,
      badge: 'MAP',
    },
    default: {
      title: 'Matty Stratton · Speaking',
      subtitle: 'DevOps, teams, and the human side of software.',
      badge: 'SPEAKING',
    },
  };

  return Object.entries(pages).map(([page, data]) => ({ params: { page }, props: data }));
}

export const GET: APIRoute = async ({ props }) => {
  const { title, subtitle, badge } = props as { title: string; subtitle: string; badge: string };
  const png = await renderOgCard({ title, subtitle, badge });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
