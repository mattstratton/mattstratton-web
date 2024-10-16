---
title: The wonderful mess of information syncronization
author: Matt Stratton
layout: post
date: 2007-02-05T18:33:00+00:00
url: /tech/the-wonderful-mess-of-information-syncronization
dsq_thread_id:
  - 28261332
categories:
  - Tech

---
<span class="postbody">So <a href="https://mugsy1274.livejournal.com/459460.html">a while ago</a>, I asked some questions and ranted about my difficulty in keeping my contacts in sync. </p> 

<p>
  I think I&#8217;m 99% of the way to a solution, although I won&#8217;t be able to fully test until I get home and install some stuff on my Mac. I&#8217;m going to explain what I&#8217;m doing, what I plan to do, and what I still need, in the hopes that a) someone might be able to help me fill in the gaps, and b) it might help some other folks.
</p>

<p>
  For starters, here are the various places I have information stored, and that I would like to keep in sync. For purposes of this discussion, the only information I am syncing are contacts and calendars.
</p>

<p>
  Devices: <br /> Mac Mini <br /> BlackBerry Pearl <br /> Windows laptop (work)
</p>

<p>
  Contacts: <br /> Address Book on OS X <br /> Gmail Contacts <br /> Address Book on BlackBerry
</p>

<p>
  Calendars: <br /> iCal on OS X <br /> Calendar on BlackBerry <br /> Google Calendar &#8211; includes several calendars, which are &#8220;Personal&#8221; (main), &#8220;Work&#8221;, and &#8220;Wedding&#8221; (shared) <br /> Lotus Notes Calendar
</p>

<p>
  Generally speaking, I want all Contacts in sync with each other, as well as the calendars. The only difference is that iCal and the BlackBerry should sync with all the Google Calendars, and Lotus Notes should only sync with the &#8220;Work&#8221; calendar. Lotus Notes also has no need to sync any address book information.
</p>

<p>
  So, how am I doing this right now? Currently, my Lotus Notes calendar is being &#8220;synced&#8221; with the Google Calendar by hand &#8211; that is, I manually put in my meetings, information, etc. Which is fine, except that I have to remember to do it. Most of my &#8220;work&#8221; entries come from email invites, so unless I remember, I rarely will update the Gcal with any new meetings. About every two weeks I manually reconcile the calendars. Which kind of defeats the purpose of having it (the reason I want my Notes calendar on my Gcal and BB is so that when I&#8217;m at home, I can check to see if I have early meetings the next day, etc).
</p>

<p>
  I don&#8217;t really have a sync for iCal and Gcal right now &#8211; I have iCal subscribe to all of my Gcal calendars, and refresh every 30 minutes or so. Which gives me a read-only copy of all my calendars in iCal (which is then dumped down to the BlackBerry via PocketMac). This is not ideal, because it means that the only place I can actually enter calendar information is in Gcal directly. That&#8217;s not a big deal with iCal, since I rarely enter events there, but at this point if I create/edit events on the BlackBerry, they will never make their way up to Gcal.
</p>

<p>
  Luckily, I just found out that <a class="postlink" target="_blank" href="https://blog.spanningsync.com/">Spanning Sync</a> has gone into public beta. This is a tool that does a two-way sync between iCal and Gcal. I will be installing it as soon as I get home tonight, and that solves a large portion of my calendar sync issues.
</p>

<p>
  However, it does not help with the Contacts. Again, the authoritative source for my contacts is Address Book on OS X &#8211; which then syncs (two-way) to the BlackBerry via <a class="postlink" target="_blank" href="https://www.pocketmac.net/products/pmblackberry/">PocketMac</a>. This is kind of a crappy setup right now, since I don&#8217;t really like how PocketMac is working (it lacks the ability to sync over Bluetooth, and some of the sync features bug me). Luckily, the <a class="postlink" target="_blank" href="https://www.markspace.com/missingsync_blackberry.php">BlackBerry version of the Missing Sync</a> is supposed to be coming out soon, and that should help with that.
</p>

<p>
  So what&#8217;s still missing? I need a way to sync my Lotus Notes calendar with Gcal (there&#8217;s a tool out there called &#8220;<a class="postlink" target="_blank" href="https://www.companionlink.com/products/companionlinkforgoogle.html">CompanionLink for Google Calendar</a>&#8221; that will sync Notes with Gcal, but it only can sync the &#8220;default&#8221; Gcal calendar, so that doesn&#8217;t help). And I still need an automated way to keep my OS X Address Book in sync with the Gmail contacts. </span>
</p>