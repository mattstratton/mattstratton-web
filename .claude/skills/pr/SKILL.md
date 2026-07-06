---
name: pr
description: Build, test, review, and ship the current changes as a pull request. Use when the user says "/pr", "open a PR", "ship this", or asks to push their work up for review.
---

# pr

Take the working tree's changes from "done" to "open PR," scoped for a solo-maintained
repo (no draft-PR pause, no parallel security/a11y review bots — just enough
automation to catch mistakes before they ship).

## Steps

1. **Check the branch.** If currently on `master` or `main`, create a new branch
   first (name it for the change, e.g. `fix/nav-overflow`). Direct pushes to
   `master`/`main` are hard-blocked by `.claude/hooks/block-push-to-main.sh`, so
   this step isn't optional.
2. **Build and test.** Run `npm run build` and `npm test` from the repo root (or
   from the relevant subproject — `mattstratton-speaking/` and
   `mattstratton-dev-to/` each have their own `package.json` and must be run from
   inside that directory). Stop and fix before continuing if either fails.
3. **Review the diff.** Run the `code-review` skill against the changes. Apply
   fixes for anything it flags as a real issue; use judgement on stylistic
   nitpicks.
4. **Commit.** Follow this repo's normal commit conventions (see the root
   `CLAUDE.md` — specific files staged, not `git add -A`; message ends with the
   `Co-Authored-By` trailer). Never commit files that look like they might hold
   secrets (`.env`, credentials) without double-checking their contents first.
5. **Push and open the PR.** Push the branch, then `gh pr create` with a concise
   title and a body summarizing the change and how it was verified. Open it
   **ready for review**, not draft — there's no second reviewer waiting on draft
   status here.

## When to skip this skill

For a trivial one-line fix the user explicitly wants pushed directly, just ask
whether they want the full flow or a quick manual commit — don't force the
branch+PR ceremony on something that doesn't need it.
