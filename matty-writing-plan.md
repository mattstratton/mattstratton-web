# Matty Stratton — Personal Brand & Writing Plan
**Status:** Draft for discussion | **Date:** May 2026

---

## What this is

A plan to give Matty's existing and future postgres writing a front door, a brand, and a distribution mechanism — while keeping TigerData as the beneficiary without it feeling like a TigerData marketing property.

The posts already exist. The thinking is already done. This is about packaging and compounding what's there, and establishing where new writing lives going forward.

---

## The core idea

Matty has published 14 postgres posts in roughly 3 months. They're good, they're honest about tradeoffs, and the top performer is pulling 1,000+ active users with no signs of stopping. The problem isn't the content. The problem is there's no front door, no throughline, and no way to follow Matty as a person rather than stumbling onto a TigerData blog post.

The fix is three things working together:

1. **A named, evergreen reference collection** — not a numbered series with a finish line, but a living index organized by topic. Engineers come back to it when they hit a specific symptom. New posts slot in as they're written.
2. **A refreshed mattstratton.com** — current, postgres-forward, with a dedicated section for technical writing. The front door to the collection and to Matty as an author.
3. **A newsletter** — Matty-branded, not TigerData. Low-commitment cadence anchored to existing monday workflow. The mechanism for people to follow the work over time.

These three things are distinct but reinforce each other. The collection is the asset. The site is the home. The newsletter is the distribution.

---

## Content ownership and where things live

### The existing 14 posts
These live on tigerdata.com and stay there. They're TigerData's content, not worth moving, and duplicate content would hurt SEO on both ends anyway. They're the back catalog.

### New postgres writing going forward
Matty will continue writing for tigerdata.com, but at a reduced cadence — roughly 2 posts a month rather than the current pace. The rest goes on mattstratton.com. This is aligned with the broader TigerData content strategy around external distribution. Matty writes on his own site, TigerData benefits from his authority, everyone wins.

### The split in practice
- **tigerdata.com** — anchor pieces, integration guides, company-positioned content
- **mattstratton.com** — postgres internals, tradeoffs, the stuff written in Matty's voice
- **dev.to** — ROS 2 / physical AI learning in public (separate audience, separate posture)
- **Newsletter** — distribution layer for mattstratton.com content

---

## The collection

### What it is

An evergreen reference on postgres internals and tradeoffs. Not a course, not a numbered blog series — a field guide. Engineers use it two ways: read start-to-finish as an onboarding path, or jump directly to the thing that matches the symptom they're currently experiencing.

The 14 existing posts on tigerdata.com are the founding content of this collection. New posts published on mattstratton.com extend it over time. The collection index lives at mattstratton.com and links to both.

### Why it works

- **Gap in the market:** Ben Dicken covers all databases, broadly. Postgres FM is a full podcast. Neither is short, written, and postgres-specific. This is.
- **Format fit:** Engineers bookmark written references. They don't bookmark "that company's blog."
- **Trust transfer direction:** Personal authority → company credibility. Not the other way around. Matty being known as the postgres person benefits TigerData more than another TigerData blog page would.
- **Evergreen:** New posts slot in naturally. No "episode 15" awkwardness. The collection gets more useful over time without needing to be rebuilt.

### Structure

The 14 existing posts already map to a clean 4-part arc:

**Part 1 — What's happening inside Postgres**
Understanding the mechanics before diagnosing symptoms.
- MVCC: The Feature You're Paying For But Not Using
- Write Amplification in Postgres: The 3-4x Tax on Every Insert
- When Continuous Ingestion Breaks Traditional Postgres

**Part 2 — Why you're hitting the wall**
The anchor post lives here. This is the "aha" section.
- Understanding Postgres Performance Limits for Analytics on Live Data *(anchor — 1,000+ active users)*
- Six Signs That Postgres Tuning Won't Fix Your Performance Problems
- Postgres Performance: Why Peak Throughput Benchmarks Miss the Real Problem
- Vertical Scaling: Buying Time You Can't Afford

**Part 3 — The traps**
Things you'll try that won't fix it.
- Why Adding More Indexes Eventually Makes Things Worse
- The Hidden Costs of Table Partitioning at Scale
- Read Replicas Don't Solve Write Bottlenecks

