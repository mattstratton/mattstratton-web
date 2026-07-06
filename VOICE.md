# VOICE.md

This file describes Matt Stratton's personal writing voice — the tone,
formatting instincts, vocabulary, and pet peeves that should carry through
content written or reviewed for this site (`src/content/writing/`, the
legacy `src/content/posts/` archive) and for `mattstratton-dev-to/` posts.

**This file is optional context, not a dependency.** Nothing in this repo
requires it to exist. Agents/skills that check for it (e.g.
`mattstratton-dev-to/.claude/skills/new-devto-post/SKILL.md`, step 7) should
read it and match tone if it's present, and say nothing if it's absent —
never fail or block on a missing `VOICE.md`. It also has **no runtime
dependency on any external service** (Tiger Den MCP, the
`tigerdata-marketing-skills` plugin, or anything else) — it's a static file,
seeded once from those sources, that keeps working with zero access to them.

Seeded from Matty's Tiger Den `matty` voice profile, adjusted for this site:
the Tiger Data–branded LinkedIn post samples and a conference-talk transcript
analysis were dropped from the source material since they're written for a
different audience/purpose than a personal blog. Tone, formatting, and
vocabulary notes are personal writing habits, not brand rules, so those
carried over largely as-is.

## Tone

- Conversational and direct. Treat the reader as a fellow engineer, not a
  student. Second person throughout — "you," constantly.
- Mildly self-deprecating. Dry understatement after describing something
  painful: a short standalone sentence that deflates the tension rather than
  amplifying it. Conversational asides in parentheses.
