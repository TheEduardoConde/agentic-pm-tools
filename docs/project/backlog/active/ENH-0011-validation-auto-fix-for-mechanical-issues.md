---
id: ENH-0011
type: Enhancement
prefix: ENH
number: 0011
title: Validation auto-fix for mechanical issues
status: New
priority: Medium
effort: M
release: Unassigned
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

# ENH-0011: Validation auto-fix for mechanical issues

## Summary

The validation view surfaces findings but offers no way to resolve them from the UI. Add "Fix" buttons for deterministic, low-risk issues — specifically wrong-folder placement and BACKLOG.md out-of-sync — so users can remediate without manually editing files.

## Problem / Need

The most common validation findings (item in wrong folder, BACKLOG.md stale) are mechanical — the correct action is unambiguous. Requiring users to manually move files or regenerate the index is friction for a tool designed to remove friction.

## Expected Outcome

Validation findings that have a known safe fix display a "Fix" button. Clicking it executes the fix and re-runs validation to confirm resolution.

## Acceptance Criteria

- [ ] "Item in wrong folder" findings show a "Move to correct folder" button.
- [ ] "BACKLOG.md out of sync" findings show a "Regenerate index" button.
- [ ] Clicking a Fix button executes the fix atomically.
- [ ] Validation re-runs automatically after a fix and updates the findings list.
- [ ] Findings that require manual judgment (e.g., duplicate IDs, missing required fields) do not show a Fix button.

## Testing Notes

Manually move a backlog item file to the wrong folder. Run validation. Confirm the finding appears with a Fix button. Click Fix and confirm the file moves and the finding resolves.

## Human Testing Plan

Move `backlog/active/FEAT-XXXX.md` to `backlog/archived/` manually. Open the Validation view. Confirm a "wrong folder" finding appears with a Fix button. Click Fix and confirm the file moved back and the finding is gone.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
