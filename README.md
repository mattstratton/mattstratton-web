# mattstratton.com website code

The code behind [mattstratton.com](https://mattstratton.com): **Astro 6 +
Tailwind CSS v4**, deployed to Netlify. This repo is technically three repos
in a trenchcoat — see below, or `CLAUDE.md` for the full architectural
rationale (URL-preservation rules, migration history, why Astro 7 is a
no-go for now, etc).

## Monorepo structure

Three independent subprojects live here side by side, merged via `git
subtree` so the whole mattstratton.com stack can be managed from one place.
There's no shared tooling, no npm workspaces, no shared `package.json` —
each one is fully self-contained and needs its own `npm install` run from
inside its own directory.

- **`/` (this directory)** — mattstratton.com itself. The 2,630-post legacy
  Hugo archive (2001–2020), the evergreen `writing` field-guide collection,
  and the `/fitness` page (workout history pulled from Liftosaur at build
  time). Covered by the rest of this README.
- **[`mattstratton-speaking/`](mattstratton-speaking/README.md)** —
  speaking.mattstratton.com, a self-hosted Notist replacement: every talk,
  event, video, and slide deck as a static Astro site. Separate Astro config
  on purpose — don't try to unify it with this site's.
- **[`mattstratton-dev-to/`](mattstratton-dev-to/README.md)** — manages
  Matt's dev.to posts via a git-ownership-transfer model, and feeds the
  `crosspost` script (below) that selectively republishes dev.to posts into
  this site's `/writing/` collection.

## Getting started

Requires **Node 24** (see `.nvmrc`).

```bash
npm install
npm run dev        # local dev server (http://localhost:4321)
npm run build      # production build → dist/
npm run preview    # preview the built site
```

Other root scripts:

| Script | What it does |
|---|---|
| `npm run migrate` | Re-runs the legacy Hugo→Astro post converter. Mostly historical at this point — the original Hugo source has been removed from the repo (still in git history), so re-running it would require restoring `content/post/` first. |
| `npm run crosspost` | Cross-posts a selected dev.to article into the `writing` collection (rehosts images, delinks embeds, maps tags). Opt-in and curated, not bulk — see `scripts/crosspost-devto.ts`. |
| `npm run refresh-fitness-cache` | Refreshes the committed Liftosaur fallback cache (`src/data/liftosaur-cache.json`) used when the live API call fails at build time. |
| `npm test` | Runs the script + lib unit tests (`node --test`). |

`mattstratton-speaking/` and `mattstratton-dev-to/` each have their own
scripts — see their READMEs.

## GitHub Actions workflows

All workflows live at the true repo root (`.github/workflows/`) — GitHub
only discovers Actions there, never in a subdirectory, so the two that are
scoped to `mattstratton-dev-to/` are still forced to live at top level (via
`working-directory`/`paths` settings pointing back into that subproject).

| Workflow | Trigger | What it does | Secrets |
|---|---|---|---|
| `devto-import.yml` | Daily cron (13:00 UTC) + manual | Pulls newly published dev.to posts into `mattstratton-dev-to/posts/` and opens a PR for review. | `DEVTO_API_KEY` |
| `devto-crosspost.yml` | PR touching `mattstratton-dev-to/posts/**/*.md` | Auto-crossposts eligible, changed posts into the `writing` collection and commits the generated files back onto the same PR. | — |
| `devto-publish.yml` | Push to `main` touching `mattstratton-dev-to/posts/**/*.md` | Publishes changed/new posts to dev.to via the API, writing generated metadata (like the post `id`) back via a commit. | `DEVTO_API_KEY` |
| `fitness-rebuild.yml` | Daily cron (12:00 UTC) + manual | Refreshes the Liftosaur fallback cache and commits it to `main`, then triggers a Netlify rebuild so `/fitness` picks up fresh data even if the live API is flaky at build time. | `LIFTOSAUR_API_KEY`, `NETLIFY_BUILD_HOOK_FITNESS` |

Both dev.to workflows guard against infinite loops (`github.actor !=
'github-actions[bot]'`) since they commit back into the repo themselves —
worth knowing before you go "fixing" what looks like a workflow that ignores
its own commits.

## Environment variables

| Variable | Used for |
|---|---|
| `BUTTONDOWN_API_KEY` | Fetches the newsletter archive at build time. |
| `BUTTONDOWN_API_BASE` | Optional override if Buttondown moves its API base. |
| `LIFTOSAUR_API_KEY` | Fetches workout history for `/fitness` at build time. |
| `LIFTOSAUR_API_BASE` | Optional override if Liftosaur moves its API base. |

All are optional — the site builds fine without them, just with an empty
newsletter archive / fitness page. See `CLAUDE.md` for where to generate
each key and how to wire up the Buttondown/Netlify rebuild webhooks.

## `scripts/`

- `crosspost-devto.ts` — backs the `crosspost` npm script and the
  `devto-crosspost.yml` workflow.
- `migrate-posts.ts` — the one-time legacy Hugo→Astro converter (see above).
- `update-liftosaur-cache.ts` — backs `refresh-fitness-cache` and the
  `fitness-rebuild.yml` workflow.

## More detail

- `CLAUDE.md` — architecture, URL-preservation rules, environment variable
  setup, and migration history.
- `VOICE.md` — Matt's writing voice profile, for drafting or reviewing
  posts in the `writing` collection or `mattstratton-dev-to/`.
