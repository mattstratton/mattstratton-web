---
title: I Contain Multitudes (and Also Three Git Repos)
description: "A tour of the stack behind mattstratton.com and speaking.mattstratton.com: a monorepo holding two Astro sites and a dev.to sync tool, twenty years of blog posts, and the pipeline that crossposts posts like this one."
pubDate: 2026-07-03
topics:
  - astro
  - webdev
  - showdev
draft: false
heroImage: /writing/mattstratton-com-stack/mattstratton-com-stack-cover.png
---

![](/writing/mattstratton-com-stack/mattstratton-com-stack-cover.png)

My blog is older than most of the tools I use to run it. The oldest posts started life on LiveJournal sometime in the early 2000s, got dragged through a WordPress import at some point in the mid-2000s, spent the better part of a decade as a Hugo site, and, about a week ago, moved into an Astro 5 site that reproduces every one of those old URLs byte for byte. That's 2,630 posts spanning 2001 to 2020, frozen exactly where they landed.

At the same time, [my speaking site](https://speaking.mattstratton.com) (106 talks going back to 2012) moved off Notist and onto something I actually own. And the tool that syncs my dev.to drafts with git finally works the way it was supposed to the whole time, instead of the way it actually did for a while.

All three of those used to be separate repos. As of earlier today, they're one monorepo, with the real git history from all three preserved, not squashed into "initial commit" and called a day. Here's the tour: how the two sites work, how dev.to fits into either of them, and a couple of things that broke in interesting ways along the trip.

## The shape of it today

Three systems, one person, now one [repo](https://github.com/mattstratton/mattstratton-web):

- **mattstratton.com** is the personal site. It carries the 2,630-post legacy archive and a newer, general-purpose `/writing/` section for anything I want to write that isn't archival.
- **speaking.mattstratton.com** is the talk archive: every deck, every video, every event, self-hosted.
- **mattstratton-dev-to** isn't a website at all. It's a small tool that keeps dev.to drafts and this git repo in sync, and it's the thing that lets a post published on dev.to also show up natively on [mattstratton.com](https://mattstratton.com), which is what's about to happen to this exact post.

They're merged into one monorepo now, but they're still three genuinely separate concerns underneath, with their own configs and their own reasons for existing. Let's take them one at a time.

## mattstratton.com: preserving twenty years of receipts

The current site is Astro 5 and Tailwind v4. The single rule that shaped every other decision in the migration: **URL preservation is the prime directive.** [`astro.config.mjs`](https://github.com/mattstratton/mattstratton-web/blob/master/astro.config.mjs) sets `trailingSlash: 'always'` and builds in directory format specifically to reproduce the old Hugo URLs exactly, which in turn had reproduced the WordPress URLs before that. Old inbound links, whether from a 2009 blog roll or a conference site linking a talk recap from 2014, still resolve. Nobody has to fix a dead link because I decided to rewrite my site in a different framework.

The `posts` collection is the frozen 2001 to 2020 archive, bulk-converted from Hugo. It doesn't grow. It just needs to keep existing. Everything new goes into `writing`, and that one's got more going on than I expected when I started writing this post.

## The field guide: my own posts plus the good stuff I wrote elsewhere

`/writing/` used to be scoped much more narrowly. The working plan before this project had it locked to Postgres-focused, authority-building content, an idea inherited from a content strategy document written for a completely different audience than the one reading my personal blog. The pushback that killed that scoping was simple: I contain multitudes, and a personal site that can only hold one topic isn't really personal anymore.

What's actually interesting about `/writing/` now, though, is that it isn't only my own posts. It's a merge of two genuinely different things:

- Native entries in `src/content/writing/`, defined by the schema in [`content.config.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/src/content.config.ts): `title`, `description`, `pubDate`, `topics`, `draft`, an optional `part` for a curated four-part Postgres arc, and an optional `canonicalUrl` for when the real original lives somewhere else entirely.
- A hand-maintained list of external links to posts I've written for my employer, Tiger Data, defined in [`field-guide.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/src/data/field-guide.ts):

```ts
export interface FieldGuideLink {
  title: string;
  description: string;
  part: "mechanics" | "limits" | "traps" | "decision";
  url: string;
}
```

There are 14 of those right now, all pointing at tigerdata.com, each slotted into one of the same four `part` buckets native posts can opt into. [`writing.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/src/lib/writing.ts) normalizes both shapes into one common `GuideItem` (`title`, `description`, `href`, `external`) so the template can render them identically, native entries first within each part, external links after, no interleaving by date. The one visual tell is a small "tigerdata.com ↗" badge next to external titles. No new tab, just an honest label about where you're about to land.

## The newsletter: Buttondown does the sending, Astro just serves the pages

`/newsletter/` works the same way as most of this site: fetch at build time, serve static files forever. [`buttondown.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/src/lib/buttondown.ts) is an Astro content-layer loader that calls one endpoint, `GET /emails?ordering=-publish_date` against Buttondown's API, follows pagination until it runs out of pages, and hands the result to Astro as the `newsletter` collection. Every issue page, the archive index, and the RSS feed are then just static output from a normal `getCollection()` call, same as any local markdown file.

Two details worth calling out for anyone tempted to do the same thing:

- If `BUTTONDOWN_API_KEY` isn't set, the loader logs a warning and returns an empty collection instead of failing the build. That's not an accident: it means anyone can clone this repo and build it locally without needing my API key.
- Buttondown stores each issue's body as Markdown, so the loader runs it through `marked.parse()` before it ever reaches a template. The site never touches raw HTML from the API.

```ts
const key = import.meta.env.BUTTONDOWN_API_KEY ?? process.env.BUTTONDOWN_API_KEY;
if (!key) {
  logger.warn("BUTTONDOWN_API_KEY not set: newsletter archive will build empty.");
  return;
}
```

## speaking.mattstratton.com: getting my slides back from a CDN I don't own

The old speaking site lived on Notist, and Notist had two problems that eventually became one problem: video embeds had already started quietly breaking, and every slide deck was served off Notist's CDN. The day that account lapses, the images and PDFs go with it. A core part of a speaker's professional identity, every talk I've ever given, was living in someone else's database with a thin export option.

So the new site's whole design goal is asset ownership and durability. Plain content in my own repo, on my own domain, that keeps working with no third-party dependency that can be shut off or go quietly stale. Not a redesign. A portability project.

The interesting piece is the slide pipeline, because it runs entirely **locally, before a commit ever happens**, and never on the deploy host:

```
originals/{id}.pdf --optimize(gs, 300dpi)--> public/slides/{id}.pdf --rasterize--> public/slides/{id}/{n}.webp
   (gitignored, full-res)          (committed, served, downloadable)     (committed, served, viewer images)
```

The reason it has to run locally: static hosts don't give you root, and you need root (or at least a real package manager) to run `pdftoppm` and `gs`. Trying to shell out to Ghostscript from inside a Netlify build is a fight you will lose. Doing the rasterization on my own machine and committing the output keeps the actual deploy build a boring, fast, host-agnostic `astro build`.

Video embeds got the same "own it, don't proxy it" treatment. Instead of reproducing Notist's approach (a proxy that, again, had already started breaking), each talk stores a plain provider and video ID in frontmatter, and the page renders a lightweight embed facade that only loads the real player on click.

The current numbers: 106 talks from 2012 to 2026, 93 events, 36 videos, 3,684 slide images. All of it committed, none of it one CDN outage away from disappearing.

## Making the talks searchable

Video is the one asset class the speaking site doesn't fully own. It can host the reference, but not the file itself. What it can own is the transcript, and that turned into a genuinely useful feature: full-text search across every talk I've ever given.

Raw transcripts come from YouTube's auto-generated captions, pulled by [`scripts/transcripts.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/mattstratton-speaking/scripts/transcripts.ts) via `yt-dlp`, cleaned up, and written to `public/transcripts/{id}.txt`. Auto-generated captions are rough: no punctuation, mangled proper nouns, every "um" and "uh" transcribed faithfully. A [`transcript-cleanup`](https://github.com/mattstratton/mattstratton-web/blob/master/mattstratton-speaking/.claude/skills/transcript-cleanup/SKILL.md) Claude Code skill handles the cleanup pass, with a strict ruleset: fix punctuation, capitalization, and proper nouns, remove disfluencies, but never reword, paraphrase, or reorder anything actually said. When in doubt, the instruction is to leave the text alone rather than guess.

Search itself runs client-side against two separate JSON payloads, built at deploy time:

- [`search-index.json.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/mattstratton-speaking/src/pages/search-index.json.ts) is small: title, abstract, event, tags, year, per talk. Loaded on first open of the search box.
- [`deep-index.json.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/mattstratton-speaking/src/pages/deep-index.json.ts) is the heavy one, concatenating each talk's transcript and slide text into a single searchable blob, fetched lazily only once you actually type a query:

```ts
const parts = [readTranscript(talk.id), readSlideText(talk.id)].filter(Boolean);
if (!parts.length) continue;
records.push({ url: talkUrl(talk), text: parts.join(" ").replace(/\s+/g, " ") });
```

[`Search.astro`](https://github.com/mattstratton/mattstratton-web/blob/master/mattstratton-speaking/src/components/Search.astro) builds a Fuse.js fuzzy index over each payload and merges the results, so searching for a phrase I actually said mid-talk, not just a word in the title, finds the right talk. No server, no database, just two static JSON files and a fuzzy-matching library doing all the work in the browser.

## Three repos become one

The three-repos-in-one-monorepo move wasn't really about tidiness. Managing three repos independently was mild friction, sure, but the actual trigger was realizing that between a frozen archive and a newly-scoped `/writing/` section, there was no home left on my own site for general writing. Once that was the real problem, "merge some repos" turned into "fix the architecture, and while we're in there, get dev.to crossposting actually working."

The mechanism for the merge itself was `git subtree add`, not a squash and not a filter-repo rewrite. That preserves full commit history from both source repos as real, verifiable ancestry, not just "the files are here now, trust me." Both source repos were young (about 50 and 22 commits respectively), so this wasn't decades of archaeology to protect. It was doing it right on principle, which is its own kind of satisfying.

A few things bit us on the way that are worth flagging if you're ever tempted to merge repos that each bring their own CI:

- **GitHub Actions workflows are only discovered at the true repo root's `.github/workflows/`, never in a subdirectory.** The dev.to workflows got left nested under the subproject's own `.github/workflows/` after the initial merge, which made them completely invisible to GitHub. No error. No warning. `gh workflow list` just didn't show them, and they silently never ran again.
- **Netlify doesn't scope rebuilds by subdirectory on its own.** Every push rebuilds every connected site unless you add an explicit `ignore` check in each site's own `netlify.toml`. And when Netlify skips a build for having no relevant changes, it shows that as "Canceled build due to no content change," which reads exactly like a failure in your inbox even though nothing is actually wrong.
- **"Base directory" and "Package directory" are different Netlify settings**, and the re-link flow for a repo with no npm workspace only shows you Base directory. Package directory just never appears. Worth reading the actual docs instead of assuming, which is a sentence I apparently still need to relearn every few years.
- **`astro check` doesn't respect subproject boundaries.** Run from the monorepo root, it scanned an unrelated subproject's content collections using the other subproject's generated types and produced over 200 false type errors. One explicit `exclude` in `tsconfig.json` took that down to 3, all pre-existing and unrelated.

If two or more of those apply to whatever you're about to merge, budget yourself an extra afternoon.

## dev.to: ownership, not direction

The dev.to sync tool is built around one idea I'd genuinely recommend to anyone syncing content between a platform and git: **ownership, not direction.** The full mental model lives in [the repo's `CLAUDE.md`](https://github.com/mattstratton/mattstratton-web/blob/master/mattstratton-dev-to/CLAUDE.md), but the short version:

It's tempting to think of this as bidirectional sync, keep dev.to and git in lockstep, push changes both ways. Don't do that. It produces an endless phantom-diff loop where each side keeps thinking it's the one with the real version. Instead, a post is dev.to-owned while it's being drafted, and git ignores it entirely. Once a human merges an import PR, it's git-owned forever, marked by the presence of an `id` field in its frontmatter. Ownership transfers exactly once, at a deliberate moment, and it never automatically flips back.

Two small workflows do the actual work. [`devto-import.yml`](https://github.com/mattstratton/mattstratton-web/blob/master/.github/workflows/devto-import.yml) runs on a cron, pulls any newly-published dev.to posts, and opens a PR for review, never touching a file that already has an `id`. [`devto-publish.yml`](https://github.com/mattstratton/mattstratton-web/blob/master/.github/workflows/devto-publish.yml) runs on push to files under `posts/`, and pushes local edits back to dev.to, writing the `id` back on a post's very first publish. Their domains never overlap, which is the entire point.

## The crosspost pipeline (and yes, this post is going through it)

Once a post is git-owned, I can opt it into crossposting by adding `crosspost: true` to its frontmatter, which republishes it as a native entry in mattstratton.com's `/writing/` collection and rewrites the dev.to post's `canonical_url` to point back at mattstratton.com, via [`crosspost-devto.ts`](https://github.com/mattstratton/mattstratton-web/blob/master/scripts/crosspost-devto.ts). That flag only gets added after a post already has an `id`, meaning it's already live on dev.to. It's a deliberate, later opt-in, never part of the initial draft template. This post is a good example of the "before":

```yaml
---
title: "I Contain Multitudes (and Also Three Git Repos)"
published: false
description: "..."
tags: [astro, webdev, showdev]
---
```

No `id`, no `crosspost`, no `canonical_url`. Once this is published and I decide it belongs on mattstratton.com too, it'll pick up all three, the same way `decouple-release-from-deploy.md` already has:

```yaml
id: 4061454
date: "2026-07-03T15:43:16Z"
crosspost: true
canonical_url: "https://www.mattstratton.com/writing/decouple-release-from-deploy/"
```

The design detail I actually like: this collapses into one atomic commit, not a two-phase publish-then-circle-back dance. mattstratton.com's URL for a crossposted piece is fully deterministic from the filename before any build even happens. dev.to's own article ID is server-assigned and unknowable in advance. So one commit creates the new `/writing/` entry and rewrites the dev.to source's `canonical_url` in the same diff, and one push correctly triggers both the Netlify deploy and dev.to's existing publish workflow, without anyone babysitting a second step.

One trap worth naming because it's the kind of thing that looks obviously fine until it isn't: the `writing` schema has had an optional `canonicalUrl` field since the very first Astro migration commit, for a case that had never actually come up: a native `/writing/` entry that's really a copy of something whose true original lives elsewhere, like a mirrored Tiger Data post. Before the crosspost script existed, the only place that field showed up at all was a commented-out line in the placeholder template file, `# canonicalUrl: ... # set when cross-posted`. Nobody had ever actually set it on a real post. For a dev.to crosspost, though, mattstratton.com is *becoming* the canonical source, the opposite of what that field was reserved for, so the crosspost script has to know to leave it unset on the entries it generates instead of reaching for an already-named field out of habit.

## A few weird-ass bugs, for flavor

This post is meant to be "here's how it's set up," not "here's a bug report," but a couple of the failures along the way are too good not to mention briefly.

The best one: the publish workflow started failing with a 422 on any post whose `canonical_url` changed after the first publish, with the error body `{"error":"Tried to load unspecified class: Time","status":422}`. Root cause was a full YAML round-trip silently dropping quotes from a timestamp that doesn't strictly need them under the JS YAML library's own rules:

```yaml
# before the fix (breaks dev.to's Ruby backend)
date: 2026-07-03T15:43:16Z
# after (quoted, parses fine on both sides)
date: "2026-07-03T15:43:16Z"
```

Perfectly legal YAML either way, by the JS library's rules. But dev.to's backend is Ruby, and Ruby's YAML parser auto-detects that now-unquoted, ISO-8601-shaped scalar as a native `Time` object, which its safe loader then refuses to instantiate. Two implementations of "the same" file format, quietly disagreeing about what a bare string is allowed to become. Fixed by doing a targeted single-line replace on just the `canonical_url` line instead of re-serializing the whole file.

A few smaller ones, quickly:

- Two files edited in a different tool picked up Windows line endings, and `crosspost: true\r` parses as the string `"true\r"`, not the boolean `true`. Those two posts just silently never showed up as eligible.
- A 7-part series had dev.to's actual Series feature turned on for exactly 2 of the 7 posts, predating any of this tooling.
- Rewriting internal links across that same series hit a substring-replace bug where a typo'd slug happened to be a literal prefix of a different, correct slug. Fixed by sorting replacements longest-slug-first.

## The fun stuff: memory and gains

Two smaller pieces worth a callout because they're genuinely neat and don't fit anywhere else in this tour.

The speaking site's Claude Code skills (adding a new talk, cleaning up a transcript, resyncing talk memory) don't need [memory.build](https://memory.build) to work. They ran fine without it. But they now also include it, a permanent memory layer for AI agents, so that when I'm working with an agent on content, it can pull up what it already knows about a talk or a previous session instead of me re-explaining context every single time. Nice to have, not load-bearing.

And `/fitness` pulls my workout history straight from [Liftosaur](https://www.liftosaur.com)'s API at build time. The reason it exists at all: Liftosaur's own public profile page just didn't show as much as I wanted, no real trend view, nothing I could link people to that told the whole story. Liftosaur doesn't hand back tidy JSON for a workout either; it returns a compact Liftoscript-text blob, so a small parser extracts the date, program, exercises, and sets from that text. Personal records and trend sparklines get computed from that parsed data at render time, not fetched as a separate call.

## What's still on my plate

The crosspost trigger right now is a manual CLI command I have to remember to run. The fix I actually want: since the dev.to workflow is already entirely PR-centric (import arrives as a PR, `id` gets written back as an auto-commit on that same push, never a second spawned PR), the crosspost step should follow the exact same shape. A GitHub Action on `pull_request` that detects `crosspost: true`, generates the `/writing/` entry, and pushes it as an additional commit onto the same PR, instead of a manual script run or a redundant second PR. I filed [an issue for it](https://github.com/mattstratton/mattstratton-web/issues/53) while writing this post, because I'd apparently been assuming for a while that one already existed and it hadn't.

A couple of others I'm actually looking forward to: [a map of everywhere I've spoken](https://github.com/mattstratton/mattstratton-web/issues/51) on the speaking site (the event data already has lat/lng, so this should be a fun afternoon, not a project), and [real hero and thumbnail image design](https://github.com/mattstratton/mattstratton-web/issues/41) for `/writing/` and the legacy archive, since the crosspost script currently papers over that gap by embedding the cover image inline in the post body instead of rendering it properly. There's also the usual pile of housekeeping (a `master` to `main` rename, a Node 24 upgrade) that's real but not exactly a fun read.

None of it was urgent enough to hold up shipping the parts that already work. That's usually how the good list gets built anyway.
