---
title: Coding Agents Are Actually Good at This One Thing
published: true
description: >-
  Coding agents aren't magic. But for internal tooling? They've brought back the
  "just build the thing" era I've been missing since Microsoft Access.
tags: webd
canonical_url: >-
  https://dev.to/mattstratton/coding-agents-are-actually-good-at-this-one-thing-5dej
id: 3299129
cover_image: >-
  https://dev-to-uploads.s3.amazonaws.com/uploads/articles/rxoya791llxf4y6v2c81.png
---
The discourse around AI coding tools tends to collapse into two camps: people who think they're going to replace developers, and people dunking on "vibe coding" demos that fall apart the moment you look at them sideways.

Both camps are mostly arguing about the wrong thing.

I've been using coding agents heavily for the past few months, and the use case where they've actually changed how I work isn't production applications or greenfield SaaS ideas. It's internal tooling. And that distinction matters more than people are giving it credit for.

## The Airtable Problem

For years, I built internal tools the way most of us did: I found something close enough and made it work. Airtable was great for this. I built conference talk trackers, content inventories, planning dashboards... all kinds of things. The spreadsheet-meets-database model was genuinely useful, and for a while, it was the right call.

But you're always fighting two things with tools like Airtable or Notion or even Asana when you're bending them to a purpose they weren't built for. First, you fight the constraints of the tool itself: the data model it has, the views it supports, the automations it allows. Second, you fight the cost and friction of giving your whole team access to yet another SaaS platform.

At some point the juice stops being worth the squeeze. You're not building what you actually need, you're building the closest approximation that fits inside someone else's product.

## Just Build the Thing

What coding agents have unlocked for me is the ability to *just build the thing*.

The project I've been heads-down on is called Tiger Den: an internal content management system for our Marketing team at Tiger Data. It's a Next.js app, Drizzle ORM, tRPC, Postgres (running on [Tiger Data](https://tigerdata.com), natch). A real web app with a real database, exactly structured for how we actually work.

Tiger Den manages our content library, tracks blog posts and videos, stores voice profiles for different authors so we can make sure our content matches our voices, generates UTM links, and surfaces the right content for the right workflow. It's not a product. It's not trying to be. It's a tool that fits our team's exact needs because we built it for our team's exact needs.

A few folks on the team are starting to use it. Workflows that used to involve a bunch of spreadsheet wrangling and web search gymnastics are getting simpler. It's not fully baked (it's somewhere between "mostly works for me" and "the team is starting to play with it") but it's already more useful than what it replaced (a combination of "nothing" plus "not very updated spreadsheet"), and I've been iterating on it continuously.

That iteration speed is the point.

## Why Internal Tooling Specifically

The reason coding agents shine here, and why I keep coming back to this use case, is the risk profile.

When you're building a public-facing application, you have to worry about edge cases at scale, security hardening, performance under load, what happens when a user does something unexpected, what happens when a thousand users do something unexpected. The cost of getting it wrong is high.

Internal tools have a completely different calculus. The user population is small and known. The stakes for any individual bug are low. You can ship something that's 80% right and fix the other 20% next week. You can move fast and it's actually fine.

This is the Microsoft Access model, honestly. In the 90s and early 2000s, people built remarkably functional internal tools in Access (forms, reports, relational data, real logic) because the barrier was low enough that you could actually do it. Then the web happened, the complexity went way up, and that era of "just build the thing" basically ended for most people.

Coding agents are bringing it back. The barrier is low again. You can describe what you want, iterate in a tight loop, and end up with something that actually fits your use case instead of something that almost fits someone else's template.

## What About Retool?

When I posted about this, someone brought up Retool — fair question. Isn't that exactly what Retool is for?

Maybe. But my reaction was: isn't that just trading one set of constraints for another? Now I'm stuck on how Retool thinks about the world instead of how Airtable thinks about the world. I haven't dug deep into Retool, so I'm not going to trash it, but the pattern is the same: you're building inside someone else's model of what your tool should be.

The thing I actually want is to build the thing I want. That's what "just use Next.js and a database" gives me.

## Some Honest Caveats

I want to be careful not to oversell this, because the context matters a lot.

I'm a systems guy. Infrastructure, security, DevOps, that's my background. I could build Tiger Den without a coding agent; it would just take a lot longer because I'm coming at software development somewhat sideways. The agent collapses that time gap significantly. But I'm still making real architectural decisions, reviewing what gets generated, and understanding the codebase well enough to maintain it. This isn't "describe what you want and walk away."

Someone also asked about maintenance (a reasonable concern!). My answer: for Tiger Den specifically, I'm only writing to my own database. I'm not doing write operations against external systems, I'm not touching production data, and the blast radius of any given bug is small. That's a deliberate choice, and it's part of why internal tooling is the right framing. If I were building something that talked to our customers' data or integrated deeply with critical external systems, I'd be a lot more careful.

The low-stakes calculus stops applying the moment you have real users, real consequences for downtime, or data you can't afford to mess up. Keep that boundary clear and this approach works really well. Blur it and you're asking for trouble.

But for "my team needs a thing and the existing tools don't quite fit"? This is legitimately transformative. I've wanted to be able to build internal tools this easily for a long time. Now I can.

Airtable, it's been real. Tiger Den is better.

