---
id: FEAT-0019
type: Feature
prefix: FEAT
number: 0019
title: Kanban drag-and-drop status change
status: Ready to Release
priority: High
effort: L
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

# FEAT-0019: Kanban drag-and-drop status change

## User Story



## Summary

Enable dragging a card from one Kanban column to another to trigger a status change. This is the #1 missing interaction compared to JIRA and Linear, and the biggest daily usability gap in the current app.

## Problem / Need

The lifecycle board is currently view-only. Users can see items grouped by status but cannot interact with the board to move items. Every status change requires opening the inline picker or the full edit modal. Drag-and-drop on a Kanban is the most intuitive status-change mechanism for visual thinkers and sprint planners.

## Expected Outcome

Cards on the lifecycle board are draggable. Dropping a card into a different status column triggers the same update as the inline status picker — the item's status is updated on disk and the board refreshes. An invalid drop (e.g., dragging to the same column) does nothing.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] Cards on the lifecycle board can be dragged.
- [x] Dropping a card into a different column updates the item's status via the existing `PUT /api/backlog/items/{id}` endpoint.
- [x] The board re-renders to reflect the new status without a full page reload.
- [x] Dropping a card onto its current column does nothing.
- [x] Drag-and-drop works for statuses that require folder moves (e.g., Done, Deferred, Archived).
- [x] A visual drop indicator shows the valid drop target during drag.
- [x] The implementation uses the HTML5 Drag and Drop API — no external library required.

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

- 2026-05-06T15:44:24.680Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T20:38:48.529Z - Status changed from Needs Validation to Ready to Release.

## Links

- None.