**Part 4 — The decision**
Architectural honesty about what to do next.
- Optimization vs. Architecture: Knowing the Difference
- The Best Time to Migrate Was at 10M Rows. The Second Best Time Is Now.
- Document Databases: Be Honest
- ClickHouse Is Fast. Your Pipeline Isn't.

Physical AI / IIoT posts (in progress) will slot into Part 4 as an applied extension of the same architecture-vs-optimization argument.

---

## The site (mattstratton.com)

### Current state

Hugo site on Netlify. hugo-profile theme. Last updated during the TigerData job search. Currently positions Matty as "Developer Relations leader and community builder" with publications from 2019–2021. Accurate for 2022. Not accurate for 2026.

The blog (`/post/`) has 2,000+ posts going back to 2001. It's a 25-year archive of personal writing. It is staying exactly as it is — not getting cleaned up, tagged, or reorganized as part of this plan.

### The blog situation

mattstratton.com has a massive existing blog at `/post/` spanning 2001 to around 2019. It's personal content and it's not the right home for postgres technical writing — not because it's embarrassing but because it's a completely different thing. Mixing them would be confusing for readers and make the technical content harder to find.

The solution is a **new Hugo content section** — `/content/writing/` — that is completely separate from `/post/`. Postgres posts go there. The old blog stays untouched. The nav points to the new section. `/post/` quietly exists for anyone who wants to archaeologically dig through 25 years of Matty's internet presence, which is honestly kind of a feature.

### What needs to change (in priority order)

**1. New content section** — create `/content/writing/` as a separate Hugo section with its own list template. This is where new postgres posts live. Clean separation from the personal blog.

**2. Hero + about copy** — one paragraph, current, postgres-forward. Matty leads developer relations at TigerData, writes about postgres internals and performance tradeoffs, and has 20+ years of sysadmin/SRE/infra background that gives that writing its credibility. Also building in public on physical AI and robotics. Not a marketing paragraph — an honest description.

**3. Skills** — add postgres, time-series, physical AI/robotics (learning in public). Keep the sysadmin/SRE/infra/Kubernetes background. That history is not legacy baggage — it's the reason the postgres writing is credible. Someone who's operated infrastructure at scale has standing to write about database performance tradeoffs that a pure developer doesn't.

**4. Publications section** — replace 2019–2021 posts with a curated selection from the postgres collection. Links out to tigerdata.com for existing posts, mattstratton.com/writing for new ones.

**5. Newsletter signup** — embed on the homepage and the writing section index. Single field, low friction.

### The bigger rebrand

The hugo-profile theme and overall site design are overdue for a refresh. This is out of scope for this plan — it's a separate project. The copy and content section work above can happen independently of a theme change and shouldn't wait for it.

---

## The newsletter

### Why now

- Matty is already doing research work on mondays (content-scout — details TBD)
- The collection needs a distribution mechanism so engineers can follow the work without checking the site
- It's Matty-branded, which cleanly separates it from TigerData content — a distinction that matters for authenticity
- Low-commitment cadence means it doesn't become a second job

### Format

**Low-commitment model** — send when something notable happens, not on a fixed schedule that creates pressure. In practice this probably means roughly monthly, anchored to publishing cadence.

Each issue: what Matty published, 2–3 sentences of context that didn't make it into the post, one or two things from the monday content-scout research that are worth knowing about. Maybe 300–400 words total. Not a production. A dispatch.

### Tool

**Buttondown** — clean, cheap, built for technical writers, embeds easily into Hugo. Keeps subscribers on mattstratton.com rather than sending them to a substack page. Doesn't have the "creator economy" energy that slightly undermines technical authority.

Alternative: Substack, if the discoverability matters more than brand coherence. Worth a separate decision once the format is locked.

### What it is NOT

Original writing that exists nowhere else. That's a different commitment and a different job. This is a distribution layer for work that's already happening, plus the monday research context as a bonus for subscribers.

---

## Dev.to

Separate from all of the above. The ROS 2 / robotics learning-in-public content belongs here. Different format, different audience posture (community participant vs. authority), different purpose. Already planned in the physical AI content doc.

