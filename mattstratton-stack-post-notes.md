# Notes for the "mattstratton.com stack" blog post

**Status:** Raw material, not a draft. Captured 2026-07-03 right after doing this work, so the details are fresh — write the actual post from this later. Delete this file (or fold the useful bits into the post itself) once it's written.

---

## The narrative arc (why this happened, not just what)

Three repos ran the "mattstratton.com stack" independently: `mattstratton-web` (personal site), `mattstratton-speaking` (speaking.mattstratton.com), `mattstratton-dev-to` (dev.to sync). Managing them separately was friction, but the *real* trigger was realizing that between a frozen 2001–2020 blog archive and a newly-scoped, Postgres-only `/writing/` section, there was **no home on my own site for general writing anymore** — "I contain multitudes" was the actual pushback that reframed the whole project. A prior planning doc had been heavily influenced by a TigerData content strategy and treated `/writing/` as exclusively Postgres-authority-building content; explicitly rejecting that as gospel is what turned this from "let's tidy up some repos" into "let's actually fix the architecture and revive dev.to cross-posting."

Good opening-paragraph material: the plan file for this whole project is ~130 lines and went through multiple real corrections *during* execution, not just in the design phase — worth being honest in the post that "the plan survived contact with reality, but not unchanged."

---

## Part 1: the three systems, before the merge

### mattstratton-web
- Astro 5 + Tailwind v4, migrated from Hugo (hugo-profile theme) in 2026.
- **Prime directive: URL preservation.** `trailingSlash: 'always'` + `build.format: 'directory'` reproduce Hugo's old URLs byte-for-byte across 2,630 legacy posts (2001–2020).
- Content collections: `posts` (the legacy archive, frozen), `writing` (evergreen field guide, was Postgres-only, now general), `newsletter` (Buttondown, fetched at build time), `workouts` (Liftosaur, fetched at build time).
- OG cards generated at build via satori + sharp.

### mattstratton-speaking
- Also Astro 5 + Tailwind v4, but **deliberately different config**: `trailingSlash: 'never'` + `build.format: 'file'`, to mirror Notist's old URL scheme exactly (`/{notistId}/{notistSlug}`) after migrating off that third-party platform.
- North star: **asset ownership and durability** — "every slide, thumbnail, and video reference lives in this repo... should keep working for 15 years."
- The interesting architectural piece: the slide-image pipeline runs **locally, pre-commit**, never on the deploy host — `originals/*.pdf` (gitignored, full-res) → `optimize` (poppler/ghostscript, 300dpi) → `public/slides/*.pdf` (committed) → `rasterize` → `public/slides/{id}/{n}.webp` (committed, served). Why: static hosts can't run `pdftoppm`/`gs` without root, so doing it locally keeps the actual Netlify build a pure, fast, host-agnostic `astro build`.
- Numbers: 106 talks (2012–2026), 93 events, 36 videos, 3,684 slide images.
- Has its own Claude Code skills (`add-talk`, `transcript-cleanup`, `resync-talk-memory`) that turned out to be automatically discoverable from the monorepo root after the merge — no `cd` needed, pleasantly.

### mattstratton-dev-to
- Not a website — a small Node/TS project syncing dev.to content with git.
- The core idea worth explaining in the post on its own: **"ownership, not direction."** Don't think of it as bidirectional sync (the docs explicitly call out that pattern as producing "an endless phantom-diff loop"). Instead: a post is dev.to-owned (git ignores it) until a human merges an import PR, at which point it's git-owned forever, marked by the presence of an `id` field in frontmatter. Ownership transfers exactly once, never flips back automatically.
- Two workflows: `import.yml` (cron, pulls new dev.to posts into a PR for review) and `publish.yml` (on push touching `posts/**/*.md`, pushes local changes back to dev.to, including writing the `id` back on first publish).

---

## Part 2: the monorepo merge

**Mechanism:** `git subtree add` (not squash, not filter-repo) — preserves full commit history from both source repos as real, verifiable ancestry. Confirmed by checking that each repo's actual root commit is a real ancestor of the merged branch, not just "the files are there."

**The gotchas that actually bit us** (good post material — these are the "here's what nobody tells you about monorepo-ing three Astro/Node projects" bits):

1. **GitHub Actions workflows are only discovered at the true repo root's `.github/workflows/` — never in a subdirectory.** The dev-to workflows were initially left nested under `mattstratton-dev-to/.github/workflows/` after the merge, which made them completely invisible to GitHub (`gh workflow list` just... didn't show them, no error, no warning). Fixed by moving them to the root and renaming to avoid colliding with an existing workflow. This is a real, silent regression — not a warning, not an error, just nothing happening. Worth its own paragraph as a "if you're merging repos with their own CI, check this first" warning.

