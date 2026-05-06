---
id: UI-0020
type: User Interface
prefix: UI
number: 0020
title: Dark mode toggle
status: New
priority: Low
effort: S
release: Unassigned
created: 2026-04-29
developed:
updated: 2026-04-29
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# UI-0020: Dark mode toggle

## Summary

Add a dark mode toggle to the app. The CSS already uses design tokens (`--color-*` variables), making a dark theme largely a matter of providing an alternate token set under a `data-theme="dark"` attribute on the root element.

## Problem / Need

The app currently has only a light theme. Dark mode is a standard user expectation in modern tools and is especially important for developers working at night. The existing CSS architecture already anticipates it.

## Expected Outcome

A toggle in the header or Settings switches between light and dark themes. The preference persists across sessions (stored in `localStorage`). The dark theme reuses the same CSS architecture with an alternate color token set.

## Acceptance Criteria

- [ ] A theme toggle button is visible in the app header or Settings.
- [ ] Clicking the toggle switches between light and dark themes without a page reload.
- [ ] The dark theme is defined as an alternate `--color-*` token set under `[data-theme="dark"]`.
- [ ] The theme preference is saved to `localStorage` and restored on next load.
- [ ] All core UI surfaces (sidebar, table, modals, badges, panels) are legible in dark mode.

## Testing Notes

Toggle between themes and inspect every view (dashboard, releases, validation, prompts, settings) for unreadable text or missing contrast.

## Human Testing Plan

Click the theme toggle. Confirm all UI surfaces switch to a dark theme. Reload the page and confirm the dark theme persists.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
