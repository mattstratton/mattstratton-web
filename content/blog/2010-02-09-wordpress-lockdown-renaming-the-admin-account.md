---
title: WordPress Lockdown! Part 1 – Renaming the admin account
author: Matt Stratton
layout: post
date: 2010-02-09T21:38:23+00:00
url: /tech-tips/wordpress-lockdown-renaming-the-admin-account
description:
  - |
    By default, when WordPress is installed, an administrative account called "admin" is created. This account is a prime target for hackers, since they know that every WordPress blog has a powerful account with the name "admin". They can launch a password-guessing tool against your blog with the user "admin", and eventually, they might be able to get through. Here's how to "rename" the default admin account in WordPress.
thesis_keywords:
  - wordpress, security, wordpress security
thesis_post_image:
  - /wp-content/uploads/lock.png
thesis_post_image_horizontal:
  - right
thesis_post_image_vertical:
  - before-post
thesis_thumb:
  - /wp-content/uploads/lock1.png
dsq_thread_id:
  - 65563286
categories:
  - Tech Tips
tags:
  - Blog
  - wordpress

---
WordPress is one of the most popular blogging platforms available today. However, it&#8217;s very popularity can work against it &#8211; due to the fact that many people install WordPress but don&#8217;t know how to properly lock it down, it&#8217;s a prime target for hackers who want to exploit it. Making your WordPress blog nice and secure requires a minimal amount of effort &#8211; but it will pay off when you don&#8217;t find yourself in the unenviable position of having your entire blog wiped out by some jerk who thinks it&#8217;s hilarious to mess with other people&#8217;s websites. This post is Part 1, which focuses on the Admin account in WordPress (the keys to the kingdom). Part 2 will discuss methods of protecting your wp-admin directory (which is the door to the kingdom, to continue the metaphor).

_Note &#8211; this tip is for &#8220;self-hosted&#8221; WordPress installations. For purposes of this discussion, &#8220;self-hosted&#8221; means &#8220;not on wordpress.com&#8221;. It doesn&#8217;t mean you yourself own a server, or host your blog out of a computer connected to your cable modem in your basement. Want to know if you&#8217;re self-hosted? Here&#8217;s an easy way to find out: if you have the rights to install plugins into your WordPress, you&#8217;re self-hosted)_

## Renaming the admin account

By default, when WordPress is installed, an administrative account called &#8220;admin&#8221; is created. This account is a prime target for hackers, since they know that every WordPress blog has a powerful account with the name &#8220;admin&#8221;. They can launch a password-guessing tool against your blog with the user &#8220;admin&#8221;, and eventually, they might be able to get through. Obviously, we want to get rid of this account. Here&#8217;s the steps to follow:

### Make sure you&#8217;re not posting as &#8220;admin&#8221;

You should have created a second account which you use for all your posting. If you HAVE been posting as admin, please slap yourself on the wrist. Bad blogger! No cookie! Luckily, this is easy to fix &#8211; create a new user account which you will use for your posting. You can go ahead and give it the role of &#8220;administrator&#8221; if you&#8217;d like. Be advised that email addresses must be unique inside a WordPress installation, so if you want to use the email address you&#8217;ve already assigned to &#8220;admin&#8221;, you&#8217;ll need to change Admin&#8217;s email address first.

_Super secure tip_ &#8211; if you want to be REALLY tight, only give your new account the role of Editor. That way if a hacker figures out your username, they won&#8217;t have unfettered access to your entire blog. This might be considered an &#8220;overkill&#8221; step, as Editors still have the right to delete posts, but they won&#8217;t be able to install plugins that might be sneaky backdoors into your blog. When you want to do admin-type things, you&#8217;ll log in with the new admin account we&#8217;re creating in the next step.

### Create a new admin account

WordPress won&#8217;t let you rename an existing account, but we can accomplish this in a roundabout way. Create a new account that will be considered your &#8220;backdoor&#8221; or &#8220;break glass&#8221; admin for your blog. I suggest giving it a name that you will remember, but not something like &#8220;root&#8221; or &#8220;administrator&#8221;. It&#8217;s okay to have the word &#8220;admin&#8221; IN the login name, however. For example, if your blog is called &#8220;Awesome Blog 2000&#8221;, you might call your admin account &#8220;abadmin&#8221;.

Give that account the &#8220;administrator&#8221; role, and set a REALLY strong password for it. It should be 14 characters long, and include letters, numbers, symbols, and mixed case. I recommend using the <a href="https://strongpasswordgenerator.com/" target="_blank">Strong Password Generator</a> website to create this password. Don&#8217;t worry about remembering it &#8211; you&#8217;re going to store this password in a safe place, but not have to remember it in your head.

Now, go into Authors & Users under &#8220;Users&#8221; in your WordPress settings, and delete the account called &#8220;admin&#8221;. If you&#8217;ve been posting as this user, when you delete it, WordPress will ask you who to assign those posts to &#8211; just pick your own personal account for this. No fuss, no muss.

_Lock image from Flickr user_ <a href="https://www.flickr.com/photos/darwinbell/443924168/" target="_blank"><em>Darwin Bell</em></a>

<div class="zemanta-pixie" style="margin-top: 10px; height: 15px;">
  <a class="zemanta-pixie-a" title="Reblog this post [with Zemanta]" href="https://reblog.zemanta.com/zemified/3aab49a5-e52a-45f2-8cd8-abf99f53cca6/"><img class="zemanta-pixie-img" style="border: none; float: right;" src="https://img.zemanta.com/reblog_c.png?x-id=3aab49a5-e52a-45f2-8cd8-abf99f53cca6" alt="Reblog this post [with Zemanta]" /></a><span class="zem-script more-related pretty-attribution"></span>
</div>