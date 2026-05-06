---
id: FEAT-0021
type: Feature
prefix: FEAT
number: 0021
title: Sprint and iteration planning view
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

# FEAT-0021: Sprint and iteration planning view

## Summary

Add a `sprint` front matter field to backlog items and a Sprint Planning view that groups items by sprint, shows capacity vs. total effort, and allows drag-and-drop assignment of items into sprint slots.

## Problem / Need

The current model only plans by release (version), which has no time-box. Teams that work in 1–2 week sprints need a time-bounded view that maps to a release but is smaller than a full version. JIRA Sprints and Linear Cycles address this.

## Expected Outcome

Items can carry `sprint: Sprint 1` in front matter. A new Sprint view in the app sidebar shows items grouped by sprint, with effort sums per sprint and a capacity warning when effort exceeds a configurable limit. Items can be assigned to a sprint from the view.

## Acceptance Criteria

- [ ] `sprint` is a supported optional front matter field.
- [ ] A Sprint view is accessible from the sidebar.
- [ ] Items are grouped by sprint label in the view.
- [ ] Each sprint shows the total effort count (S=1, M=2, L=3, XL=5, XS=0.5) and a configurable capacity limit.
- [ ] Items can be assigned to a sprint from the Sprint view.
- [ ] Items with no sprint are shown in a "Backlog" section at the bottom.

## Testing Notes

Create items across three sprints. Confirm grouping and totals. Exceed the capacity limit and confirm a visual warning.

## Human Testing Plan

Assign 5 items to "Sprint 1" and load the Sprint view. Confirm all 5 appear under Sprint 1. Confirm the effort total is shown.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
