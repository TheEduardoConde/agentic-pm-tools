---
id: UI-0020
type: User Interface
prefix: UI
number: 0020
title: Dark mode toggle
status: Ready to Release
priority: Low
effort: S
release: Unassigned
tags: []
blocks: []
blocked_by: []
sprint: 
created: 2026-04-29
developed: 2026-05-06
updated: 2026-05-13
tested: 2026-05-13
deployed: 
archived: 
archive_reason: 
deferred: 
defer_reason: 
---

# UI-0020: Dark mode toggle

## User Story



## Summary

Add a dark mode toggle to the app. The CSS already uses design tokens (`--color-*` variables), making a dark theme largely a matter of providing an alternate token set under a `data-theme="dark"` attribute on the root element.

## Problem / Need

The app currently has only a light theme. Dark mode is a standard user expectation in modern tools and is especially important for developers working at night. The existing CSS architecture already anticipates it.

## Expected Outcome

A toggle in the header or Settings switches between light and dark themes. The preference persists across sessions (stored in `localStorage`). The dark theme reuses the same CSS architecture with an alternate color token set.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] A theme toggle button is visible in the app header or Settings.
- [x] Clicking the toggle switches between light and dark themes without a page reload.
- [x] The dark theme is defined as an alternate `--color-*` token set under `[data-theme="dark"]`.
- [x] The theme preference is saved to `localStorage` and restored on next load.
- [x] All core UI surfaces (sidebar, table, modals, badges, panels) are legible in dark mode.

## Edge Cases



## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed after implementation. Human testing is still required for user-facing workflow confirmation.

## Human Testing Plan

Human tester should exercise the item acceptance criteria in the running app, including the affected UI workflow and any file updates on disk. Record pass/fail results before deployment.

## Owner Review Needed



## Codex Prompt



## Changed Files

- `app/server.js`
- `app/index.html`
- `app/src/app.js`
- `app/src/styles.css`
- `app/test/readBacklog.test.js`
- `docs/project/TEST_COMMANDS.md`

## Activity

- 2026-05-06T15:44:24.846Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.886Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T19:27:28.152Z - Status changed from Needs Validation to Blocked.
- 2026-05-13T19:27:48.068Z - Status changed from Blocked to Needs Validation.
- 2026-05-13T20:38:48.612Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
