# Delivery Standard

This standard governs LLM-assisted implementation from approved backlog item or release scope through validation and handoff.

## Operating Rules

- Read the relevant backlog item or release file first.
- Implement only approved scope.
- Do not redesign, refactor, restructure, or expand scope unless the backlog item or release explicitly requires it.
- If scope expansion appears necessary, stop and ask the requester.
- Check `docs/project/TEST_COMMANDS.md` before running tests.
- Update related project backlog or release files when applicable.
- Do not commit, push, merge, rebase, force push, tag, release, or deploy without explicit approval from the project owner or authorized reviewer.

## Item Workflow

1. Read the backlog item.
2. Confirm it is `Ready` or `Planned`, unless explicitly instructed otherwise.
3. Implement only the item scope.
4. Validate each acceptance criterion.
5. Run required automated tests where applicable.
6. Update the backlog item with status, lifecycle dates, implementation notes, testing notes, changed files, and links when applicable.
7. Provide a completion report.
8. Prepare version-control recommendations without executing them unless approved.

## Release Workflow

1. Read the release file.
2. Read every included backlog item file.
3. Implement only included items.
4. Validate each item's acceptance criteria.
5. Run required automated tests where applicable.
6. Update each item and the release summary when applicable.
7. Provide a completion report.
8. Stop before version-control or deployment actions unless approved.

## Testing

Codex or another implementation agent must validate implemented functionality against backlog requirements.

If `docs/project/TEST_COMMANDS.md` is missing:

- Infer likely commands from project files.
- Label inferred commands as inferred.
- Recommend creating `docs/project/TEST_COMMANDS.md`.
- Do not treat inferred commands as permanent standards.

Do not claim tests passed without evidence. Record command, result, relevant output, skipped tests, and known limitations.

If tests fail, fix and rerun when the fix is clearly within scope. Stop and report when failure requires credentials, unavailable services, environment setup, unclear requirements, or a scope decision.

## Human Testing

Human testing is required when work affects user behavior, UI/UX, workflows, API behavior, data changes, security, authentication, permissions, release readiness, automation behavior, money movement, trading, or external integrations.

Human testing may be marked `Not Applicable` for low-risk internal work such as typo fixes, minor docs changes, internal refactors with no behavior change, formatting-only changes, test-only improvements, or dependency cleanup with passing automated tests. Include a reason.

## Security Check

Record security review inside the completion report unless a separate security report is required.

A separate security report is required for `SEC` work, authentication or authorization changes, secrets or environment variable handling, payment/trading/transaction behavior, external API integration changes, user data storage/export/deletion/permissions, deployment security, or dependency updates with security implications.

Review secret exposure, authentication, authorization, permission boundaries, input validation, output encoding, data retention, external trust boundaries, dependency risk, and deployment configuration when applicable.

## Status Outcomes

- `Development Complete`: work is written, but automated tests were not completed or could not confirm the requirement.
- `Blocked` or `Changes Requested`: validation fails and cannot be fixed without guidance.
- `Ready for Testing`: automated tests pass and human testing is required.
- `Ready to Deploy`: automated tests pass and human testing is not applicable.
- `Passed Testing`: human testing was required and approved by the authorized reviewer.
- `Deployed`: approved release, version-control, or deployment action is completed.

## Definition Of Done

A backlog item is done only when:

1. Acceptance criteria are satisfied.
2. Code or documentation changes are complete.
3. Required automated tests were run, or skipped with a clear reason.
4. Human testing is completed when applicable.
5. Security check is completed when applicable.
6. Backlog item file is updated.
7. Changed files are recorded in the backlog item file.
8. Completion report is provided.
9. Version-control recommendation is prepared when applicable.
10. Commit, push, PR, merge, release, tag, or deploy happens only after approval.

## Completion Report

Required after implementation, bug fixes, test implementation, security fixes, refactors, deployment preparation, or version-control preparation.

Not required for brainstorming, requirements drafting, backlog card writing, documentation-only planning, or simple question answering.

Include:

- Scope completed
- Backlog items addressed
- Files changed
- Implementation summary
- Automated tests run
- Tests not run
- Human testing plan or reason not applicable
- Security check
- Backlog updates made
- Version-control recommendation
- Risks, warnings, and approvals needed

## Version Control

Agents may inspect Git status, summarize changed files, identify unrelated changes, check for secrets, prepare commit messages, prepare commands, prepare PR text, and recommend next steps.

Before asking for approval, present branch, changed files, files proposed for commit, files excluded, tests run, backlog items included, proposed commit message, proposed push or PR workflow, and risks or skipped tests.

Default strategy: use one commit per backlog item for large or separate work, and one release commit for small coherent releases. Commit bodies must list included backlog item IDs.

