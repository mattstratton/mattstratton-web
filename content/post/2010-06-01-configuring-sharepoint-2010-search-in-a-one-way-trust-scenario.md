---
title: Configuring SharePoint 2010 Search in a one-way trust scenario
author: Matt Stratton
layout: post
date: 2010-06-01T14:54:45+00:00
url: /tech-tips/configuring-sharepoint-2010-search-in-a-one-way-trust-scenario
description:
  - SharePoint 2010 is a pretty great product. However, quite a few gotchas will come up with a one-way trust scenario, most notably, search issues. With some PowerShell kung-fu, however, these can be resolved.
thesis_keywords:
  - sharepoint, sharepoint search, sharepoint 2010
thesis_thumb:
  - /wp-content/uploads/sp2010-tnail.png
dsq_thread_id:
  - 103161334
categories:
  - Featured
  - Tech Tips
tags:
  - Microsoft
  - Microsoft SharePoint
  - SharePoint 2010
  - SharePoint Search

---
Let me just start out by saying that I think that <a class="zem_slink" title="Microsoft SharePoint" rel="wikipedia" href="http://en.wikipedia.org/wiki/Microsoft_SharePoint">SharePoint</a> 2010 is pretty darn awesome. The user experience is three billion times better than previous versions, and the list of amazing features is miles long.

That being said, I&#8217;m starting to think that Microsoft didn&#8217;t really do a lot of testing of this product in a multi-domain, one-way trust scenario. Let us assume the scenario below:

<div id="attachment_6028" style="width: 354px" class="wp-caption alignnone">
  <a href="/wp-content/uploads/trust.jpg"><img class="size-full wp-image-6028" title="trust" src="/wp-content/uploads/trust.jpg" alt="" width="344" height="162" /></a>
  
  <p class="wp-caption-text">
    In this scenario, the domain SERVER trust ACCOUNT, but not vice-versa
  </p>
</div>

My SharePoint 2010 farm is in Server, but all user accounts are in ACCOUNT. This is a one-way trust, and a fairly common corporate scenario.

### The Search Symptom

After configuring SharePoint Search and successfully crawling some content sources, I was never able to return any search results. People results would show up, but no content from the SharePoint sites. Additionally, when I looked at my Scopes in Central Admin, they showed no items&#8230;but the crawl log showed all the results.

### For Admin Eyes Only!

After spending hours trying to debug this (going so far as to even completely delete the Search Service application and recreate it), I came across <a href="http://social.technet.microsoft.com/Forums/en-US/sharepoint2010setup/thread/fe9e2e61-b3ec-4850-a1df-d2419314f846" target="_blank">this post</a> on MSDN:

[<img class="alignnone size-full wp-image-6029" title="msdn" src="/wp-content/uploads/msdn.png" alt="" width="350" height="88" />][1]

At first, I thought this didn&#8217;t apply to me, as I was connecting at ACCOUNT\USER, who was a farm admin as well as a site collection admin. But then I came across <a href="http://social.technet.microsoft.com/Forums/en-US/sharepoint2010setup/thread/fb211700-1613-4d0f-b8e1-6b6a4a93e770/" target="_blank">another post</a>:

[<img class="alignnone size-full wp-image-6030" title="msdn2" src="/wp-content/uploads/msdn2.png" alt="" width="504" height="90" />][2]

I wasn&#8217;t seeing that exact error, but it made a bit of a lightbulb go off for me. On a whim I tried logging in as SERVER\ADMIN&#8230;and voila! Search results appeared!

### So now what?

This was all well and good, but it didn&#8217;t solve my problem. I needed ACCOUNT users to get search results too. The issue seemed to be that the app pool for the Search query component was running as a service account in the SERVER domain&#8230;and that account didn&#8217;t have any rights in ACCOUNT to determine the security trimming for the user doing the search. Long story short, I needed that app pool to run as an ACCOUNT account.

That being said, when I went to register the ACCOUNT account as a managed account, it wouldn&#8217;t take it. Because, you know, the farm account (I suppose) didn&#8217;t have rights in ACCOUNT to pull up any properties about this user:

[<img class="alignnone size-full wp-image-6031" title="error" src="/wp-content/uploads/error.jpg" alt="" width="500" height="17" />][3]

### PowerShell to the rescue!

The GUI wasn&#8217;t going to let me add this managed account&#8230;but would PowerShell save the day? Turns out that yes, yes it would. Following the insight from Bill Baer&#8217;s <a href="http://blogs.technet.com/b/wbaer/archive/2010/04/11/managed-accounts.aspx" target="_blank">blog post</a>, I was able to add an ACCOUNT service account using PowerShell&#8230;which I could then select as the app pool identity for the Search query component. And after doing so&#8230;voila! Search results worked like a charm.

### Where do we go from here?

This is just one of the several issues I&#8217;ve encountered in our one-way trust scenario with SharePoint 2010. The maddening thing is that all of these issues worked FINE in MOSS 2007&#8230;but it seems that with all of the infrastructure changes that happened with 2010&#8230;a lot of this stuff got lost along the way.

<div class="zemanta-pixie" style="margin-top: 10px; height: 15px;">
  <a class="zemanta-pixie-a" title="Reblog this post [with Zemanta]" href="http://reblog.zemanta.com/zemified/5ef78aad-7a56-4af4-b2fa-7840874b2c34/"><img class="zemanta-pixie-img" style="border: medium none; float: right;" src="http://img.zemanta.com/reblog_c.png?x-id=5ef78aad-7a56-4af4-b2fa-7840874b2c34" alt="Reblog this post [with Zemanta]" /></a><span class="zem-script pretty-attribution"></span>
</div>

 [1]: /wp-content/uploads/msdn.png
 [2]: /wp-content/uploads/msdn2.png
 [3]: /wp-content/uploads/error.jpg