---
title: Why I’m Considering Ditching Thesis For My Own Custom Theme
author: Matt Stratton
layout: post
date: 2012-01-30T14:00:54+00:00
url: /tech/why-im-considering-ditching-thesis-for-my-own-custom-theme
description: Long-time readers of this blog will be aware that I have been a vocal supporter and proponent of the Thesis framework for WordPress for quite some time. This site runs on Thesis, and I am always keen to recommend it to others. That being said, I&#8217;ve recently been considering dropping Thesis from this blog and replacing it with my own custom theme.
image: /wp-content/uploads/thesis1.png
thesis_post_image_vertical:
  - before-post
thesis_thumb:
  - /wp-content/uploads/thesis1tn.png
dsq_thread_id:
  - 557720744
categories:
  - Meta
  - Tech
tags:
  - thesis
  - wordpress

---
Long-time readers of this blog will be aware that I have been a vocal supporter and proponent of the Thesis framework for WordPress for quite some time. This site runs on Thesis, and I am always keen to recommend it to others (for crying out loud, there&#8217;s a giant ad for Thesis in my sidebar). That being said, I&#8217;ve recently been considering dropping Thesis from this blog and replacing it with my own custom theme.

Why am I thinking about this? Over the past few months, I&#8217;ve been working on a side project developing a custom CMS and blog using WordPress for the <a href="https://www.chicagophoto.org" target="_blank">Chicago Photography Center</a>. When I started the project, I considered using Thesis for the theme/framework&#8230;and decided that with the very high level of customization that was going to be required, it was going to be a better solution to develop a custom theme (that, and I wanted to flex my PHP chops).

In the process, I learned a LOT about theme development. And when I had to do some coding updates the other day for <a href="https://www.itbuildscharacter.com" target="_blank">It Builds Character</a>, I was actually a little annoyed to have to do them in Thesis, when I had just spent the previous few months wallowing in my own code. This made me start to reconsider my choice of Thesis for this blog (and possible IBC). Here are some of my reasons why.

## Thesis compatibility with plugins

Another WordPress add-on that I love is W3TotalCache. This is a plugin which is useful for dramatically increasing the performance of your WordPress site through a mixture of page/object caching, CDN configuration, and minification. However, I&#8217;ve often run into issues getting this plugin to work &#8211; especially when I try to mix the Thesis dynamic CSS file with the minification and CDN delivery in W3TC.

I&#8217;m not alone &#8211; if you Google  <a href="https://www.google.com/search?q=thesis+w3+total+cache" target="_blank">&#8220;thesis w3 total cache&#8221;</a> you will find a multitude of people having issues with the combination of W3TC and Thesis. Of course, one could make the argument that this is more of a W3TC issue than a Thesis one, and you&#8217;re probably right. That being said, **I have a greater chance of the developer of W3TC testing his code against a stock WordPress install than Thesis** (and comments I&#8217;ve seen have led me to believe that the developer has no interest in testing against Thesis).

This is true of other plugins as well &#8211; when I look to install or update a plugin, WordPress happily reports as to whether or not the developer has tested the plugin with the version of WordPress I am running. There is no such report for Thesis compatibility.

Of course, it&#8217;s entirely possible that a plugin would be incompatible with my own custom theme. The upshot is **when it&#8217;s my code, I can fix it myself**. And I don&#8217;t run the risk of installing an &#8220;upgrade&#8221; to my theme that might break plugins or behavior.

## Flexibility

This might sound a little wacky, since one of the main benefits of Thesis is its flexibility. And it&#8217;s VERY flexible. **But it&#8217;s not nearly as flexible as writing my own code.** For instance, on the IBC site we have enabled the _Show interior layout borders_ option. But when I had to removed it on one portion of the layout, it took a little digging (okay, a VERY little digging, thanks to Chrome Developer Tools) to figure out exactly where Thesis had declared that setting. Which was pretty easy to just override in the custom.css. However, once I did that, I decided I didn&#8217;t like the way the sidebar didn&#8217;t extend all the way to the footer like the content did. If it was my theme, I could have switched around the layout in the manner I wanted (I&#8217;m sure there are all sorts of ways to do this in Thesis, so don&#8217;t bother telling me how to do it in the comments &#8211; that&#8217;s not my point).

Thesis _is_ super powerful and flexible &#8211; if you learn Thesis. I know there &#8216;s nothing I can do in my custom theme that a Thesis guru cannot do with some clever hooks or custom.css wizardry. That being said, **I&#8217;ve come to the conclusion that I&#8217;d rather invest my time and effort in becoming a PHP/WordPress expert**, and not a Thesis expert.

## Workflow has become a pain

One of the things I like about my implementation of Thesis is the use of a &#8220;post image&#8221; and a &#8220;post thumbnail&#8221;, which are used outside of the actual post content to create a header image and then a thumbnail for teasers. However the manner of getting them going is a royal PITA in my Thesis implementation. First I have to upload BOTH files (the full post image and the thumbnail) into the Media Library of WordPress (I can&#8217;t have Thesis auto-generate my thumbnails because I want to serve them via the CDN). Then I have to copy the URL of the images and paste them into the option boxes in the post.

Is this the end of the world? No. But wouldn&#8217;t it be better to just use the built-in &#8220;Featured Image&#8221; functionality of WordPress? Again, this is totally possible to hook together with Thesis (I am sure) &#8211; but why spend all that time coding to hack Thesis, when I could be hacking together my OWN code?

## Supportability

One of the reasons I&#8217;m considering investing some time in re-coding It Builds Character into a custom theme is that I am NOT the only person who does work on that site. Occasionally, <a href="https://twitter.com/ChiMomWriter" target="_blank">ChiMomWriter</a> needs something coded or tweaked, and I don&#8217;t have time to do it for her &#8211; so she hires outside help. Outside help that not only needs to know WordPress (and be capable of understanding my strange configurations of it) but also understands Thesis. It&#8217;s basically a secondary level of software knowledge required. Granted, there are eleventy-billion self-granted Thesis gurus out there, but there are even more (possibly within your circle of trust) who know WordPress alone.

## Should YOU drop Thesis?

Absolutely not. **By no means am I trying to say that Thesis is a bad product or that nobody should use it**. Quite the contrary &#8211; if you aren&#8217;t interested in doing anything more than very light coding, Thesis is a GREAT way to add a ton of power and flexibility to your WordPress site. I will continue to recommend it to just about anyone (and if you DO decide to go with Thesis, please feel free to use my <a href="/thesis" target="_blank">affiliate link</a>). But as I&#8217;ve learned more about theme development, I feel like I&#8217;ve &#8220;outgrown&#8221; Thesis, and I&#8217;d rather expend my skull sweat on writing my own code instead of getting to be a SME on Thesis.

_What about you? If you are currently using the Thesis framework, what do you like about it? Have you considered switching to your own custom theme? Let me know in the comments!_

&nbsp;