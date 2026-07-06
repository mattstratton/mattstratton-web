#!/usr/bin/env bash
# PreToolUse hook (matcher: Bash) — blocks direct `git push` to master/main so
# changes always go through a branch + PR. See .claude/skills/pr/SKILL.md.
set -euo pipefail

input="$(cat)"
command="$(echo "$input" | jq -r '.tool_input.command // empty')"

[[ -z "$command" ]] && exit 0
[[ "$command" != *"git push"* ]] && exit 0

target_branch=""
if [[ "$command" =~ push[[:space:]]+[^[:space:]]+[[:space:]]+([^[:space:]:]+) ]]; then
  target_branch="${BASH_REMATCH[1]}"
fi

if [[ -z "$target_branch" ]]; then
  target_branch="$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "")"
fi

if [[ "$target_branch" == "master" || "$target_branch" == "main" ]]; then
  echo "Blocked: direct 'git push' to '$target_branch' is not allowed. Create a branch and use the /pr skill to open a pull request instead." >&2
  exit 2
fi

exit 0
