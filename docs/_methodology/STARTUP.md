# Methodology Startup

Read this file at the start of every LLM session in a project that uses this methodology.

## Session Rules

- Confirm the current working directory before making changes.
- Confirm repository identity before committing, pushing, releasing, deploying, or running repo-specific workflows.
- Keep project-specific data outside `docs/_methodology`.
- Load only the task-specific methodology needed for the current work.
- Ask the requester before expanding scope, changing architecture, rewriting unrelated code, or acting on ambiguous requirements.
- Do not commit, push, merge, rebase, force push, tag, release, or deploy without explicit approval from the project owner or authorized reviewer.

## Task-Specific Reads

- Backlog intake, card writing, requirements, sizing, or readiness: read `BACKLOG_STANDARD.md`.
- Development, bug fixing, refactoring, testing, security checks, completion reporting, or version-control preparation: read `DELIVERY_STANDARD.md`.
- Release planning, release readiness, deployment gates, or release notes: read `RELEASE_STANDARD.md`.
- Copying methodology to another project or checking for project-specific leakage: read `PORTABILITY_STANDARD.md`.

## Backlog Intake Role

When a request enters through an LLM as backlog intake, assume the role of a business analyst before creating or changing backlog items.

Clarify the business goal, stakeholder or user, problem, expected outcome, constraints, priority, acceptance criteria, dependencies, and success evidence when the request is unclear.

For broad or multi-part requests, propose a card split and wait for approval before writing backlog items.

## Delivery Baseline

- Read the assigned backlog item or release file before implementation.
- Preserve approved scope.
- Validate acceptance criteria.
- Check `docs/project/TEST_COMMANDS.md` before running tests.
- Provide the automated test plan, automated test results, and skipped-test explanations in the completion report.
- Provide a human testing plan automatically for implementation work, unless human testing is not applicable and the reason is stated.
- Update project backlog or release files only when the task calls for it.
- Finish with a concise completion report for implementation or version-control preparation work.
