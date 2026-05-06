---
id: FEAT-0016
type: Feature
prefix: FEAT
number: 0016
title: Item activity log and comments
status: New
priority: Low
effort: L
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

# FEAT-0016: Item activity log and comments

## Summary

Append a `## Activity` section to backlog item markdown files that records timestamped status changes and free-text comments. No database required — the log is pure markdown, append-only, and stored in the item file itself.

## Problem / Need

Once a backlog item leaves "New" status, there is no history of what happened to it or why decisions were made. JIRA's activity stream is one of its most-referenced features during retrospectives and audits.

## Expected Outcome

Every status change stamps an entry like `- 2026-04-29: Status changed from New to In Development.` in the `## Activity` section. Users can also post a free-text note from the item detail modal. The activity log is read-only (append-only) and shown in the item view.

## Acceptance Criteria

- [ ] Status changes append a timestamped entry to `## Activity`.
- [ ] The item detail modal includes a "Add note" input that appends a free-text entry to `## Activity`.
- [ ] The `## Activity` section is rendered in the item detail view.
- [ ] Entries are append-only — existing entries cannot be edited or deleted via the UI.
- [ ] The activity section is preserved when items are edited via the edit modal.

## Testing Notes

Change an item's status three times. Open the item file and confirm three activity entries exist. Add a manual note and confirm it appears as a fourth entry.

## Human Testing Plan

Change an item from New to Ready. Open the item detail view. Confirm an activity entry reads "Status changed from New to Ready" with today's date.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
