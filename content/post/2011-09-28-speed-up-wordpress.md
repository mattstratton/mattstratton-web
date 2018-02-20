---
title: 'Speeding Up WordPress, Part 1: Basic W3 Total Cache Configuration and Content Delivery Network'
author: Matt Stratton
layout: post
date: 2011-09-29T04:14:40+00:00
url: /tech-tips/speed-up-wordpress
thesis_post_image:
  - http://cdn.mattstratton.com/wp-content/uploads/speedy-header.png
thesis_post_image_horizontal:
  - center
thesis_post_image_vertical:
  - before-post
thesis_thumb:
  - http://cdn.mattstratton.com/wp-content/uploads/speedytn.png
description:
  - Everyone wants their blog to load faster. One of the best ways to improve performance on self-hosted WordPress is using a combination of the W3 Total Cache plugin and a Content Delivery Network such as Amazon CloudFront. This post will walk you through the process, step by step, and have you serving up a speedier blog in no time!
dsq_thread_id:
  - 429044043
categories:
  - Featured
  - Tech Tips
tags:
  - performance
  - site performance
  - wctc
  - wordpress

---
A while ago, I [wrote up a small post][1] posting the results of the &#8220;blog speedup&#8221; I did for my friend [Jenn][2]. What I didn&#8217;t do was actually explain HOW I did it. This post will dive into the settings and steps needed to make your WordPress blog super-duper fast. NOTE: This will only work on a &#8220;self-hosted&#8221; WordPress installation. You will not be able to do this if your blog is hosted at WordPress.com.

## Install W3 Total Cache

The main tool we will be using is the awesome plugin, [W3 Total Cache][3]. This is a plugin that has a LOT of options. Instructions on how to install WordPress plugins are a little out of scope for this article, but if you aren&#8217;t sure how to do this, then I&#8217;m also a little worried that we&#8217;ll be over your head with this. But just in case, here is a hint:

<img class="alignnone size-full wp-image-6762" title="install-w3tc" src="/wp-content/uploads/install-w3tc.png" alt="Installing wordpress plugin" width="500" height="137" srcset="/wp-content/uploads/install-w3tc.png 500w, /wp-content/uploads/install-w3tc-300x82.png 300w" sizes="(max-width: 500px) 100vw, 500px" />

After you have installed it, it must be activated. This is pretty easy. But again, here&#8217;s a screenshot.

<img class="alignnone size-full wp-image-6763" title="activate-w3tc" src="/wp-content/uploads/activate-w3tc.png" alt="" width="500" height="149" srcset="/wp-content/uploads/activate-w3tc.png 500w, /wp-content/uploads/activate-w3tc-300x89.png 300w" sizes="(max-width: 500px) 100vw, 500px" />

Congratulations. You&#8217;ve installed the plugin. This is the easiest part. Now, buckle up, because it&#8217;s gonna get awesome.

## Configure W3 Total Cache

All of the configuration settings can be found under the new &#8220;Performance&#8221; menu on the left side.

<img class="alignnone size-full wp-image-6764" title="sidebar-menu" src="/wp-content/uploads/sidebar-menu.png" alt="" width="148" height="316" srcset="/wp-content/uploads/sidebar-menu.png 148w, /wp-content/uploads/sidebar-menu-140x300.png 140w" sizes="(max-width: 148px) 100vw, 148px" />

If you expand it out, you&#8217;ll see various sections. We&#8217;re going to step through each of them one at a time.

### General Settings

If you&#8217;re a fan of How I Met Your Mother, you probably just saluted when you read this section. Regardless, we will look quickly at the settings you should change in here.

Under &#8220;General&#8221;, you can leave that one alone for now. We&#8217;ll come back here once we have everything set up to actually activate our changes, but you probably don&#8217;t want to do that until you&#8217;ve completely configured everything.

You also want to leave Minify disabled for now. There is an art to minification, and I&#8217;ll dive into it much deeper in another post, but for now, let&#8217;s leave it off.

Go ahead and make sure that &#8220;Enabled&#8221; is checked for Page Cache, Database Cache, and Object Cache. Set it to Disk or Disk Enhanced (if you have other options that show up, awesome, but you probably don&#8217;t. Disk Enhanced is generally good enough for most blogs). Then click &#8220;Save All Settings&#8221;.

### Content Delivery Network

