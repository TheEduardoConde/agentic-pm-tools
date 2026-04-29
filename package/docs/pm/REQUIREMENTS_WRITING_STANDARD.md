# Requirements Writing Standard

Requirements should make implementation and validation unambiguous without over-designing the solution.

## Requirement Qualities

Good requirements are:

- Clear
- Testable
- Bounded
- Traceable to a need
- Free of hidden assumptions

## Functional Requirements

Functional requirements describe what the system must do. Use them when acceptance criteria alone are not enough.

Write each requirement as a direct statement:

```text
- The system must allow a user to save a draft without publishing it.
```

## Nonfunctional Requirements

Use nonfunctional requirements when performance, security, accessibility, reliability, compatibility, or operational constraints matter.

Examples:

```text
- The page must remain usable on supported mobile viewport widths.
- The import process must reject malformed input without partially writing records.
```

## Avoid

- Vague quality words without measurable meaning
- Requirements that prescribe a technical implementation when behavior is sufficient
- Bundling unrelated requirements into one line
- Project-specific decisions inside reusable methodology files
