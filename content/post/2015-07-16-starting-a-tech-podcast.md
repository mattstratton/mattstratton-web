---
title: So You Want To Start A Tech Podcast…
author: Matt Stratton
layout: post
date: 2015-07-17T03:04:56+00:00
url: /tech/starting-a-tech-podcast
image: /wp-content/uploads/pdocast.png
dsq_thread_id:
  - 3941980611
categories:
  - Tech

---
<img class="alignnone wp-image-7001" src="/wp-content/uploads/pdocast-300x148.png" alt="pdocast" width="550" height="272" srcset="/wp-content/uploads/pdocast-300x148.png 300w, /wp-content/uploads/pdocast-1024x506.png 1024w, /wp-content/uploads/pdocast.png 1280w" sizes="(max-width: 550px) 100vw, 550px" />

I&#8217;ve been talking lately to a few folks, specifically Jason Hand, about &#8220;how to do a podcast&#8221;. For those of you who don&#8217;t know, I am the co-host and creator of the <a href="http://arresteddevops.com" target="_blank">Arrested DevOps </a>podcast, and have been doing this for a little over a year and a half. So, similar to my post about [&#8220;what is DevOps anyway?&#8221;][1], I thought it was just as easy to write up a blog post explaining how we do things at ADO, and some tips I&#8217;ve learned along the way.

## The Technology

Of course, everyone wants to know the &#8220;tech&#8221; bits we use. By no means am I saying this is the right, or best, way to do things. But it&#8217;s how we do it. It mostly works, and we have only made a few tweaks and changes to the process over the last 18 months. I have a bunch of things I&#8217;m planning on changing, which I&#8217;ll list later on in the &#8220;What Does The Future Hold?&#8221; section.

### Hosting

