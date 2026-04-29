# Agentic PM Tools

Agentic PM Tools is a portable markdown-based project management toolkit for software projects that use humans and AI coding agents together. It includes reusable PM methodology, backlog and release templates, agent prompts, and a standalone local app for managing project PM files.

## Who It Is For

- Solo developers
- AI-assisted developers
- Codex users
- Small teams
- Project owners who prefer markdown-based PM

## What's Included

- `app/`: standalone local PM Tools app
- `methodology/`: reusable project-management standards
- `templates/`: backlog, release, testing, security, and completion-report templates
- `prompts/`: reusable agent prompts
- `examples/project/`: fake sample project data for trying the app
- `package/docs/pm/`: copy-ready package layout for dropping into another repository

## Quick Start

```powershell
cd app
npm install
npm start
```

By default, the standalone export reads from:

```text
../examples/project
```

Open the local URL printed by the server.

## Configure a Target Project

You can point the app at another project PM folder with either an environment variable or CLI flag:

```powershell
$env:PM_TOOLS_PROJECT_PATH="C:\path\to\repo\docs\project"
npm start
```

```powershell
npm start -- --project "C:\path\to\repo\docs\project"
```

The target project should follow the structure documented in `methodology/PROJECT_STRUCTURE_STANDARD.md`.

## Copy Into an Existing Project

To embed the portable package in another repository, copy:

```text
package/docs/pm
```

into the target repository as:

```text
docs/pm
```

Project-specific data should live separately under:

```text
docs/project
```

When the app is copied into `docs/pm/app`, its fallback target path is `../../project`.

## Project Folder Standard

See `methodology/PROJECT_STRUCTURE_STANDARD.md`.

## Backlog Item Format

See `methodology/BACKLOG_STANDARD.md` and the templates in `templates/`.

## Release Workflow

See `methodology/RELEASE_WORKFLOW.md`.

## Codex Prompt Workflow

See `methodology/CODEX_PROMPTING_STANDARD.md` and `prompts/`.

## Validation Workflow

Validation is manual. The app does not run full backlog validation automatically on load.

## Known Limitations

- Safe-fix validation buttons are future scope.
- Git/version-control actions are never performed by the app.
- The app is a local filesystem tool and should be run only against trusted project folders.
- Desktop layout is the primary target.

## Roadmap

- Safe-fix validation buttons
- Configurable project paths UI
- Dark mode
- Import existing docs wizard
- GitHub issue export
- Installer/copy script
- Packaged desktop app

## License

MIT
