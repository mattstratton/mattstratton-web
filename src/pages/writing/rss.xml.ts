import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';
import { publishedWriting } from '../../lib/writing';

// Writing-only feed — the distribution layer for the newsletter strategy.
export const GET: APIRoute = async (context) => {
  const entries = publishedWriting(await getCollection('writing'));
  return rss({
    title: 'Matty Stratton · Writing',
    description: 'Postgres internals, performance limits, and architecture tradeoffs.',
    site: context.site ?? 'https://www.mattstratton.com',
    items: entries.map((e) => ({
      title: e.data.title,
      description: e.data.description,
      pubDate: e.data.pubDate,
      link: `/writing/${e.id}/`,
    })),
  });
};
