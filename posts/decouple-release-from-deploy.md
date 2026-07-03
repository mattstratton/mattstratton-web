---
title: Your Agent Didn't Break Prod. Your Pipeline Did.
published: true
description: '''Merged'' and ''live'' are not the same event, and an agent that can merge to main doesn''t change that. It just makes it obvious you never separated them.'
tags:
  - devops
  - ai
  - webdev
  - cicd
cover_image: ./assets/decouple-release-from-deploy-cover.png
id: 4061454
---
Picture a pipeline that looks pretty reasonable on paper. An agent opens pull requests. CI gates the merge to main: lint, tests, build, all green or it doesn't land. A scheduled job periodically promotes whatever's sitting in staging straight to production. No individual approval per feature. Just a batch cutover on a timer.

That pipeline will absolutely, eventually, wreck your week.

Not because the agent did anything malicious. Because two very different questions got quietly collapsed into one gate: "did this pass CI" and "is this safe for a real person to see right now." Those have never been the same question, not for humans and not for robots. We just used to have enough friction in the deploy process that the gap between them rarely mattered.

I've [written before](https://dev.to/mattstratton/how-my-coworker-who-didnt-know-cd-shipped-to-production-3j6j) about the scaffolding that lets a non-engineer safely drive a coding agent against a real codebase. Rules, skills, hooks. Three layers of paranoia built into the system instead of relying on any one person's vigilance on a random Friday. That post was about the merge gate: what stops garbage from landing on `main`.

This post is about the gate after that one. Passing CI and landing on `main` solves exactly one problem, and it is not the problem of "will my users see something half-finished this afternoon."

I've been talking about [shifting things left in the pipeline](https://www.youtube.com/watch?v=Qf1-CRT0pvY&t=178s) for the better part of a decade, usually about security. Same instinct, one checkpoint further down the line: not just "is this code safe to merge," but "is deploying this code, right now, safe."

## Continuous delivery is not continuous deployment

This isn't a new idea. It's an old one that a lot of teams politely ignored for a decade, mostly because deploys used to be scary enough that nobody wanted to do more than one a sprint.

Continuous delivery means every merge is *releasable*. It does not mean every merge is *released*. Continuous deployment collapses those two things into the same action, and that's a choice you make on purpose, not a default you inherit by moving fast.

If your pipeline treats "merged" and "live" as synonyms, you've opted into continuous deployment without ever deciding to. The fix isn't slowing the pipeline down. It's separating the two decisions so a merge event and a "customers can see this" event stop being the same button.

Feature flags are one popular way to do that separation, and if you already run one, great, keep running it. But a flag is a mechanism, not the point. I don't run a feature-flag system myself, and I still get the same separation. What matters is the decoupling, not the specific tool you use to get it.

In case it's not obvious what one even looks like: a feature flag, at its most embarrassingly simple, is a boolean and an `if` statement.

```javascript
if (flags.newInvoiceExport) {
  renderNewExport()
} else {
  renderOldExport()
}
```

You do not need a vendor with a pricing page to get started. A config value, an environment variable, a column on a settings table, all of that counts as day one. Upgrade to something like LaunchDarkly or Unleash once the dumb version is the thing slowing you down, not before.

## Put a gate on the release event, not just the merge event

My own setup looks like this: PRs merge to `main`, but `main` isn't what's live. A separate release step promotes `main` to a `production` branch, and that promotion only happens after I explicitly say go. Nothing gets pushed to production on a timer, and nothing gets pushed because a batch of unrelated changes happened to be sitting around.

Once that promotion kicks off, it isn't done just because Vercel says "build succeeded." The release process waits until Vercel confirms the new build is actually the one serving traffic, then runs an automated check against production itself: hit a handful of endpoints that have to work, confirm they do, and only then call the release finished. If that check fails, I find out. A user does not.

There's a second, slower layer after that: a manual pass through the specific things that changed in this release, because an automated check can tell you the server responds, not that the feature behaves the way you meant it to.

None of that requires a flag anywhere. The gate isn't "does this code know how to hide itself." The gate is "does a human, and then a machine, and then a human again, all get a chance to say no before this reaches a real user." Feature flags earn you a *fourth* layer, an inside-the-code one, on top of that. Nice to have. Not the load-bearing part.

## An automated check is monitoring with a head start

I've spent a lot of years on the incident response and observability side of this industry, enough to have [given entire talks on it](https://noti.st/mattstratton/gD2v6u/the-proactive-approach-data-driven-observability-incident-response). The lesson that refuses to go out of style: an automated check after a release doesn't exist to catch every possible bad deploy. It exists to catch the *slow* discovery of a bad deploy.

A user hitting your bug is monitoring too. It's just the worst possible kind, because you find out from a support ticket instead of a dashboard, and by the time the ticket lands, it's already been somebody's bad afternoon for a while.

A post-deploy check that hits the handful of things that actually matter isn't a replacement for real observability: dashboards, alerts, tracing, whatever you've already built. It's a compressed version of the same instinct, aimed at the exact moment you're most likely to have broken something, which is right after you changed something.

## The fallback: revert fast, and don't paint yourself into a corner

A release gate handles the "I'm not ready" case. It doesn't handle the "I was wrong" case, where the promotion went through, real users saw it, and it turns out there's a bug that only shows up under actual traffic. For that you need the other half: the ability to revert fast, which mostly comes down to one boring rule.

Don't ship a database migration that the previous version of your code can't survive.

This is the expand/contract pattern, and if you've been doing this long enough you've relearned it under a new name roughly every three years. Add the new column nullable. Backfill it. Write to both the old and new column. Read from the new one once you trust it. Only then, in a later release, drop the old column. Every step in that sequence is safe to roll back from, because the previous version of the app never depends on something that doesn't exist yet.

Skip that discipline and your revert button becomes decorative. You can `git revert` the code in about four seconds. If the migration already ran and already dropped a column the old code expects, reverting the code just gives you a fancier way to be down.

This is also, not coincidentally, [incident response 101](https://noti.st/mattstratton/VhGnmc/dont-panic-effective-incident-response). Effective incident response runs on having a small number of pre-agreed moves you can execute without a meeting: revert, roll back, page someone, whatever applies. The worst possible moment to invent your rollback plan is during the incident it's supposed to fix. If reverting requires an engineer to reason live about which of three interdependent migrations is safe to undo, you don't have a rollback plan. You have a discussion topic, and discussion topics don't resolve outages.

## Someone still has to own saying "go"

None of the automation above changes who's accountable for a release. It changes what that person is accountable *with*.

I've talked before, on stages instead of on a blog, about how [the lifecycle of a service](https://noti.st/mattstratton/AwDQxx/the-lifecycle-of-a-service) doesn't end the moment something reaches production, and ownership doesn't evaporate the second it ships. Somebody owns a service in production the same way somebody owns the decision to promote a build to it. If your team can't answer "who decided to release this" for a given deploy, an agent that opens PRs quickly is not actually your biggest problem.

In my setup, that person is me, for now. It might be someone else on my team next month, and the gate doesn't care which name is attached, only that a name is. The promotion step has an owner. It is never "whichever cron job happened to fire at 3am."

## Same guardrails, new reason to need them

None of this is agent-specific. Gated promotions, expand/contract migrations, decoupling deploy from release: this is stuff engineering orgs have known for well over a decade. It got treated as optional at a lot of small teams because a human was in the loop on every deploy, and a human noticing "wait, this doesn't feel done yet" was doing the job the gate should have been doing.

Take that human out of the loop, or just make them faster and more numerous by handing them an agent, and the discipline you skipped stops being optional. It was never really optional. It was just being covered for by somebody's judgment call at 4:58pm on a Thursday.

The agent didn't create this problem. It just removed the friction that used to hide it.

*Same as last time: if you want the receipts on how the merge-side guardrails work, [that's here](https://dev.to/mattstratton/how-my-coworker-who-didnt-know-cd-shipped-to-production-3j6j). This one's the other half.*
