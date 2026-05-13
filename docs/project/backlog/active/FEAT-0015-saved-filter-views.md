---
id: FEAT-0015
type: Feature
prefix: FEAT
number: 0015
title: Saved filter views
status: Needs Validation
priority: Low
effort: M
release: Unassigned
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

# FEAT-0015: Saved filter views

## User Story



## Summary

Allow users to save named combinations of filter settings (status, priority, folder, tags, sort) as reusable views. Saved views persist to `.pm-meta.json` and appear as quick-access shortcuts in the backlog filter panel.

## Problem / Need

Users repeatedly configure the same filter combinations (e.g., "items in testing", "ready to deploy", "my sprint"). Re-applying these filters on every session visit is repetitive. JIRA Boards and Linear saved views address this directly.

## Expected Outcome

A "Save View" button in the filter panel captures the current filter state and prompts for a name. Saved views appear as clickable chips or a dropdown. Clicking a saved view applies its filters. Views can be deleted.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] The filter panel includes a "Save View" action.
- [x] Saved views persist to `.pm-meta.json` under a `savedViews` key.
- [x] Clicking a saved view applies all its filter settings to the table.
- [x] Saved views can be renamed and deleted.
- [x] Views load correctly after a server restart.

## Edge Cases

## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed (93/93) on 2026-05-11. Partial code-level verification completed:
- AC2 (PASSED via test): "saved views persist under project metadata" passes — views written to `.pm-meta.json` under `savedViews` key via `saveSavedViews()`.
- AC5 (PASSED via code): `getSavedViews` reads from `.pm-meta.json` on every call — survives server restart by design (file-backed persistence).
- AC1, AC3, AC4 (REQUIRES BROWSER): "Save View" button presence, clicking a saved view applying filters, and rename/delete interactions require UI testing in the running app.

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

- 2026-05-06T15:44:24.474Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.504Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
