# CLAUDE.md — dev.to ↔ Git Sync Repo

This repo syncs Matty Stratton's dev.to content with git. Dev.to is the drafting studio; git is the archive and edit surface for published work.

## Core mental model: ownership, not direction

Do NOT think of this as data flowing in two directions. Think of it as **ownership of a post, which transfers exactly once.**

- **dev.to-owned:** while being drafted. Git ignores it completely.
- **git-owned:** after import. The `id` field in front matter is the marker.
- **Ownership flips exactly once** (at import time, via a merged PR). It never flips back automatically.

A file with `id` in its front matter is git-owned. A file without `id` is a new git-native post awaiting its first publish.

## Invariants (never violate these)

1. **The importer is create-only.** It may create new files. It never overwrites a file that already has an `id`.
2. **The importer is publish-gated.** It only imports posts that are `published: true` on dev.to. Never drafts.
3. **The publisher only touches tracked files.** It never invents new dev.to posts from scratch — those come from git-native posts (no `id`) being pushed for the first time.
4. **No post is ever written by both jobs.** Importer skips anything with a known `id`; publisher only touches things with an `id`. Their domains don't overlap.

## How to write a new post (Path B — git-native)

This is the recommended path when co-writing with Claude Code.

1. Create `posts/<slug>.md` on a branch. Use this front matter template:

```markdown
---
title: "Post Title"
published: false
description: "One sentence."
tags: [tag1, tag2]
cover_image: "./assets/cover.png"
---

Content here.
```

2. If there are images: put them in `posts/assets/` and reference with relative paths. The publisher rewrites relative paths to `raw.githubusercontent.com` URLs on push.
3. Do NOT set `id` — it gets written back after the first publish.
4. Merge to `main`. Publisher creates a dev.to draft and writes `id` back.
5. Review the draft on dev.to. When it looks right, set `published: true` and merge again.

**Once the post has an `id`, do not edit it in the dev.to editor.** Git owns it from that point on.

## Front matter schema

```markdown
---
title: "string"
published: true | false
description: "string"
tags: [max 4 tags]
canonical_url: "https://..."   # leave blank for new posts; importer fills from dev.to
cover_image: "./relative/path" # or absolute URL for imported posts
series: "optional series name"
id: 1234567                    # injected by importer/publisher — never set manually
---
```

## What NOT to do

- **Do not set `id` manually.** The publisher and importer manage this field.
- **Do not edit a post in the dev.to web editor after it has been imported.** The next publish will overwrite it.
- **Do not upload images via the dev.to editor for git-native posts.** All images must live in `posts/assets/`.
- **Do not run the importer on a schedule without the PR gate.** The `import.yml` workflow opens a PR — the human must merge it. This is intentional: the ownership flip is a deliberate event.

## Image handling

- Relative image paths (no `http://` prefix) → publisher rewrites to `https://raw.githubusercontent.com/mattstratton/mattstratton-dev-to/main/...`
- Absolute URLs → left untouched (imported posts carry dev.to CDN URLs)
- Images must be committed before or with the publish, or you'll get 404s

## Repo structure

```
posts/
  <slug>.md          # one per tracked post; has `id` in front matter
  assets/            # images for git-native posts
scripts/
  import.ts          # the importer — exports: DevToArticle, getTrackedIds, buildFrontMatter, buildMarkdown
  import.test.ts     # vitest unit tests for the pure functions
.github/
  workflows/
    import.yml       # daily cron + manual → creates posts/<slug>.md → opens PR
    publish.yml      # on push to main affecting posts/**/*.md → publishes to dev.to
```

## Running the importer locally

```bash
DEVTO_API_KEY=<your-key> npm run import
```

This is safe to run repeatedly — it's idempotent. Running it when no new posts exist produces zero file changes.

## Secrets

- `DEVTO_API_KEY` — dev.to personal API key. Required for both import and publish workflows.
- `GITHUB_TOKEN` — built-in. Sufficient for unprotected `main`.

If `main` is ever branch-protected, the publisher's `id` write-back will fail with `GITHUB_TOKEN` — a Personal Access Token with `repo` scope would be needed instead.