- Credibility via war story: ground claims in firsthand experience ("Trust
  me, I've seen it happen," "I've had conversations with..."). Use sparingly
  — it should earn authority, not turn into a lecture.
- Openly admit when a tool, workflow, or choice is janky but works ("I'm too
  lazy to learn Audacity," "Because it works for me"). That's practitioner
  honesty, not performative humility.
- Humor is dry, occasionally pop-culture-referencing, never forced.

## Formatting rules

- Sentence rhythm alternates short, punchy sentences with longer explanatory
  ones. Fragments are fine for emphasis.
- Paragraphs are short — 2-3 sentences typical, rarely past 4.
- When presenting a set of diagnostic criteria or signals, a natural closing
  move is a "count how many apply to you" prompt that tells the reader how to
  act on the list. Not every piece needs this — it's a signature device to
  reach for when the content actually fits that shape, not a template to
  force.
- Vary deflating one-liners every time — "Oof.", "Good luck.", "Sigh.",
  "Deal with it.", invented fresh in the moment. Never reuse the same
  deflator twice within a piece, and don't let one become a tic across
  multiple pieces either.

## Vocabulary and rhetorical devices

- Concrete analogies to deflate abstraction: translate technical or
  organizational concepts into everyday scenarios (a thermostat for
  declarative config, learning a second language for cross-functional
  communication). The analogy should do the heavy lifting — don't re-explain
  the concept after making it.
- Rhetorical questions answered immediately in the next sentence ("Why
  Hangouts? Because we started with them.") — moves the reader forward
  instead of making them wait.
- Occasional low-key profanity and casual interjections, used for
  punctuation rather than volume.
- Technical credibility through specificity — real numbers, real config
  parameters, real command output. Never hand-wave a technical claim.

## Anti-patterns (avoid these)

- Em-dashes.
- Emoji.
- Marketing speak.
- Hollow reassurance phrasing ("I've got good news for you," "don't worry,"
  excessive "trust me").
- Starting paragraphs with "I mean,".
- LinkedIn-guru voice: empty maxims, motivational posturing, manufactured
  urgency.
- Explaining an analogy after making it — let it land and move on.
- Repeating the same deflating phrase within a single piece, or leaning on
  the same one across multiple pieces.

## Writing samples

Real excerpts, trimmed of terminal/code-log noise where it doesn't
illustrate voice. Full posts are linked.

### Hosting a Participant-First Conference in the Age of Corona — How To Do It

> The usual DevOpsDays Chicago conference is a two-day event, with a single
> track of talks in the morning, with Open Space discussions in the
> afternoon. For the virtual event, we decided to make it a single-day event.
>
> We chose to do a single day, as we were concerned with the time investment
> for participants in a two-day virtual event... When considering our
> program, we realized that a lot of things with our traditional schedule
> were bound by the "laws of physics" of having hundreds of people in a
> physical space and having to move them around. For example, it's not
> practical in the physical space to have a talk with everyone in one room,
> and then leave for 20 minutes of breakouts, and then move back to the main
> hall, etc. But in a virtual space, this is completely possible!
>
> One interesting thing that occurred was due to us deviating from the
> "usual" DevOpsDays talk length (30 minutes), several speakers didn't notice
> that the length had changed! We had one speaker turn in a 25-minute
> recording; when I pointed this out to them, they said "oh, I thought I was
> being helpful by making it shorter," as they hadn't seen that the length
> was 20 minutes, not 30. This is a reminder to be extra explicit with
> details like this to your speakers!

Full post: <https://dev.to/mattstratton/hosting-a-participant-first-conference-in-the-age-of-corona-how-to-do-it-3p2j>

### Getting Started with Chef

> Chef is super cool. The point of this post is to walk you through the
> basics of getting started solving a problem with Chef.
>
> The first thing we want to do is create a cookbook. A cookbook is, well, we
> don't care yet. Trust me, we'll get to it.
>
> ...
>
> This tells Chef that we want to make sure the apache2 package is installed.
> Chef will check if it's installed, and if not, it will install it. If it's
> already installed, then it won't do anything.
>
> This is really important to understand. Chef only takes action if it needs
> to. We aren't writing a list of commands; we are explaining our desired
> state.
>
> I like to think about it a little bit like how a thermostat works. I tell
> the thermostat "I would like the temperature in my house to be 70 degrees."
> My thermostat checks — "Is it 70 degrees?" If so, it doesn't do anything. If
> not, it turns up the heat. How annoying would it be if I had to tell my
> thermostat exactly what to do every time? Very annoying, that's how much.

Full post: <https://www.mattstratton.com/post/getting-started-with-chef/>

### Starting a Tech Podcast

> I've been talking lately to a few folks, specifically Jason Hand, about
> "how to do a podcast." ... So, similar to my post about "what is DevOps
> anyway?", I thought it was just as easy to write up a blog post explaining
> how we do things at ADO, and some tips I've learned along the way.
>
> ...
>
> I import the AIFF into LogicX on my Mac, and edit it there. Would I
> recommend using Logic for podcast editing? No way. Why do I do it? Because
> it works for me and I'm too lazy to learn Audacity.
>
> You should learn Audacity.
>
> ...
>
> So the tech is actually the easy part. The hard part of running a podcast
> has to do with all the administrative stuff. Scheduling guests... Writing
> the blog post after you're done, so the episode actually shows up in your
> feed with all your nice notes. That stuff. Sorry, it's a bunch of work.
> Deal with it.
>
> There are three kinds of lies — lies, damn lies, and podcast listener
> statistics. Because of the way a podcast works, you can't actually really
> tell how many people really listen to your show.

Full post: <https://www.mattstratton.com/tech/starting-a-tech-podcast/>

### Blog post about Gmail security

> Email can be our lifeblood. Your email inbox is the center of your
> existence, and if it gets compromised, you can be in for a world of hurt.
> ... This post will mostly focus on securing a Gmail account (most tips will
> apply to Google Apps email as well), but some of the points apply to any
> email system.
>
> **Make that password tight, yo**
>
> The easiest way for a hacker to get your password is by use of a "brute
> force" attack... Good passwords do not contain ANY words that might be
> found in a dictionary. Even if you think that it's a word nobody could
> guess, remember that it's not a person who is trying to figure it out, but
> a program that is spinning through a dictionary for words.
>
> The best security systems are called "two-factor." That means you have to
> know/have TWO things in order to be authenticated... Be warned — while it's
> not very hard to set up (it does take about ten minutes or so), it WILL
> make your Google login process go through a few more hoops every time. But
> as I am fond of saying, "security and convenience are inversely
> proportional."

(Source URL not recorded in the seed profile — legacy post, pre-migration.)

### Blog post about web server caching

> Another thing I did this weekend was install the W3 Total Cache plugin.
> Yeah, I couldn't use it to its full value, since I don't have Apache, but
> it had some neat features.
>
> ...
>
> About two minutes after starting Apache, I got a weird disconnect error on
> my WinSCP session... "Well, this sucks," I thought to myself. "I know that
> Apache can be memory hungry, but seriously? After two minutes?"
>
> ...
>
> If I had not offloaded my scripts and images to the CDN, my server would
> have choked on this... That's a lot of freakin' requests.
>
> Of course, my initial calculations are that my CloudFront bill for today
> will be about $5-$6. That sounds like a lot, but I really don't expect to
> maintain this kind of traffic over more than a day or two. The buck I made
> from AdSense doesn't really counter that. But hey — if I take my lunch to
> work one day this week, everything will balance out, right?

(Source URL not recorded in the seed profile — legacy post, pre-migration.)

---

**On updating this file:** the sample set above is intentionally small —
it's the initial seed from the Tiger Den voice profile, filtered to
blog/dev.to material. A follow-up skill to pull in fresh samples over time
(new `/writing/` or dev.to posts as they're published) is tracked separately
and out of scope for this file's initial version.
