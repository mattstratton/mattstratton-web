---
title: Making Jenn Fast – How I Sped Up A WordPress Blog
author: Matt Stratton
layout: post
date: 2011-07-26T04:06:38+00:00
url: /tech-tips/making-wordpress-faster
thesis_post_image:
  - /wp-content/uploads/FastWomanDSO.jpg
thesis_description:
  - Speed matters, right? It’s a proven fact that the speed of page load has a direct impact on Google rankings and visitor conversion. Well, it’s about as proven as anything is on the Internet, which basically means that a lot of us think it sounds logical, so it must be true. Regardless, having a faster website can only be a good thing and help you feel way more awesome about yourself. In this blog post, I’ll summarize some of the tweaks I made to my friend Jenn’s blog – Jenn Said What?! – to make her a blogger speed demon.
dsq_thread_id:
  - 368613533
categories:
  - Tech Tips
tags:
  - wordpress

---
Speed matters, right? It’s a proven fact that the speed of page load has a direct impact on Google rankings and visitor conversion. Well, it’s about as proven as anything is on the Internet, which basically means that a lot of us think it sounds logical, so it must be true. Regardless, having a faster website can only be a good thing and help you feel way more awesome about yourself. In this blog post, I’ll summarize some of the tweaks I made to my friend Jenn’s blog – <a href="http://jennsaidwhat.com/" target="_blank">Jenn Said What?!</a> – to make her a blogger speed demon.

## How do we measure up?

There are two tools I used to measure the performance of Jenn’s website. One is <a href="http://code.google.com/speed/page-speed/" target="_blank">PageSpeed</a>, which is a Google Chrome extension that provides a “score” to evaluate how well a page stacks up to a list of good practices for speedy pages. A high PageSpeed score doesn’t necessarily mean that your page loads quickly, but it does mean that you’re doing everything you can to make it fast.

The other tool is <a href="http://www.webpagetest.org" target="_blank">WebPageTest.org</a>. This is a super-cool (and free!) online tool that will load any website from various locations around the world, using different browsers, and report back on how long the page took to load – as well as some tips and suggestions on how to make things faster.

Prior to making any changes, this is how Jenn Said What?! scored:

### PageSpeed

**Score: 77/100**

The two “red” areas that PageSpeed identified for us here were “Serve scaled images” and “Leverage browser caching”. The first problem is that the social icons on the page (the small Facebook, LinkedIn, etc icons) were 512&#215;512 images, but were scaled to 60&#215;60. That meant that the browser had to download four large images, only to then resize them to a smaller version. Using the proper sized images would save 224 KB in request (or about 1/4 of a MB). That doesn’t sound like much, but it’s actually kind of huge.

The other area, browser caching, is more of a factor for return visitors. None of the images or elements on the page were set to be cacheable by the browser, which meant that every time they were loaded, it was a call to the server. For things like the aforementioned social icons, this can start to add up, especially as people go from post to post through the blog. Adding expiration headers to allow browsers to cache these elements can make the user experience a lot faster once the initial page has been loaded.

### WebPageTest.org

Overall, the speed of Jenn Said What?! wasn’t _terrible_…WPT (using IE8) reported 8.271 seconds until the homepage was fully loaded. That’s not abysmally slow, but it’s certainly not fast. One of the main areas of potential improvement recommended by WPT was to use a CDN (Content Delivery Network) which helps offload the delivery of things like images or scripts from the main web server to a global network of content servers.

[<img style="background-image: none; padding-left: 0px; padding-right: 0px; display: inline; padding-top: 0px; border: 0px;" title="before-test" src="/wp-content/uploads/before-test_thumb.png" alt="before-test" width="552" height="432" border="0" />][1]

## The Changes

First item of business was to resize the social icons. This was done easily in Photoshop, and was a quick win.

For the rest of the tweaking, I turned to my performance tool of choice for WordPress, the <a href="http://wordpress.org/extend/plugins/w3-total-cache/" target="_blank">W3 Total Cache plugin</a>. This plugin is definitely not for the faint of heart, but used properly, you can make some major changes to your site’s performance. For Jenn’s site I enabled all of the features, with the exception of minification/combination of JavaScript and CSS – these take a lot of trial and error, and I wasn’t ready to do that tonight!

## The Results

After implementing my changes, the PageSpeed score for Jenn Said What?! went from 77/100 to 87/100 – a ten point increase! That’s quite a bit of a jump. There are still a few areas that could be improved, but they are all “yellow”, which means they are of somewhat questionable value – and a lot of them are out of Jenn’s control (for example, the badge for Bloggers in Sin City doesn’t specify an expiration, but since it’s hosted offsite, we cannot control that)

WebPageTest.org reported a speed increase as well – going from 8.271 seconds down to 6.714 seconds. That’s about a 1.5 second improvement. That might not sound like a lot, but it’s definitely a move in the right direction. If we get really clever with combining/minifiying JavaScripts and CSS, and even do some more image optimization, we could probably shave off another second or two.

[<img style="background-image: none; padding-left: 0px; padding-right: 0px; display: inline; padding-top: 0px; border: 0px;" title="after-test" src="/wp-content/uploads/after-test_thumb.png" alt="after-test" width="549" height="407" border="0" />][2]

## How Exactly Does It Work?

I will be having a follow-up post, either here, or if I ever get around to doing my guest posts at <a href="http://doniree.com" target="_blank">Doniree.com</a>, that goes in-depth on all of the configurations for W3TC and all of the measuring tools used here. Stay tuned!

 [1]: /wp-content/uploads/before-test.png
 [2]: /wp-content/uploads/after-test.png