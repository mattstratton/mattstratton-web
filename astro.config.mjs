// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Durability-first static site replacing the Notist speaking archive.
// URLs mirror Notist exactly: /{notistId}/{slug}, no trailing slash, no /username segment.
export default defineConfig({
  site: 'https://speaking.mattstratton.com',
  trailingSlash: 'never',
  build: {
    // Emit /{id}/{slug}.html so paths resolve without a trailing slash, matching Notist.
    format: 'file',
  },
  // Keep the generated OG image routes (/og/*.png) out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/og/') })],
  vite: {
    // Cast: @tailwindcss/vite ships its own Vite types which skew from Astro's
    // bundled Vite types — harmless at runtime, noisy at type-check.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
