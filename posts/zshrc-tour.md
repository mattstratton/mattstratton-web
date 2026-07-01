---
title: "What's Actually in My .zshrc (and Why)"
published: false
description: "A guided tour through the parts of my shell config that are actually worth explaining, from a shell that now has two audiences to a Keychain-backed secrets setup."
tags: [shell, zsh, dotfiles, productivity]
cover_image: "./assets/zshrc-tour-cover.png"
---

Your shell config is mostly a graveyard. A line you added in 2019 to fix a problem you don't remember having. An alias you're afraid to remove because what if you need it. Mine is no different, but there are a handful of pieces in there that are worth explaining, not because they're clever, but because most people have never thought about why they'd want them.

This isn't a full dump of my config. If you want that, it's all on GitHub at [matty-dotfiles](https://github.com/mattstratton/matty-dotfiles). This post is about the config itself: the logic, the functions, the stuff that changes how the shell behaves depending on who, or what, is actually running it. (There's a quick note at the bottom on how the files are actually organized, if you're wondering why I keep saying "files" instead of "file.")

## The part that actually matters: AGENT_MODE

Here's the thing that made me want to write this post in the first place.

```bash
if [[ -n "$npm_config_yes" ]] || [[ -n "$CI" ]] || [[ "$-" != *i* ]]; then
  export AGENT_MODE=true
else
  export AGENT_MODE=false
fi
```

Your shell used to have one audience: you. That's not true anymore. If you're running Claude Code, or any other coding agent that shells out to run commands on your behalf, your shell now has a second audience that doesn't want the same things you do. It doesn't want `thefuck` to interactively suggest a correction. It doesn't want a confirmation prompt before `rm` deletes something. It doesn't want your fancy multi-line prompt burning tokens or confusing a parser.

So I detect it. If `npm_config_yes` is set, or `CI` is set, or the shell isn't interactive (`$-` doesn't contain `i`), I flip `AGENT_MODE` on. Later in `.zshrc_shared`, that flag does real work:

```bash
if [[ "$AGENT_MODE" == "true" ]]; then
  export EDITOR='nvim'
  PROMPT='%n@%m:%~%# '
  RPROMPT=''
  unsetopt CORRECT
  unsetopt CORRECT_ALL
  setopt NO_BEEP
  setopt NO_HIST_BEEP
  setopt NO_LIST_BEEP
  alias rm='rm -f'
  alias cp='cp -f'
  alias mv='mv -f'
  alias npm='npm --no-fund --no-audit'
  alias yarn='yarn --non-interactive'
  alias pip='pip --quiet'
  alias git='git -c advice.detachedHead=false'
fi
```

No beeps, no interactive confirmations, a boring flat prompt instead of starship, and force flags on the destructive file commands so an agent doesn't get stuck at a prompt it can't answer. `EDITOR` switches to plain `nvim` instead of `code --wait`, because a headless agent trying to wait on VS Code to close a file is not a fun afternoon.

I'd bet a decent chunk of you reading this have never thought about the fact that your interactive shell defaults are actively hostile to a non-interactive process. Worth fixing before it bites you.

## Secrets that don't live in plaintext

```bash
source ~/keychain-environment-variables.sh

export GITHUB_TOKEN=$(keychain-environment-variable GITHUB_TOKEN)
export CHANGELOG_GITHUB_TOKEN=$(keychain-environment-variable GITHUB_TOKEN)
export BOWIE_GITHUB_TOKEN=$(keychain-environment-variable GITHUB_TOKEN)
export HOMEBREW_GITHUB_API_TOKEN=$(keychain-environment-variable GITHUB_TOKEN)
export GITHUB_PERSONAL_ACCESS_TOKEN=$(keychain-environment-variable GITHUB_TOKEN)
export BUTTONDOWN_API_KEY=$(keychain-environment-variable BUTTONDOWN_API_KEY)
```

