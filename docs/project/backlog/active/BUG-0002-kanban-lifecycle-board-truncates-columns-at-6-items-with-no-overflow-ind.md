---
id: BUG-0002
type: Bug
prefix: BUG
number: 0002
title: Kanban lifecycle board truncates columns at 6 items with no overflow indicator
status: Ready for Testing
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

Users with active sprints frequently have more than 6 items in a single status (e.g., "Ready" or "In Development"). The silent truncation makes the board misleading.

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

Lifecycle board columns now render a `+ N more` overflow button when a status has more than six items. Clicking the overflow button applies the backlog table status filter for that column and scrolls the table into view.


## Testing Notes

Seed a project with 8+ items in a single status and confirm the overflow indicator appears.

Static UI coverage now verifies the overflow filter hook is present.

## Human Testing Plan

Manually create 8 items with status "Ready". Load the dashboard. Confirm the lifecycle board column shows 6 items plus a "+2 more" indicator. Click the indicator and confirm the table filters to that status.

## Owner Review Needed



## Codex Prompt



## Changed Files

- app/src/app.js
- app/src/styles.css
- app/test/readBacklog.test.js

## Links

- None.
