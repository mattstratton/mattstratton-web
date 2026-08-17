---
title: Don't Give the Model SQL
published: false
description: 'My health data has six traps in it that have each already produced a wrong answer. Given SQL, a model walks into all six. Told about them in a prompt, it avoids them most of the time, which is worse.'
tags:
  - ai
  - llm
  - programming
  - database
cover_image: ./assets/dont-give-the-model-sql-cover.png
crosspost: true
series: Rebuilding My Health Tracker
canonical_url: 'https://www.mattstratton.com/writing/dont-give-the-model-sql/'
id: 4418607
---

I built a web app to answer questions about my own health data, for a reason that is embarrassingly small. I already had a perfectly good way to ask them: a Claude Code skill that queried the database and reasoned over the results. It worked well. It also can't run on Claude iOS, and the moment I actually want to ask "should I be worried about this" is standing in a kitchen at 6am, not sitting at a desk.

So it lives at a URL, behind Google sign-in allowlisted to exactly one address, with the [source public](https://github.com/mattstratton/mattstratton-fitness-tracker) minus the data. It reads the TimescaleDB database I wrote about in [The Past Keeps Changing](https://dev.to/mattstratton/the-past-keeps-changing-3eg8), and it answers two different kinds of question in two deliberately different ways.

(Obligatory: none of this is medical advice, and the thresholds in it are tuned to one person's circumstances. If you copy the rules you will get advice calibrated to somebody else's body.)

## Two modes, kept apart on purpose

**The coach view is deterministic.** Protein adherence, deficit versus the scale, weight trend, overreaching, stalled lifts, data freshness. Each one is a pure function in `lib/signals/`, unit-tested against fixtures, no LLM involved anywhere. A verdict traces to a rule instead of to a vibe, and `unknown` is a first-class result distinct from `ok`, which matters because this dataset produces `unknown` constantly.

**The ask view is an LLM.** Claude, server-side, over thirteen read-only tools. It handles the questions nobody wrote a rule for: am I stalling on squat, how big is my deficit actually, what's my VO2max doing.

The interesting design work is all in the second one, and it's mostly about what I refused to build.

## The obvious design

Hand the model SQL. Give it the schema, a read-only connection, and let it write queries. It's the design every "chat with your database" demo uses, it takes an afternoon, and for a database this small the query cost is irrelevant.

I rejected it, because there are six traps in this data and every one of them has already produced a wrong answer in this project, on a page I was looking at, at least once.

1. **Today is a Partial Day.** Its numbers are still accumulating. Compare it against a completed day and you invent a fast.
2. **A gap is not a zero.** An unlogged day is unlogged, not a day I ate nothing.
3. **Apple shadow-copies every Liftosaur session.** Query the workouts view naively and training volume roughly doubles.
4. **`energy_balance` overstates the deficit by about 2.7x.** Over the last 30 complete days it reports an average intake of 1,602 kcal against 3,216 burned, a net of −1,614 a day, which predicts losing 3.2 lb a week. The scale over the same window says 1.2. Basal energy is a formula estimate from weight, height and age, and watch-measured active energy runs generous. Both are real numbers whose *difference* is not a measurement.
5. **A single weigh-in is noise.** Day-to-day scale movement is water.
6. **`reps: 0` is a set that was attempted and failed**, not a set that's missing.

Given SQL, a model walks into all six, which says nothing about the model and everything about the schema. The traps are invisible from it. Nothing about a column called `calories` tells you today's value is half-formed.

## Why the prompt isn't the fix

I could put all six traps in the system prompt, and if I do, the model gets them right *most of the time*. That's what decided the design, because most of the time is the worse outcome.

A tool that's wrong every time gets caught on day one and thrown away. A tool that's right ninety-something percent of the time gets trusted, and then the rare wrong answer arrives wearing exactly the same confident formatting as the right ones. I have no way to spot it, because the whole reason I'm asking is that I don't already know the answer.

So the traps are foreclosed by the shape of the tools rather than by instructions:

- Windowed queries end in `AND observed_on < today_local()`. The Partial Day isn't excluded by the model remembering to exclude it. It isn't reachable.
- Gaps stay absent rows. Nothing zero-fills, so there's no zero to misread.
- **No tool reaches Apple's workout view at all.** The double-counting trap isn't documented for the model's benefit, it's unreachable through the API surface.
- `energy_balance` cannot be fetched without its reality check arriving in the same payload. You can't get the misleading number on its own.

The prompt still describes all six traps, because a model that understands *why* a window ends where it does gives better answers than one that just gets truncated data. But the prompt is not what's holding them. If the prompt were deleted tomorrow the answers would get worse and they wouldn't get wrong in those six specific ways.

There's also no write tool, and I mean that literally rather than as shorthand for one that's disabled or gated behind a confirmation. There is nothing to disable. Program changes stay in Liftosaur and macro targets stay MacroFactor's call, so the chat has no legitimate reason to mutate anything. The reasoning is in [ADR 0006](https://github.com/mattstratton/mattstratton-fitness-tracker/blob/main/docs/adr/0006-typed-tools-not-sql-for-the-chat.md).

## The catalog that wasn't the index

Then I nearly shipped a tool that was wrong in a way none of that structure protects against.

The chat needs to know which metrics exist. There's a `metric_catalog` table holding canonical units and an attention grade per metric, so `list_metrics` obviously reads from that. It compiled. It typechecked. It returned rows that looked entirely plausible.

```
in_data  catalogued  uncatalogued
81       38          43
```

The catalog covers 38 of 81 metrics. The other 43 aren't stale junk: sorted by coverage they start with walking and running distance (3,865 days of it, updated today), flights climbed, walking heart rate average, walking speed, step length, plus the entire micronutrient panel, all of it current because MacroFactor logs micros.

So the tool would have worked exactly as written and made the chat answer "I don't have that" about ten years of walking distance sitting right there in the database.

No test would have caught this. The function did what it said. I caught it by printing `.length` from a throwaway script against the real database and noticing 38 where I expected 81.

The fix inverts the join. Drive from `observations_daily`, `LEFT JOIN` the catalog, and an uncatalogued metric shows up with `catalogued: false` and a null unit rather than not showing up. It costs one aggregate over the whole continuous aggregate per call, which `EXPLAIN ANALYZE` puts comfortably under 100ms, and that's fine for something called once a conversation.

The general shape: **a lookup table is not an index of reality unless something enforces that it is.** Nothing did. Nothing does now either, but at least the absence is visible in the output.

## False precision is a real cost

Raw rows out of the views look like this:

```
observed_on  calories            protein_g
2026-08-08   1370.9033333354562  187.9353333412348
```

Summing floats does that. Two problems once it reaches a language model. It's false precision, because a scale that reports to a fifth of a pound did not measure thirteen decimal places, and an answer quoting them implies rigour the data doesn't have. And it's pure token cost: eighteen characters where six will do, on every point of every series.

Rounded to two decimals at the tool boundary rather than in the query layer, on the principle that the data layer should return what the database holds and the tool layer is already the thing whose job is shaping output for a model. Done inside the single `json()` helper every tool return passes through, so a new tool can't forget. It took roughly a third off `get_nutrition`'s payload for a seven-day window, and proportionally more over a ninety-day series.

## The counterweight

I want to be careful not to oversell the structural argument, because the model repeatedly did better than the structure asked of it.

Nine deliberately trappy questions, run through [a committed probe script](https://github.com/mattstratton/mattstratton-fitness-tracker/blob/main/scripts/probe-coach.ts) so the results are something you can reproduce rather than something I remember. Three of them came back with reasoning the prompt does not contain.

Asked what my VO2max was doing, it reported the upward trend and then warned, unprompted, that Apple derives the figure from outdoor walk and run heart-rate data and that "the estimate is affected by weight dropping as well as by fitness," landing on "suggestive, not conclusive" instead of claiming a fitness gain. Nothing in the prompt mentions VO2max at all.

Asked whether I was stalling on squat, it separated T1 from T2 work by inspecting the weights and set counts. The tier hint that exists elsewhere in this codebase is not exposed to any tool.

And asked about sleep, it read the coverage figures before answering and declined to grade anything on 21 nights. That answer also contained a mistake that was entirely mine, which I didn't spot for another hour. It's the last section of this post.

That last one is my favourite, because it was an accident. I added a `days365` field to make the metric index honest about coverage, for the reasons above. The model appropriated it as a generic "is there enough data here to answer this" gate. A field added for one reason got used for a better one, which is worth knowing before you trim a tool payload on token grounds.

Structure constrains the failure modes. It doesn't cap the upside.

## The signals I wanted and couldn't build

The obvious next feature is cross-domain: does bad sleep predict missed lifts, does a deep deficit show up in recovery markers. Every signal in the app reads exactly one domain, and a few of them contain advisory copy gesturing at relationships the code never actually checks.

Before writing any of it I checked whether the three most obvious hypotheses hold against real history. They don't get a real test, and why not is the finding.

The only lift the stall rule flags is one it's supposed to ignore. Running `stalling()` unfiltered across 2,545 sets and 190 sessions returns exactly one hit: triceps pushdown, parked at 47.5lb for two sessions. That's a T3 accessory, and a T3 parking at one weight is the program working as designed rather than a stall. It's precisely the false positive the tier filter exists to suppress, and with the filter on there is nothing left.

The recovery rule has fired once in nine years. I ran the real `overreaching()` function over every day of history rather than approximating its baseline maths in SQL, because getting a rule subtly wrong by hand is the exact thing this project keeps catching me doing. Out of 2,409 days: `ok` 2,344 times, `unknown` 48, `watch` 16, and `act` a single time, on 25 April 2022. Nothing has gone past `ok` since June 2024.

That last paragraph is a correction. My own notes said `act` had never fired at all, and I believed it for months, because the script that produced that claim was a one-off I never committed and never re-ran. Writing it as [`npm run verify-signals`](https://github.com/mattstratton/mattstratton-fitness-tracker/blob/main/scripts/verify-signal-history.ts) took fifteen minutes and immediately contradicted the note. Make the check runnable and it will eventually tell you something you didn't want to hear.

And consistent nutrition logging started on 13 July, so four complete weeks is what I'd be correlating against. That's an anecdote wearing a sample's clothes.

So there are no cross-domain signals in this app, and the reason is that the events they'd correlate don't exist in my data yet. Filed as a dated follow-up rather than closed, because the hypotheses aren't rejected, they're just unanswerable with what's on hand.

I find this more satisfying than shipping the feature would have been. The version of me that skipped the check builds four correlation signals, they all sit at `unknown` forever, and I learn nothing except that the page is noisy.

## What's still unverified

Two honest gaps, because a post about verification that ends on a clean note is a post that hasn't looked hard enough.

The ask interface has never been rendered in a browser. The Chrome extension couldn't inject into localhost, so the streaming format is verified via curl and unit tests on the decoder and nothing else. It works when I use it on my phone against production, which is evidence but not a test.

And the `unknown` signal path is untested against live data, because nothing is currently `unknown`. The instruction telling the model how to handle it is tested. The behaviour isn't.

Some numbers, since I've spent this whole series insisting on them. Across the nine probes, measured today:

```
  #  secs  ttft  turns    in    out  cacheR  cacheW     cost
   1   6.9   6.1      2   705     83   14138       0  $0.0127
   3  10.2   6.6      2  3989    299   14138       0  $0.0345
   8  13.6  10.1      3 12119    458   21207       0  $0.0826
   9  16.8   1.7      2 13344    660   14138       0  $0.0903
```

The cached prefix is **7,069 tokens** of system prompt plus thirteen tool definitions, and `cacheWrite` is zero on every turn after the first, which is the number to watch. If it ever stops being zero, something volatile has crept into the prefix and every turn is paying full freight. A two-turn question reads that prefix twice, hence 14,138.

Nine questions cost 37 cents in total, from 1.3 cents for "how many calories today" to 9 cents for the ones that pull a year of series data. Latency ran 6.9 to 16.8 seconds end to end, with first text arriving anywhere from 1.7 to 10.1 seconds in. That spread is why streaming and a visible status line were not a nicety: ten seconds of blank screen reads as a hang, and the honest fix is to show the thing working rather than to make it faster.

## And one gap I didn't know I had

Everything above is a gap I could name. Re-running those probes turned up one I couldn't, and it was sitting in the answer I'd just finished praising.

The sleep response ended with "sleep coverage overall is ~7% of days, so this is informational only." Seven percent is wrong. Over the last thirty days it's seventy, because my watch-wearing changed in July.

The model wasn't guessing and it wasn't reading that from the data. It was reading it from `lib/coach/context.ts`, where I had written **"Sleep has roughly 7% coverage"** into the system prompt as a standing fact, months ago, back when it was true.

So the chat told me something false about my own body, sourced from the one component I'd exempted from the argument this entire post makes. The tools compute. The prompt asserts. Assertions rot, and this one had quietly reached the point where the app was contradicting its own database.

Then I went to delete it and found out why it had survived.

```js
test('prompt: carries the remaining data traps', () => {
  assert.match(prompt, /single weigh-in is noise/)
  assert.match(prompt, /7% coverage/)          // <- this line
})
```

The stale number was under test. That assertion *required* it to be present, so anyone who spotted the problem and corrected it would have gone red and, quite reasonably, put it back. A wrong fact had acquired a defender.

Two tests below that one sits `prompt: forbids numbers that did not come from a tool`. Two below that, `prompt: hardcodes no target values`, with a comment explaining that targets change weekly so the model has to fetch them rather than be told. The principle was already written down. It was already enforced for one kind of number. And for another kind, a test was holding the violation in place.

Chasing the string turned up seven copies, including a live row in the database and the coaching skill I run from my terminal. I had fixed one of them that same morning, in `CLAUDE.md`, and considered the job done.

The fix isn't to correct the figure. It's to delete it and let `list_metrics` report coverage, which it already does, and which is how the model knew to be careful about sleep in the first place. The test now asserts the inverse: `assert.doesNotMatch(buildSystemPrompt(), /\d+(\.\d+)?%\s*coverage/i)`, so the next person to write a percentage into that prompt gets stopped instead of protected.

Which is the argument for tool shape over prompt text, arriving as a bug rather than a principle, in the one part of the system I'd decided didn't need it.

---

The other two in this set: [The past keeps changing](https://dev.to/mattstratton/the-past-keeps-changing-3eg8) is why the storage layer under all this is append-only, and [every number I didn't measure was wrong](https://dev.to/mattstratton/every-number-i-didnt-measure-was-wrong-dkk) is the five figures I had to retract while writing these.
