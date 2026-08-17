---
title: The Past Keeps Changing
description: Apple Health revises days after they have closed, and 69% of the values my pipeline has watched land changed after the day they describe was already over. Upsert made that invisible for months.
pubDate: 2026-08-17
topics: ['postgres', 'timescaledb', 'data-modeling', 'time-series']
heroImage: /writing/the-past-keeps-changing/the-past-keeps-changing-cover.png
draft: false
---

I moved my personal health tracker onto a time-series database this month. It holds 69,000 rows in thirty megabytes.

That is not a defensible reason to use one, and I want to be blunt about it before you get there on your own. Nothing I did made anything faster and nothing needed to.

What it replaced was smaller still. An 840 KB SQLite file on my laptop, seventeen metrics, about 280 health observations going back three months, plus two and a half years of lifting history. For what it was doing, that was the right call, and I'd make it again.

I moved because I'd been quietly losing data for months and the schema was built in a way that made it impossible for me to notice.

The whole repo is public at [mattstratton/mattstratton-fitness-tracker](https://github.com/mattstratton/mattstratton-fitness-tracker), schema and decision records included, minus my actual data for reasons I hope are obvious. Every query below runs against the live database, and every number in this post is one query away from you checking it.

## What it used to be

There was no server and no app. [Health Auto Export](https://www.healthyapps.dev/) wrote JSON files into two iCloud folders. A launchd agent on my MacBook polled those folders every hour, parsed whatever it found, and upserted the results into an 840 KB SQLite file next to it. When I wanted coaching I opened Claude Code on that same laptop and ran a skill that queried it.

That was the entire system. The Mac was the infrastructure, which sounds fine right up until the Mac is closed.

About 150 lines of that code existed for no reason other than surviving iCloud, and every one of them was written in response to something that had already broken. Files under `~/Library/Mobile Documents` can exist as metadata-only placeholders that a launchd agent cannot materialise. That one failed with `EDEADLK`, stranded four days of workouts, and looked exactly like file corruption. Two automations wrote the same data into two different folders, so the winner was whichever sorted last alphabetically, until I changed it to whichever had the later mtime. On files whose mtimes iCloud does not reliably update.

Hold onto that last one. It comes back, and it turns out to be the whole problem.

## Losing data twice without noticing

Each hourly run did the obvious thing:

```sql
INSERT ... ON CONFLICT DO UPDATE
```

New value for a day? Overwrite the old one. That is what upsert is for, and it cost me data twice.

The first one was ugly. An iOS update silently dropped Health Auto Export's HealthKit read permission for Weight & Body Mass and Lean Body Mass, while leaving Body Fat % and BMI alone. The exports kept running. They kept succeeding. They contained empty arrays for exactly two metrics, and the sync log wrote `status='ok'` every hour for five days straight.

Five days of weigh-ins gone, with the monitoring reporting green the entire time.

The second was quieter and I caught it by accident. A midday export made a 1,241 kcal day read as 333, because the export landed at lunchtime and the upsert dutifully replaced a complete day with a partial one.

Two bugs, and if you squint they're the same bug. Upsert answers "did this value change?" by destroying the evidence you would need to answer it. Nothing in that schema could distinguish "never reported" from "reported as empty" from "reported correctly, then clobbered by something worse."

The rule I got out of it: never ask whether the sync ran, ask whether the data is current. Those sound identical right up until a sync succeeds at doing nothing.

## The question that dissolved it

I spent an embarrassing amount of time on "should this table upsert or append?" and got nowhere, because it's the wrong question and wrong questions don't have answers.

The right one turned out to be: **is the thing I'm storing an observation about a day, or a report that arrived at a time?**

Those are different objects. What I burned on August 9th is a fact about August 9th. "My watch told me, on August 10th, that I'd burned 1,834 kcal on August 9th" is a fact about a conversation. The first is stable. The second happens over and over, from multiple sources, with different answers.

The old schema mashed both into one row, which is exactly why both data-loss bugs were invisible. You cannot detect that a report was wrong if you've thrown away the fact that a different report ever existed.

Separate them and the write model stops being a judgement call. Reports append, always. There is no `UPDATE` statement anywhere in this codebase that touches health data. Current truth is something you derive instead of something you maintain.

It's the difference between a whiteboard and a logbook.

Four words I'll use for the rest of this:

- **Observation**: what a metric was on a given day
- **Report**: a source telling you, at a specific time, what it thinks an Observation was
- **Observed Day**: the calendar day being described, in one fixed timezone
- **Restatement**: a later Report that disagrees with an earlier one about the same Observed Day

Those first two are why I have two row counts and both are correct. 73,210 Reports. 69,613 distinct Observations. The gap is every time something changed its mind, and under the old schema that gap was zero by construction.

Look at where the weight sits in that second definition. *At a specific time*. That timestamp is what orders Restatements, and ordering Restatements correctly is the entire job. Under the old pipeline it was the file's modification time. A file iCloud had placed there. With an mtime iCloud does not reliably update.

The field the whole model turns on was being inferred from filesystem metadata that lies, and I had already been bitten by that metadata badly enough to rewrite the tie-breaking logic once. It never occurred to me that the same unreliable field was also deciding which version of Tuesday I believed. It's now the HTTP receipt time on the POST, which isn't an approximation of when a source told me something. It's when a source told me something.

## Here is what changing its mind looks like

Basal energy for August 9th, every Report in the order it arrived:

```
value     reported_at (America/Chicago)
718.42    2026-08-09      <- the day, in progress
1746.06   2026-08-09
1817.51   2026-08-09
1842.11   2026-08-10      <- the day is over now
1834.03   2026-08-10         and the number goes DOWN
2319.02   2026-08-10
2319.02   2026-08-11      <- settles, two days later
```

The transition from 1842.11 to 1834.03 is the one that matters. A day still in progress can only accumulate, so a rising number proves nothing. A number going *down* on a day that already ended is Apple revising history after the fact.

Almost every time-series database ever built assumes that doesn't happen. Write once, read forever, the past is immutable, timestamps move in one direction only. It's such a load-bearing assumption that plenty of these systems list it as a feature.

My health data has not read the marketing copy.

## Where TimescaleDB stops being incidental

What replaced the laptop, before we get to the schema: Health Auto Export now posts straight to a [Vercel](https://vercel.com) function on a daily schedule, a scheduled job pulls lifting history from [Liftosaur](https://www.liftosaur.com/), and both land in [TimescaleDB](https://www.tigerdata.com/timescaledb) on [Tiger Cloud](https://www.tigerdata.com/cloud). No files, no iCloud, no Mac. A [Next.js](https://nextjs.org) app reads it and tells me whether I hit protein, which is a separate post.

That change alone deleted the 150 lines and, more to the point, made Report Time a real measurement instead of an inference.

It also turned up something I hadn't gone looking for. Once nothing was reading files hourly, there was no reason not to ask HealthKit for everything it had, so I did, and it handed back 87 MB of JSON going back to January 2016. Ten years of resting heart rates and step counts and body weights had been sitting on my phone the entire time. The old pipeline could see three months of it, because three months was when I'd set it up, and it had never occurred to me to ask for more. That backfill loaded in 2.2 seconds and quadrupled the useful history of the whole project before I'd written a single interesting query.

Everything past this point is a modeling argument you could implement on any relational database, and for most of this post's length that is exactly what I would tell you to do.

Here it stops being true.

The Reports table is a hypertable partitioned on `observed_on`, with no primary key and no unique constraint. That's not sloppiness, it's the point: uniqueness would make Restatement an error, and Restatement is the normal path.

Current truth is a continuous aggregate.

```sql
CREATE MATERIALIZED VIEW observations_daily
WITH (timescaledb.continuous) AS
SELECT time_bucket(INTERVAL '1 day', observed_on) AS observed_on,
       metric,
       last(value, reported_at)  AS value,
       last(unit,  reported_at)  AS unit,
       max(reported_at)          AS last_reported_at,
       count(*)                  AS report_count      -- >1 means it was Restated
FROM observations
GROUP BY 1, 2;
```

Sit with `last(value, reported_at)` for a second. That is last-write-wins. It is *precisely* the semantics `ON CONFLICT DO UPDATE` was giving me, expressed as an aggregate instead of as a destructive write, and every losing write is still there to query.

That one line is most of what the migration bought me, and everything else in this post is housekeeping around it.

`report_count` is the part I didn't expect to lean on. It's just `count(*)`, but it means every row in the view carries whether it has ever been argued about.

## How often does this actually happen

I asked three times and got three answers, all correct, spanning two orders of magnitude.

```
the question I asked                                          answer
of all 69,613 Observations, how many have >1 Report?            0.6%
of Observations on days the live pipeline has touched,
   how many have >1 Report?                                    53.6%
of Observations the pipeline first saw live, how many had
   their VALUE change after that day had already closed?       69.3%
```

Zero point six percent is junk, diluted by ten years of backfill that loaded once and has never been revised because nothing has looked at it since.

Fifty-three point six is better and still wrong for my purposes, because "more than one Report" counts today's step count ticking upward all afternoon. That's a day accumulating, not history changing.

The third one is the claim. **Of the Observations this pipeline has watched land in real time, 69.3% had their value change after the day they describe was already over.** That's the majority path, not an edge case I went hunting for.

It needs two caveats and it's going to need them forever. It's 140 of 202 Observations against a pipeline that has been live for five days, so read it as directional rather than as a rate. And it can only climb, because an Observation that hasn't been revised yet can still get revised tomorrow while one that has can't un-revise itself. Any figure here needs its as-of date welded on.

I couldn't have measured any of this before, because the old schema's entire design was "make this unmeasurable."

## What that buys you on a bad day

Knowing how often your data revises itself is less interesting than knowing what you can do the day it goes wrong.

One evening in August my food-logging app and this site disagreed about the same day by 868 calories, both of them reading the same database. I've written up [what caused that separately](/writing/every-number-i-didnt-measure-was-wrong/), because it's a TimescaleDB footgun with its own set of lessons and I diagnosed it wrong the first time. What belongs here is what the diagnosis cost.

One query. Both Reports were sitting in the log with their timestamps on them, so I could see the number the page was serving, the number that had arrived after the page stopped looking, and the five hours between the two that explained the whole thing.

Under the old schema the later write would have overwritten the earlier one and left nothing behind. I'd have had a wrong number on a page, no way to know it was wrong, and no way to work out when it had become wrong.

Append-only didn't prevent that bug. It made the bug *legible*, which at 9pm in a grocery store turns out to be worth considerably more.

## A thing that was true for two and a half years and invisible

The first Liftosaur sync against the new schema failed on this:

```sql
CONSTRAINT lifting_sets_weight_sane CHECK (weight_lbs > 0)
```

Fifty-two sets across plank, crunch, hanging leg raise, inverted row and bodyweight squat come out of Liftosaur as `0lb`. And `0lb` means "no external load," which is already what `NULL` meant in this schema for a set logged as `3x12` with no weight segment at all.

One concept, two representations, sitting in my training history since February 2024.

Relaxing the constraint to `>= 0` is the easy fix and the wrong one. Every "did I add weight this week?" query would then need `> 0` instead of `IS NOT NULL`, and `AVG(weight_lbs)` would quietly average real loads against a pile of zeroes. Normalized in the parser instead.

I want to be clear about the credit: that's a *Postgres* win, not a TimescaleDB one. A CHECK constraint is about as old-fashioned as database features get. SQLite is typeless and had no constraints, so those rows sat there for two and a half years as an ambiguity nothing in the system was capable of noticing.

The time-series parts of this story are the hypertable and the continuous aggregate. Everything else I got came from moving onto a relational database that has opinions.

## What I'd actually ask you to do

It isn't "move your side project to a time-series database." My dataset is a rounding error, the performance argument at my size doesn't exist, and you shouldn't let anyone including me cite my 73,000 rows as evidence that you need anything at all.

My suggestion is smaller than that, and more annoying. Go find out whether your data revises itself.

Most people have never checked, and the reason is that upsert makes it unfalsifiable. If your write path is `ON CONFLICT DO UPDATE`, a source that quietly restates history looks exactly like a source that doesn't. There is no query you can run. The evidence was destroyed at write time, by you, deliberately, in a line of code that looked completely reasonable.

Count how many of these are true where you work:

- Something upstream can restate a value for a day that has already closed
- Your only record that a value ever changed is an `updated_at` column
- You cannot answer "what did we think this number was last Tuesday?"
- A sync that succeeds and delivers nothing looks identical to one that succeeds and delivers everything
- Your dashboard reads from a materialized view and nobody has checked what its watermark is doing

One is fine. Two is worth an afternoon. If you got four, you don't have a data pipeline, you have a very confident rumor.

The fix isn't a migration. It's one question, asked before you design the table: **is this an observation about a day, or a report that arrived at a time?**

Get it right and most of the rest falls out.

---

Two follow-ups to this one. [Every number I didn't measure was wrong](/writing/every-number-i-didnt-measure-was-wrong/) is the confessional: five figures in this project that I never checked against the real thing, and the cheap arithmetic that would have caught each one. [Don't give the model SQL](/writing/dont-give-the-model-sql/) is about the app on top, and why its chat interface has thirteen typed tools instead of a query box.