2. **Netlify doesn't auto-scope rebuilds by subdirectory.** By default, any push rebuilds *every* connected site regardless of what changed. Scoping requires an explicit `ignore` build command in each site's own `netlify.toml` (a `git diff --quiet` check against the relevant subdirectory). Also: Netlify's dashboard shows a skipped/ignored build as an "error" — `Canceled build due to no content change` — which can trigger misleading "deploy failed" emails. Not a bug, just a confusing UX choice worth flagging.

3. **"Base directory" and "Package directory" are different Netlify settings**, and the re-link UI for a non-workspace repo (no npm/turbo/nx workspaces) only exposes Base directory — Package directory never showed up. Worth checking the actual docs rather than assuming, since this tripped up the initial plan.

4. **`astro check` doesn't respect subproject boundaries by default.** Post-merge, running it from the monorepo root produced 200+ false type errors, because it was scanning `mattstratton-speaking/`'s own unrelated content collections using `mattstratton-web`'s generated types. Fixed with an explicit `exclude` in `tsconfig.json`. Went from 200+ errors to 3 (which turned out to be pre-existing and unrelated).

5. **Branch-naming asymmetry**: `mattstratton-web` used `master` (never renamed from the old default), the other two used `main`. Reconciled on `master` for the merged repo rather than doing a rename mid-project — deferred as its own follow-up (there's a GitHub issue for it).

**Numbers**: `.git` grew to ~472MB post-merge (legitimate committed conference assets in speaking's history, not bloat). Both source repos were young — ~50 and ~22 commits respectively — so "preserving history" wasn't about decades of archaeology, just doing it right on principle.

---

## Part 3: the dev.to crosspost pipeline (the actual feature)

**The idea**: opt-in (`crosspost: true` frontmatter flag) republishing of selected dev.to posts into mattstratton.com's `/writing/` collection, with dev.to's `canonical_url` updated to point *back* at mattstratton.com — making mattstratton.com the SEO-canonical source instead of dev.to.

**The design insight worth explaining**: this collapses into a **single atomic commit**, not a two-phase "publish then circle back" dance, because the mattstratton.com URL is fully deterministic from the chosen filename *before* any build happens (unlike dev.to's own numeric article IDs, which are server-assigned and unknowable in advance). One commit creates the new `/writing/` entry *and* edits the dev.to source's `canonical_url` in the same diff; one push then correctly and independently triggers both the Netlify deploy and dev.to's existing publish workflow.

**A genuinely easy-to-get-backwards correctness trap**: the `writing` collection already had a `canonicalUrl` field, but it means *"the true original lives elsewhere"* (used for the opposite direction — mattstratton content whose real canonical is tigerdata.com). For a dev.to→mattstratton crosspost, mattstratton.com is *becoming* canonical, so that field must stay unset on the new entry. Good illustration of how an existing, reasonable-looking field can quietly mean the wrong thing for a new use case.

### The bug hunt (best war story of the whole project)

`devto-publish` started failing with HTTP 422 on every post whose `canonical_url` was being *changed* (not set for the first time). Reproduced the exact failing API call directly (added a `DEVTO_API_KEY` to local `.env` just for this) and got the real error body instead of guessing: `{"error":"Tried to load unspecified class: Time","status":422}`.

Root cause: the script rewrote each source file's frontmatter via a full `YAML.stringify()` round-trip, which silently drops quotes from scalars that don't strictly need them under the JS `yaml` library's own YAML 1.2 core schema — `date: '2020-01-30T21:33:31Z'` became `date: 2020-01-30T21:33:31Z`. Totally fine by that library's own rules. But dev.to's backend is Ruby (Forem), and Ruby's YAML parser (Psych) auto-detects that now-unquoted ISO-8601-looking scalar as a native `Time` object — and its *safe* loader refuses to instantiate that type. A genuine cross-language YAML dialect mismatch, not a logic bug in the usual sense.

Fix: stopped re-serializing the whole frontmatter block. Now does a targeted single-line find/replace on the raw text, touching only the `canonical_url` line and leaving every other field's original formatting completely alone.

This is a great "YAML is not one language, it's a family of subtly incompatible dialects" post section on its own.

### Other things that came up mid-batch (good "things nobody warns you about" material)

- **CRLF line endings silently breaking boolean parsing**: two files edited in a different tool ended up with Windows line endings throughout. YAML parsed `crosspost: true\r` as the *string* `"true\r"`, not the boolean `true` — so `=== true` silently failed and those two posts just... didn't show up in the eligible list. No error, no warning. Found by manually re-deriving the parse logic and checking `typeof`.
- **A dev.to "Series" grouping that was only ever half-applied**: while crossposting, discovered a 7-part blog series where only 2 of 7 posts had dev.to's official Series feature actually turned on — the other 5 only had *prose* ("Part 3 of my 7-part series...") without the underlying platform feature. Confirmed via git archaeology that this predated all of this tooling (the original 2026-06-24 import commit already lacked it) — not something the sync scripts broke. Fixed by adding the `series:` field to the missing 5 and letting the publish workflow push it live.
- **Internal cross-links needed a cleanup pass**: once a batch of interlinked posts (the same 7-part series) all got crossposted, their "Start with Part 1" / "Next in this series" links still pointed at dev.to. Had to scan for and rewrite those to `/writing/...` for posts that were *also* crossposted, while leaving links to non-crossposted posts alone. Found a real bug in my own first pass at this — a typo'd dev.to slug in one link happened to be a literal string-prefix of another correct slug, so a naive substring replace left a dangling stray character. Fixed by sorting replacements longest-slug-first.
- **A duplicate frontmatter block baked into a post's body** — one dev.to article's stored content had a second, non-functional `---...---`-delimited block sitting inside the body text itself (likely a copy-paste artifact from however it was originally drafted). Not something our tooling caused, but would've carried straight into the crosspost as ugly literal text if not caught.
- **Medium canonical posts**: two old posts had `canonical_url` pointing at Medium (predating dev.to). The crosspost script refuses to touch a non-dev.to canonical unless explicitly overridden, since deciding true ownership there is a human call, not a mechanical default. Once overridden, Medium drops out of the canonical chain entirely — mattstratton.com becomes canonical on both the new entry and the dev.to post's updated `canonical_url`.
- **Filenames with literal `*` characters** (Medium's `1*abc123.png` naming convention, carried through on rehosted images) — turned out to just work fine, in both dev server and the actual static `dist/` output. A fun "huh, that's more robust than I expected" detail.

### What's NOT built yet (worth mentioning as "next steps" or a follow-up post)

The crosspost script is currently a manual CLI tool (`npm run crosspost -- <post> --override-canonical`). The better design, worked out through discussion but not yet built: since this repo's dev-to workflow is already entirely PR-centric (import arrives as a PR, `id` write-back is an auto-commit on the same push, never a second spawned PR), the crosspost trigger should follow the same pattern — a GitHub Action on `pull_request` that detects `crosspost: true` and pushes the generated `/writing/` entry as an *additional commit onto the same PR*, rather than requiring a manual script run or spawning a redundant second PR. Not yet built.

---

## Numbers/stats worth having on hand

- 3 repos → 1 monorepo, full git history preserved for all three.
- 2,630+ legacy Hugo-era posts preserved byte-for-byte.
- 106 talks / 93 events / 36 videos / 3,684 slide images on the speaking site.
- 30 dev.to posts total; 17 crossposted to `/writing/` as of this writing.
- 8+ PRs touching this project end to end (worth pulling the actual list/links when writing, they tell a good "here's the real messy process" story): the `/writing/` generalization, the monorepo merge, the workflow-location fix, the crosspost script + first real crosspost, the DevRel series recovery, the 16-post batch crosspost, the YAML-quoting bug fix, the internal link cleanup.
- 6 follow-up issues filed for deliberately deferred work (shared design-system package, `master`→`main` rename, Node 20→24 upgrade, a "draft new dev.to post" Claude skill, better hero/thumbnail image design, external field-guide topic tags).

## Possible angles for the actual post

- Straight chronological "how we merged three repos and what broke" — very concrete, very "here's the receipts."
- Lead with the YAML dialect bug as a hook ("the bug that taught me YAML isn't one language"), then zoom out to the bigger project.
- Focus on the "ownership, not direction" model as the throughline — a genuinely reusable idea for anyone syncing content between a platform and git, independent of the rest of the monorepo story.
- The "I contain multitudes" reframing as the actual opening — this is a personal-brand/content-strategy story as much as a technical one, and that tension (a TigerData-influenced plan vs. wanting room for general writing) might be the most interesting part to a non-technical-adjacent reader.
