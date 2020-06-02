---
title: Gotta go back in time…
author: Matt Stratton
layout: post
date: 2008-02-09T11:00:00+00:00
url: /life-in-general/gotta-go-back-in-time
dsq_thread_id:
  - 28222313
categories:
  - Personal

---
_Disclaimer &#8211; I have nobody to blame but myself for this, and I am fully aware of that fact._

On Thursday, our landlord had an electrician come into our unit to do some work. He (the landlord) warned us several different times in advance that this was occurring, and even pointed out that since the power was probably going to be cut, we should make sure to save files on our computers, etc. Being the [professional nerdbag][1] that I am, I shrugged it off with a &#8220;sure, sure, of course, thanks for pointing that out, etc.&#8221;

Well, on Thursday morning, on the way to a conference, I realized I had neglected to shut my Mac down before leaving. &#8220;Oh well,&#8221; I thought. &#8220;It&#8217;s survived power failures before, and I don&#8217;t have anything open that I am worried about.&#8221;

Sure enough, I get home that night, and when I boot up my Mac, it powers up from the backup install &#8211; my main system drive is offline. I do some investigating, and discover that one of my external FW hard drives is DOA &#8211; won&#8217;t spin up. 

This is the hard drive that has two partitions &#8211; one that is my main OS X system drive, and the other is my main data drive.

I&#8217;ve just lost my OS, applications, and my iTunes, iPhoto, and all my documents.

Well, luckily for me, I recently upgraded to [Leopard][2], which includes a nifty little auto-backup thinger called [Time Machine][3]. So all of that stuff was totally backed up to an additional external HDD (which, fortunately, survived). The internal HD on my Mac (which I was using for a backup OS because I thought that since the external FW hard drive was 7200 instead of 5400 I&#8217;d get better performance, etc, etc) would be able to get &#8220;restored&#8221; to from the backup of my DOA OS partition, and I could restore the data partition to another extra external HD (which I had been using for iterative backups before Time Machine existed, so I didn&#8217;t need it for that anymore).

Last night I fired up the Leopard DVD, and instead of running the install, I just picked &#8220;restore from Time Machine&#8221; or something like that. It took a little convincing to get it to see the internal HD, but once I did, it took about an hour to copy all the data, and then voila! I was back in business.

Well, with the system part. The data partition still need restoring.

The first thing I did was immediately turn OFF Time Machine backups &#8211; I had read that after a restore, Time Machine was not good about knowing what it had backed up BEFORE. I was able to find my old Data partition in Time Machine, and tried to restore every folder on it to my newly created Data partition.

That did not work well.

I found I had to do one folder at a time (which was no big deal, since there were only about 7 folders at the root of /Data, and some of the smaller ones I could do at the same time). The biggest problem I had was with iPhoto. I store my iPhoto library on the data partition and not in my Home directory. And somewhere along the line I had upgraded my iPhoto. When I picked just the iPhoto from /Data, it did not restore very well. But if I browsed back in Time Machine to before the upgrade, restored the iPhoto Library folder, and then restored the current iPhoto Library over that, everything worked swimmingly.

One thing that I am kicking myself for &#8211; I had my [Aperture][4] library excluded from the TM backup (because it&#8217;s notoriously a bad TM-citizen) figuring &#8220;well heck, I back up the Aperture library to a vault on a different disk&#8221;.

Guess what? I haven&#8217;t backed up my Aperture library (since it&#8217;s a manual process) since Dec 29, 2007. Oh well. Luckily I have anything important already on Flickr. I hope.

 [1]: https://www.linkedin.com/in/mattstratton
 [2]: https://www.apple.com/macosx/
 [3]: https://www.apple.com/macosx/features/timemachine.html
 [4]: https://www.apple.com/aperture/