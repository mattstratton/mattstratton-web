import type { APIRoute } from 'astro';
import { getCollection, getEntry } from 'astro:content';
import { stripHtml } from '../lib/strip-html';
import type { SearchRecord } from '../lib/search-types';

/**
 * Static search corpus, emitted once at build into `dist/search-index.json`.
 *
 * Fetched lazily by the search overlay on first open and cached by the browser,
 * rather than inlined into every page's HTML. Keeps the deploy build a pure
 * `astro build` with no host tools — just a durable static JSON file.
 */
export const GET: APIRoute = async () => {
  const talks = (await getCollection('talks')).sort(
    (a, b) => b.data.presentedOn.getTime() - a.data.presentedOn.getTime(),
  );

  const records: SearchRecord[] = await Promise.all(
    talks.map(async (talk) => {
      const d = talk.data;
      const event = d.event ? await getEntry(d.event) : null;
      return {
        url: `/${d.notistId.toLowerCase()}/${d.notistSlug}`,
        title: d.title,
        abstract: d.abstractHtml ? stripHtml(d.abstractHtml) : '',
        eventName: event?.data.name ?? '',
        location: event?.data.location ?? '',
        year: d.presentedOn.getFullYear(),
        date: d.presentedOn.toLocaleDateString('en-US', { year: 'numeric', month: 'short' }),
        hasVideo: Boolean(d.video),
        hasSlides: d.slideSource !== 'none',
        thumbnail: d.thumbnail ?? null,
      };
    }),
  );

  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json' },
  });
};
