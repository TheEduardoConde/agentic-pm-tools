---
id: ENH-0007
type: Enhancement
prefix: ENH
number: 0007
title: Inline status change by clicking the status badge in the table row
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

- [ ] Clicking the status badge in a table row opens a status picker (dropdown or popover).
- [ ] The picker lists all valid statuses.
- [ ] Selecting a status updates the item and closes the picker without full page reload.
- [ ] The `updated` date is stamped on save.
- [ ] The lifecycle board and table row reflect the new status immediately.
- [ ] The picker can be dismissed without making a change (Escape key or click-away).

## Edge Cases



## Implementation Notes

The status `<span>` badge in `renderRows` was replaced with a `<button class="badge badge-status ...">` carrying `data-status-pick="{itemId}"`. A `button.badge` CSS reset (border, cursor, font-family) keeps visual appearance identical to the span. A dynamically created `div#statusPicker` is appended to `<body>` at startup; it is populated with one button per `STATUS_OPTIONS` entry on open. `showStatusPicker` positions the picker below the clicked badge using `getBoundingClientRect`. Escape keydown and document click-away call `hideStatusPicker`. Selecting an option calls the shared `updateItemStatus` helper and reloads the backlog. The `els.rows` click handler was updated to intercept `[data-status-pick]` clicks before the general row-open logic.

## Testing Notes

Confirm the picker works for statuses that require folder moves (e.g., Archived, Deployed). Confirm ESC dismisses without saving.

## Human Testing Plan

Click the status badge on a "New" item. Select "Ready". Confirm the badge updates and the item appears in the "Ready" column on the lifecycle board.

## Owner Review Needed



## Codex Prompt



## Changed Files

- `app/src/app.js` — `renderRows` status badge changed to button; `badgeKey` helper extracted; `showStatusPicker` / `hideStatusPicker` functions; status picker element creation; `statusPickerEl` event listeners; `els.rows` click handler updated.
- `app/src/styles.css` — `button.badge` reset styles; `.status-picker` and `.status-picker-option` styles.

## Links

- None.
