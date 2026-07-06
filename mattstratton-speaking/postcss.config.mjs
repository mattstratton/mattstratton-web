// @tailwindcss/vite is incompatible with Astro 6's default rolldown-vite
// (https://github.com/withastro/astro/issues/16542) — Tailwind runs via
// PostCSS instead until that's resolved upstream.
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
