---
name: new-devto-post
description: Scaffold a brand-new git-native dev.to post end to end — frontmatter, tags, optional cover image, crosspost intent, and the PR — following the Path B workflow in mattstratton-dev-to/CLAUDE.md. Use when the user says "new dev.to post", "draft a dev.to post", "write a new post for dev.to", or hands over prose/an idea to publish there.
---

# new-devto-post

Create one new git-native dev.to post (`mattstratton-dev-to/CLAUDE.md`'s "Path B"). The
post is created with `published: false` and no `id` — git owns it from creation, and
dev.to only sees it once the first PR merges. Never invent an `id`, `date`, or
`canonical_url`; those are injected downstream by `devto-publish.yml` and, later,
`scripts/crosspost-devto.ts`.

All paths below (`posts/...`) are relative to `mattstratton-dev-to/`. If the
session's cwd is the monorepo root, `cd mattstratton-dev-to` first — there is no
`posts/` directory anywhere else in the repo.

## Interview (skip anything already supplied, one question at a time)

1. **Title** — derive `slug` by lowercasing, stripping punctuation, converting
   spaces to hyphens, and collapsing repeats. Check `posts/<slug>.md` doesn't
   already exist. **If it collides, stop and ask the user to adjust the title or
   slug** — do not auto-suffix. (Every git-native post's filename today equals its
   slug exactly; dev.to's random suffixes like `-3mb1` only ever come from the
   importer, on dev.to-native posts.)
2. **Description** — one sentence (dev.to's summary/meta description).
3. **Tags** — up to 4, freeform. dev.to has no fixed vocabulary (unlike the
   speaking site's `tags.json`), so grep the tags already used across
   `posts/*.md` and show them as loose inspiration only — never enforce a list.
   **If the user gives more than 4, tell them and ask them to pick their top
   4 — never silently truncate or drop tags on their behalf.**
4. **Cover image** (optional) — a local file path. Copy it as-is (no format or
   dimension validation, matching `crosspost-devto.ts`'s own precedent of just
   copying/downloading) into `posts/assets/<slug>-cover.<ext>`. If none is given,
   omit `cover_image` from the frontmatter entirely.
5. **Series** (optional) — ask if this post continues an existing series.
   Grep `series:` values already used across `posts/*.md` (e.g. "DevRel Guide
   to Business", "Learning ROS 2 as a Database Person" — these are real, active
   series, not hypothetical) and show them for the user to pick from or
   decline. If declined, omit `series` entirely.
6. **Crosspost intent** — ask explicitly: should this post eventually land on
   mattstratton.com/writing/? If yes, set `crosspost: true`. **If no, omit the
   field — never write `crosspost: false`** (no existing post does this; posts
   that haven't opted in simply lack the key). Note for the user: this flag is
   inert until the post has an `id` (i.e. until after its first publish
   round-trip) — `scripts/crosspost-devto.ts`'s eligibility check requires both
   `id` and `crosspost === true`. Setting it now just means it fires
   automatically later, in whatever PR next touches this file, instead of being
   forgotten.
7. **Voice profile** (optional, silent) — check for `VOICE.md` at the monorepo
   root (the file issue #56 may eventually add). If present, read it and match
   its tone/patterns while drafting. If absent, say nothing and proceed —
   this hook must never fail, block, or warn just because the file doesn't
   exist yet.
8. **Body** — draft prose from what the user gives you, or take pasted prose
   as-is.

## Generate

Base frontmatter — always present, in this order:

```yaml
---
title: <title>
published: false
description: <description>
tags:
  - tag1
  - tag2
---
```

Then add these lines, **each only if the corresponding interview answer calls
for it** — do not paste a line for an option the user declined:

- `cover_image: ./assets/<slug>-cover.png` — only if a cover image was supplied.
- `series: <exact series name from step 5>` — only if continuing a series.
- `crosspost: true` — only if the user opted in at step 6. Never write
  `crosspost: false`.

- Write `posts/<slug>.md` with the assembled frontmatter followed by a blank
  line and the body.
- If a cover image was supplied, copy it into `posts/assets/<slug>-cover.<ext>`.
- Always excludes `id`, `date`, `canonical_url` — all automation-injected
  downstream (by `devto-publish.yml` and, later, `scripts/crosspost-devto.ts`),
  never set manually.

## Write + verify + commit

1. From `mattstratton-dev-to/`, run `npm test` and `npm run typecheck` — a
   regression gate. They won't exercise the new file directly, but both must
   still pass before continuing.
2. Spot-check the new file's frontmatter with `gray-matter` (already a
   dependency — don't add a new script for this): confirm it parses as valid
   YAML and `tags` has at most 4 entries.
3. If a cover image was added, confirm it exists at the referenced relative
   path.
4. Show `git status` + diff, scoped to the new `posts/<slug>.md` (and
   `posts/assets/...` if applicable).
5. Hand off to the root **`pr`** skill for branch/build/test/review/commit/push/
   PR-open — don't reimplement any of that here. Suggest branch name
   `devto/<slug>`. **Never commit without the user's sign-off.**
6. In the PR description, note that merging only creates a dev.to **draft** —
   actually publishing it live is a separate, later step (flip `published:
   true`, merge again) that this skill doesn't perform.

## Out of scope

- Flipping `published: true` on an already git-owned post (the second-PR
  publish step) — a separate, simpler future flow.
- Editing or republishing existing posts.
- Bulk import from dev.to (`devto-import.yml` / `mattstratton-dev-to/scripts/import.ts`
  already own that).
- Building `VOICE.md` itself (issue #56) — this skill only reads one if it
  exists, never creates it.
