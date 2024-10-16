---
title: Some important email virus information
author: Matt Stratton
layout: post
date: 2003-08-21T17:20:00+00:00
url: /tech/some-important-email-virus-information
aktt_notify_twitter:
  - no
dsq_thread_id:
  - 28247013
categories:
  - Tech
  - Tech Tips
tags:
  - Email

---
A couple friends of mine have been &#8220;accusing&#8221; me of emailing them viruses&#8230;so I figured this was as good a time as any to discuss exactly HOW these viruses work, and why you shouldn&#8217;t go all apeshit when you get a virus that APPEARS to come from a certain email address.

Basically, this is how these email worm propagate (all names used for comedic value and to make things clear).

The cast of characters

**Larry** &#8211; Larry is running Windows XP Home Edition on his brand new Dell computer that he just bought. Larry has a cable modem so that he can buy used porn tapes on eBay. Larry reads his email with Outlook Express.

**Matt** &#8211; Matt also runs a Windows operating system. He is running an updated antivirus software on it. He reads his email with Outlook XP.

**Dallas** &#8211; Dallas uses Linux on his computer. We don&#8217;t know what he uses to read his email, and frankly, we don&#8217;t care.

So let&#8217;s trace the email virus&#8230;Larry&#8217;s computer gets infected with the virus. It immediately goes to his address book, as well as his inbox and sent items folder, and sends emails (with the virus attached) to every single email address it can find. Of course, to make itself harder to track, **it doesn&#8217;t put Larry&#8217;s email address as the &#8220;from&#8221;&#8230;but one of the other email addresses it finds**. For example, Dallas&#8217;s.

Matt receives an email that appears to be from Dallas. His antivirus software strips the infected attachement, but Matt figures out that it was from a virus. He immediately calls up Dallas and yells &#8220;Hey fucker, you sent me a virus&#8221;.

Dallas climbs up on the High Horse of Open Source and quietly and rationally explains that he could not have sent the virus, as he uses StrokeTorvalds-c to read his email, and since nobody but Dallas and Jake use that program, nobody&#8217;s bothered to write a virus for it.

Make sense? Never trust the &#8220;from&#8221; header in email&#8230;it&#8217;s super-easy to spoof. If you have the technology and wherewithal to do so, look at \*all\* the headers. You won&#8217;t always be able to tell exactly WHO sent the email, but you can start to track it down.

Of course, if you a) don&#8217;t open attachements from email EVER or b) run updated AV software, this is less of an issue. But again, before going apeshit on someone, check the \*real\* headers.