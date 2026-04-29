# Agentic Development Method

This method governs Codex-driven development from backlog item to completion report.

## Operating Rules

- Read the relevant backlog item or release file first.
- Preserve scope. Do not redesign, refactor, restructure, or expand scope unless the backlog item explicitly requires it.
- If redesign, refactor, restructuring, or scope expansion seems necessary, stop and ask Eddie first.
- Check `./docs/project/TEST_COMMANDS.md` before running tests.
- Update backlog item files with lifecycle dates, implementation notes, testing notes, changed files, and links when applicable.
- Provide an Agent Completion Report after implementation.
- Do not commit, push, merge, rebase, force push, deploy, or create a release without Eddie's explicit approval.

## Item Workflow

1. Read the backlog item.
2. Confirm it is `Ready` or `Planned`, unless Eddie explicitly instructed otherwise.
3. Implement only the item scope.
4. Validate acceptance criteria.
5. Run required automated tests where applicable.
6. Update the backlog item.
7. Prepare the Agent Completion Report.
8. Prepare version-control recommendation without executing it.

## Release Workflow

1. Read the release file.
2. Read every included backlog item file.
3. Implement only included items.
4. Validate each item's acceptance criteria.
5. Update each item.
6. Update the release status summary, prompt, and checklist as needed.
7. Prepare the Agent Completion Report.
8. Stop before version-control actions.
