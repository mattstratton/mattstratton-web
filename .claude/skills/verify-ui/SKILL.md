---
name: verify-ui
description: Visually verify a UI change by capturing it in light mode, dark mode, and a mobile viewport using Chrome automation. Use when the user says "/verify-ui", "check the UI", "verify this looks right", or after making changes to layouts, components, or styling that should be visually confirmed before shipping.
---

# verify-ui

Formalizes the manual light/dark/mobile check that `mattstratton-speaking/CLAUDE.md`
already calls for after UI changes. Run this standalone, on demand — it is not
wired into `/pr`.

## Steps

1. **Start the dev server** for whichever subproject changed (`npm run dev` from
   the repo root, `mattstratton-speaking/`, etc.) if it isn't already running.
2. **Load the deferred Chrome tools** in one `ToolSearch` call:
   `select:mcp__claude-in-chrome__tabs_context_mcp,mcp__claude-in-chrome__navigate,mcp__claude-in-chrome__computer,mcp__claude-in-chrome__read_page,mcp__claude-in-chrome__tabs_create_mcp`.
3. **Identify the page(s) to check** — the route(s) touched by the diff, or ask
   the user if it's not obvious from the changed files.
4. **Capture each page in three states**, saving screenshots to disk (not just
   describing them):
   - Light mode, desktop viewport.
   - Dark mode, desktop viewport (toggle via the site's theme control, or
     `prefers-color-scheme` emulation if the site has no manual toggle).
   - Mobile viewport (narrow width, e.g. ~375px), default color scheme.
5. **Check for the known failure modes** this codebase cares about: broken tap
   targets or overflow at narrow widths, missing focus outlines, body text below
   WCAG AA contrast, and any element that doesn't degrade gracefully when an
   asset (image, video, slide) is absent.
6. **Report findings** — call out anything that looks broken with the specific
   screenshot as evidence, rather than a general "looks fine."

## Notes

- Avoid triggering JS `alert`/`confirm`/`prompt` dialogs during capture — they
  block the extension. If a control might trigger one, skip clicking it and note
  why.
- If Chrome tool calls fail repeatedly or a page won't load, stop and report
  what was attempted rather than retrying in a loop.
