---
title: Team management with OneNote
author: Matt Stratton
layout: post
date: 2010-02-24T19:49:42+00:00
url: /tech-tips/team-management-with-onenote
thesis_description:
  - "Managing resources across a team can be a real challenge. I've devised a system for tracking this using a combination of Microsoft OneNote and Outlook. Bear in mind that I just invented this today, so a) it's not really a proven system yet, and b) I'm VERY open to feedback and suggestions for how it can be improved."
thesis_thumb:
  - /wp-content/uploads/onenote.png
dsq_thread_id:
  - 69854116
categories:
  - Tech Tips
tags:
  - Evernote
  - Getting Things Done
  - Microsoft OneNote
  - Outlook
  - Time management

---
<div class="zemanta-img" style="margin: 1em; display: block;">
  <div style="width: 164px" class="wp-caption alignright">
    <a href="http://en.wikipedia.org/wiki/Image:1note2007.PNG"><img class=" " title="Microsoft OneNote" src="http://upload.wikimedia.org/wikipedia/en/8/8f/1note2007.PNG" alt="Microsoft OneNote" width="154" height="154" /></a>
    
    <p class="wp-caption-text">
      Image via Wikipedia
    </p>
  </div>
</div>

I&#8217;ve blogged before about time management, especially my fascination with strategies/systems like <a class="zem_slink" title="Getting Things Done" rel="wikipedia" href="http://en.wikipedia.org/wiki/Getting_Things_Done">Getting Things Done</a>. The trick is, a lot of that stuff is geared towards _individual_ time management&#8230;but what happens when you manage a team of people and need to keep track of what they are working on?

I&#8217;ve devised a system for tracking this using a combination of Microsoft <a class="zem_slink" title="Microsoft OneNote" rel="homepage" href="http://office.microsoft.com/en-us/onenote/FX100487701033.aspx">OneNote</a> and Outlook. Bear in mind that I just invented this today, so a) it&#8217;s not really a proven system _yet_, and b) I&#8217;m VERY open to feedback and suggestions for how it can be improved.

## The Problem

I manage a team of three people &#8211; two sysadmins and one DBA. Their time and tasks are a mixture of day-to-day support, planned projects, and &#8220;unofficial&#8221; projects. Since it&#8217;s my responsibility to do resource balancing across the team, I need to know at a glance who is working on what, so I don&#8217;t over-allocate a resource.I also need to be able to go back at review time and easily list out all of the cool things my team did for the year.

### Day-to-day

In some ways, this is the easiest area to manage, simply because it defies management. I&#8217;m not a micromanager, so I don&#8217;t need to track every small task that my employees perform that is in response to a support ticket or system issue. There is time carved out for this type of activity, so I simply trust my guys to manage those types of requests themselves &#8211; and I don&#8217;t need to track this over time.

### Planned Projects

For me, &#8220;planned projects&#8221; are either business projects that my team is supporting, or infrastructure projects just within our team. These are activities that span over multiple weeks, might have various phases, and (this is the key part), were planned. I knew there were coming and when they were coming (for the most part) and already resource-balanced for their requirements. For this type of activity, I want to a) know who is working on which project, and b) capture some basic status/activity information. For example, if Business Project X required my sysadmin to design and implement a cool new single-signon server farm, I want to make sure I capture that, so I can brag about it in his review.

### &#8220;Unofficial&#8221; projects

Ah, the nefarious &#8220;unofficial&#8221; bucket. What goes here? Well, this is pretty much anything that doesn&#8217;t fall into the above categories. A &#8220;project&#8221; is anything that really takes more than a reactive response (for example, a break-fix issue in production is not a &#8220;project&#8221;). And &#8220;unofficial&#8221; really means &#8220;unplanned&#8221;. Most &#8220;unofficial&#8221; projects tend to be things that I have assigned to my team to follow up on in areas like process improvement or system efficiency. One example would be &#8220;implement a 3G modem on our monitoring server to send us SMS alerts instead of email on critical systems&#8221;. That&#8217;s a project, sure, but it wasn&#8217;t in our plan.

## The Solutions

I&#8217;ve tried three different ways to manage this (including the one I just came up with this morning), and they all have varying levels of effectiveness.

### Solution 1 &#8211; The Mental List

Frankly, this is how I&#8217;ve been doing it most of the time for the past two years, and I think it&#8217;s a very common method. It&#8217;s just like it sounds &#8211; &#8220;keep it in your head&#8221;. I generally know what we&#8217;re working on, so I can have a pulse of who is really busy and who has spare cycles.

The problem with this solution? It totally sucks. There&#8217;s no method for follow-up, and it relies upon my memory. It means that every time a new request comes in, I have to go to my team and basically say &#8220;Hey, who is really busy right now?&#8221; That&#8217;s not effective OR efficient. So this solution gets a D-minus grade.

### Solution 2 &#8211; The Whiteboard

I picked this up from a fellow manager. He has a big whiteboard in his cube, where he lists out all of his team members, and underneath them, lists the stuff they are working on. It&#8217;s a good solution because it&#8217;s super easy, and VERY visible. The visibility is great for the manager, since he can just glance at the big honkin&#8217; board in his cube/office and see who has a lot of stuff under their name. And likewise, the entire team can quickly see what everyone else is working on.

