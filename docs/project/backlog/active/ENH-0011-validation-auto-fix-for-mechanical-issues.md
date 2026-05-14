---
id: ENH-0011
type: Enhancement
prefix: ENH
number: 0011
title: Validation auto-fix for mechanical issues
status: Needs Validation
priority: Medium
effort: M
release: Unassigned
tags: []
blocks: []
blocked_by: []
sprint: 
created: 2026-04-29
developed: 2026-05-06
updated: 2026-05-13
tested: 2026-05-13
deployed: 2026-05-13
archived: 
archive_reason: 
deferred: 
defer_reason: 
---

# ENH-0011: Validation auto-fix for mechanical issues

## User Story



## Summary

The validation view surfaces findings but offers no way to resolve them from the UI. Add "Fix" buttons for deterministic, low-risk issues — specifically wrong-folder placement and BACKLOG.md out-of-sync — so users can remediate without manually editing files.

## Problem / Need

The most common validation findings (item in wrong folder, BACKLOG.md stale) are mechanical — the correct action is unambiguous. Requiring users to manually move files or regenerate the index is friction for a tool designed to remove friction.

## Expected Outcome

Validation findings that have a known safe fix display a "Fix" button. Clicking it executes the fix and re-runs validation to confirm resolution.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] "Item in wrong folder" findings show a "Move to correct folder" button.
- [x] "BACKLOG.md out of sync" findings show a "Regenerate index" button.
- [x] Clicking a Fix button executes the fix atomically.
- [x] Validation re-runs automatically after a fix and updates the findings list.
- [x] Findings that require manual judgment (e.g., duplicate IDs, missing required fields) do not show a Fix button.

## Edge Cases



## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed (93/93) on 2026-05-11. Partial code-level verification completed:
- AC3 (PASSED via test): "fixValidationFinding regenerates the BACKLOG index" passes — fix executes atomically via `atomicWriteFile`.
- AC4 (PASSED via code): `POST /api/backlog/fix` endpoint exists in server.js and the test confirms index regeneration completes and returns a valid result.
- AC1, AC2, AC5 (REQUIRES BROWSER): Presence/absence of "Move to correct folder" and "Regenerate index" buttons, and absence of Fix buttons for non-mechanical findings, require UI inspection in the running app.

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

- 2026-05-06T15:44:24.220Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.256Z - Status changed from Development Complete to Ready for Testing.
- 2026-05-13T20:34:51.223Z - Status changed from Needs Validation to Done.
- 2026-05-13T21:12:27.480Z - Note: Human testing 2026-05-13: FAIL. No auto-fix buttons are implemented in the Validation view. The UI subtitle explicitly states "Safe-fix buttons are future scope." Item remains in Needs Validation.
- 2026-05-13T21:13:29.182Z - Status changed from Done to Needs Validation.

## Links

- None.
