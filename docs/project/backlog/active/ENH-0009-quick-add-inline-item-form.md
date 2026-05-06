---
id: ENH-0009
type: Enhancement
prefix: ENH
number: 0009
title: Quick-add item inline form in the backlog table
status: New
priority: Medium
effort: S
release: v0.2.0
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

# ENH-0009: Quick-add item inline form in the backlog table

## Summary

Add a slim inline form at the top of the backlog table that allows creating a new item by entering just a title and prefix, without opening the full "Add Item" modal. This mirrors the quick-add pattern in Linear and Notion.

## Problem / Need

Opening the full Add Item modal for a rapid brain-dump of 10 new items is slow. Users want to capture items quickly during a planning session and fill in details later.

## Expected Outcome

A persistent or on-demand single-row form appears at the top of the backlog table. The user types a title, selects a prefix (defaulting to FEAT), and presses Enter to create the item with all other fields set to defaults. The form resets and remains focused for the next entry.

## Acceptance Criteria

- [ ] A quick-add row or button is visible at the top of the backlog table.
- [ ] The form requires only a title; prefix defaults to FEAT and can be changed via a small dropdown.
- [ ] Pressing Enter creates the item and resets the form without closing or navigating away.
- [ ] The created item appears in the table immediately.
- [ ] Pressing Escape cancels without creating an item.
- [ ] The created item has status New, priority Medium, effort Unknown, release Unassigned.

## Testing Notes

Create 5 items rapidly via the quick-add form and confirm all appear in the backlog table with correct defaults.

## Human Testing Plan

Click the quick-add area. Type a title. Press Enter. Confirm the item appears in the table. Type another title and press Enter again. Confirm a second item appears.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
