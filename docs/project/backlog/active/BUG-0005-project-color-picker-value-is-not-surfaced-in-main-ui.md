---
id: BUG-0005
type: Bug
prefix: BUG
number: 0005
title: Project color picker value is not surfaced in main UI
status: Ready to Release
priority: Low
effort: XS
release: v0.3.0
tags: []
blocks: []
blocked_by: []
sprint: 
created: 2026-04-29
developed: 2026-04-29
updated: 2026-05-13
tested: 2026-05-13
deployed: 
archived: 
archive_reason: 
deferred: 
defer_reason: 
---

# BUG-0005: Project color picker value is not surfaced in main UI

## User Story



## Summary

The project registration form includes a color picker, and the color is stored in `pm-tools-config.json`. However, the color is never applied anywhere in the main UI — not on the project picker dropdown, the sidebar, or the header. The feature is invisible to users after registration.

## Problem / Need

Users who configure a color to distinguish between projects get no visual benefit from doing so in the main workflow. The color picker sets an expectation that the color will appear somewhere prominent.

## Expected Outcome

The project color is applied as a visual indicator on the project picker dropdown entry (and optionally a subtle accent in the header or sidebar) so users can immediately identify the active project.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The project picker dropdown shows each project's color as a swatch next to the label.
- [x] The active project's color is visible somewhere in the header or sidebar.
- [x] Changing a project's color in Settings takes effect without requiring an app restart.

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

- 2026-05-13T19:28:00.569Z - Status changed from Needs Validation to Ready.
- 2026-05-13T19:28:22.345Z - Status changed from Ready to Needs Validation.
- 2026-05-13T20:38:48.238Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
