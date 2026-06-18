import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';
import { readTranscript } from '../lib/transcripts';
import { readSlideText } from '../lib/slide-text';
import type { DeepRecord } from '../lib/search-types';

/**
 * Heavy "search inside talks" corpus — transcript + slide text concatenated, one
 * record per talk that has either, emitted to `dist/deep-index.json`.
 *
 * Kept separate from search-index.json (which stays small for instant open). The
 * search overlay fetches this lazily on the first query, then folds matches into
 * the results, keyed by the shared `url`. A talk surfaces here if the query is in
 * what was said (transcript) or what was shown (slides). Gzips small, caches.
 */
export const GET: APIRoute = async () => {
  const records: DeepRecord[] = [];
  for (const talk of await getCollection('talks')) {
    const parts = [readTranscript(talk.data.notistId), readSlideText(talk.data.notistId)].filter(
      Boolean,
    );
    if (!parts.length) continue;
    records.push({
      url: `/${talk.data.notistId.toLowerCase()}/${talk.data.notistSlug}`,
      text: parts.join(' ').replace(/\s+/g, ' '),
    });
  }

  return new Response(JSON.stringify(records), {
    headers: { 'Content-Type': 'application/json' },
  });
};
