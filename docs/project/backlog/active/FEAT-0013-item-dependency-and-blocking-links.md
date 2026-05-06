---
id: FEAT-0013
type: Feature
prefix: FEAT
number: 0013
title: Item dependency and blocking links
status: New
priority: Medium
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

# FEAT-0013: Item dependency and blocking links

## Summary

Add support for `blocks` and `blocked_by` relationships between backlog items, stored as front matter arrays. Validation should detect broken links. The UI should display dependency info on item detail views and optionally warn when a blocked item is moved to In Development.

## Problem / Need

Complex projects have items that cannot start until other items are complete. Without dependency tracking, the backlog gives no visibility into sequencing constraints. JIRA's "blocks/is blocked by" links are one of its most-used features.

## Expected Outcome

A backlog item's front matter can contain:
```yaml
blocks: [FEAT-0005, BUG-0002]
blocked_by: [FEAT-0001]
```
The item detail view shows these relationships. Validation flags broken links. The lifecycle board optionally shows a chain icon on items with open blockers.

## Acceptance Criteria

- [ ] `blocks` and `blocked_by` are supported front matter arrays.
- [ ] The item edit modal allows adding/removing dependency links.
- [ ] The item detail view displays linked items with their current status.
- [ ] Validation flags references to non-existent item IDs as errors.
- [ ] Moving a `blocked_by` item to In Development when the blocker is not Deployed shows a warning.

## Testing Notes

Create two items where A blocks B. Confirm the detail views show the relationship. Archive item A and confirm validation flags B's `blocked_by` reference as a broken link.

## Human Testing Plan

Create FEAT-0100 and FEAT-0101 where FEAT-0100 blocks FEAT-0101. Open FEAT-0101's detail view. Confirm FEAT-0100 appears in the "Blocked by" section with its current status.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
