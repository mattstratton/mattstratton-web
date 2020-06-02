---
title: 'Thursday Tech Tip – Good Old Rock: Behind the Music'
author: Matt Stratton
layout: post
date: 2009-03-26T14:37:43+00:00
url: /meta/good-old-rock-behind-the-music
aktt_notify_twitter:
  - no
digg:
  - 1
dsq_thread_id:
  - 28264811
categories:
  - Meta
  - Tech Tips
tags:
  - wordpress

---
Recently, a friend made this request for a Thursday Tech Tip: _&#8220;I want to have my own website. I am looking for advice on an idiot-friendly tool or service.&#8221;_

[<img class="  alignright" style="margin: 3px;" src="https://farm4.static.flickr.com/3622/3377681018_b7facd6908.jpg" alt="Lily" width="300" height="200" />][1]{.tt-flickr.tt-flickr-Medium}

Based upon that, I&#8217;ve decided to &#8220;pull back the curtain&#8221; and give you some of the details of how my blog works. This doesn&#8217;t actually answer my friend&#8217;s request, which will wait for a later post. But the request was the catalyst for me to write this one.

**The History**

Good Old Rock began life as [my LiveJournal][2] &#8211; I started writing in it on April 1, 2001. For many years, I got a lot of value out of using LiveJournal as my blogging platform. I had several experiments with moving off of it to a self-hosted blog (or to Vox), but I always came back to LJ. However, in January of 2009, I decided **I was done with LJ**. Partially this was due to rumors of  [Russians shutting down LJ][3]{.snap_shots}, but truly, I wanted to move to allow myself more flexibility with the platform &#8211; and I wanted my blog to be more of my &#8220;site&#8221;, and not just an &#8220;online diary&#8221;. So I rolled up my sleeves, exported all of my LJ posts to a file (using a tool called <a href="https://www.fawx.com/software/ljarchive/" target="_blank">ljArchive</a>, and set up a blog on [WordPress.com][4].

I imported my posts into the WordPress.com blog, and for a while (about two weeks) I was satisfied with my blog. It was easy to use WordPress, and I was able to point my domain (mattstratton.com, which I have owned for about 12 years) at that blog. However, the more I used it, the more I felt hampered &#8211; **when you host your blog on WordPress.com, you are pretty coralled with what you can do** &#8211; you can only use the themes provided by them (which are very extensive) and you cannot modify them. This was the big kicker for me &#8211; I had a theme I liked, but I didn&#8217;t like how the archive pages looked &#8211; and I couldn&#8217;t modify it. I decided it was time to move to a &#8220;self-hosted&#8221; WordPress installation.

I consulted with my friend Jason (of <a href="https://jasondanielphotography.com/blog/" target="_blank">Jason Daniel Photography</a>) who was doing a self-hosted WordPress. He recommended his webhost, <a href="https://www.marblehost.com/" target="_blank">Marblehost</a>. I looked into their pricing and features, and they seemed to be a robust solution that would meet my needs. I signed up for my hosting account, installed <a href="https://wordpress.org" target="_blank">WordPress</a>, and then exported all the posts from my WordPress.com blog to a file, which I then imported into my new blog. I&#8217;ve gone through several iterations of layout and configuration with WordPress, including several themes and a myriad of plugins, which I will detail below.

**Theme**

WordPress gives you the ability to install various themes for your blog, which are akin to &#8220;skins&#8221;. Basically, **a theme is a collection of files that controls, amongst other things, the styling and layout of your blog**. Things like the font, colors, etc are controlled by the theme&#8217;s stylesheet, and the various theme files also control the layout of your blog, including items like sidebars and how the archive pages look.

After trying out a bunch of other themes, I finally settled on a theme called <a href="https://wordpress.bytesforall.com/" target="_blank">Atahualpa</a>, created by the good folks at <a href="https://www.bytesforall.com/" target="_blank">Bytes For All</a>. This is a VERY powerful theme &#8211; it has 25 pages of options to customize. However, due to it&#8217;s heavy customization, **it&#8217;s actually pretty hard to hack the files themselves** &#8211; you have to work within the configuration tool of Atahualpa itself, as making mods to the theme files could have pretty nasty repercussions. This has not actually been a big issue for me&#8230;.yet. The color scheme, etc, is actually very easy to modify as the CSS files can be hacked to pieces without any major issues &#8211; and the majority of the things that you would want to &#8220;hack&#8221; up the theme files for (adding javascript includes for things like analytics, ads, etc) all can usually be accomplished through the various &#8220;inserts&#8221; options in the theme itself.

