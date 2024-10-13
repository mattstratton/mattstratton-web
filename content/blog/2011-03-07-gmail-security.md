---
title: Making your Gmail account bulletproof
author: Matt Stratton
layout: post
date: 2011-03-07T23:18:17+00:00
url: /tech-tips/gmail-security
description:
  - Email can be our lifeblood. Your email inbox is the center of your existence, and if it gets compromised, you can be in for a world of hurt. If hackers get access to your email, they can use this access to reset passwords to your Facebook account, or even your online banking accounts. Because of this, you should be doing everything possible to guard the keys to your email kingdom. This post will mostly focus on securing a Gmail account (most tips will apply to Google Apps email as well), but some of the points apply to any email system.
thesis_post_image:
  - /wp-content/uploads/bulletproof.jpg
thesis_post_image_horizontal:
  - center
thesis_post_image_vertical:
  - before-post
dsq_thread_id:
  - 248460605
categories:
  - Featured
  - Tech Tips
tags:
  - gmail
  - security

---
Email can be our lifeblood. Your email inbox is the center of your existence, and if it gets compromised, you can be in for a world of hurt. If hackers get access to your email, they can use this access to reset passwords to your Facebook account, or even your online banking accounts. Because of this, you should be doing everything possible to guard the keys to your email kingdom. This post will mostly focus on securing a Gmail account (most tips will apply to Google Apps email as well), but some of the points apply to any email system.

# Make that password tight, yo

The easiest way for a hacker to get your password is by use of a “brute force” attack. Basically, the hacker uses a script or program to keep trying various combinations of letters and numbers as your password until they guess right. To make this type of attack less effective, you should create a super strong password.

Good passwords do not contain ANY words that might be found in a dictionary. Even if you think that it’s a word nobody could guess, remember that it’s not a person who is trying to figure it out, but a program that is spinning through a dictionary for words. Never ever use a real word in your password.

Of course, the challenge is creating a password that is hard to guess but easy to remember. One trick is to include numbers instead of letters (for example, instead of “password”, use “pa55w0rd”. This USED to be a good trick, but the hackers have gotten smart, and a lot of attacks will substitute the common number/letter substitutions.

One tried and true mechanism is to use an acronym for something that is easy to remember. The example I’ve used for years and years is “Real programmers don’t eat quiche”. The password for this would be “Rpdeq!” Now, that’s actually a crappy password, since it’s only seven characters (you should use at least eight for safety), but you get the idea. A number helps too, so a more robust password (that is easy to remember) would be the phrase “I want to be rich one day!” – the password would be “Iw2br1d!” – eight characters, mixed case, and includes numbers and a special.

# Sometimes, a password isn’t enough

Even if you have a strong password, you might still be in trouble. The reason is this – for some unknown reason, Google has a weaker lockout system on their mobile API than the main Gmail login [citation needed]. This means that hackers can pretend to be a mobile device and just keep trying random combinations over and over again (if they tried this on the main Gmail login, after a few unsuccessful attempts they would be locked out). This is why most hackers are targeting the mobile access to Gmail. Fortunately, there is a solution (but it’s a rough one).

# Two-step Verification with Gmail

The best security systems are called “two-factor”. That means you have to know/have TWO things in order to be authenticated (if you have ever used a security token for access to your company’s VPN, you’ve used two-factor authentication before). Google has implemented an optional feature in Google Accounts for this type of login. Be warned – while it’s not very hard to set up (it does take about ten minutes or so), it WILL make your Google login process go through a few more hoops every time. But as I am fond of saying, “security and convenience are inversely proportional.”

## Setting up two-step verification

The process is pretty straightforward. Log onto your <a href="https://www.google.com/accounts/b/0/ManageAccount" target="_blank">Account Settings page</a> for Google and click on “Using 2-step verification”.

[<img style="background-image: none; padding-left: 0px; padding-right: 0px; display: inline; padding-top: 0px; border: 0px;" title="two-step" src="/wp-content/uploads/two-step_thumb.png" border="0" alt="two-step" width="454" height="174" />][1]

This will then walk you through a step-by-step wizard to configure this setting. As <a href="https://googleblog.blogspot.com/2011/02/advanced-sign-in-security-for-your.html" target="_blank">Google points out</a>, make sure you have time allocated to do this (and don’t try doing it on the train over your aircard – make sure you’ve got a good connection through the whole process), and also ensure you have your mobile phone with you. You can either use text messaging for this or an app on your iPhone, Android device, or Blackberry.

## What does this change?

Once you have two-step verification set up, your Google account/Gmail life will change. First of all, every time you want to sign in to a Google site (such as Gmail) on a computer, not only will you need to know your password, you will need a verification code. This will be generated each time and made available to you either via text message or via your smartphone app. Of course, if you have a trusted computer (such as your home PC or your work laptop, maybe) you can tell Google to “trust” that device for a month, so you will only have to enter the code every 30 days. But when you sign into Gmail at a kiosk at the airport, for example, you’ll need to know this code.

You will also have to re-set up passwords for an programs or apps that access your Google account (for example, if you use Outlook to read your gmail, or the email settings on your iPhone). For this, you will set up application-specific passwords, using the <a href="https://www.google.com/accounts/b/0/IssuedAuthSubTokens" target="_blank">Authorized Access page</a> in your Google account.

You will simply scroll down to the bottom of the page, and enter the name of the application in this box, and click “Generate Password”:

[<img style="background-image: none; padding-left: 0px; padding-right: 0px; display: inline; padding-top: 0px; border: 0px;" title="app-password" src="/wp-content/uploads/app-password_thumb.png" border="0" alt="app-password" width="454" height="184" />][2]

The password for this application will then be displayed. Make sure you only do this when you are ready to use it, as there is no way to display this password again. You can simply copy/paste it into your app. Don’t worry about the spaces.

[<img style="background-image: none; padding-left: 0px; padding-right: 0px; display: inline; padding-top: 0px; border: 0px;" title="app-password2" src="/wp-content/uploads/app-password2_thumb.png" border="0" alt="app-password2" width="454" height="161" />][3]

_(Don’t worry – this password won’t work if you try it on my account, as I have revoked it)_

The good thing is, if you feel that a specific password has been compromised, you can always revoke its access. For example, let’s say you set up a password called “iPhone email”. Then, you lose your iPhone. If you go to this page and revoke the access of “iPhone email”, the person who found your iPhone will not be able to use it to access your email. Of course, you already protected yourself by having a lock code on your mobile device, right? <img class="wlEmoticon wlEmoticon-smile" style="border-style: none;" src="/wp-content/uploads/wlEmoticon-smile.png" alt="Smile" />

Hopefully, these tips will help you keep your Gmail (and Google Apps) mailbox safe from malicious hackers. One final tip – it’s always a good idea to check the recent access to your Gmail account for anything suspicious. To do this, simply scroll down to the very bottom of your inbox and click on Details next to “Last account activity”:

[<img style="background-image: none; padding-left: 0px; padding-right: 0px; display: inline; padding-top: 0px; border: 0px;" title="gmail-activity" src="/wp-content/uploads/gmail-activity_thumb.png" border="0" alt="gmail-activity" width="454" height="128" />][4]

This will show you all the activity on your account. If you see things that look squirrelly, you should consider changing your password (even if you have two-step verification) or revoking any two-step verification that might have been compromised.

 [1]: /wp-content/uploads/two-step.png
 [2]: /wp-content/uploads/app-password.png
 [3]: /wp-content/uploads/app-password2.png
 [4]: /wp-content/uploads/gmail-activity.png