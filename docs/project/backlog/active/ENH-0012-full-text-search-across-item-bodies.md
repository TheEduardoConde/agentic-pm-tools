---
id: ENH-0012
type: Enhancement
prefix: ENH
number: 0012
title: Full-text search across backlog item body content
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

# ENH-0012: Full-text search across backlog item body content

## Summary

The current search bar only matches against item title and ID. Add a server-side full-text search endpoint so users can find items by content in their Summary, Acceptance Criteria, Problem, or any other section.

## Problem / Need

As a backlog grows, users often remember a detail from an item's description but not its title or ID. Title-only search forces them to scroll through many results manually.

## Expected Outcome

The search bar (or a dedicated "full-text" toggle) sends the query to a new server endpoint that scans item body content using Node's `fs.readFile` and returns matching items with a highlighted excerpt.

## Acceptance Criteria

- [ ] A full-text search mode or toggle is available in the backlog view.
- [ ] The server endpoint `GET /api/backlog/search?q=...` returns items whose body contains the query string (case-insensitive).
- [ ] Results include a short excerpt showing the match in context.
- [ ] Search is scoped to the active project.
- [ ] Results load within 2 seconds for a backlog of 200 items.

## Testing Notes

Create an item with a unique phrase in the Summary section. Search for that phrase. Confirm the item appears in results with an excerpt. Confirm items whose title matches but body does not are still returned.

## Human Testing Plan

Create an item with a unique word in the acceptance criteria. Search for that word. Confirm the item appears in results.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
