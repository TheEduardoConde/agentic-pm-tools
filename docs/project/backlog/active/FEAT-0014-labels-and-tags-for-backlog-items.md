---
id: FEAT-0014
type: Feature
prefix: FEAT
number: 0014
title: Labels and tags for backlog items
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

# FEAT-0014: Labels and tags for backlog items

## Summary

Add a free-form `tags` front matter array to backlog items so items can be grouped and filtered by cross-cutting concerns (e.g., `auth`, `performance`, `api`, `mobile`). Tags complement the prefix system which handles item type — tags handle domain and area.

## Problem / Need

The current filter set (status, priority, folder) does not support filtering by domain or component. On large backlogs, finding all performance-related items or all API-touching items requires manual scanning.

## Expected Outcome

Items can carry a `tags: [api, auth]` front matter array. The UI shows tags as badges on item rows. The filter panel includes a tag multi-select. Typing in the quick-add form or the edit modal allows assigning tags.

## Acceptance Criteria

- [ ] `tags` is a supported front matter array (zero or more short strings).
- [ ] Tags are displayed as badges in the backlog table row and item detail modal.
- [ ] The filter panel includes a tag filter that narrows the table to items with the selected tags.
- [ ] The edit modal allows adding and removing tags via a text input or tag picker.
- [ ] Validation warns when a tag value contains spaces or special characters beyond `-` and `_`.

## Testing Notes

Create items with overlapping tags. Use the tag filter to confirm only matching items appear. Edit an item to remove a tag and confirm the table updates.

## Human Testing Plan

Create two items, both tagged `auth`. Open the filter panel, select the `auth` tag. Confirm only those two items are shown in the table.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
