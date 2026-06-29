import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

// Main site feed at /index.xml — the same path Hugo emitted, so existing
// subscribers keep working. Carries the active writing plus the recent archive,
// newest first.
export const GET: APIRoute = async (context) => {
  const writing = (await getCollection('writing'))
    .filter((e) => !e.data.draft)
    .map((e) => ({ title: e.data.title, description: e.data.description, pubDate: e.data.pubDate, link: `/writing/${e.id}/` }));
  const posts = (await getCollection('posts')).map((p) => ({
    title: p.data.title,
    description: p.data.description ?? '',
    pubDate: p.data.date,
    link: `/${p.data.permalink}/`,
  }));

  const items = [...writing, ...posts]
    .sort((a, b) => b.pubDate.getTime() - a.pubDate.getTime())
    .slice(0, 30);

  return rss({
    title: 'Matty Stratton',
    description: 'Postgres, performance, and 25 years of writing from Matty Stratton.',
    site: context.site ?? 'https://www.mattstratton.com',
    items,
  });
};
