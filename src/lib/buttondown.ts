import type { Loader } from 'astro/loaders';
import { marked } from 'marked';

// Astro content-layer loader for the newsletter archive. At build time it pulls
// sent issues from the Buttondown API and exposes them as a `newsletter`
// collection. The API key is read from the environment (BUTTONDOWN_API_KEY,
// set as a Netlify env var + a local .env) — never committed. If the key is
// missing or the API errors, the archive builds empty rather than failing the
// build, so the site (and contributors without the key) still build fine.

// Long-standing v1 base. If Buttondown moves it to api.buttondown.com, override
// with BUTTONDOWN_API_BASE.
const API_BASE =
  import.meta.env.BUTTONDOWN_API_BASE ?? process.env.BUTTONDOWN_API_BASE ?? 'https://api.buttondown.email/v1';

// Statuses that represent a publicly-archivable, already-delivered issue.
const PUBLISHED = new Set(['sent', 'imported']);

interface ButtondownEmail {
  id: string;
  subject?: string;
  body?: string;
  slug?: string;
  publish_date?: string;
  status?: string;
  email_type?: string;
}

function excerptFrom(html: string, max = 200): string {
  const text = html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  return text.length > max ? `${text.slice(0, max).trimEnd()}…` : text;
}

export function buttondownLoader(): Loader {
  return {
    name: 'buttondown',
    load: async ({ store, logger, parseData }) => {
      store.clear();
      const key = import.meta.env.BUTTONDOWN_API_KEY ?? process.env.BUTTONDOWN_API_KEY;
      if (!key) {
        logger.warn('BUTTONDOWN_API_KEY not set — newsletter archive will build empty.');
        return;
      }

      const emails: ButtondownEmail[] = [];
      let url: string | null = `${API_BASE}/emails?ordering=-publish_date`;
      try {
        while (url) {
          const res: Response = await fetch(url, { headers: { Authorization: `Token ${key}` } });
          if (!res.ok) {
            logger.error(`Buttondown API ${res.status} ${res.statusText} — archive will build empty.`);
            return;
          }
          const page = (await res.json()) as { results?: ButtondownEmail[]; next?: string | null };
          emails.push(...(page.results ?? []));
          url = page.next ?? null;
        }
      } catch (err) {
        logger.error(`Buttondown fetch failed (${String(err)}) — archive will build empty.`);
        return;
      }

      let count = 0;
      for (const e of emails) {
        if (!e.status || !PUBLISHED.has(e.status) || !e.slug) continue;
        try {
          const bodyHtml = marked.parse(e.body ?? '', { async: false }) as string;
          const data = await parseData({
            id: e.slug,
            data: {
              subject: e.subject ?? e.slug,
              slug: e.slug,
              publishDate: e.publish_date ?? new Date(0).toISOString(),
              bodyHtml,
              excerpt: excerptFrom(bodyHtml),
            },
          });
          store.set({ id: e.slug, data });
          count++;
        } catch (err) {
          logger.warn(`Skipped newsletter issue "${e.slug}" (${String(err)}).`);
        }
      }
      logger.info(`Loaded ${count} newsletter issue(s) from Buttondown.`);
    },
  };
}
