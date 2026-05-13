---
id: ENH-0006
type: Enhancement
prefix: ENH
number: 0006
title: Bulk status change from selection bar
status: Needs Validation
priority: High
effort: S
release: v0.3.1
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

# ENH-0006: Bulk status change from selection bar

## User Story



## Summary

The backlog table selection bar currently only supports "Assign in Releases". Add a "Change Status" action that applies a single status to all selected items, matching the bulk-assignment capability already in place.

## Problem / Need

Moving multiple items through a status transition (e.g., marking a batch of `Needs Validation` items as `Ready to Release`) currently requires opening each item's edit modal individually. JIRA and Linear both support bulk status change as a core workflow operation.

## Expected Outcome

When one or more items are selected, a "Change Status" dropdown or button appears in the selection bar. Choosing a status and confirming applies it to all selected items and updates their `updated` date.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The selection bar shows a "Change Status" action when at least one item is selected.
- [x] The action presents the full list of valid statuses.
- [x] Confirming the change applies the new status to all selected items.
- [x] Items that require a folder move (e.g., to `completed/` or `archived/`) are moved correctly.
- [x] The backlog table and lifecycle board refresh after the bulk update.
- [x] The `updated` date on each changed item is stamped with today's date.

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

- 2026-05-06T15:44:23.938Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