`keychain-environment-variable` is a function that pulls a secret out of macOS's Keychain at shell startup instead of having it sit around in plaintext in a dotfile that's synced to GitHub. I did not write this myself, I adapted it from [a blog post](https://www.netmeister.org/blog/keychain-passwords.html), and I only know that because the comment at the top of the file still says so. It just shells out to `security find-generic-password` under the hood, nothing exotic, but it means the thing I `git push` never has a credential in it.

It's worth calling out that this function has to live somewhere. It's not in `.zshrc_shared` itself, it's a separate file (`keychain-environment-variables.sh`) that gets sourced, and yes, it's yadm-alternated too (`##os.Darwin` and `##os.Linux` versions, same symlink dance as the zshrc files). If you go copy the alias/export lines above without also grabbing that script, none of this works. Ask me how I know.

## The `gh` alias that fixes a dumb problem

```bash
alias gh="GITHUB_TOKEN= command gh"
```

Small, but it earns its place. The `gh` CLI has its own auth flow, and it checks `GITHUB_TOKEN` first if it's set, which it is, everywhere, because half my other tools need it exported. Without this alias, `gh` quietly uses that token instead of my actual `gh auth login` session, and I get weird permission mismatches that take way too long to debug. This alias just unsets the variable for the one command that has opinions about it.

## A shortcut for working an issue with Claude Code

```bash
issue() { claude --permission-mode plan -w "issue-$1" "/implement issue #$1" }
```

Type `issue 412` and it spins up Claude Code in plan mode, in its own worktree named `issue-412`, already pointed at a slash command that implements GitHub issue #412. It's a one-liner, but it's the kind of one-liner that removes enough friction that I actually use it instead of doing the same five commands by hand every time.

## atuin and starship deserve more than a name-drop

I mentioned in [My Brewfile](https://dev.to/mattstratton/my-brewfile-1pob) that I install both of these, but I glossed over why, so let's fix that.

```bash
eval "$(atuin init zsh)"
```

[atuin](https://atuin.sh/) replaces your plain old shell history file with a searchable SQLite database, and it hooks into your shell so every command gets logged with context: what directory you were in, how long it ran, whether it exited cleanly. The part that actually changed how I work is the search. Instead of mashing the up arrow forty times or grepping through `.zsh_history` and hoping, I hit a keybinding and fuzzy-search across every command I've ever run, filtered by directory if I want. If you sync it, that history follows you across machines too. I didn't realize how much time I spent reconstructing commands from memory until I stopped having to.

```bash
eval "$(starship init zsh)"
```

[starship](https://starship.rs/) is the prompt. That's it, that's the whole job, but it does that job well: git branch and status, language versions, command duration, all rendered fast and only when relevant, so it doesn't clutter the prompt with things that don't apply to the directory you're in. The reason it matters more than "cosmetic" makes it sound is that a good prompt answers questions before you have to ask them. Am I in a dirty git tree? Which Node version is active here? Starship tells me before I type anything.

Also notice that starship shows back up in the `AGENT_MODE` block from earlier, sort of. When agent mode is on, I explicitly override `PROMPT` to something flat and boring instead of letting starship render. Fancy prompts are a UX win for a human; they're just noise (or worse, a parsing hazard) for a process reading your terminal output.

## Aliases are underrated, actually

People treat aliases like a beginner's trick, something you graduate out of once you "really" know the shell. That's backwards. An alias is just muscle memory you get to define yourself, for the commands you actually run, not the ones a tutorial thinks you should run. A few from my shared config:

```bash
alias c='clear'
alias sz='source ~/.zshrc'
alias zshconfig="nvim ~/.zshrc"
alias gpom="git push origin main"
alias gitmain="git checkout main && git pull origin main"
alias cpenv='cp ~/src/github.com/timescale/tiger-den/.env ./'
```

`c` has been in my shell configs for so many decades at this point that I genuinely forget, in the moment, that `c` isn't actually a real command. It's `clear`. It has always been `clear`. I have simply stopped knowing that.

`sz` and `zshconfig` exist because I edit and reload this file constantly, and typing `nvim ~/.zshrc##os.Darwin` correctly every time is not a skill I've bothered to develop. `gpom` and `gitmain` are the ones I'd actually recommend you steal: they encode the exact git incantations you run dozens of times a day into something you can type without thinking. `cpenv` is hyper-specific to one project of mine, and that's fine too. Aliases don't need to be generalizable to be worth having.

## The stuff I'll just mention

A few plugins and settings that do work but don't need a full section: `thefuck` for command correction, `autojump` for directory jumping, oh-my-zsh plugins like `git-extras` and `history-substring-search`, and a couple of bindkeys so option+arrow jumps by word instead of doing nothing useful:

```bash
bindkey "^[[1;3C" forward-word
bindkey "^[[1;3D" backward-word
```

All small. All the kind of thing you only notice once it's gone.

## Bonus: why there are three files, not one

I manage my dotfiles with [yadm](https://yadm.io/), which supports "alternate files" keyed on things like OS. So instead of one `.zshrc`, I actually have `.zshrc##os.Darwin` and `.zshrc##os.Linux`, and yadm symlinks the right one to `.zshrc` depending on the machine. Both of those source a third file, `.zshrc_shared`, which holds everything that doesn't care what kernel it's running on. Same setup applies to the keychain script above.

That's really it. It's a small mechanism, not a deep one, which is exactly why it's a bonus section and not its own post. If enough people want the full "how yadm alternates work" writeup, say so in the comments and I'll do it properly.

## Go poke around

The full files are in [matty-dotfiles](https://github.com/mattstratton/matty-dotfiles) if you want the parts I skipped. If you've got a shell trick worth stealing, I want to hear about it in the comments.
