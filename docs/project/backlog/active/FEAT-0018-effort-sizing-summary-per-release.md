---
id: FEAT-0018
type: Feature
prefix: FEAT
number: 0018
title: Effort sizing summary per release
status: New
priority: Medium
effort: S
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

# FEAT-0018: Effort sizing summary per release

## Summary

Display a breakdown of effort sizes (XS, S, M, L, XL, Unknown) for the items included in a release, so planners can assess load at a glance without opening each item.

## Problem / Need

Release planning currently requires opening individual items or the items table to see effort values. There is no summary showing whether a release is overloaded (too many L/XL items) or whether effort estimates are missing (Unknown). This is a standard capacity view in any sprint planner.

## Expected Outcome

The release detail panel shows a compact effort summary below or beside the progress bar. Each effort tier shows a count and optionally a simple icon or chip (XS ×3, S ×5, M ×2, L ×1, Unknown ×2).

## Acceptance Criteria

- [ ] The release detail panel shows an effort breakdown for releases with at least one item.
- [ ] Each effort tier (XS, S, M, L, XL, Unknown) shows the count of included items with that effort.
- [ ] Tiers with zero items are either hidden or shown as 0.
- [ ] The breakdown updates when items are added/removed or their effort changes.

## Testing Notes

Create a release with items of mixed effort values. Confirm the breakdown counts match. Assign or remove items and confirm the counts update.

## Human Testing Plan

Open a release with 10 items. Confirm the effort breakdown is visible and accurate. Add an item with effort XL. Confirm the XL count increases by 1.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
