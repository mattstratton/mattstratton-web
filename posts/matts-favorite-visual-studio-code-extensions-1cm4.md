---
title: Matt’s Favorite Visual Studio Code Extensions
published: true
description: >-
  Back in October, I decided I was going to “force” myself to use Visual Studio
  Code as my only edito...
tags: text
canonical_url: >-
  https://medium.com/@mattstratton/matts-favorite-visual-studio-code-extensions-49a92752c350
id: 14832
cover_image: 'https://thepracticaldev.s3.amazonaws.com/i/yk4fe26q692ojchvq5vy.png'
---

![](https://cdn-images-1.medium.com/max/1024/1*SQm5ZwCZdYRLXwz9em5xLA.jpeg)

[Back in October](https://dev.to/mattstratton/on-trying-new-things-cel), I decided I was going to “force” myself to use [Visual Studio Code](https://code.visualstudio.com) as my only editor instead of [Atom](https://atom.io) (to be clear, I also continued to use vim). The experiment has been a rousing success; I haven’t opened Atom since them. I’ve found VS Code’s performance to be staggeringly superior, and the Go extension specifically has made me really&nbsp;happy.

With that, I decided to compile a list of the VS Code extensions that I have found most helpful in my journey. Keep in mind, this is a list of extensions that are based upon _my_ workflows and tools. If you don’t work on the same technologies as I do, you might not find them as&nbsp;useful.

- [Bracket Pair Colorizer](https://marketplace.visualstudio.com/items?itemName=CoenraadS.bracket-pair-colorizer) — forever answers the question “Which opening parenthesis does this&nbsp;close?”
- [Chef Extension](https://marketplace.visualstudio.com/items?itemName=Pendrica.Chef) — Support for the [Chef](https://www.chef.io) DSL, plus some awesome snippets. Even provides support for cookstyle linting.
- [Docker](https://marketplace.visualstudio.com/items?itemName=PeterJausovec.vscode-docker) — Because you can’t DevOps without Docker. In addition to some Command Palette actions for Docker commands (which, to be honest, I’ve not tried yet), you get syntax highlighting for your Dockerfile and docker-compose.yml files.
- [Gist Extension](https://marketplace.visualstudio.com/items?itemName=kenhowardpdx.vscode-gist) — Pretty basic, but it does the job. Makes it nice and easy to create and edit [GitHub Gists](https://gist.github.com) from VS Code.&nbsp;[1]
- [Git History](https://marketplace.visualstudio.com/items?itemName=donjayamanne.githistory) — Check out the history of a file (i.e., git log or the history of a single line (i.e., git blame). For blame, I prefer the Git Lens extension listed below,&nbsp;however.
- [Git Lens](https://marketplace.visualstudio.com/items?itemName=eamodio.gitlens) — Here we go…this is pretty essential if you do anything git related in VS Code. One of my favorite features is that it provides highlights of all lines changed in the most recent&nbsp;commit.
- [GitHub](https://marketplace.visualstudio.com/items?itemName=KnisterPeter.vscode-github) — Work with things like Pull Requests directly from within VS&nbsp;Code.
- [gitIgnore](https://marketplace.visualstudio.com/items?itemName=codezombiech.gitignore) — Pretty straightforward. Syntax highlighting for your&nbsp;.gitignore files. You can even use a command to generate a&nbsp;.gitignore from the [github/gitignore](https://github.com/github/gitignore) repository.
- [Go](https://marketplace.visualstudio.com/items?itemName=lukehoban.Go) — This is pretty much the thing that got me to switch from Atom to VS Code. I can’t even begin to list all the features. If you code in Go, you can’t possibly be using VS Code without this extension. Install it now. We’ll&nbsp;wait.
- [Intellisense for CSS Class Names](https://marketplace.visualstudio.com/items?itemName=Zignd.html-css-class-completion) — Fun type-ahead completion of your custom CSS classes, as defined in the current workspace (or linked references). You won’t know how you worked without&nbsp;it.
- [Markdown PDF](https://marketplace.visualstudio.com/items?itemName=yzane.markdown-pdf) — My colleague [Eric Sigler](https://esigler.com/) and I were recently bemoaning the fact that no code editor has a “print” function. Yes, sometimes you still do need to use dead trees. But more often than not, you just need to dish your [Markdown](https://daringfireball.net/projects/markdown/syntax) into a PDF to share with people who don’t read Markdown natively. This extension does what it says on the&nbsp;tin.
- [Markdown Preview Github Styling](https://marketplace.visualstudio.com/items?itemName=bierner.markdown-preview-github-styles)- Admit it. 99% of the Markdown you write in VS Code is for use in a README or similar on GitHub. This applies the Markdown Preview function of VS Code to look like [GitHub’s](https://github.github.com/gfm/).
- [markdownlint](https://marketplace.visualstudio.com/items?itemName=DavidAnson.vscode-markdownlint)- It’s kind of nice to have linting on your Markdown. This extension is both awesome and the bane of my existence at the same time (I keep violating rules that annoy me, such as MD001 header-increment - Header levels should only increment by one level at a time. Luckily, you can tell the linter to ignore certain rules, either globally, or on a project-by-project basis. (Tower is a paid product; a similar one that is pretty popular is [GitKraken](https://www.gitkraken.com/), but I haven’t found any VS Code extensions for&nbsp;it)
- [Open In GitTower](https://marketplace.visualstudio.com/items?itemName=fabiospampinato.vscode-open-in-gittower)- While I know that awesome people only use git at the command line, I occasionally find value in using a GUI. One of the only ones that I have found adds value is [Tower](https://www.git-tower.com/). This extension just makes it easy to pop the project open in&nbsp;there.
- [Project Manager](https://marketplace.visualstudio.com/items?itemName=alefragnani.project-manager)- Pretty straightforward…just create a list of your common projects, and you get a nice command palette action to browse/open them.
- [REST Client](https://marketplace.visualstudio.com/items?itemName=humao.rest-client)- It’s not a replacement for [Postman](https://www.getpostman.com/), but if you want to try out some REST calls from within your code, this works pretty&nbsp;well.
- [Sass](https://marketplace.visualstudio.com/items?itemName=robinbentley.sass-indented)- adds indented formatting to your SCSS files. Small things mean a&nbsp;lot.
- [Syncing](https://marketplace.visualstudio.com/items?itemName=nonoroazoro.syncing)- keeps your settings backed up to a secret GitHub gist (you can use a public one if you like, although I prefer a secret one, which is the default). This is helpful a) to keep your workspace in sync across multiple machines, and b) when you get a new machine, to add all your settings (including extensions). NOTE: This sync doesn’t happen automatically; you need to run the&nbsp;command.
- [Travis CI Status](https://marketplace.visualstudio.com/items?itemName=felixrieseberg.vsc-travis-ci-status)- Keep up-to-date on the status of your project in&nbsp;[Travis](https://travis.ci).
- [WakaTime](https://marketplace.visualstudio.com/items?itemName=WakaTime.vscode-wakatime)- “Fitbit for Programmers”. Keeps track of what projects you are spending time on. You can see mine at [wakatime.com/@mattstratton](https://wakatime.com/@mattstratton).

What extensions have you found that are super awesome? Let me know in the comments!

[1] If you use 2FA with your GitHub account, you’ll need to set a Personal Access Token (only needs gist access) and then pop it into your VS Code settings like so: "gist.oauthtoken": "XXXXXXXX"
