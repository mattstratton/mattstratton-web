# mattstratton-dev-to

Git-based archive and publishing workflow for dev.to content. dev.to is the drafting studio. Git is the archive and edit surface for published work.

---

## THE ONE RULE

> **Once a post is imported into this repo, do not edit it in the dev.to web editor.**

Git is the authority for tracked posts. Any edits made in the dev.to editor will be overwritten the next time a git change is published. The post's `id` field in front matter is the marker — if it's there, git owns it.

---

## How it works

**dev.to → git (import)**
Published posts are pulled into `posts/<slug>.md` on a daily schedule. New posts arrive as a PR — merge it to take ownership in git.

**git → dev.to (publish)**
Editing any `posts/**/*.md` file and merging to `main` pushes the change to dev.to automatically.

The importer is deliberately one-directional and create-only: it never overwrites a file that already has an `id`. The publisher only touches files with an `id`. Their domains don't overlap, so no feedback loop is possible.

---

## One-time setup

### 1. Get your dev.to API key

Go to [dev.to](https://dev.to) → Settings → Extensions → DEV Community API Keys → Generate a new key.

### 2. Add the secret to this repo

In this GitHub repo: Settings → Secrets and variables → Actions → New repository secret.

- **Name:** `DEVTO_API_KEY`
- **Value:** your API key

### 3. Fix GitHub Actions permissions

Two settings on the same page — both are required. Go to: Settings → Actions → General → Workflow permissions:

1. Select **"Read and write permissions"** — allows the publisher to commit `id` write-backs
2. Check **"Allow GitHub Actions to create and approve pull requests"** — allows the importer to open PRs

Save.

### 4. Run the first bulk import

Go to: Actions → "Import published posts from dev.to" → Run workflow → Run workflow.

This seeds the archive with all your currently published posts. A PR will open — review it and merge. Every post in that PR is now git-owned.

---

## Day-to-day workflows

### Editing a tracked post

1. Find the file in `posts/<slug>.md`
2. Edit it (locally, on a branch, via GitHub web editor — doesn't matter)
3. Open a PR, merge to `main`
4. The publisher pushes the change to dev.to within ~1 minute

### Importing a new post you published on dev.to

The daily cron handles this automatically. If you can't wait:

Actions → "Import published posts from dev.to" → Run workflow

A PR opens with the new post. Merge it to take ownership.

### Creating a new post git-native (recommended when writing with Claude Code)

1. Create `posts/<your-slug>.md` with `published: false` and no `id` field — use the front matter template below
2. Put any images in `posts/assets/` and reference them with relative paths (`./assets/cover.png`). The publisher rewrites these to repo-hosted URLs automatically.
3. Open a PR, merge to `main`
4. The publisher creates the draft on dev.to and writes the `id` back into the file
5. Review the rendered draft on dev.to
6. When it looks right: set `published: true`, commit, merge
7. Post goes live

Do not upload images via the dev.to editor for git-native posts. All images must live in the repo.

---

## Front matter reference

```markdown
---
title: "Your Post Title"
published: false               # set to true when ready to go live
description: "One-sentence summary shown in cards and SEO"
tags: [tag1, tag2, tag3]      # max 4 tags — dev.to hard limit
canonical_url: ""              # leave blank for new posts; importer fills this from dev.to
cover_image: "./assets/cover.png"  # relative path (git-native) or absolute URL (imported)
series: "Series Name"          # optional
id:                            # DO NOT set this manually; injected by importer/publisher
---

Your post content here. dev.to-flavored markdown.
Liquid embed tags ({% youtube ... %}, {% embed ... %}) work fine.
```

**Rules:**
- `id` is injected automatically — never set it yourself on a new post
- Max 4 tags (dev.to enforces this)
- For git-native posts: all image paths must be relative (the publisher rewrites them to repo URLs)
- For imported posts: image URLs are absolute dev.to CDN URLs — leave them alone

---

## Troubleshooting

**Import workflow ran but no PR appeared**
No new published posts were found, or all published posts are already tracked. Check the workflow run logs in Actions.

**Publish workflow didn't trigger**
Check that the changed file is under `posts/` and the commit was to `main`. The path filter is `posts/**/*.md`.

**Publisher wrote back an `id` but triggered another workflow run**
The loop guard (`if: github.actor != 'github-actions[bot]'`) should prevent this. If it's still looping, check that your repo's Actions settings are using the default `GITHUB_TOKEN` (not a PAT with a different actor name).

**Post not updating on dev.to after merge**
Check the publish workflow run in Actions. Common causes: the file wasn't changed (only whitespace/formatting), or the `DEVTO_API_KEY` secret is missing or expired.

**Slug collision warning in import logs**
The importer found a dev.to post whose slug matches a file that already exists in `posts/` without an `id`. This usually means a git-native draft is in progress with the same slug. Resolve by either renaming your draft or waiting until the draft is pushed and gets its `id`.

---

## Repo structure

```
posts/
  <slug>.md          # one file per tracked post
  assets/            # images for git-native posts (referenced by relative paths)
scripts/
  import.ts          # the create-only, publish-gated importer
.github/
  workflows/
    import.yml       # daily cron + manual trigger → opens PR with new posts
    publish.yml      # on push to main → publishes changed posts to dev.to
```
