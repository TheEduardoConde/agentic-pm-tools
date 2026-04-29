# Scrum Card Writing Standard

This standard explains how to translate ideas into backlog cards.

## Start From the Need

Capture the underlying problem before writing the solution. A good card states:

- What is wrong, missing, unclear, risky, or valuable
- What outcome should exist after the work
- How success will be verified

## Choosing a Prefix

Use the prefix that describes the intent of the work:

- `FEAT`: new user-facing capability
- `BUG`: broken behavior
- `ENH`: improvement to existing behavior
- `REQ`: requirement clarification or capture
- `TEST`: automated or manual testing work
- `SEC`: security-specific work
- `API`: API or integration work
- `DATA`: data model, migration, import, export, or storage work
- `OPS`: operational workflow, deployment, monitoring, or environment work
- `DOC`: documentation
- `ARCH`: architecture decision or design
- `REFA`: refactor without intended behavior change
- `REL`: release planning or release execution
- `AI`: AI agent behavior or prompt/process work
- `PM`: project-management process or tooling
- `UX`: user experience flow
- `UI`: interface polish
- `PERF`: performance
- `RISK`: risk analysis or mitigation
- `SPIKE`: research spike

## Simple vs Detailed Cards

Use the simple template for bugs, docs, small changes, refactors, tests, and work that does not need a user story.

Use the detailed template for user-facing work, complex behavior, multi-step workflows, data changes, integrations, or anything that needs functional requirements.

## User Story Rules

User Story is required for:

- `FEAT`
- `ENH`
- `UX`
- `UI`

User Story is optional for:

- `API`
- `DATA`
- `OPS`
- `AI`

User Story is usually not needed for:

- `BUG`
- `TEST`
- `SEC`
- `DOC`
- `ARCH`
- `REFA`
- `REL`
- `PM`
- `SPIKE`

## Functional Requirement Rules

Functional Requirements are required only when needed to make the work clear and testable.

They are normally needed for:

- `FEAT`
- `ENH`
- `UX`
- `UI`
- `API`
- `DATA`
- `AI`
- `OPS`
- `SEC`

## Acceptance Criteria

Every backlog item must include Acceptance Criteria.

Write criteria as observable statements:

- The changed behavior can be inspected or tested.
- Each criterion has a clear pass/fail outcome.
- Criteria do not hide major requirements inside vague language.

Prefer:

```text
- Given an unauthenticated user, when they request a protected route, then the system returns the configured unauthorized response.
```

Avoid:

```text
- Auth should work well.
```

## Splitting Vague or Broad Requests

When a user gives a broad, vague, or multi-part request, the backlog agent should not automatically create multiple cards. It should propose the split first, explain why, and wait for user approval.

Split when:

- Multiple unrelated features are requested
- UI and backend work are separable
- Testing work should stand alone
- Documentation work should stand alone
- Security work needs separate review
- Refactor is mixed with behavior change
- Release process work is mixed with app feature work

Do not split when:

- It is one small bug
- It is one clear UI change
- It is one documentation correction
- A test naturally belongs to the same acceptance criteria
- Splitting creates administrative clutter
