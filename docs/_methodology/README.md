# Project Methodology

`docs/_methodology` contains reusable, project-neutral methodology for software projects that use human direction and LLM-assisted delivery.

This folder is read-only process guidance. Do not place project backlog, requirements, decisions, logs, release notes, test results, secrets, local paths, or runtime app state here.

## Required Startup Read

Every LLM session must read:

```text
docs/_methodology/STARTUP.md
```

`STARTUP.md` tells the LLM which task-specific standard to load next.

## Standards

- `PORTABILITY_STANDARD.md`: folder boundaries and copy rules
- `BACKLOG_STANDARD.md`: intake, backlog item format, requirements, readiness, and card writing
- `DELIVERY_STANDARD.md`: implementation, testing, completion reporting, security checks, and version-control approval
- `RELEASE_STANDARD.md`: release planning, readiness, and approval gates

## Reusable Assets

- `prompts/`: role prompts for focused LLM work
- `templates/`: markdown templates for backlog items, releases, reports, prompts, and test command files

## Project Data Location

Project-specific working data belongs outside this folder, normally under:

```text
docs/project/
  CURRENT_STATE.md
  BACKLOG.md
  TEST_COMMANDS.md
  REQUIREMENTS.md
  TEST_LOG.md
  DECISION_LOG.md
  RELEASE_NOTES.md
  .pm-meta.json
  backlog/
  releases/
```

