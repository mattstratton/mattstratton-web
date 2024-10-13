---
title: Windows Users – Please Read and Protect Yourself
author: Matt Stratton
layout: post
date: 2003-08-11T23:52:00+00:00
url: /life-in-general/windows-users-please-read-and-protect-yourself
dsq_thread_id:
  - 28246983
categories:
  - Personal

---
There&#8217;s a pretty large vulnerablity in almost all versions of Windows that is <a href="https://isc.sans.org/diary.html?date=2003-08-11" target="_blank">being exploited</a> currently.

One of the symptoms will be a dialog box reading:

**System is shutting down in 60 seconds. Please save any files blahblah.
  
Shut down has initiated by NT Authority System.
  
Windows must restart because the remote productivity call service terminated unexpectedly.**

The patch is available here..

This affects the following systems:

Windows NT 4.0 Server
  
Windows NT 4.0 Terminal Server Edition
  
Windows 2000
  
Windows XP (Home and Professional)
  
Windows Server 2003

People, please keep up to date on [Windows Update][1] if you run a Microsoft OS. Remember, it is your responsiblity to protect your system.

It really does amaze me how many people fail to keep their antivirus defintions up to date (or don&#8217;t even run AV at all), or don&#8217;t keep their operating system patched.

It&#8217;s like a car. It needs maintence. You take your car in when the &#8220;check engine&#8221; light goes on. You put gas in the car, and check the air in the tires. A computer is not a toaster.

Also, if you have a broadband connection, please either put your computer behind a [firewall][2] or at least install something like [ZoneAlarm][3] or use the [firewall built into XP][4]. Ideally, you should be behind a router AND running a software firewall, but at least do one.

Think about how foolish you would feel if someone broke into your house and vandalized your walls, stole your stuff, and used your phone line to call a bunch of 900 numbers, and when asked &#8220;did you lock your door?&#8221; you said &#8220;why should I have to?&#8221;

A great utility for detecting how well your firewall is working is [Shields Up!][5].

Check it out. I bet you&#8217;ll be scared.

Incidentally, I am well aware that some of the tips I have provided are not the most ideal and locked down scenarios. Yes, putting up a Linux firewall between your home network and your router is better. Yes, there are other things to do when locking down your PC. All I&#8217;m trying to do here is get some basic stuff out there that is a helluva lot better than nothing.

Another great tool is the Microsoft Baseline Security Analyzer. This tool will scan your computer against Microsoft&#8217;s best practices for security, alert you to any big problems, and tell you how to fix it. If you&#8217;re running a Windows server, you really should already know about this tool. It&#8217;s useful to run on your home PC as well, if you&#8217;re running Windows NT 4.0, Windows 2000, Windows XP or Windows Server 2003.

m.

 [1]: https://windowsupdate.microsoft.com
 [2]: https://www.linksys.com/Products/product.asp?grid=34&scid=29&prid=20
 [3]: https://download.com.com/3000-2092-10217783.html?tag=lst-0-1
 [4]: https://www.microsoft.com/WindowsXP/home/using/howto/homenet/icf.asp
 [5]: https://grc.com/x/ne.dll?bh0bkyd2