---
id: FEAT-0019
type: Feature
prefix: FEAT
number: 0019
title: Kanban drag-and-drop status change
status: Development Complete
priority: High
effort: L
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

- [ ] Cards on the lifecycle board can be dragged.
- [ ] Dropping a card into a different column updates the item's status via the existing `PUT /api/backlog/items/{id}` endpoint.
- [ ] The board re-renders to reflect the new status without a full page reload.
- [ ] Dropping a card onto its current column does nothing.
- [ ] Drag-and-drop works for statuses that require folder moves (e.g., Deployed, Archived).
- [ ] A visual drop indicator shows the valid drop target during drag.
- [ ] The implementation uses the HTML5 Drag and Drop API — no external library required.

## Edge Cases



## Implementation Notes

Used the HTML5 Drag and Drop API via event delegation on `els.statusBoard`. Board columns gained `data-drop-status` attributes; cards gained `draggable="true"` and `data-item-id`. A module-level `draggedItemId` variable tracks the in-flight card. `dragover` prevents default to allow dropping and adds a `drag-over` CSS class to the target column for visual feedback; `dragleave` removes it when the pointer exits the column boundary (checked via `relatedTarget`). `drop` calls a new shared `updateItemStatus(id, newStatus)` helper which calls `PUT /api/backlog/items/{id}` and then reloads the backlog and releases. Same-column drops are no-ops. A `badgeKey()` helper was extracted from `badge()` to enable reuse by the status picker.

## Testing Notes

Drag items between all column combinations that involve folder moves (active → completed, active → archived). Confirm files move on disk.

## Human Testing Plan

Drag a "Ready" item to the "In Development" column. Confirm the card appears in the In Development column after drop. Confirm the item file is now in `backlog/active/` with status "In Development".

## Owner Review Needed



## Codex Prompt



## Changed Files

- `app/src/app.js` — `renderBoard` adds `draggable`, `data-item-id`, `data-drop-status`; new `updateItemStatus` helper; new `badgeKey` helper; drag event listeners on `els.statusBoard`.
- `app/src/styles.css` — `.board-card[draggable]`, `.board-card.dragging`, `.board-column.drag-over` styles.

## Links

- None.
