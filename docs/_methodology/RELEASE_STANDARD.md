# Release Standard

Releases group approved backlog items into a deployable or publishable change set.

## Release Files

Project-specific release files live under:

```text
docs/project/releases/
```

Release IDs use app version format such as `v0.1.0`, `v0.2.0`, or `v1.0.0`.

## Required Contents

Release files should contain release-level information only:

- Release ID
- Title
- Status
- Created, developed, tested, and deployed dates
- Goal
- Included backlog item IDs
- Release status summary
- Development prompt when generated
- Human testing checklist when applicable
- Version-control prompt or recommendation when generated
- Release notes

Do not duplicate changed files in release files. Changed files belong in individual backlog item files.

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

## Status Values

- Planning
- Ready for Development
- In Development
- Development Complete
- Ready for Human Testing
- Ready to Deploy
- Deployed
- Blocked
- Cancelled

## Readiness

A release can move to `Ready to Deploy` only when every included backlog item is in one of these statuses:

- `Ready to Deploy`: item passed automated validation and human testing was not applicable.
- `Passed Testing`: item required human testing and was approved by the authorized reviewer.

## Approval Gates

Gate 1, Approve Release Readiness: confirms release work is functionally acceptable.

Gate 2, Approve Version-Control or Deployment Action: confirms the exact Git, release, tag, deploy, or publish action to execute.

Agents may prepare release and version-control actions, but must not execute commit, push, PR, merge, deploy, release, tag, rebase, or force-push actions without explicit approval.