Now comes the real fun part &#8211; configuring our **Content Delivery Network**. Basically, with a CDN, we serve up things like scripts, stylesheets, and images to the browser via a distributed network. Why do we do this? Two things: First, it takes load off of OUR server (see [this post][4] for more details). But secondly, it can vastly improve the performance of the page, because **the browser is now getting those big files from servers that are very close to them**, instead of having to go all the way through the internet to get to YOUR server. In this post, I will be demonstrating how to do this with Amazon S3 and CloudFront. There are other CDN&#8217;s, but I personally use Amazon. Be advised &#8211; **this is NOT a free service**, and the cost model is totally based upon how much traffic you send thorugh it. That being said, I haven&#8217;t found it to be terribly expensive. It is suggested that you watch your usage carefully when you first turn this on &#8211; and if it starts to look spendy, you can always turn it off.

#### Configure the CDN

First, make sure your CDN settings under General Settings look like this, and then click &#8220;Save All Settings&#8221;.

<img class="alignnone size-full wp-image-6765" title="general-settings-cloudfront" src="/wp-content/uploads/general-settings-cloudfront.png" alt="" width="500" height="163" srcset="/wp-content/uploads/general-settings-cloudfront.png 500w, /wp-content/uploads/general-settings-cloudfront-300x97.png 300w" sizes="(max-width: 500px) 100vw, 500px" />

This will generate an error like this:

<img class="alignnone size-full wp-image-6766" title="cdn-error" src="/wp-content/uploads/cdn-error.png" alt="" width="500" height="25" srcset="/wp-content/uploads/cdn-error.png 500w, /wp-content/uploads/cdn-error-300x15.png 300w" sizes="(max-width: 500px) 100vw, 500px" />

Don&#8217;t worry! We&#8217;re going to fix this. Here&#8217;s how. Click on &#8220;CDN&#8221; in the Performance menu:

<img class="alignnone size-full wp-image-6767" title="cdn-nav" src="/wp-content/uploads/cdn-nav.png" alt="" width="158" height="311" srcset="/wp-content/uploads/cdn-nav.png 158w, /wp-content/uploads/cdn-nav-152x300.png 152w" sizes="(max-width: 158px) 100vw, 158px" />

Now scroll down to the section titled &#8220;Configuration&#8221;. You will enter your Amazon Web Services Access Key ID and Secret Key in here:

<img class="alignnone size-full wp-image-6768" title="cdn-config" src="/wp-content/uploads/cdn-config.png" alt="" width="510" height="265" srcset="/wp-content/uploads/cdn-config.png 510w, /wp-content/uploads/cdn-config-300x155.png 300w" sizes="(max-width: 510px) 100vw, 510px" />

&#8220;Wait a tick,&#8221; you are saying. What the hell is an &#8216;Amazon Web Services Access Key ID and Secret Key&#8217;?&#8221;

#### Setting up Amazon

Good question. To get going with this, you will need an AWS account. You will sign up for this at <http://aws.amazon.com/>. Unfortunately, I already have my account, and I&#8217;m not going to create a new one, so you&#8217;ll have to go without screenshots. But once you have your account, sign onto the <a href="https://console.aws.amazon.com/s3/home" target="_blank">management console</a> and click on Security Credentials:

<img class="alignnone size-full wp-image-6769" title="aws-credentials" src="/wp-content/uploads/aws-credentials.png" alt="" width="292" height="140" />

Scroll down to the Access Credentials section. Here&#8217;s where you will find the Access Key ID and Secret Key we just talked about. Don&#8217;t worry if you only see one Access Key on your screen. I&#8217;m honestly not sure why I have two.

<img class="alignnone size-full wp-image-6770" title="access-keys" src="/wp-content/uploads/access-keys.png" alt="" width="500" height="242" srcset="/wp-content/uploads/access-keys.png 500w, /wp-content/uploads/access-keys-300x145.png 300w" sizes="(max-width: 500px) 100vw, 500px" />

Now that you have entered your Access Key ID and Secret Key into the box, it should look like this (obviously mine are blurred out). Enter in a name for the S3 &#8220;bucket&#8221; you want to create (I usually do something with the sitename-origin, but you can call it whatever you want) and then click &#8220;Create Bucket and Distribution&#8221;.

