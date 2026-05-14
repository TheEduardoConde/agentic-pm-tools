---
id: ENH-0009
type: Enhancement
prefix: ENH
number: 0009
title: Quick-add item inline form in the backlog table
status: Ready to Release
priority: Medium
effort: S
release: v0.2.0
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

# ENH-0009: Quick-add item inline form in the backlog table

## User Story



## Summary

Add a slim inline form at the top of the backlog table that allows creating a new item by entering just a title and prefix, without opening the full "Add Item" modal. This mirrors the quick-add pattern in Linear and Notion.

## Problem / Need

Opening the full Add Item modal for a rapid brain-dump of 10 new items is slow. Users want to capture items quickly during a planning session and fill in details later.

## Expected Outcome

A persistent or on-demand single-row form appears at the top of the backlog table. The user types a title, selects a prefix (defaulting to FEAT), and presses Enter to create the item with all other fields set to defaults. The form resets and remains focused for the next entry.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] A quick-add row or button is visible at the top of the backlog table.
- [x] The form requires only a title; prefix defaults to FEAT and can be changed via a small dropdown.
- [x] Pressing Enter creates the item and resets the form without closing or navigating away.
- [x] The created item appears in the table immediately.
- [x] Pressing Escape cancels without creating an item.
- [x] The created item has status New, priority Medium, effort Unknown, release Unassigned.

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

- 2026-05-06T15:44:24.059Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.102Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T20:38:48.377Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
