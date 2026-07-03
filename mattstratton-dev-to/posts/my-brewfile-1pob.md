---
title: My Brewfile (Updated)
published: true
description: Did you know that Homebrew can install more than just packages? Here's an updated guided tour through my Brewfile to see how I set up applications, VS Code extensions, and more on my MacBook.
tags: home
canonical_url: https://www.mattstratton.com/writing/my-brewfile-1pob/
id: 327372
cover_image: https://dev-to-uploads.s3.amazonaws.com/i/e2bcvnrx9shjhpqfy8l5.png
date: 2020-05-04T20:51:50Z
crosspost: true
---
*Updated 06-24-2026*

I am a big fan of using [Homebrew](https://brew.sh) to install/update all the software on my MacBook. One thing that not everyone knows about is the idea of a [`Brewfile`](https://github.com/Homebrew/homebrew-bundle), which is a text file that lists all the various packages, etc, and you can then use `brew bundle` to install the things in the `Brewfile` (along with their dependencies). Brewfiles support more than just Homebrew packages; you can use a `Brewfile` to list out casks, as well as apps installed from the Mac App Store.

My current `Brewfile` is [available on GitHub](https://github.com/mattstratton/matty-dotfiles/blob/master/Brewfile), but I thought it might be helpful to go through it and provide some explanation of each package/application, and what I use them for.

## Packages

This is not a comprehensive list of all the packages I have installed, but just some that you might wonder about!

- [asciinema](https://formulae.brew.sh/formula/asciinema): Record what you do in a terminal! Fancy!
- [atuin](https://formulae.brew.sh/formula/atuin): Replaces your shell history with a searchable, syncable SQLite database. Sounds boring, is actually kind of life-changing.
- [autojump](https://formulae.brew.sh/formula/autojump): Little fun tool to make it easier to [jump to a different directory](https://github.com/wting/autojump).
- [diff-so-fancy](https://formulae.brew.sh/formula/diff-so-fancy): Make your [diffs look cooler](https://github.com/so-fancy/diff-so-fancy) and more readable.
- [direnv](https://formulae.brew.sh/formula/direnv): I don't use this as much as I should, but lets you do fancy stuff like [adjust environment variables based on the current directory](https://direnv.net/).
- [fd](https://formulae.brew.sh/formula/fd): A better `find`. Faster, friendlier, and the output doesn't make you feel bad about yourself.
- [gh](https://formulae.brew.sh/formula/gh): Command-line [tool for GitHub stuff](https://github.com/cli/cli).
- [git-extras](https://formulae.brew.sh/formula/git-extras): Lots of [extra helper stuff](https://github.com/tj/git-extras/blob/master/Commands.md) for `git`
- [hub](https://formulae.brew.sh/formula/hub): Some GitHub [things](https://github.com/github/hub) that `gh` doesn't quite do...yet.
- [mas](https://formulae.brew.sh/formula/mas): CLI for the Mac App Store. If you want to install MAS stuff via `Brewfile`, you need this.
- [neovim](https://formulae.brew.sh/formula/neovim): Modern vim with a better plugin ecosystem. Yes, I know.
- [ponysay](https://formulae.brew.sh/formula/ponysay): Pipe text through this to have [a cute pony](https://github.com/erkin/ponysay) display it. [Whimsy](https://www.youtube.com/watch?v=q6RlQkAsDqI)!
- [ripgrep](https://formulae.brew.sh/formula/ripgrep): A blazing fast grep replacement. Once you use it you can't go back.
- [starship](https://formulae.brew.sh/formula/starship): Cross-shell prompt that's fast, configurable, and shows you git status, language versions, and whatever else you want at a glance.
- [thefuck](https://formulae.brew.sh/formula/thefuck): Corrects your [previous console command](https://github.com/nvbn/thefuck). One of those tools that sounds dumb until the fifth time it saves you.
- [tldr](https://formulae.brew.sh/formula/tldr): Replacement for `man`. Actually readable.
- [tree](https://formulae.brew.sh/formula/tree): Why this isn't part of the standard OS X, I will never know.
- [uv](https://formulae.brew.sh/formula/uv): Extremely fast Python package manager written in Rust. If you do any Python work, swap to this immediately.
- [vim](https://formulae.brew.sh/formula/vim): Yes, OS X includes `vim`. But some plugins I like need it compiled with lua support, so there.
- [yadm](https://formulae.brew.sh/formula/yadm): I use this to manage my [dotfiles](https://github.com/mattstratton/matty-dotfiles).
- [yt-dlp](https://formulae.brew.sh/formula/yt-dlp): The actively-maintained community fork of youtube-dl for downloading videos from the internet. youtube-dl basically died; use this instead.
- [zsh-syntax-highlighting](https://formulae.brew.sh/formula/zsh-syntax-highlighting): A plugin for zsh to make your command line life much easier.
- [zsh-autosuggestions](https://formulae.brew.sh/formula/zsh-autosuggestions): Another really helpful zsh plugin. Fish-style suggestions as you type.

### Tapped packages

Some packages come from third-party taps rather than the main Homebrew repository. A few worth calling out:

- [speedtest](https://www.speedtest.net/apps/cli) (via `teamookla/speedtest`): Official CLI for speedtest.net. Install via `tap "teamookla/speedtest"` first.
- [litra](https://github.com/timrogers/litra) (via `timrogers/tap`): CLI control for Elgato Litra lights. Handy if you want to automate your lighting setup via scripts or Stream Deck.

## Casks

Homebrew can also install applications that have installers, etc. I try to only install software using a cask so that I can keep it tracked with my `Brewfile`. Note that some of these applications are not free and will require you to input a license key the first time you start them up.

- [1password](https://formulae.brew.sh/cask/1password): My main password management application. Works across mobile devices and all my computers. Use the one you prefer, but you should be using one.
- [adobe-creative-cloud](https://formulae.brew.sh/cask/adobe-creative-cloud): Gets the main installer/control app on my machine so I can install the various Adobe applications I'm licensed for.
- [aerial](https://formulae.brew.sh/cask/aerial): An OS X screensaver that uses the same images/look as the Apple TV screensaver.
- [alfred](https://formulae.brew.sh/cask/alfred): Task launcher, clipboard manager, and a whole lot more via workflows. I have both Alfred and Raycast installed and honestly use both for different things.
- [audio-hijack](https://formulae.brew.sh/cask/audio-hijack): Rogue Amoeba again! Dump audio from any application to be recorded, etc.
- [bartender](https://formulae.brew.sh/cask/bartender): Small utility that you don't know you needed until you try it. Lets you hide various things in the Mac menubar.
- [betterdisplay](https://formulae.brew.sh/cask/betterdisplay): Display management utility for finer-grained control over resolution, brightness, and HiDPI settings than macOS gives you natively.
- [beyond-compare](https://formulae.brew.sh/cask/beyond-compare): I use this for diffing files.
- [cleanshot](https://formulae.brew.sh/cask/cleanshot): Screenshot tool that replaced the default macOS screenshot workflow for me. Annotations, scrolling capture, OCR — it does a lot.
- [dash](https://formulae.brew.sh/cask/dash): Great tool for quick access to documentation on various tools, languages, etc. Coupled with Alfred, it's amazing.
- [descript](https://formulae.brew.sh/cask/descript): Audio/video editing tool that edits media like a document. Genuinely weird in the best way.
- [elgato-control-center](https://formulae.brew.sh/cask/elgato-control-center): Tool for controlling my Elgato Key Lights.
- [elgato-stream-deck](https://formulae.brew.sh/cask/elgato-stream-deck): Driver/configuration utility for the Stream Deck. Note: OBS must be installed before the Stream Deck software, which will annoy you if you keep your Brewfile alphabetical.
- [ghostty](https://formulae.brew.sh/cask/ghostty): New terminal emulator that's been making waves. Fast, native, and has a surprisingly good feature set out of the box.
- [handbrake](https://formulae.brew.sh/cask/handbrake): Still a super useful tool for converting video files to the format you want.
- [iterm2](https://formulae.brew.sh/cask/iterm2): If you do anything in the terminal on OS X, you should be using iTerm. Period. (I have both iTerm2 and Ghostty installed — living dangerously.)
- [logitech-presentation](https://formulae.brew.sh/cask/logitech-presentation): I mention this one because it's annoying; this only installs the *installer* for the Logitech Spotlight remote. You'll need to run the installer manually from wherever it gets dropped.
- [loopback](https://formulae.brew.sh/cask/loopback): Creates virtual audio devices, helpful for audio routing.
- [moom](https://formulae.brew.sh/cask/moom): Window management tool. Custom configurations for window placement, move windows there with a keystroke.
- [obs](https://formulae.brew.sh/cask/obs): Open Broadcaster Software. As noted above, install this before the Stream Deck software.
- [obsidian](https://formulae.brew.sh/cask/obsidian): Notes app built on local Markdown files. Good for both note-taking and the "I'll definitely organize this later" kind of note-taking.
- [raycast](https://formulae.brew.sh/cask/raycast): Spotlight replacement / launcher that's been eating Alfred's lunch for a few years now. Free tier is genuinely great.
- [riverside-studio](https://formulae.brew.sh/cask/riverside-studio): High-quality podcast/video recording. Records locally so you don't get the usual remote-recording quality issues.
- [screen-studio](https://formulae.brew.sh/cask/screen-studio): Screen recording with automatic zoom effects and nice defaults. Great for demos.
- [soundsource](https://formulae.brew.sh/cask/soundsource): Lets me control audio on a per-app basis, adjusting the volume and output device for individual apps.
- [tower](https://formulae.brew.sh/cask/tower): Most of the time, I use `git` at the command line, but this is a nice GUI on top of it.

## Fonts

You can use Homebrew to install fonts directly — and as of modern Homebrew, you no longer need to add the `homebrew/cask-fonts` tap first. Fonts are available straight from the main cask repository now.

```ruby
cask "font-hack-nerd-font"
cask "font-inconsolata-for-powerline"
cask "font-menlo-for-powerline"
cask "font-monaspace"
cask "font-monaspace-nerd-font"
```

Monaspace is worth calling out — it's a font superfamily from GitHub Next with some interesting typographic tricks for code. Worth a look.

## Mac App Store apps

I am not going to list all these, as I only use a few, but just to touch on a few things.

You need to know the ID of the app; to get it, run the following command:
`mas search Bear` (where "Bear" is the search string for the app you want). You need the `mas` package installed for this, which is why we have the packages listed first in the `Brewfile`.

You'll get output that looks like this:

```plaintext
  1091189122  Bear                             (1.7.11)
   926066161  Wildlife Simulator: Bear         (1.0)
   413013033  BATTLE BEARS -1 Mac              (1.1)
  1150538527  Dress Up Bear                    (1.1)
   792252100  Build A Teddy Bear               (1.0)
```

The first column is the ID that you will need. You also need the *exact* app name. Then update your `Brewfile` like this:

```ruby
mas "Bear", id: 1091189122
```

## VS Code Extensions

This one's new — Brewfile now supports installing VS Code extensions via the `vscode` keyword! I have a fairly ridiculous number of them, but a few highlights:

```ruby
vscode "eamodio.gitlens"
vscode "esbenp.prettier-vscode"
vscode "golang.go"
vscode "github.copilot"
vscode "github.copilot-chat"
vscode "hashicorp.terraform"
vscode "streetsidesoftware.code-spell-checker"
```

You can get the extension identifier from the VS Code marketplace URL or from the Extensions panel in VS Code itself (right-click an extension → "Copy Extension ID"). Then just add it to your Brewfile:

```ruby
vscode "publisher.extension-name"
```

This means your entire VS Code setup — extensions and all — gets bootstrapped along with everything else when you run `brew bundle`. Genuinely useful.

## AI Tools

When I first wrote this post, this section didn't exist. Now I have an entire category of AI-adjacent tools in my Brewfile, which is either exciting or a sign of something, depending on your disposition.

- [herdr](https://herdr.dev): "tmux for coding agents." Runs persistent agent sessions that survive terminal closes, work over SSH, and show you semantic state (blocked, working, done, idle) across all your running agents at a glance. If you're running multiple coding agents, this is how you wrangle them.
- [cask "claude"](https://claude.ai): The Claude desktop app. You know what this is.
- [cask "chatgpt"](https://openai.com/chatgpt): The ChatGPT desktop app. Also you know what this is.
- [cask "cursor"](https://cursor.sh): AI-native code editor forked from VS Code. Good if you want the AI stuff baked in more deeply than Copilot provides.
- [cask "codex"](https://formulae.brew.sh/cask/codex): OpenAI's coding agent tool.

The Brewfile didn't have any AI tools in it a few years ago. Now there's a whole section. We're all just out here shipping vibes into the future, I guess.
