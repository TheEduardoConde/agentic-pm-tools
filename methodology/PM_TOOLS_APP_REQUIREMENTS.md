# PM Tools App Requirements

This document describes future requirements only. Do not build the app until explicitly requested.

## Location

The future PM Tools app must live at:

```text
./docs/pm/app
```

## Standalone Requirement

The app must be standalone:

- Own `package.json`
- Own `npm install`
- Own `npm start`
- Not integrated into any host application
- Portable across projects

The app may reuse patterns or code from an existing project backlog page, but must not carry project-specific assumptions.

## MVP Capabilities

1. View backlog
2. Add backlog item
3. Edit backlog item
4. Archive, defer, reject, or mark duplicate without deleting
5. Bulk assign items to release
6. Auto-create release files
7. Generate item-level Codex prompt
8. Generate release-level Codex prompt
9. Generate human testing checklist
10. Update status and lifecycle dates
11. Move files based on status
12. Validate backlog by button only
13. Regenerate `BACKLOG.md` index

## Validate Backlog Behavior

- Manual button only
- Do not run automatically on load
- Store last validation timestamp in `./docs/project/.pm-meta.json`
- Show a non-blocking reminder if validation has not run recently

Validation checks:

- Duplicate IDs
- Missing required fields
- Invalid prefix
- Invalid status
- Invalid priority
- Invalid effort
- Invalid release format
- Status-folder mismatch
- Missing release file for assigned release
- Release file references missing backlog items
- Backlog item release does not match release file membership
- Invalid dates
- Filename mismatch
- `BACKLOG.md` index out of sync

Safe fixes:

- Move files to correct folder based on status
- Regenerate `BACKLOG.md`
- Create missing release files
- Add missing optional template sections

## Archive Behavior

- No delete from normal UI
- Move to `./docs/project/backlog/archived/`
- Set `status: Archived`
- Set archived date
- Set `archive_reason: Manually archived by user`
- Add Archive Note section

## Deferred Behavior

- Move to `./docs/project/backlog/deferred/`
- Set `status: Deferred`
- Set deferred date
- Add Defer Note section

## Completed Behavior

- Move to `./docs/project/backlog/completed/`
- Status must be `Deployed`

## Release Assignment

- User can bulk select backlog items
- Assign selected items to a release version, for example `v0.2.0`
- If release file does not exist, create it automatically
- Update each selected backlog item:
  - `release: v0.2.0`
  - `status: Planned`
  - `updated: today`
- Regenerate `BACKLOG.md`

## Codex Prompt Behavior

- Generate item-level prompts
- Generate release-level prompts
- Display prompt for copy/paste
- Save item prompt under backlog item `## Codex Prompt`
- Save release prompt under release file `## Codex Development Prompt`

## Release Status Summary

- App calculates live summary
- Release file may store a generated summary snapshot
- Do not duplicate changed files in release file
