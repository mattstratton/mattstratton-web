// @ts-check
import { defineConfig } from 'astro/config';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';

// Migrated from Hugo. URL preservation is the prime directive: the 2,600+ legacy
// posts were emitted by Hugo at their literal `url:` value as directory-style
// paths WITH a trailing slash (no `permalinks:` config, default uglyURLs=false).
// `trailingSlash: 'always'` + `build.format: 'directory'` reproduces those URLs
// byte-for-byte (e.g. /life-in-general/foo/index.html) so 25 years of inbound
// links and indexed URLs keep resolving. Do NOT switch to 'never'/'file' here —
// that's the speaking site's config and would 301-bounce every legacy URL.
export default defineConfig({
  site: 'https://www.mattstratton.com',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
  // Keep generated OG image routes (/og/*.png) out of the sitemap.
  integrations: [sitemap({ filter: (page) => !page.includes('/og/') })],
  vite: {
    // Cast: @tailwindcss/vite ships its own Vite types which skew from Astro's
    // bundled Vite types — harmless at runtime, noisy at type-check.
    plugins: [/** @type {any} */ (tailwindcss())],
  },
});