**Plugins**

Here&#8217;s the meat of where WordPress can really get customized. When you&#8217;re on a &#8220;self-hosted&#8221; WordPress (i.e., one where you control all the code and config), the installation of little bits of code called &#8220;plugins&#8221; can really extend and improve your WordPress installation. It&#8217;s possible to get a little too crazy with installing plugins, which can cause a lot of extra load on your server (and slow down the page load, etc), so **you want to try to be prudent with what you install**. I&#8217;ve gone through quite a few different plugin configurations, but my current installed set has been stable for about a month, so I&#8217;ll probably stick to it. For your amusement and edification, here is the list of WordPress plugins installed on Good Old Rock:

<p style="padding-left: 30px; ">
  <strong><a href="https://akismet.com/" target="_blank">Akismet</a></strong> &#8211; this plugin comes &#8220;for free&#8221; (not that any of the other plugins I use aren&#8217;t free) with your WordPress installation. It is the anti-spam plugin provided by WordPress, and it&#8217;s VERY good at flagging spam comments and putting them in the queue. This is a must-have.
</p>

<p style="padding-left: 30px; ">
  <strong><a href="https://semperfiwebdesign.com/" target="_blank">All in One SEO Pack</a></strong> &#8211; SEO (Search Engine Optimization) is a key component if you want your blog to be properly indexed by folks like Google. This plugin doesn&#8217;t mean you&#8217;ll automatically get super-good Google juice, but it does optimize the default paths, titles, and tags used by WordPress to make it a lot more search engine friendly.
</p>

<p style="padding-left: 30px; ">
  <strong><a href="https://nickohrn.com/amazon-reloaded-for-wordpress" target="_blank">Amazon Reloaded for WordPress</a></strong> &#8211; If you write a lot of blog posts that include links and pictures to products on Amazon.com, this plugin makes it very easy to search for products from within the blog post composition window. If you have an Amazon Associates ID, it will automatically include your info into the links it creates, so if someone clicks on that link on your blog and buys something&#8230;you get a tiny piece of that cash. It&#8217;s a nice little tool.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://immersion.io/publikationen/code/wordpress/automagic-twitter-profile-uri/" target="_blank"><strong>Automagic Twitter Profile URI</strong></a> &#8211; When you leave a comment on Good Old Rock, if the email address you use is the same as the email address associated with your Twitter account, you have the option to include your Twitter username in the comment. It&#8217;s neat and lightweight.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://wordpress.designpraxis.at/" target="_blank"><strong>BackUpWordPress</strong></a><strong> </strong>&#8211; A very important tool &#8211; this will schedule backups of both the static files and the MySQL database that drives your blog. These files are then stored in a directory on the same server as your blog, so it&#8217;s very important to have a process where you download those files to another computer. I have a script set up on my computer at home to automatically FTP these files down every day for archive/disaster recovery purposes.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://getclicky.com/goodies/"><strong>Clicky Web Analytics</strong></a> &#8211; When you really start getting going with your site, you are quickly going to become obsessed with monitoring the traffic to your blog. I use a service (free) called <a href="https://www.getclicky.com" target="_blank">Clicky</a>. This plugin makes it a breeze to get full Clicky integration into my site.
</p>

<p style="padding-left: 30px; ">
  <strong>commentluv</strong><strong> </strong>&#8211; This plugin displays a link to the last blog post a commenter has made. It&#8217;s pretty popular amongst WordPress users, and having it installed can help encourage other bloggers to leave comments on your posts, for the link love.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://wordpress.org/extend/plugins/dandyid-services/" target="_blank"><strong>DandyID Services</strong></a> &#8211; If you look in the upper left corner of this page, you&#8217;ll see a little section of various icons representing my identify on several other services, such as Twitter, Facebook, YouTube, etc. That little section is created by this plugin.
</p>

