import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { readTranscript } from '../lib/transcripts';
import type { DeepRecord } from '../lib/search-types';

/**
 * Heavy "search inside talks" corpus — full transcript text, one record per talk
 * that has one, emitted to `dist/deep-index.json`.
 *
 * Kept separate from search-index.json (which stays small for instant open). The
 * search overlay fetches this lazily on the first query, then folds transcript
 * matches into the results, keyed by the shared `url`. ~1MB of text total today;
 * gzips small, downloads once, caches.
 */
export const GET: APIRoute = async () => {
  const records: DeepRecord[] = [];
  for (const talk of await getCollection('talks')) {
    const text = readTranscript(talk.data.notistId);
    if (!text) continue;
    records.push({
      url: `/${talk.data.notistId.toLowerCase()}/${talk.data.notistSlug}`,
      text: text.replace(/\s+/g, ' '),
    });
  }

  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json' },
  });
};
