export interface GeoResult {
  lat: number;
  lng: number;
  displayName: string;
}

interface NominatimHit {
  lat: string;
  lon: string;
  display_name: string;
}

// One-shot geocode via OpenStreetMap Nominatim. No API key; runs once at
// authoring time and the result is committed, so the live site never calls it.
// Nominatim's usage policy requires a descriptive User-Agent.
export async function geocode(
  location: string,
  fetchImpl: typeof fetch = fetch,
): Promise<GeoResult | null> {
  const url =
    'https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=' +
    encodeURIComponent(location);
  const res = await fetchImpl(url, {
    headers: { 'User-Agent': 'mattstratton-speaking add-talk (https://speaking.mattstratton.com)' },
  });
  if (!res.ok) return null;
  const hits = (await res.json()) as NominatimHit[];
  if (!hits.length) return null;
  const h = hits[0];
  return { lat: Number(h.lat), lng: Number(h.lon), displayName: h.display_name };
}
