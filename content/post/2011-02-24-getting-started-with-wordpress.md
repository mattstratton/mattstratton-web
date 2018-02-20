---
title: I just got a WordPress blog…now what do I do?
author: Matt Stratton
layout: post
date: 2011-02-24T16:01:15+00:00
url: /tech-tips/getting-started-with-wordpress
thesis_post_image:
  - /wp-content/uploads/wordpress-registered-trademark-e1298559579569.png
thesis_post_image_vertical:
  - before-post
thesis_post_image_horizontal:
  - center
description:
  - |
    With it's famous "Five minute install method", getting WordPress up and running for your blog is relatively trivial. However, after the base install, there are several things that should be configured for the most awesome WordPress experience possible.
dsq_thread_id:
  - 239272869
categories:
  - Featured
  - Tech Tips
tags:
  - wordpress

---
WordPress is one of the most popular blogging platforms available today. With it&#8217;s famous &#8220;Five minute install method&#8221;, getting WordPress up and running for your blog is relatively trivial. However, after the base install, there are several things that should be configured for the most awesome WordPress experience possible. _Note: The tips in this post are geared towards the &#8220;self-hosted&#8221; version of WordPress (the one where you install WordPress on your own website, as opposed to using WordPress.com)._

# Permalinks

By default, all of the URL&#8217;s to your posts are going to look something like this: _http://myblog.com/?p=123_. This is less than ideal for a few reasons. First of all, it makes it difficult for a person to see the URL and have any idea what the post is about. Secondly, when we talk about SEO (<a class="zem_slink" title="Search engine optimization" rel="wikipedia" href="http://en.wikipedia.org/wiki/Search_engine_optimization">Search Engine Optimization</a>, or &#8220;how to make Google love your site, like a lot&#8221;), the URL is a major factor.

When Google is deciding what a page or post on your blog is about, they take a long, hard look at the url and try to puzzle out the content based upon it. Think about the difference between these two URL&#8217;s:

_http://yourblog.com/?p=123
  
http://yourblog.com/photography/how-to-use-your-camera_

Those URL&#8217;s could both point to the same post, but the second one is chock full of information for a user or Google to understand.

