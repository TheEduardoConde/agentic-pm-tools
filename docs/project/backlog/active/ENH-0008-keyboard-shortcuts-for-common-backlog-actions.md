---
id: ENH-0008
type: Enhancement
prefix: ENH
number: 0008
title: Keyboard shortcuts for common backlog actions
status: Needs Validation
priority: Medium
effort: M
release: Unassigned
tags: []
blocks: []
blocked_by: []
sprint:
created: 2026-04-29
developed: 2026-05-06
updated: 2026-05-06
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# ENH-0008: Keyboard shortcuts for common backlog actions

## User Story



## Summary

Add keyboard shortcuts for the most common backlog operations so power users can navigate and triage without reaching for the mouse.

## Problem / Need

The current UI is entirely pointer-driven. Triaging a backlog — opening items, changing status, navigating between rows — requires many clicks. JIRA and Linear both offer keyboard navigation as a core productivity feature.

## Expected Outcome

A defined set of keyboard shortcuts is available and discoverable via a help overlay (`?`). At minimum: navigate rows with arrow keys, open the focused item with `Enter` or `O`, change status with `S`, close modals with `Escape`.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] Arrow keys move focus between rows in the backlog table.
- [x] `Enter` or `O` opens the focused item's detail modal.
- [x] `S` opens the inline status picker for the focused row.
- [x] `Escape` closes any open modal or picker.
- [x] `?` opens a keyboard shortcut help overlay listing all available shortcuts.
- [x] Shortcuts do not fire when focus is inside a text input or textarea.

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

- 2026-05-06T15:44:23.996Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.033Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
