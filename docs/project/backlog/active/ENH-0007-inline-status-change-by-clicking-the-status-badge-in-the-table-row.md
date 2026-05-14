---
id: ENH-0007
type: Enhancement
prefix: ENH
number: 0007
title: Inline status change by clicking the status badge in the table row
status: Ready to Release
priority: High
effort: S
release: v0.3.1
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

# ENH-0007: Inline status change by clicking the status badge in the table row

## User Story



## Summary

Currently, changing an item's status requires opening the full edit modal. Add the ability to click the status badge in the backlog table row to open a small status picker inline, without opening the modal.

## Problem / Need

Opening the full edit modal for a single-field status change is a common source of friction in PM tools. JIRA, Linear, and Height all allow clicking the status badge to change it in place. This is the single highest-impact usability improvement for daily triage workflows.

## Expected Outcome

Clicking a status badge in the backlog table opens a compact dropdown or popover showing all valid statuses. Selecting one updates the item immediately and closes the picker.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] Clicking the status badge in a table row opens a status picker (dropdown or popover).
- [x] The picker lists all valid statuses.
- [x] Selecting a status updates the item and closes the picker without full page reload.
- [x] The `updated` date is stamped on save.
- [x] The lifecycle board and table row reflect the new status immediately.
- [x] The picker can be dismissed without making a change (Escape key or click-away).

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

- 2026-05-06T15:44:23.973Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T20:38:48.238Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