The good news is that changing your URL structure (or &#8220;permalinks&#8221;, in WordPress jargon) is super simple. In your WordPress admin screen, click on &#8220;Permalinks&#8221; underneath &#8220;Settings&#8221;:

<img class="aligncenter size-full wp-image-6199" title="permalinks1" src="/wp-content/uploads/permalinks1.png" alt="" width="154" height="196" />This will open up the Permalink configuration screen. My suggested settings look like this:

[<img class="aligncenter size-full wp-image-6200" title="permalinks-settings" src="/wp-content/uploads/permalinks-settings.png" alt="" width="500" height="217" srcset="/wp-content/uploads/permalinks-settings.png 500w, /wp-content/uploads/permalinks-settings-300x130.png 300w" sizes="(max-width: 500px) 100vw, 500px" />][1]You can remove the %category% if you aren&#8217;t going to use categories, but it is really much better to use it (and categories in general). Make your changes, and click Save Changes, and you&#8217;re on your way to permalinks nirvana.

# Plugins

One of the main reasons to run a self-hosted WordPress install is for the plugins. These are nifty little pieces of software (often times free) which extend WordPress and give you extra cool features for your blog. It&#8217;s possible to go &#8220;plugin crazy&#8221; and install a billion plugins, but there are a few that I consider to be essential for any blog.

## Essential plugins

**<a href="http://wordpress.org/extend/plugins/all-in-one-seo-pack/" target="_blank">All In One SEO Pack</a>** &#8211; I wrote a [post a while ago][2] about why this plugin is awesome, including some configuration tips. I don&#8217;t actually use it myself anymore, as I have accomplished a lot of what it does using the <a href="/thesis" target="_blank">Thesis theme</a>, but if you don&#8217;t rock Thesis (more about that later), this plugin is a must-have. With some very simple settings, you can make your blog look extra tasty to search engines like Google&#8230;which means more traffic to your blog&#8230;which means more people are reading what you write. Which is a good thing, right?

**<a href="http://www.mkyong.com/blog/digg-digg-wordpress-plugin" target="_blank">Digg Digg</a>** &#8211; It&#8217;s becoming super important to make it as easy as possible for your readers to share your posts on their favorite social media sites. This plugin adds sharing buttons to your posts for most of the popular sites. You can see it in action on my blog. Don&#8217;t let the name fool you &#8211; even if you don&#8217;t care about getting stuff on Digg, you can still use this plugin for sharing on Facebook or Twitter, for example.

**Akismet** &#8211; This plugin is installed (but not configured) by default in the WordPress installation. I mention it here to remind you to make sure you configure it, as it is instrumental in protecting your blog from spammy comments.

<a style="font-weight: bold;" title="Google XML Sitemaps 3.2.4" href="http://www.arnebrachhold.de/redir/sitemap-home/">Google XML Sitemaps</a> &#8211; Kind of a geeky plugin, but one you don&#8217;t have to think about much. This will make your blog automatically submit its &#8220;site map&#8221; to Google, which helps the Googlebot figure out all of the pages and posts in your blog.

<a style="font-weight: bold;" title="No Self Pings 0.2" href="http://blogwaffe.com/2006/10/04/421/">No Self Pings</a> &#8211; Any time another blog links to a post of yours, you site might receive it as a &#8220;ping&#8221; &#8211; which means a little comment will show up in the post saying, in effect, &#8220;here&#8217;s who linked here!&#8221; WordPress isn&#8217;t smart enough to know that you probably don&#8217;t want to ping your own blog from itself, so if you install this plugin, you won&#8217;t get pings when you write posts with links to other posts of yours.

<a style="font-weight: bold;" title="Wordpress Firewall 1.25 for WP 2.x" href="http://www.seoegghead.com/software/wordpress-firewall.seo">WordPress Firewall</a> &#8211; Being as popular as it is, WordPress is also a popular target for hackers and nogoodniks who just want to mess with your site. This plugin helps insulate you from their nefarious deeds. It is NOT, however, a replacement for strong passwords!

<a style="font-weight: bold;" title="WP Greet Box 6.2.3" href="http://omninoggin.com/projects/wordpress-plugins/wp-greet-box-wordpress-plugin/">WP Greet Box</a> &#8211; I love this plugin. Depending upon how people come into your site (Google search, link from Digg, etc), a custom message is displayed, which can also include a suggestion to subscribe to your RSS feed. Definitely can help turn one-time users into repeat readers.

**RSS Cloud** &#8211; Another &#8220;set and forget&#8221; plugin. This just helps services such as Google Reader update their feeds with your new posts as soon as possible.

You can always see a list of the plugins I am currently running on this site by visiting my [About page][3].

## Installing plugins

The easiest way to install new plugins is using the Search feature. Under &#8220;Plugins&#8221; click &#8220;Add New&#8221;, and then type in the name of the plugin in the search box.

<img class="aligncenter size-full wp-image-6203" title="add-new-plugin" src="/wp-content/uploads/add-new-plugin.png" alt="" width="377" height="272" srcset="/wp-content/uploads/add-new-plugin.png 377w, /wp-content/uploads/add-new-plugin-300x216.png 300w" sizes="(max-width: 377px) 100vw, 377px" />In the search results, just click on &#8220;Install&#8221; for the plugin you want, and then make sure to click on &#8220;Activate&#8221; after the installation has completed.

# Back that thing up

I cannot stress enough how important it is to maintain backups for your blog. Upgrades to WordPress, or changes to plugins, could totally mess things up. Or, even worse, a nefarious hacker could totally wreak your site, leaving you in the lurch. If you have it backed up, it&#8217;s much less stressful when this happens. Luckily, there are a couple relatively easy ways to take care of backups.

## Backing up the database

The database is the brains behind your blog. If you don&#8217;t back up anything else, you must make sure to back up your database. The easiest way to do this is with the <a style="font-weight: bold;" title="WP-DBManager 2.60" href="http://lesterchan.net/portfolio/programming/php/">WP-DBManager</a> plugin. Once configured, this plugin will make a backup of your database on a regular schedule, and copy it to a directory on your site. You can also have it email the backups to you (which I recommend, since if your entire site gets hosed, having the backups on the same server is kind of useless). This will NOT back up any changed theme files or images you have uploaded, but it will maintain all of your configuration and post content. This will protect you from a messed up database (either due to a malicious hacker or a failed upgrade), but if your entire site gets accidentally deleted, it won&#8217;t get EVERYTHING back for you.

## Back up EVERYTHING

If you want to make sure you are super protected, I recommend using the <a style="font-weight: bold;" title="Automatic WordPress Backup 2.0.3" href="http://www.webdesigncompany.net/automatic-wordpress-backup/">Automatic WordPress Backup</a> plugin. This will back up ALL of the pieces of your blog (database AND files) to a bucket on Amazon S3 storage. While the plugin is free, S3 storage is not (although it is very very cheap &#8211; backing up your blog this will should cost you pennies a month). Setting up Amazon S3 for this plugin is a little more complicated, but it is the most bulletproof backup method. I will be writing a future blog post that goes into WordPress backup in greater detail, including configuration of this plugin and Amazon S3 (and once it&#8217;s done, I&#8217;ll link to it from this post).

# Next steps

Obviously, these tips are not the end of your WordPress tweaking experience, but it&#8217;s a good start. Keep an eye on this blog in the coming weeks, as I am planning several follow-up posts that dig deeper into areas such as backup, security, and site performance. However, I would love to know what areas of WordPress optimization and configuration you want to know more about. Let me know in the comments!

<div class="zemanta-pixie" style="margin-top: 10px; height: 15px;">
  <a class="zemanta-pixie-a" title="Enhanced by Zemanta" href="http://www.zemanta.com/"><img class="zemanta-pixie-img" style="border: none; float: right;" src="http://img.zemanta.com/zemified_a.png?x-id=0723f013-01b5-4bdb-805f-dc667d6ebb2c" alt="Enhanced by Zemanta" /></a><span class="zem-script pretty-attribution"></span>
</div>

 [1]: /wp-content/uploads/permalinks-settings.png
 [2]: /tech-tips/all-in-one-seo-pack
 [3]: /about