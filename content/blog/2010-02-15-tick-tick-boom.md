---
title: Tick, tick…boom
author: Matt Stratton
layout: post
date: 2010-02-16T03:30:04+00:00
url: /meta/tick-tick-boom
thesis_post_image:
  - /wp-content/uploads/explode.png
thesis_post_image_horizontal:
  - right
thesis_post_image_vertical:
  - before-post
thesis_thumb:
  - /wp-content/uploads/explode-tnail.png
dsq_thread_id:
  - 67216179
categories:
  - Meta

---
Remember yesterday when I was <a href="/meta/week-2-recap" target="_self">bragging</a> about having 1,700 pageviews of my <a href="/hilarity/hundreds-of-facebook-users-are-apparently-really-dumb" target="_self">dumb Facebook user blog post</a>? No, you don&#8217;t, since only 19 of you read that post. But if you did&#8230;let me just say this. I hadn&#8217;t seen nothin&#8217; yet.

# The Perfect Storm

## The technology

Over the weekend, I was doing some experimenting with stuff on my blog and my server. I host my blog on a VPS, and due to potential memory constraints, was advised to run lighttpd instead of <a class="zem_slink" title="Apache HTTP Server" rel="homepage" href="https://httpd.apache.org/">Apache</a> as my web server. If you don&#8217;t know what that means, don&#8217;t sweat it&#8230;all you need to know is that Apache is a very common server to run WordPress on, and Lighty&#8230;well, he&#8217;s not as popular.

I&#8217;d run into some issues using lighty, specifically goopy stuff with .htaccess files and any plugins that rely on it. I gave the matter some thought, and figured hey, I have 512 MB of RAM to work with..let&#8217;s try Apache. I putzed with this for a while over the weekend, but never really got it to work the way I wanted to.

Another thing I did this weekend was install the <a href="https://www.w3-edge.com/wordpress-plugins/w3-total-cache/" target="_blank">W3 Total Cache plugin</a>. Yeah, I couldn&#8217;t use it to its full value, since I don&#8217;t have Apache, but it had some neat features. One of them was the ability to use a CDN for things like javascripts, CSS, and images. Since we all know I dig the cloud, I thought it would be cool to migrate this type of content to Amazon <a class="zem_slink" title="CloudFront" rel="homepage" href="https://aws.amazon.com/cloudfront/">CloudFront</a>. I&#8217;m not going to lie and say it was super easy, but it was a great learning experience for me, which is really all that matters.

## The irony clouds gather

This morning, when I went into work, I told my co-worker Shane about implementing CloudFront on my blog. I said something to the effect of &#8220;Do I get the kind of traffic that necessitates serving this content from the edge? No. Was it a cool way to play with Amazon&#8217;s CDN and learn about it? Yes.&#8221;

Later in the morning, I also thought it time to try Apache one more time. I was 99% sure I knew what I was missing in my config files that kept me from getting it going over the weekend, so I spent about five minutes updating the config, and then fired up Apache (it was listening on a different IP address, so all of my current sites kept running on Lighty).

## The part where things start to act weird

About two minutes after starting Apache, I got a weird disconnect error on my WinSCP session (the file transfer program), and it refused to reconnect. I went over to my terminal session in putty, and every command I would enter resulted in a &#8220;cannot allocate memory&#8221; error. Plus, yeah, all the sites were down.

&#8220;Well, this sucks,&#8221; I thought to myself. &#8220;I know that Apache can be memory hungry, but seriously? After two minutes?&#8221;

Since I could not run any commands from the terminal, I couldn&#8217;t even stop Apache. This required a nuclear option, which was to log into my VPS control panel and reset the server. Of course, as soon as I do that, I get called away into a meeting. I figure this is no big deal as a) my job is more important than my blog, and b) I didn&#8217;t have Apache set to start at startup, so when the server came back online, Lighty would fire up and all would be well.

That&#8217;s what I thought, at least. A few minutes later, I got this tweet:

