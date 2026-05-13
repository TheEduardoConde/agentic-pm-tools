---
id: FEAT-0021
type: Feature
prefix: FEAT
number: 0021
title: Sprint and iteration planning view
status: Needs Validation
priority: Low
effort: L
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

# FEAT-0021: Sprint and iteration planning view

## User Story



## Summary

Add a `sprint` front matter field to backlog items and a Sprint Planning view that groups items by sprint, shows capacity vs. total effort, and allows drag-and-drop assignment of items into sprint slots.

## Problem / Need

The current model only plans by release (version), which has no time-box. Teams that work in 1–2 week sprints need a time-bounded view that maps to a release but is smaller than a full version. JIRA Sprints and Linear Cycles address this.

## Expected Outcome

Items can carry `sprint: Sprint 1` in front matter. A new Sprint view in the app sidebar shows items grouped by sprint, with effort sums per sprint and a capacity warning when effort exceeds a configurable limit. Items can be assigned to a sprint from the view.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] `sprint` is a supported optional front matter field.
- [x] A Sprint view is accessible from the sidebar.
- [x] Items are grouped by sprint label in the view.
- [x] Each sprint shows the total effort count (S=1, M=2, L=3, XL=5, XS=0.5) and a configurable capacity limit.
- [x] Items can be assigned to a sprint from the Sprint view.
- [x] Items with no sprint are shown in a "Backlog" section at the bottom.

## Edge Cases

## Implementation Notes

Implemented in the large backlog delivery pass on 2026-05-06. The pass added status workflow acceleration, quick add, keyboard shortcuts, validation safe fixes, full-text search, dependency/tag/sprint metadata, activity notes, release progress and effort summaries, CSV export, roadmap and sprint views, and dark mode support as applicable to this item.

## Testing Notes

Automated validation: npm test from app/ passed after implementation. Human testing is still required for user-facing workflow confirmation.

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

- 2026-05-06T15:44:24.700Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.728Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
