# Release Workflow

Releases use app version IDs:

```text
v0.1.0
v0.2.0
v1.0.0
```

Project-specific release files live at:

```text
./docs/project/releases/v0.1.0.md
```

## Release File Contents

Release files should contain release-level information only:

- Release ID
- Title
- Status
- Created, developed, tested, and deployed dates
- Goal
- Included backlog item IDs
- Release status summary
- Codex development prompt
- Human testing checklist
- Version-control prompt
- Release notes

Do not duplicate changed files in release files. Changed files belong only in individual backlog item files.

## Front Matter

```yaml
---
id: v0.1.0
title: Release v0.1.0
status: Planning
created: YYYY-MM-DD
developed:
tested:
deployed:
---
```

## Release Status Values

- Planning
- Ready for Development
- In Development
- Development Complete
- Ready for Human Testing
- Ready to Deploy
- Deployed
- Blocked
- Cancelled

## Release Readiness Rule

A release can move to `Ready to Deploy` only when every included backlog item is in one of these statuses:

- `Ready to Deploy`
- `Passed Testing`

Meaning:

- `Ready to Deploy`: item passed automated validation and human testing was not applicable.
- `Passed Testing`: item required human testing and Eddie approved it.

## Approval Gates

Gate 1, Approve Release Readiness:

Confirms the release work is functionally acceptable.

Gate 2, Approve Version-Control Action:

Confirms the exact Git or release action Eddie wants.

Agents may prepare release and version-control actions, but must not execute commit, push, PR, merge, deploy, release, tag, rebase, or force-push actions without Eddie's explicit approval.