First of all, let&#8217;s understand what exactly a podcast is. Forget about the recordings, etc&#8230;basically it&#8217;s just an RSS feed that wraps around non-text thingies (usually audio or video files, but in theory you could do a podcast of PDF&#8217;s, I suppose). So that means you need two main things.

  1. A place to store your media files (mp3&#8217;s if you&#8217;re an audio podcast, which is what ADO is&#8230;I&#8217;ll explain the video portion of ours in a bit)
  2. Something on the internet to generate your RSS feed so people can subscribe to it using their favorite podcast app (and to have your show listed in the directories like iTunes, etc)

For item 1, we host our audio files in Amazon S3. This is not necessarily the best choice in the world, but it works for us, and I&#8217;m really REALLY nervous about changing it, because I don&#8217;t want to mess up any existing links, etc. Both <a href="https://www.blubrry.com" target="_blank">blubrry</a> and <a href="http://www.libsyn.com" target="_blank">Libsyn</a> are options for hosting your media files (they also provide analytics, which I&#8217;ll touch on in a minute). I haven&#8217;t used either of them for hosting media, but people seem to like them. It can get spendy, but honestly, podcasting ain&#8217;t cheap, so get that idea out of your head right now.

For item 2, the ADO website is run on WordPress, which I happen to run on a VM in Azure (that last bit is a bunch of whodafuckcares). The key portion of this is that I use the <a href="https://wordpress.org/plugins/powerpress/" target="_blank">PowerPress</a> WP plugin to make all the fancy RSS stuff work nicely. I use a bunch of other plugins as well, but that is the most important one. You really need to have more than just the RSS feed &#8211; every episode of your podcast should have an episode page with things like show notes, etc, on it.

### Recording

We record every episode of ADO via Google Hangouts On Air. Why? Well, mostly because we have guests on (almost) every episode, so recording In Real Life isn&#8217;t really an option. Why Hangouts? Because we started with them. I personally am NOT a fan of using Hangouts for a podcast. I would rather we switched to using Skype, but there are things we lose by going the Skype route, mostly the ability to livestream the episode. If I was starting over, I would use Skype to record the episodes, but also use a tool called <a href="http://www.podclear.com" target="_blank">PodClear</a> to handle the true recording, as it records everyone&#8217;s audio &#8220;locally&#8221;, so the quality is way better&#8230;and then you get everyone on a separate audio track. In theory, we should be able to use PodClear with Hangouts, but every time we&#8217;ve tried it, it hasn&#8217;t been delightful. Mostly because Hangouts decides it needs to use up ALL OF YOUR CPU. Sigh.

After the HOA is finished, it gets auto-published to our YouTube channel (this is the video portion I mentioned). I then download the MP4 of the video from YouTube, which will eventually be turned into the audio side of the world.

### Post-Production

Once I&#8217;ve downloaded the MP4, I convert it to AIFF using <a href="http://www.iskysoft.com/video-converter-mac.html" target="_blank">SkySoft Video Converter</a> (why that tool? Because it works. I&#8217;m sure there are other ways to do it. I used to use some cloud-based thing that I don&#8217;t remember the name of, but this works just fine).

I import the AIFF into LogicX on my Mac, and edit it there. Would I recommend using Logic for podcast editing? No way. Why do I do it? Because it works for me and I&#8217;m too lazy to learn <a href="http://audacityteam.org" target="_blank">Audacity</a>.

You should learn Audacity.

Once I&#8217;ve done all my editing, I bounce the audio to AIFF. I then upload that AIFF file to Auphonic (a non-free cloud-based audio processing tool) which converts it to mp3, makes it mono (your podcasts should be mono), and adjusts the loudness. Your podcast should have a normalized volume of -16 LUFS. It also automagically posts it to my Amazon S3 bucket with the right name based upon our naming standard. Auphonic costs me like $9/month, but it&#8217;s so worth it.

## Actually Running A Show

So the tech is actually the easy part. The hard part of running a podcast has to do with all the administrative stuff. Scheduling guests (we use <a href="http://doodle.com" target="_blank">Doodle</a> to help with that). Writing and sharing agendas (for every episode, we create a script/agenda in Google Docs, which we share with the guests). Writing the blog post after you&#8217;re done, so the episode actually shows up in your feed with all your nice notes. That stuff. Sorry, it&#8217;s a bunch of work. Deal with it.

### Measurements

There are three kinds of lies &#8211; lies, damn lies, and podcast listener statistics. Because of the way a podcast works, you can&#8217;t actually really tell how many people really listen to your show. You can see how many times an audio file (i.e., an episode) is downloaded, but you have no idea if someone actually listened to it. For example, my podcast app will download all the episodes for shows I subscribe to, which makes me show up in their stats, but if I never listen to the actual show, nobody knows that. My Very Unscientific Method is to take my unique download numbers from Blubrry and divide them by half. That&#8217;s what I use to vaguely decide how many listens an episode gets. You can use a service like Blubrry or <a href="http://podtrac.com" target="_blank">Podtrac</a> to keep track of this. Biggest tip? Pick one at the beginning and KEEP USING IT. That way you can see your historical data. Oh, and make sure you have Google Analytics on your episode pages.

## Learn About Podcasting

Here&#8217;s the thing. Doing podcasts well is about more than recording a great show. Well, that&#8217;s a really important part. Actually, the very most important part of all (whether you have an audio or video podcast) is to NAIL the audio quality. If people can&#8217;t understand you, or the quality is crappy, they will hate your show. So don&#8217;t do that. Invest in a good mic. Wear headsets. Record according to the best of your ability (i.e., don&#8217;t use Hangouts). Edit your audio to make it nice and normalized.

There are lots of blogs and Facebook groups and podcasts about podcasting. Sadly, a lot of people who do podcasts are of the &#8220;let me teach you via my podcast how to MAKE MONEY FAST&#8221;, but you can still learn a lot from some of the podcast pros. My favorite is Daniel J. Lewis &#8211; his <a href="http://theaudacitytopodcast.com" target="_blank">Audacity to Podcast</a> show is a must-listen for anyone who wants to start and run a podcast. He&#8217;s been doing it a long time, and has great shows full of useful tips. Listen to them. You will learn a lot.

What Does The Future Hold?

Here are a few things I want to change about how we do things for ADO.

  1. Switch to Skype/PodClear for recording
  2. Change our WordPress theme to this fancy custom thing I&#8217;m developing (this is because right now, it&#8217;s exceedingly difficult to write an episode page on our site if you aren&#8217;t me. I&#8217;ve got a new theme with a plugin I wrote that makes adding guests, show notes, sponsor banners, etc a lot easier)

What other things would you like to know? I wrote this post in a stream-of-consciousness manner, and I&#8217;ll likely be updating as I go. Please share your tips or questions in the comments!

 [1]: /tech/devops "DevOps – A Crash Course"