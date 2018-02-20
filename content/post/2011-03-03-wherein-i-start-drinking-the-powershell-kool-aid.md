---
title: Wherein I start drinking the PowerShell Kool-Aid
author: Matt Stratton
layout: post
date: 2011-03-03T14:00:36+00:00
url: /tech-tips/wherein-i-start-drinking-the-powershell-kool-aid
thesis_post_image:
  - /wp-content/uploads/powershell_logo-e1299160988113.png
thesis_post_image_horizontal:
  - center
thesis_post_image_vertical:
  - before-post
description:
  - "If you're a Microsoft system administrator, it's hard to avoid PowerShell. Pretty much any of the recent versions of Microsoft server technologies are heavily reliant upon this scripting system. I've been resistent to it for a while now, insisting upon using vbscript for most of my scripting tasks, but I've recently done a complete turnaround and embraced it wholeheartedly."
thesis_keywords:
  - powershell
dsq_thread_id:
  - 244490487
categories:
  - Tech Tips
tags:
  - powershell

---
If you&#8217;re a Microsoft system administrator, it&#8217;s hard to avoid PowerShell. Pretty much any of the recent versions of Microsoft server technologies are heavily reliant upon this scripting system. I&#8217;ve been resistent to it for a while now, insisting upon using vbscript for most of my scripting tasks, but I&#8217;ve recently done a complete turnaround and embraced it wholeheartedly.

Apologies in advance for a somewhat random blog post &#8211; future posts will be more targeted about specific PowerShell topics, but for now, I&#8217;m just capturing a few things I&#8217;ve learned so far (and trying out the <a href="http://www.wordpress-plugin.org/plugin/syntax-highlighter-for-wordpress-plugin/" target="_blank">Syntax Highlighter For WordPress Plugin</a> that I just installed).

# The right tools for the job

PowerShell scripts can be created or edited in any text editor (for example, Notepad), but for true PowerShell, um, power, you need something more robust. My text editor of choice is <a href="http://www.editplus.com/" target="_blank">EditPlus</a>, which can be a decent working environment for PowerShell, although it lacks syntax highlighting for PowerShell (since it&#8217;s not PS-aware). However, I&#8217;ve completely fallen in love with Idera&#8217;s <a href="http://www.idera.com/Products/PowerShell/PSP/" target="_blank">Powershell Plus IDE</a>. It&#8217;s like Visual Studio for PowerShell. It&#8217;s not cheap ($199/user), but if you&#8217;re going to be a hardcore PowerShell scripter, you&#8217;ll really see the value. I&#8217;m planning on doing a deeper dive on this tool in a future blog post (someone make sure to remind me that I promised to do this!)

# Some example code

My current project is to use PowerShell to automate the configuration of newly provisioned IIS servers in our dev/test environment. All of our test servers require a substantial amount (over a dozen) of IIS sites per box, and they all have pretty specific configurations. Doing this manually is a real pain the butt, as well as running the risk of inconsistent configuration (for example, my senior sysadmin is always complaining about the fact that I never remember to change the log file directory for IIS sites I build. This is why it&#8217;s dangerous to allow management to actually do technical work, apparently.)

First things first &#8211; if you are using PowerShell 2.0, and want to do any cool IIS manipulation, you need to load the WebAdministration module, as follows:

[powershell]
  
Import-Module WebAdministration
  
[/powershell]

Once I&#8217;ve done this, I can do some nifty things. For example, we never use &#8220;Default Web Site&#8221;. You can&#8217;t remove this site with the GUI, but PowerShell lets you whack it completely:

[powershell]
  
if (Test-Path &#8220;iis:sites\Default Web Site&#8221;){
  
Remove-Website -name &#8220;Default Web Site&#8221;
  
}
  
[/powershell]

See what I did there? First we check if there is a site called &#8220;Default Web Site&#8221;. If there is, we remove it. Pretty simple.

The other nifty thing to notice is that we can access IIS sites just like they were any other part of the file system (which lets us use the &#8220;Test-Path&#8221; command).

Once I&#8217;ve completed my build script, I&#8217;m going to create a post that explains it in detail, but this should illustrate some of the really quick and dirty things you can do with PowerShell that are way harder to do in the GUI.

**_What about you? What tasks have you started using PowerShell to automate? What are your favorite PowerShell tools or websites?_**