So what&#8217;s the problem with this? It&#8217;s ephemeral. It doesn&#8217;t last. When things get completed, they are removed from the list, so it&#8217;s not good for a tracking archive. Additionally, it&#8217;s a freakin&#8217; whiteboard. They get erased.

### Solution 3 &#8211; Electronic List

My solution for this uses Microsoft OneNote and Outlook (the Outlook part is a &#8220;nice to have&#8221;, which I&#8217;ll get into when I describe the solution in depth below). Fundamentally, I have a bucket in my list software for every team member, and then a bucket for each team member as &#8220;archive&#8221;. When a task/project is completed, it&#8217;s moved to the archive bucket. There&#8217;s nothing &#8220;magic&#8221; about using OneNote for this &#8211; you could use another note system like <a class="zem_slink" title="Evernote" rel="homepage" href="http://www.evernote.com/">Evernote</a>, or even just track it in Excel with multiple tabs.

The beauty of this system is that everything is captured, and it has an archive. Additionally, since it&#8217;s electronic, you can edit the information (in a paper/whiteboard system, it&#8217;s a lot harder to make changes to it after the fact without being destructive). You also can include a lot more rich content, such as links to documents or diagrams, etc.

## How I&#8217;m Doing It

As I mentioned, my new solution uses OneNote, so that&#8217;s what all of my examples will build upon. You can easily extend the same principles to any electronic organization system though, but you might miss some of the extra cool integration points by doing so.

### OneNote Configuration

At a high level, the first step is to create a dedicated notebook for your team. This notebook will contain all of the lists you will use in this example. Inside that notebook, create a section/folder (hereafter referred to as &#8220;section&#8221;) for each team member, and then another section for each team member&#8217;s archive &#8211; as displayed below:

<div id="attachment_5979" style="width: 477px" class="wp-caption aligncenter">
  <img class="size-full wp-image-5979" title="buckets" src="/wp-content/uploads/buckets.png" alt="" width="467" height="35" srcset="/wp-content/uploads/buckets.png 467w, /wp-content/uploads/buckets-300x22.png 300w" sizes="(max-width: 467px) 100vw, 467px" />
  
  <p class="wp-caption-text">
    In this example, there are three employees named "Barry", "Chris", and "Ray"
  </p>
</div>

Inside each of the &#8220;main&#8221; sections for each employee, I&#8217;ve created pages for the &#8220;planned&#8221; projects, as well as a page for what I call &#8220;Activities/Tasks&#8221;, which would be &#8220;unplanned projects&#8221;.

<div id="attachment_5980" style="width: 485px" class="wp-caption aligncenter">
  <img class="size-full wp-image-5980" title="projects" src="/wp-content/uploads/projects.png" alt="" width="475" height="110" srcset="/wp-content/uploads/projects.png 475w, /wp-content/uploads/projects-300x69.png 300w" sizes="(max-width: 475px) 100vw, 475px" />
  
  <p class="wp-caption-text">
    Barry is working on three projects, plus Tasks/Activities
  </p>
</div>

### The Plan In Action

It&#8217;s pretty simple. Once this is set up, for every project, I simply input status and information on the associated page. Once a project is completed, I move it to the &#8220;Archive&#8221; section for that team member (in OneNote, just right-click on the page and choose &#8220;Move&#8221;).

I&#8217;m still working out the &#8220;Tasks/Activities&#8221; section, however. I&#8217;m expermienting with creating sub-pages for each task, which makes them easier to move around (the current plan would be to simply strikethrough the task on the page when it is completed; that doesn&#8217;t really get it into the archive, however). This is how the subpages would look:

<div id="attachment_5981" style="width: 163px" class="wp-caption aligncenter">
  <img class="size-full wp-image-5981" title="sub-pages" src="/wp-content/uploads/sub-pages.png" alt="" width="153" height="141" />
  
  <p class="wp-caption-text">
    Each task has its own page inside the section, which makes it portable
  </p>
</div>

### More to Consider

One neat thing about using OneNote is that it has awesome integration with Outlook. For example, if I get an email that generates an activity for a team member, I can easily send it directly to OneNote from Outlook, which will create a page with all the info in that email.

I also haven&#8217;t really looked into the tagging features in OneNote; by tagging things, I can easily search and filter on certain kinds of tasks/projects. I need to be careful to not make this system too complex &#8211; so I&#8217;m starting out with this very basic structure, and I&#8217;ll see where it takes me.

As I mentioned before, this is a work in progress. It&#8217;s NOT a complete solution yet, but I&#8217;ll keep revisiting it and revamping it&#8230;and posting as I polish it. But now I really need feedback from my readers on how I could be doing it better. I&#8217;m not necessarily looking for OneNote specific tweaks (although I&#8217;d love any you have), but more about _how_ to organize this information in a useful way. **Do you manage a team of people? What are you systems for keeping track of resources and task-followups?**

<div class="zemanta-pixie" style="margin-top: 10px; height: 15px;">
  <a class="zemanta-pixie-a" title="Reblog this post [with Zemanta]" href="http://reblog.zemanta.com/zemified/29771d90-8072-4a78-b3d4-fd33432e71d2/"><img class="zemanta-pixie-img" style="border: medium none; float: right;" src="http://img.zemanta.com/reblog_c.png?x-id=29771d90-8072-4a78-b3d4-fd33432e71d2" alt="Reblog this post [with Zemanta]" /></a><span class="zem-script pretty-attribution"></span>
</div>