# mattstratton-dev-to

Git-based archive and publishing workflow for dev.to content.

## The one rule

**Once a post is imported into this repo, do not edit it in the dev.to web editor.** Git is the authority for tracked posts. Editing on dev.to will not sync back, and the next publish will overwrite your changes.

## How it works

- **dev.to → git (import):** Published posts are pulled into `posts/<slug>.md` automatically on a daily schedule and opened as a PR. Merge to take ownership in git.
- **git → dev.to (publish):** Editing a tracked `posts/**/*.md` file and merging to `main` pushes the change to dev.to.

## Secrets required

- `DEVTO_API_KEY` — dev.to personal API key (Settings > Extensions on dev.to)
- `GITHUB_TOKEN` — built-in, no setup needed for unprotected `main`

## New posts (git-native, Path B)

Create a `posts/<your-slug>.md` with `published: false` and no `id` field. Merge to `main` — the publisher creates the draft on dev.to and writes the `id` back into the file. Review the rendered draft, then set `published: true` and merge again.

Images: put them in `posts/assets/` and reference them with relative paths (e.g., `./assets/cover.png`). The publisher rewrites these to repo-hosted URLs automatically.
