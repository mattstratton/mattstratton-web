import rss from '@astrojs/rss';
import { getCollection } from 'astro:content';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async (context) => {
  const issues = (await getCollection('newsletter')).sort(
    (a, b) => b.data.publishDate.getTime() - a.data.publishDate.getTime(),
  );
  return rss({
    title: 'Uncommitted · Matty Stratton',
    description: 'Postgres internals, performance, and the occasional find worth knowing about.',
    site: context.site ?? 'https://www.mattstratton.com',
    items: issues.map((issue) => ({
      title: issue.data.subject,
      description: issue.data.excerpt,
      pubDate: issue.data.publishDate,
      link: `/newsletter/${issue.id}/`,
    })),
  });
};