<img class="alignnone size-full wp-image-6771" title="origin-config" src="/wp-content/uploads/origin-config.png" alt="" width="500" height="113" srcset="/wp-content/uploads/origin-config.png 500w, /wp-content/uploads/origin-config-300x67.png 300w" sizes="(max-width: 500px) 100vw, 500px" />

After it has completed successfully, you will see this screen. Click &#8220;Close&#8221;

<img class="alignnone size-full wp-image-6772" title="bucket-confirm" src="/wp-content/uploads/bucket-confirm.png" alt="" width="500" height="169" srcset="/wp-content/uploads/bucket-confirm.png 500w, /wp-content/uploads/bucket-confirm-300x101.png 300w" sizes="(max-width: 500px) 100vw, 500px" />

Later on, you can change the hostname used for your CDN to something from your own domain by creating a CNAME record. But for starters, leave this as it is, and then click &#8220;Test&#8221;:

<img class="alignnone size-full wp-image-6773" title="test-cloudfront" src="/wp-content/uploads/test-cloudfront.png" alt="" width="510" height="128" srcset="/wp-content/uploads/test-cloudfront.png 510w, /wp-content/uploads/test-cloudfront-300x75.png 300w" sizes="(max-width: 510px) 100vw, 510px" />

If everything worked, you will see a small green notification that &#8220;Test Passed&#8221;. Now you can click &#8220;Save All Settings&#8221;.

#### Getting the CDN loaded

There are a few housekeeping things we must do in order to get all of our &#8220;old&#8221; files up to the CDN. One at a time, click the following buttons. Don&#8217;t click another button until the previous one has completed.

<img class="alignnone size-full wp-image-6774" title="buttongs" src="/wp-content/uploads/buttongs.png" alt="" width="510" height="30" srcset="/wp-content/uploads/buttongs.png 510w, /wp-content/uploads/buttongs-300x17.png 300w" sizes="(max-width: 510px) 100vw, 510px" />

Each button will pop up a new window. Make sure you click &#8220;Start&#8221;, and then wait for it to complete before closing the window and clicking the next button. Depending upon the number of images in previous posts, this step could take a long time to complete.

## Pushing the Go Button

Now that you&#8217;ve got your configuration completed, it&#8217;s time to turn it on! Click on the &#8220;General Settings&#8221; link on the Performance menu, and click &#8220;Deploy&#8221; under Preview Mode:

<img class="alignnone size-full wp-image-6780" title="preview-deploy" src="/wp-content/uploads/preview-deploy.png" alt="" width="476" height="212" srcset="/wp-content/uploads/preview-deploy.png 476w, /wp-content/uploads/preview-deploy-300x133.png 300w" sizes="(max-width: 476px) 100vw, 476px" />

&nbsp;

Once completed, you&#8217;ll get this confirmation:

<img class="alignnone size-full wp-image-6781" title="success2" src="/wp-content/uploads/success2.png" alt="" width="329" height="96" srcset="/wp-content/uploads/success2.png 329w, /wp-content/uploads/success2-300x87.png 300w" sizes="(max-width: 329px) 100vw, 329px" />

Success! You have now enabled basic server-side caching, as well as some super awesome Content Delivery Network functionality on your blog.

## One Caveat

Of course, all this caching comes with a bit of a cost. Any time you make a DESIGN type change to your blog (changing your header, or maybe some styling, etc) you will need to &#8220;clear the cache&#8221;. You do this by going to back to the General Settings section of Performance, and clicking &#8220;Empty All Caches&#8221;

<img class="alignnone size-full wp-image-6782" title="empty-cache" src="/wp-content/uploads/empty-cache.png" alt="" width="359" height="205" srcset="/wp-content/uploads/empty-cache.png 359w, /wp-content/uploads/empty-cache-300x171.png 300w" sizes="(max-width: 359px) 100vw, 359px" />

I realize that this post is SUPER long and pretty complex. But hopefully it will help you get started on speeding up your WordPress installation. In Part 2, we will dig into some of the other possible settings, including Browser Caching as well as configuring a CNAME for your CDN so it is served from your own domain. Part 3 will discuss the Minify options. Good luck and speedy serving!

 [1]: /tech-tips/making-wordpress-faster "Making Jenn Fast – How I Sped Up A WordPress Blog"
 [2]: http://www.jennsaidwhat.com
 [3]: http://wordpress.org/extend/plugins/w3-total-cache/
 [4]: /meta/tick-tick-boom "Tick, tick…boom"