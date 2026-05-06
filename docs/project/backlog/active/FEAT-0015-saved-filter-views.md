---
id: FEAT-0015
type: Feature
prefix: FEAT
number: 0015
title: Saved filter views
status: New
priority: Low
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

# FEAT-0015: Saved filter views

## Summary

Allow users to save named combinations of filter settings (status, priority, folder, tags, sort) as reusable views. Saved views persist to `.pm-meta.json` and appear as quick-access shortcuts in the backlog filter panel.

## Problem / Need

Users repeatedly configure the same filter combinations (e.g., "items in testing", "ready to deploy", "my sprint"). Re-applying these filters on every session visit is repetitive. JIRA Boards and Linear saved views address this directly.

## Expected Outcome

A "Save View" button in the filter panel captures the current filter state and prompts for a name. Saved views appear as clickable chips or a dropdown. Clicking a saved view applies its filters. Views can be deleted.

## Acceptance Criteria

- [ ] The filter panel includes a "Save View" action.
- [ ] Saved views persist to `.pm-meta.json` under a `savedViews` key.
- [ ] Clicking a saved view applies all its filter settings to the table.
- [ ] Saved views can be renamed and deleted.
- [ ] Views load correctly after a server restart.

## Testing Notes

Save a view with status=Ready, priority=High. Restart the server. Load the app and apply the saved view. Confirm the filters match.

## Human Testing Plan

Set status filter to "In Testing". Click "Save View", name it "Testing". Reload the page. Click the "Testing" saved view chip and confirm the filter re-applies.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
