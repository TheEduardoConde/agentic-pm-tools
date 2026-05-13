---
id: FEAT-0014
type: Feature
prefix: FEAT
number: 0014
title: Labels and tags for backlog items
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
updated: 2026-05-06
tested:
deployed:
archived:
archive_reason:
deferred:
defer_reason:
---

# FEAT-0014: Labels and tags for backlog items

## User Story



## Summary

Add a free-form `tags` front matter array to backlog items so items can be grouped and filtered by cross-cutting concerns (e.g., `auth`, `performance`, `api`, `mobile`). Tags complement the prefix system which handles item type — tags handle domain and area.

## Problem / Need

The current filter set (status, priority, folder) does not support filtering by domain or component. On large backlogs, finding all performance-related items or all API-touching items requires manual scanning.

## Expected Outcome

Items can carry a `tags: [api, auth]` front matter array. The UI shows tags as badges on item rows. The filter panel includes a tag multi-select. Typing in the quick-add form or the edit modal allows assigning tags.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] `tags` is a supported front matter array (zero or more short strings).
- [x] Tags are displayed as badges in the backlog table row and item detail modal.
- [x] The filter panel includes a tag filter that narrows the table to items with the selected tags.
- [x] The edit modal allows adding and removing tags via a text input or tag picker.
- [x] Validation warns when a tag value contains spaces or special characters beyond `-` and `_`.

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

- 2026-05-06T15:44:24.411Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.448Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
