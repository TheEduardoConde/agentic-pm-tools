---
id: FEAT-0017
type: Feature
prefix: FEAT
number: 0017
title: Release progress bar showing item status breakdown
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

# FEAT-0017: Release progress bar showing item status breakdown

## Summary

Add a horizontal progress bar to the release detail panel that visualizes the distribution of included items by lifecycle stage (Planning, Build, Test, Done). No charting library required — pure CSS segments using existing data.

## Problem / Need

The release detail panel lists items in a table but gives no at-a-glance sense of release health or completeness. A simple progress bar makes it immediately obvious how many items are done vs. in flight vs. not started.

## Expected Outcome

The release detail panel shows a segmented horizontal bar above the items table. Each segment represents a lifecycle group (e.g., Not Started in gray, In Progress in blue, In Testing in yellow, Done in green) with item counts. A legend identifies each segment.

## Acceptance Criteria

- [ ] The release detail panel shows a segmented progress bar for releases with at least one item.
- [ ] Segments correspond to lifecycle groups: Not Started (New/Planned/Ready), In Build (In Development/Development Complete/Needs Review/Changes Requested), In Test (Ready for Testing/In Testing/Failed Testing/Passed Testing), Done (Deployed/Ready to Deploy).
- [ ] Each segment shows a count and percentage.
- [ ] The bar updates when items are added or their status changes.
- [ ] An empty release shows no bar or a placeholder.

## Testing Notes

Create a release with items across all lifecycle groups. Confirm segment widths and counts match the actual item distribution.

## Human Testing Plan

Open a release with 10 items in mixed statuses. Confirm the progress bar shows visible segments with counts that sum to 10.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
