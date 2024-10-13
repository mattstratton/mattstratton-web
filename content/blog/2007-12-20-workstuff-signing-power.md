---
title: '[workstuff] Signing Power'
author: Matt Stratton
layout: post
date: 2007-12-20T15:33:00+00:00
url: /work/workstuff-signing-power
dsq_thread_id:
  - 2275476298
categories:
  - Work
tags:
  - The Dot Com
  - workstuff

---
One of the exciting things about my new role is I have &#8220;signing authority&#8221; on purchases up to $50K. Which doesn&#8217;t mean I can buy with abandon; it just means that if I&#8217;m buying something less than fifty grand I can be one of the signatures (but I still need the CFO signature). I don&#8217;t know why I think this is so cool.

I did order my first servers last week, and the PO just got approved. It was one of those &#8220;need to spend this money by the end of the year&#8221; thing. The problem is, I inherited a budget and cap spending plan from my predecessor, and let&#8217;s just say I disagreed with a lot of it. But I didn&#8217;t have a lot of time to revamp it before I had to use the 2007 dollars. I was proud of the fact that I was able to go through it and manage to revise it to spend the money more intelligently (in my opinion) without spending any MORE money. So now we&#8217;re getting more bang for our buck, but without spending more bucks. The problem is, the project management team adjusted some of the schedules for 2008, and one of the projects that I thought was going to be for Q1 is now Q3 &#8211; and guess what? That&#8217;s one of the projects I just bought $20,000 worth of hardware for. So I&#8217;ll have two very nice DL385&#8217;s sitting around for 8 months or so doing nothing. Nice.

However, I will have two DL585&#8217;s being shipped to me from CDW in the next week or so for building out a sweet honkin&#8217; SQL cluster to run a bunch of consolidating back-end applications. One of the problems that I solved was consolidating SQL in this way. According to the previous plan, we had a bunch of projects coming up that all required SQL backends. The previous plan was for all of these applications to get dedicated hardware, and run SQL on the same server as the app. This was, in my opinion, over-speccing; most of these applications have a small footprint and could easily run inside of virtual machines in our VMWare farm &#8211; so that&#8217;s exactly what I did. I took the money allocated for all these standalone machines, and invested it instead in a SQL cluster that will handle all of them. I&#8217;m like a superhero. Just call me The Consolidator.