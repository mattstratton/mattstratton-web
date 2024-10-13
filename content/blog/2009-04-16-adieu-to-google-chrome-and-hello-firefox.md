---
title: Thursday Tech Tip – In which I bid adieu to Google Chrome and once again embrace Firefox
author: Matt Stratton
layout: post
date: 2009-04-16T11:01:54+00:00
url: /tech-tips/adieu-to-google-chrome-and-hello-firefox
aktt_notify_twitter:
  - no
dsq_thread_id:
  - 28264876
categories:
  - Tech Tips

---
I&#8217;ll happily admit it &#8211; I&#8217;m an early adopter, and I like playing with new toys. I got my first TiVo in 1999, for example. So when I heard that Google had their very own fancy-pants web browser, called <a href="https://www.google.com/chrome" target="_blank">Chrome</a>, I downloaded and installed it as soon as the servers would let me. I used Chrome for about a week, but soon gave up on it due to its lack of extensions and the fact that it choked on about 75% of the sites I used regularly.

About two months ago, while rebuilding my laptop, I thought to myself &#8220;Self, it&#8217;s time to try Google Chrome again.&#8221; So I bopped to the <a href="https://www.google.com/chrome/eula.html" target="_blank">download page</a> and installed the son-of-a-gun.

All was well for a while. I ran Chrome on my XP laptop at work, and my Vista desktop at home. I marveled at the speed at which it rendered Javascript heavy sites like Gmail. I loved the integration of <a href="https://gears.google.com/" target="_blank">Gears</a>. I cheered aloud when tab isolation kept a bad page from crashing my entire browser.

But then&#8230;the troubles began. Webpages started to have broken images inside them, but only in Chrome.

<div id="attachment_5062" style="width: 189px" class="wp-caption aligncenter">
  <a href="/wp-content/uploads/2009/04/chrome404.jpg"><img class="size-full wp-image-5062" title="chrome404" src="/wp-content/uploads/2009/04/chrome404.jpg" alt="chrome404" width="179" height="371" srcset="/wp-content/uploads/2009/04/chrome404.jpg 299w, /wp-content/uploads/2009/04/chrome404-145x300.jpg 145w" sizes="(max-width: 179px) 100vw, 179px" /></a>
  
  <p class="wp-caption-text">
    Notice the lack of images in the NetworkedBlogs widget
  </p>
</div>

Plus, worse, entire pages wouldn&#8217;t load due to random so-called DNS errors&#8230;but a refresh always brought the page up.

<div id="attachment_5063" style="width: 675px" class="wp-caption aligncenter">
  <a href="/wp-content/uploads/2009/04/chromednserror.jpg"><img class="size-full wp-image-5063" title="chromednserror" src="/wp-content/uploads/2009/04/chromednserror.jpg" alt="chromednserror" width="665" height="257" srcset="/wp-content/uploads/2009/04/chromednserror.jpg 1109w, /wp-content/uploads/2009/04/chromednserror-299x116.jpg 299w, /wp-content/uploads/2009/04/chromednserror-1024x396.jpg 1024w" sizes="(max-width: 665px) 100vw, 665px" /></a>
  
  <p class="wp-caption-text">
    Chrome is claiming the server cannot be found, but other browsers on the same computer have no issue. And a refresh always loads it.
  </p>
</div>

<div id="attachment_5064" style="width: 440px" class="wp-caption aligncenter">
  <a href="/wp-content/uploads/2009/04/chromenopants.jpg"><img class="size-full wp-image-5064" title="chromenopants" src="/wp-content/uploads/2009/04/chromenopants.jpg" alt="chromenopants" width="430" height="227" srcset="/wp-content/uploads/2009/04/chromenopants.jpg 538w, /wp-content/uploads/2009/04/chromenopants-300x158.jpg 300w" sizes="(max-width: 430px) 100vw, 430px" /></a>
  
  <p class="wp-caption-text">
    Slightly different error, but identical symptom
  </p>
</div>

Enough was enough. I determined (through frantic Googling&#8230;no irony intended) that this was related to <a href="https://jackkonblog.blogspot.com/2009/02/why-does-google-chrome-sometimes-have.html" target="_blank">some potential issues with DNS caching</a>. Disabling prefetching in Chrome should resolve this issue &#8211; but Chrome was already in a precarious situation as my browser of choice.

Things came to a head yesterday at work. I was cruising along in Chrome, with only about five tabs open (most likely <a href="https://gmail.com" target="_blank">Gmail</a>, <a href="https://yehoodi.com" target="_blank">Yehoodi</a>, <a href="https://facebook.com" target="_blank">Facebook</a>, <a href="https://google.com/reader" target="_blank">Google Reader</a>, and possibly <a href="https://getclicky.com" target="_blank">Clicky</a> or even Good Old Rock). My laptop suddenly became very non-responsive. Opening Task Manager revealed that one instance of Chrome was using **1.5 GB of RAM**. Mind you, this was after about ten minutes of use.

1.5 GB of RAM.

Outlook never gets that high. Even memory-leaky Firefox never gets there. Hell, even <a href="https://www.tweetdeck.com" target="_blank">TweetDeck</a> won&#8217;t hit 1.5 GB after only ten minutes.

I gave Chrome one more chance. I killed the process (Chrome wouldn&#8217;t shut down otherwise) and tried again.

Within 15 minutes, I was up to over 1 GB in memory on a single instance of Chrome.

Sorry, Google Chrome. It was a fun ride, but I&#8217;m not ready for you yet. Or maybe you&#8217;re not ready for me. Combining these issues with the lack of extensions (add-ons are one of my favorite things about Firefox), I had to call it off. I&#8217;m aware that there are ways around these things, and I know that there are experimental versions of Chrome that will let me install add-ons (of course, even when I set Chrome to use the dev branch, it never found these updates), but I just can&#8217;t play games with my browser anymore. This is where I live, people. This is my HOUSE.