---
id: FEAT-0022
type: Feature
prefix: FEAT
number: 0022
title: Export filtered backlog to CSV
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

# FEAT-0022: Export filtered backlog to CSV

## Summary

Add a one-click "Export to CSV" button that serializes the currently filtered backlog table to a CSV file and triggers a browser download. Useful for stakeholder reports, offline reviews, and importing into spreadsheets.

## Problem / Need

Stakeholders who do not run the PM Tools app still need visibility into the backlog. Currently there is no way to share backlog data without sharing the markdown files directly. CSV export is the lowest-friction bridge to spreadsheets and project reports.

## Expected Outcome

An "Export CSV" button in the backlog table toolbar generates a CSV of the visible rows (respecting active filters). Columns include ID, Title, Status, Priority, Effort, Release, Type, Created, Updated. The download filename includes the project label and today's date.

## Acceptance Criteria

- [ ] An "Export CSV" button or action is visible in the backlog table toolbar.
- [ ] The export includes only the currently filtered/visible rows.
- [ ] Exported columns: ID, Title, Status, Priority, Effort, Release, Type, Created, Updated.
- [ ] The download is triggered as a file download in the browser.
- [ ] The filename is `{project-label}-backlog-{YYYY-MM-DD}.csv`.
- [ ] CSV values with commas are properly quoted.

## Testing Notes

Apply a status filter, export, and confirm the CSV contains only the filtered rows. Confirm items with commas in their title are quoted correctly.

## Human Testing Plan

Filter the backlog to show only "New" items. Click "Export CSV". Open the downloaded file in a spreadsheet app and confirm only New items appear with the correct columns.

## Codex Prompt

## Changed Files

- None yet.

## Links

- None.
