---
id: FEAT-0023
type: Feature
prefix: FEAT
number: 0023
title: Roadmap timeline view grouped by release
status: New
priority: Low
effort: XL
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

# FEAT-0023: Roadmap timeline view grouped by release

## Summary

Add a read-only roadmap view that lays out releases horizontally by version, with items grouped under each release, sorted by priority. No dates or Gantt bars — just a clean columnar layout for discussing scope and sequencing with stakeholders.

## Problem / Need

The current Releases Workspace shows one release at a time. There is no view that shows the full release plan at once — which items are in v0.2.0, v0.3.0, v1.0.0, and Unassigned — in a single scannable layout. Product roadmap views in JIRA, Linear, and Aha! address this.

## Expected Outcome

A Roadmap view in the sidebar shows all releases as columns (or stacked cards), ordered by semver, with Unassigned at the end. Items in each release are listed by priority. The view is read-only (clicking an item opens its detail modal). Print-friendly CSS is a bonus.

## Acceptance Criteria

- [ ] A Roadmap view is accessible from the app sidebar.
- [ ] All releases appear as columns or stacked panels ordered by semver.
- [ ] Items in each release are listed ordered by priority (Critical → Parking Lot).
- [ ] Unassigned items appear in a final "Unassigned" column.
- [ ] Clicking an item opens the item detail modal.
- [ ] The view updates when items are assigned to or removed from releases.

## Testing Notes

Create releases v0.2.0, v0.3.0, v1.0.0 with items assigned. Load the Roadmap view. Confirm ordering and item grouping.

## Human Testing Plan

Open the Roadmap view. Confirm all releases appear as panels in semver order. Confirm items appear under the correct release. Click an item and confirm the detail modal opens.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
