import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { renderOgCard } from '../../../lib/og-card';

// One OG card per talk delivery, keyed by the lowercase notistId so the URL lines
// up with the talk page route (src/pages/[id]/[slug].astro) and Base.astro's
// computed image path.
export async function getStaticPaths() {
  const talks = await getCollection('talks');
  const paths = [] as Array<{ params: { id: string }; props: Record<string, unknown> }>;
  for (const talk of talks) {
    const event = talk.data.event ? await getEntry(talk.data.event) : null;
    paths.push({
      params: { id: talk.data.notistId.toLowerCase() },
      props: {
        title: talk.data.title,
        eventName: event?.data.name ?? null,
        presentedOn: talk.data.presentedOn.toISOString(),
        thumbnail: talk.data.thumbnail,
        hasVideo: Boolean(talk.data.video),
      },
    });
  }
  return paths;
}

export const GET: APIRoute = async ({ props }) => {
  const { title, eventName, presentedOn, thumbnail, hasVideo } = props as {
    title: string;
    eventName: string | null;
    presentedOn: string;
    thumbnail: string | null;
    hasVideo: boolean;
  };
  const date = new Date(presentedOn).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
  const subtitle = [eventName, date].filter(Boolean).join(' · ');
  const png = await renderOgCard({
    title,
    subtitle,
    badge: hasVideo ? 'TALK · VIDEO' : 'TALK',
    thumbnailPath: thumbnail,
  });
  return new Response(new Uint8Array(png), {
    headers: {
      'Content-Type': 'image/png',
      'Cache-Control': 'public, max-age=31536000, immutable',
    },
  });
};
