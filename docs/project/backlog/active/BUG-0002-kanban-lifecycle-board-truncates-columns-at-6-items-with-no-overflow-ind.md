---
id: BUG-0002
type: Bug
prefix: BUG
number: 0002
title: Kanban lifecycle board truncates columns at 6 items with no overflow indicator
status: Needs Validation
priority: Medium
effort: XS
release: v0.3.0
created: 2026-04-29
developed: 2026-04-29
updated: 2026-04-29
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# BUG-0002: Kanban lifecycle board truncates columns at 6 items with no overflow indicator

## User Story



## Summary

The lifecycle board on the Backlog Dashboard shows at most 6 items per status column. When a column has more than 6 items, the extras are silently dropped — there is no count badge, "show more" link, or any indication that items are hidden.

## Problem / Need

Users with active sprints frequently have more than 6 items in a single status (e.g., "Ready" or "In Progress"). The silent truncation makes the board misleading.

## Expected Outcome

When a column contains more items than the display limit, the board shows a count of hidden items (e.g., "+4 more") with a link or action to view all items in that status.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] Columns with more items than the display limit show a visible overflow count (e.g., "+ N more").
- [x] Clicking the overflow indicator filters the backlog table to that status.
- [x] Columns at or below the limit are unaffected.

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

## Links

- None.
