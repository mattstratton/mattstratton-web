---
title: On trying new things
published: true
description: 'It’s quite easy to become creatures of habit, especially with our tools.'
tags: [webdev, vscode, firefox]
canonical_url: 'https://medium.com/@mattstratton/on-trying-new-things-6ed541a4500f'
id: 10959
cover_image: 'https://thepracticaldev.s3.amazonaws.com/i/s3knunqzh69evym3xdn9.jpg'
---

It’s quite easy to become creatures of habit, especially with our tools. We know what works for us, and we develop muscle memory for them (see also “vim vs emacs flame&nbsp;wars).

### Editors

![](https://cdn-images-1.medium.com/max/800/1*IH6ax7_VGCwnglXYVmIkyA.jpeg)<figcaption><em>Image via </em><a href="https://www.prismnet.com/~dierdorf/emacsvi.html"><em>https://www.prismnet.com/~dierdorf/emacsvi.html</em></a></figcaption>

I’ve been a fan (in theory) of [Visual Studio Code](https://code.visualstudio.com/) ever since it was released in 2015. Having made the journey between [TextMate](https://macromates.com/) to [Sublime Text](https://www.sublimetext.com/) to [Atom](https://atom.io/), it seemed a natural progression. And I recall that my first reaction was “How ironicâ€Š–â€Šthe git integration from Microsoft’s text editor is better that the one from GitHub. However, I still stuck with&nbsp;Atom.

Especially when I started to write Go, this seemed like the right choice. I honestly don’t recall which tutorial I was following which suggested the excellent [go-plus plugin](https://atom.io/packages/go-plus), but it certainly made getting starting with Go a&nbsp;delight.

In fact, I’ve become so enamored with Atom that I even wrote two pluginsâ€Š–â€Š[linter-cookstyle](https://atom.io/packages/linter-cookstyle) (to help with your Chef recipes) and [language-hugo](https://atom.io/packages/language-hugo) (syntax highlighting for [Hugo](https://gohugo.io/) files). I know my way around Atom, and I have my set of preferred plugins.

Recently, I was listening to [an episode](https://changelog.com/gotime/49) of [Go Time](https://changelog.com/gotime) with [Ramya Rao](https://twitter.com/ramyanexus). Ramya works in Microsoft’s Developer Division, and is a maintainer of the [Go extension for VS Code](https://github.com/Microsoft/vscode-go) (shouldn’t we call it just “Code? I suppose everything at Microsoft has to be “Visual something…the only exception I can think of was InterDev. Oh wait, that was _Visual_ InterDev.) Listening to the episode, especially when Ramya started talking about [CodeLens](https://code.visualstudio.com/blogs/2017/02/12/code-lens-roundup), made me think it was time to give VS Code another&nbsp;try.

To be honest, it probably took about two weeks before I fired up VS Code on a Go project. I’ve been working on a [command line utility](https://github.com/devopsdays/devopsdays-cli) for maintainers of the [devopsdays.org](https://www.devopsdays.org) website, so for fun, I decided to bring it up in VS Code next to&nbsp;Atom.

Wow. VS Code just…looked better for starters. The extension also seemed to have features that I didn’t have in go-plus (full disclosure: I might just not know how to access them). The CodeLens feature is great (hovering over a package import, for example, tells you a bunch of stuff about the package):

![](https://cdn-images-1.medium.com/max/788/1*WVpbcaYC3KQGXGYTcDna5w.png)<figcaption>CodeLens on a package import in VSÂ Code</figcaption>

One of the most striking improvements for my experience was in the embedded terminal. Atom has a plugin that gives you a terminal in the botton pane, which can be really useful. But it’s SLOW. Like, almost unusable&nbsp;slow.

With VS Code, this is an included feature. I immediately saw that it was more performant than my Atom experience. Of course, while I was initially poking around, VS Code told me there was an update to install. After installing version 1.7, one of the release notes told me that 1.7 improved performance of the terminal! It totally&nbsp;did.

The only thing about the terminal that is weird is that I think my Powerline fonts aren’t included, so my prompt looks a little&nbsp;weird:

![](https://cdn-images-1.medium.com/max/479/1*qdYGhoAJLoaS10kh2ouCqA.png)<figcaption>zsh prompt in VSÂ Code</figcaption>

![](https://cdn-images-1.medium.com/max/549/1*emmoMqJuY7HC2K48_kUh6A.png)<figcaption>zsh prompt inÂ iTerm</figcaption>

Overall, I’m seeing that VS Code seems crisper in the display to me, although I haven’t been using it enough to see if there are performance improvements (everyone is always complaining about Atom being slow, but it generally has been pretty okay for me). I still have to load up on extensions (since all I’ve been doing so far is Go, I haven’t installed my HTML/CSS/SASS type stuff that I use in Atom to see how it compares).

But how am I going to really put this through it’s paces? I feel like in order to determine if I can make this my daily driver, I need to, well, make it my daily driver for a while. My solution is to quit Atom “cold turkey”, and just uninstall it from my MacBook, and then spend a few weeks only having VS Code available to me. I’ll revisit this decision on November 17 (slightly over a month from now), and expect a follow-up post at that time. The significance of that date will be explained below.

### Browsers

You name the browser, I’m sure I’ve tried it. Starting with Lynx, then Mosaic, then Netscape…CyberDog anyone? I even rocked Opera for a hot&nbsp;second.

But when Chrome burst on the scene, I, along with every other Internet hipster, pushed aside my dear friend Firefox for Google’s new hotness. Even though it didn’t have all the features that Firefox had, Chrome was a lean, mean, browsing machine. Remember when Chrome’s claim to fame was that it wasn’t the resource hog that Firefox was? Oh, the delicious irony.

As you may or may not know, [Firefox Quantum](https://www.mozilla.org/en-US/firefox/quantum/) is a gnat’s wing away from release on November 17 (see what I did there?) It’s supposed to be fast as hell, and totally murder Chrome. I’m looking forward to trying it&nbsp;out.

One thing that I am not sure I can walk away from is Chrome’s profile feature. I have a LOT of Google logins (my personal account, my work account, my podcast account, devopsdays, etc), and I rock a Google profile for each. This lets me have multiple instances of Chrome which each have their own settingsâ€Š–â€Šthis has pluses and minuses. It’s super helpful with regard to Google accountsâ€Š–â€ŠI can keep my emails separate. And with systems where I have various logins (Trello, Twitter, etc) it helps too. For instance, when logged into my “main Chrome profile, I’m logged into the [@mattstratton](https://www.twitter.com/mattstratton) Twitter account. And when logged into my ADO Chrome profile, I’m logged into the [@arresteddevops](https://www.twitter.com/arresteddevops) Twitter account. Similarly, I have a personal Trello account and a work Trello account…having multiple browser profiles (which can run in parallel) make this something that I can&nbsp;handle.

I’ll have to see how Firefox manages this. So far, I’m not bullish on it. From the [profile documentation](https://developer.mozilla.org/en-US/Firefox/Multiple_profiles):

> You cannot change the profile while Firefox is running. Although it is possible in some cases to have multiple instances of Firefox running in different profiles, to avoid confusion, you should first exit/quit/terminate all running instances of Firefox, FirefoxDeveloperEdition or&nbsp;Nightly.

There is, however, a tool called [MultiFirefox](https://github.com/themartorana/MultiFirefox) for OS X that seems to allow for this. It’s a little bit old (the most recent commit was 9 months ago), and we’ll see if it works with Quantum. I’ll be reporting back on my findings.
