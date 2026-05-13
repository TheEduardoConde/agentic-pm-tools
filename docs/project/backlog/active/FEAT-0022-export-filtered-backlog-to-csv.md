---
id: FEAT-0022
type: Feature
prefix: FEAT
number: 0022
title: Export filtered backlog to CSV
status: Needs Validation
priority: Medium
effort: S
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

# FEAT-0022: Export filtered backlog to CSV

## User Story



## Summary

Add a one-click "Export to CSV" button that serializes the currently filtered backlog table to a CSV file and triggers a browser download. Useful for stakeholder reports, offline reviews, and importing into spreadsheets.

## Problem / Need

Stakeholders who do not run the PM Tools app still need visibility into the backlog. Currently there is no way to share backlog data without sharing the markdown files directly. CSV export is the lowest-friction bridge to spreadsheets and project reports.

## Expected Outcome

An "Export CSV" button in the backlog table toolbar generates a CSV of the visible rows (respecting active filters). Columns include ID, Title, Status, Priority, Effort, Release, Type, Created, Updated. The download filename includes the project label and today's date.

## Functional Requirements



## Technical Requirements



## Acceptance Criteria

- [x] An "Export CSV" button or action is visible in the backlog table toolbar.
- [x] The export includes only the currently filtered/visible rows.
- [x] Exported columns: ID, Title, Status, Priority, Effort, Release, Type, Created, Updated.
- [x] The download is triggered as a file download in the browser.
- [x] The filename is `{project-label}-backlog-{YYYY-MM-DD}.csv`.
- [x] CSV values with commas are properly quoted.

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

- 2026-05-06T15:44:24.747Z - Status changed from New to Development Complete.
- 2026-05-06T15:44:24.775Z - Status changed from Development Complete to Ready for Testing.

## Links

- None.