<img class="aligncenter size-full wp-image-5907" title="curious" src="/wp-content/uploads/curious.png" alt="" width="400" height="157" srcset="/wp-content/uploads/curious.png 400w, /wp-content/uploads/curious-300x117.png 300w" sizes="(max-width: 400px) 100vw, 400px" />Sure enough, when I fired up my site on my iPhone, it was the default page for nginx. Which is ANOTHER web server software that I&#8217;d been playing with a while back. Whoops.

Luckily, I have a nifty app on my iPhone that lets me ssh into my webserver. I was able to quickly stop nginx and start Lighty. And all was well with the world.

# The Great <span class="zem_slink">Reddit</span> Invasion

When I got back to my desk, I had an email from a consultant friend of mine. The topic was &#8220;You&#8217;re climbing the Reddit ranks!&#8221; and had a screenshot showing a Reddit link with a vote score of 14 on the &#8220;upcoming&#8221; page on Reddit.

Now, I&#8217;d submitted the **Hundreds of Facebook users are apparently really dumb** post to Reddit myself last week, but got no traction on it. Apparently, someone else submitted it today&#8230;and that someone was more popular on Reddit than I was. Out of curiousity, I logged onto Clicky to see the real-time stats on my blog. And discovered that there had been over 3,000 views of that page today so far.

## The memory issue, explained

Looking at the comments on the Reddit page, I came accross this:

[<img class="aligncenter size-full wp-image-5908" title="outage" src="/wp-content/uploads/outage.png" alt="" width="398" height="121" srcset="/wp-content/uploads/outage.png 398w, /wp-content/uploads/outage-300x91.png 300w" sizes="(max-width: 398px) 100vw, 398px" />][1]This actually was posted at the exact time that I was rebooting my server. So it wasn&#8217;t just Apache that caused the memory issues&#8230;it was Apache PLUS a crapton of Reddit users pounding me.

## Wherein the cloud saves my ass

Remember when I said that CloudFront was not necessary on a blog like mine? Today it totally was. As of the time of this writing, which is about 9 PM, there have been over 22,000 visitors to this site. That&#8217;s about 50% of all of my traffic for 2009&#8230;in one single day.

If I had not offloaded my scripts and images to the CDN, my server would have choked on this. Because I&#8217;m too lazy to count, I&#8217;m going to estimate that the Facebook post page contains about 8-10 images/CSS/javascripts which had been moved to CloudFront. That means that without this, we&#8217;re talking about increasing the HTTP connections to my poor little lighty server to **almost a quarter of a million in one day**. That&#8217;s a lot of freakin&#8217; requests.

I&#8217;m also saved by the fact that I moved away from my old host and am on my VPS now. On my old host, as soon as traffic started to climb, I&#8217;d start to get CPU usage warnings/threats. And that was just if I got up around 800 visits a day. So yay, VPS. And yay, CloudFront.

# Wrap it up, yo

I also added an additional AdSense ad unit just on the Facebook post. I figured all that traffic might be a good time to toss up an ad. Man, did that pay off! I am pretty sure I earned about 98 cents today. That&#8217;s almost an entire dollar.

Of course, my initial calculations are that my CloudFront bill for today will be about $5-$6. That sounds like a lot, but I really don&#8217;t expect to maintain this kind of traffic over more than a day or two. The buck I made from AdSense doesn&#8217;t really counter that. But hey &#8211; if I take my lunch to work one day this week, everything will balance out, right?

_Have you ever had a post completely blow up and generate WAY more traffic than you ever expected? Did your server have a complete meltdown, or did you come through unscathed?_ 

Image licensed via Creative Commons from Flickr user <a href="https://www.flickr.com/photos/gmcmullen/" target="_blank">gmcmullen</a>

<div class="zemanta-pixie" style="margin-top: 10px; height: 15px;">
  <a class="zemanta-pixie-a" title="Reblog this post [with Zemanta]" href="https://reblog.zemanta.com/zemified/74ddab83-f6a0-4626-94ef-a3bd77f5b3a1/"><img class="zemanta-pixie-img" style="border: medium none; float: right;" src="https://img.zemanta.com/reblog_c.png?x-id=74ddab83-f6a0-4626-94ef-a3bd77f5b3a1" alt="Reblog this post [with Zemanta]" /></a><span class="zem-script more-related pretty-attribution"></span>
</div>

 [1]: /wp-content/uploads/outage.png