<p style="padding-left: 30px; ">
  <strong>FeedBurner FeedSmith</strong> &#8211; WordPress has a built-in RSS feed, but I prefer to use the Feedburner feed (this gives me a lot more insight into how many people have subscribed to my blog, etc). This plugin maps the &#8220;default&#8221; WordPress feed URL to my Feedburner URL.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://www.tantannoodles.com/toolkit/photo-album/" target="_blank"><strong>Flickr Photo Album</strong></a> &#8211; It&#8217;s no secret that I love me some Flickr. This plugin does two things for me &#8211; firstly, it creates the little section on the right sidebar that shows some of my recent pictures on Flickr. More importantly, it adds the ability to directly insert Flickr photos into my post from the WordPress composition window. It can also be used to create a photo gallery on your blog, but I haven&#8217;t used that :)
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://www.arnebrachhold.de/redir/sitemap-home/" target="_blank"><strong>Google XML Sitemaps</strong></a> &#8211; This goes into the SEO discussion from above. A sitemap helps a search engine understand your site. This plugin will automatically create one and update the search engines with the information.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://www.michelem.org/wordpress-plugin-nofollow-free/" target="_blank"><strong>NoFollow Free</strong></a> &#8211; By default, when someone puts a link in a comment on your blog, WordPress will tag it as &#8220;nofollow&#8221; (which basically negates any &#8220;Google juice&#8221; that this link would provide to the linked site). This is good because it makes your blog less attractive to spammers. However, for real commenters, you probably want to give them the Google sauce. This plugin lets you disable the nofollow tag either globally, or for commenters who have posted a set amount of posts already.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://yoast.com/wordpress/sociable/" target="_blank"><strong>Sociable</strong></a><strong> </strong>&#8211; A plugin that adds the nifty &#8220;share this&#8221; buttons to the bottom of your posts so that folks can spam Facebook, Twitter, etc, with links to your insightful drivel.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://txfx.net/code/wordpress/subscribe-to-comments/" target="_blank"><strong>Subscribe To Comments</strong></a><strong> </strong>&#8211; This is a plugin, that in my mind, should really be part of WordPress in the first place. Installing this will let visitors check a little box on a post which will then email them every time someone comments on that post. I, for one, rarely will re-visit a blog post after commenting if I have no way to get email notifications to let me know I should come back and read more. But that&#8217;s just me.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://alexking.org/projects/wordpress" target="_blank"><strong>Twitter Tools</strong></a> &#8211; This is how I get my latest tweets populated in the left sidebar. There are some additional Twitter integration points (like automatically tweeting every time you have a new blog post) that I do not use.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://lesterchan.net/portfolio/programming/php/" target="_blank"><strong>WP-Polls</strong></a> &#8211; Used to create polls. I&#8217;m not so sure how useful this is to me, but mostly that&#8217;s because I haven&#8217;t thought of anything interesting to ask my readers in my polls :)
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://semperfiwebdesign.com/plugins/wp-security-scan/" target="_blank"><strong>WP Security Scan</strong></a> &#8211; Definitely a good plugin to install. This gives you the ability to run a &#8220;scan&#8221; on your WordPress installation to make sure you didn&#8217;t leave any security holes open. Pretty intelligent plugin, although to fix the things it suggests you need to feel a little comfortable with MySQL and WordPress.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://ocaoimh.ie/wp-super-cache/" target="_blank"><strong>WP Super Cache</strong></a> &#8211; Highly recommended. A+++++. Would buy from again. This plugin creates a static version of your posts when they are requested, which means that if you get a lot of traffic, your server isn&#8217;t working to generate the same page over and over again. It can take some getting used to &#8211; modifications you make will not always show up right away unless you clear the cache &#8211; but overall, I think the benefits far outweigh the (very minor) annoyances.
</p>

<p style="padding-left: 30px; ">
  <a title="Visit plugin homepage" href="https://mitcho.com/code/yarpp/" target="_blank"><strong>Yet Another Related Posts Plugin</strong></a> &#8211; Look down. See where it shows you other posts of mine that (hopefully) are related to this one in some way? That&#8217;s courtesy of this plugin. I think it&#8217;s super neat and interesting.
</p>

So there you have it &#8211; some of the smoke and mirrors have been pulled back. I haven&#8217;t talked about how I use Google Apps to handle the email for my domain, but I will cover that in the &#8220;Here&#8217;s How To Set Up A Website&#8221; post which will be coming soon!

_The picture of Lily up top has nothing to do with this post, but I like it._

 [1]: https://www.flickr.com/photos/mugsy/3377681018/ "Lily"
 [2]: https://mattstratton.livejournal.com
 [3]: https://www.facebook.com/ext/share.php?sid=55584539984&h=9tH_c&u=W5nac
 [4]: https://wordpress.com