---
id: ENH-0006
type: Enhancement
prefix: ENH
number: 0006
title: Bulk status change from selection bar
status: Development Complete
priority: High
effort: S
release: v0.3.1
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

# ENH-0006: Bulk status change from selection bar

## User Story



## Summary

The backlog table selection bar currently only supports "Assign in Releases". Add a "Change Status" action that applies a single status to all selected items, matching the bulk-assignment capability already in place.

## Problem / Need

Moving multiple items through a status transition (e.g., marking a batch of "Passed Testing" items as "Ready to Deploy") currently requires opening each item's edit modal individually. JIRA and Linear both support bulk status change as a core workflow operation.

## Expected Outcome

When one or more items are selected, a "Change Status" dropdown or button appears in the selection bar. Choosing a status and confirming applies it to all selected items and updates their `updated` date.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [ ] The selection bar shows a "Change Status" action when at least one item is selected.
- [ ] The action presents the full list of valid statuses.
- [ ] Confirming the change applies the new status to all selected items.
- [ ] Items that require a folder move (e.g., to `completed/` or `archived/`) are moved correctly.
- [ ] The backlog table and lifecycle board refresh after the bulk update.
- [ ] The `updated` date on each changed item is stamped with today's date.

## Edge Cases



## Implementation Notes

The "Change Status" action was already present in the HTML (`bulkStatusSelect` + `bulkStatusBtn`) and wired to `bulkUpdateSelectedItems({ status })` via a click listener. `bulkUpdateSelectedItems` iterates selected items and issues `PUT /api/backlog/items/{id}` with the chosen status, then calls `loadBacklog` and `loadReleases`. Folder moves and `updated` date stamping are handled server-side by the existing `updateBacklogItem` function. No new code was required for this item.

## Testing Notes

Select items across multiple current statuses. Apply a single new status. Confirm all items updated correctly including folder moves.

## Human Testing Plan

Select 3 items with different statuses. Use "Change Status" to set all to "Ready". Confirm each item now shows "Ready" and appears in the correct folder.

## Owner Review Needed



## Codex Prompt



## Changed Files

- No new files changed (implementation was already present in `app/src/app.js` and `app/index.html`).

## Links

- None.
