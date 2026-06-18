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
  /** Repo path to the thumbnail, or null. */
  thumbnail: string | null;
}
