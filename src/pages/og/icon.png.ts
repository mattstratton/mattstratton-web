import type { APIRoute } from 'astro';
import { renderIcon } from '../../lib/og-card';

// Square brand icon at /og/icon.png — used as the apple-touch-icon and as the
// image to upload into Buttondown's icon + share-image fields.
export const GET: APIRoute = async () => {
  const png = await renderIcon(512);
  return new Response(new Uint8Array(png), {
    headers: { 'Content-Type': 'image/png', 'Cache-Control': 'public, max-age=31536000, immutable' },
  });
};
