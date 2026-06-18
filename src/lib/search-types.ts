/**
 * One lightweight, JSON-serializable search record per talk.
 *
 * Shared (type-only) between the build-time index endpoint
 * (`src/pages/search-index.json.ts`) and the browser search script
 * (`src/components/Search.astro`) so the corpus shape stays in sync.
 */
export interface SearchRecord {
  /** Canonical talk URL: `/{notistId.toLowerCase()}/{notistSlug}`, no trailing slash. */
  url: string;
  /** notistSlug — shared across re-deliveries; used to dedupe results to one per talk. */
  slug: string;
  title: string;
  /** Plain-text abstract (HTML stripped); empty string when the talk has none. */
  abstract: string;
  /** Resolved event name, or empty string. */
  eventName: string;
  /** Resolved event location, or empty string. */
  location: string;
  /** Presentation year (number), used by the year facet. */
  year: number;
  /** Preformatted "Mon YYYY" date string (JSON has no Date type). */
  date: string;
  hasVideo: boolean;
  hasSlides: boolean;
  /** Whether a committed transcript exists (full text lives in deep-index.json). */
  hasTranscript: boolean;
  /** Repo path to the thumbnail, or null. */
  thumbnail: string | null;
}

/**
 * One heavy record per talk that has a transcript. Lives in a separate
 * `deep-index.json` so the lightweight search index stays small and instant;
 * the deep index is fetched lazily on the first query.
 */
export interface DeepRecord {
  /** Same canonical URL as the matching SearchRecord — the join key. */
  url: string;
  /** Full transcript text (newlines flattened to spaces). */
  text: string;
}
