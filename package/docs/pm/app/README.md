# PM Tools App

Standalone local app for managing markdown-based project management files.

## Install

```powershell
npm install
```

The app currently has no external runtime dependencies.

## Start

```powershell
npm start
```

Use another port if needed:

```powershell
npm.cmd start -- --port 4179
```

## Target Project Path

The app reads project PM data from a target project folder.

When copied into another repository as `docs/pm/app`, the fallback target is:

```text
../../project
```

You can override it with:

```powershell
$env:PM_TOOLS_PROJECT_PATH="C:\path\to\repo\docs\project"
npm start
```

or:

```powershell
npm start -- --project "C:\path\to\repo\docs\project"
```

## Current Capabilities

- View backlog dashboard
- View backlog lifecycle board
- View backlog table
- Add backlog items
- Edit backlog items
- Archive items without deleting files
- Move item files based on status
- Regenerate `BACKLOG.md`
- Validate backlog manually
- View release planner
- Create release files
- Assign selected backlog items to releases
- Generate item-level Codex prompts
- Generate release-level Codex prompts
- Generate human testing checklists
- Generate version-control recommendation prompts

## Not Implemented Yet

- Safe-fix validation buttons
- Git commit, push, pull request, merge, deploy, tag, or release actions
- Hosted multi-user workflow
- Packaged desktop app

## Safety Notes

- The app reads and writes markdown files in the configured target project folder.
- The app does not physically delete backlog item files from the normal UI.
- The app does not perform version-control actions.
- Run the app only against trusted local project folders.

## Test

```powershell
npm.cmd test
npm.cmd run check
```