- **Dev.to** → community discovery, learning in public, robotics engineers
- **mattstratton.com/writing** → authority, postgres reference, personal front door
- **Newsletter** → distribution for people who want to follow the work

---

## Technical implementation brief (for Claude Code)

This section is specifically for the Claude Code session that will do the Hugo work. Read the rest of the doc for context on why these decisions were made.

### Repo and setup
- Repo: https://github.com/mattstratton/mattstratton-web
- Hugo site on Netlify, theme is `hugo-profile`
- Check the theme structure before touching templates — the theme has opinions about where layouts live
- Netlify deploys on push to main, so changes are live quickly

### Task 1 — New content section
Create `/content/writing/` as a new Hugo content section, completely separate from the existing `/post/` blog. This is where new technical posts will live.
- Add a `_index.md` to `/content/writing/` with appropriate frontmatter
- Create a list template for the section. Check where `hugo-profile` expects section templates before creating anything — may be `/layouts/writing/list.html` or may need to follow the theme's pattern
- The `/post/` section stays completely untouched

### Task 2 — Nav update
Update `config.yml` to add `/writing/` to the main nav. The existing "Blog" nav item pointing to `/post/` can be removed or renamed — `/post/` doesn't need to be prominently featured anymore but doesn't need to be deleted either.

### Task 3 — Config.yml copy updates
The following sections in `config.yml` need copy updates. **Do not write this copy yourself — leave placeholders and flag for human input:**
- `hero.subtitle` and `hero.content` — needs new positioning copy
- `about.content` — needs updated bio
- `about.skills.items` — needs updated skills list (keep sysadmin/SRE/Kubernetes, add postgres/time-series/physical AI)
- `params.description` — currently says "Text about my cool site" which is a placeholder from setup and has never been updated

### Task 4 — Publications section
Update the `publications` items in `config.yml` to replace the current entries (from 2019–2021) with a selection of the postgres posts. Use these URLs and titles:
- Understanding Postgres Performance Limits for Analytics on Live Data — https://www.tigerdata.com/blog/postgres-optimization-treadmill
- Why Adding More Indexes Eventually Makes Things Worse — https://www.tigerdata.com/blog/why-adding-more-indexes-eventually-makes-things-worse
- The Hidden Costs of Table Partitioning at Scale — https://www.tigerdata.com/blog/hidden-costs-table-partitioning-scale
- Write Amplification in Postgres: The 3-4x Tax on Every Insert — https://www.tigerdata.com/blog/write-amplification-in-postgres-the-3-4x-tax-on-every-insert
- ClickHouse Is Fast. Your Pipeline Isn't. — https://www.tigerdata.com/blog/clickhouse-is-fast-your-pipeline-isnt

### Task 5 — Newsletter embed
Add a Buttondown newsletter signup embed to:
- The homepage (somewhere near the bottom, before the contact section)
- The `/writing/` section list page

Buttondown embed is a simple HTML form. Leave a placeholder comment in the template if the Buttondown account isn't set up yet — don't hardcode a fake form ID.

### What NOT to touch
- `/content/post/` and anything in it — do not modify, delete, or reorganize
- The overall site theme or design — this is a content and config update only, not a redesign
- Any existing pages (resume, speaking, speaker-info, privacy-policy)

---

## Open questions

1. **Content-scout integration** — what exactly is the monday content-scout workflow and how does it feed the newsletter? Need to map this before committing to a newsletter format.
2. **Site hero copy** — what's the one honest sentence that describes what Matty does and why someone should pay attention? Needs a first draft to react to.
3. **Newsletter name** — named thing or just "Matty Stratton's newsletter"? A name has more brand surface area but also more commitment pressure.
4. **Physical AI content** — the IIoT/robotics posts from the content plan eventually belong in the collection too. Part 5, or an extension of Part 4?
5. **Site update timing** — the postgres content plan runs through June 1. The site work doesn't need to wait for that, but shouldn't take priority over the content itself.
6. **Theme/rebrand timing** — when does the full mattstratton.com redesign happen? Separate project, needs its own plan.

---

## What is NOT in this plan

- Moving existing posts off tigerdata.com
- Cleaning up or reorganizing the existing `/post/` blog archive
- A full site redesign (separate project)
- Humanoid robots
