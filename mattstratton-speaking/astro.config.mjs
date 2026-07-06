// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import icon from 'astro-icon';

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
  integrations: [sitemap({ filter: (page) => !page.includes('/og/') && !page.endsWith('/llms.txt') }), icon()],
});
