# Portability Rules

`./docs/pm` is a portable project-management methodology package. It must be safe to copy into any software project without carrying project-specific data from the source repository.

## Allowed Content

- Universal methodology and standards
- Reusable agent prompts
- Workflow templates
- Generic examples
- Future PM Tools app source code under `./docs/pm/app`
- Schema definitions, if added later

## Prohibited Content

- Project-specific backlog items
- Project-specific requirements
- Secrets, credentials, tokens, API keys, or environment values
- Project-specific architecture decisions
- Project-specific test results
- Project-specific release notes
- Project-specific app data

## Project-Specific Data Location

Project-specific working data should live outside `./docs/pm`, normally under:

```text
./docs/project/
  CURRENT_STATE.md
  BACKLOG.md
  TEST_COMMANDS.md
  REQUIREMENTS.md
  TEST_LOG.md
  DECISION_LOG.md
  RELEASE_NOTES.md
  .pm-meta.json

  backlog/
    active/
    completed/
    deferred/
    archived/

  releases/
```

## Review Rule

Before copying or publishing this package, review every file under `./docs/pm` and remove any project-specific references. Generic examples are allowed only when they are clearly placeholders.
