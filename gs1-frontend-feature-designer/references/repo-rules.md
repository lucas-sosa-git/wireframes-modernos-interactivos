# Repo Rules

Use these rules for the GS1 interactive wireframes project.

## Scope

- Active app: `b05/`.
- Historical/reference folders: `b03/`, `b04/`.
- Do not modify historical folders unless explicitly requested.

## Context usage

- Read `AGENTS.md` first if available.
- Use `manifests/agent-view-context.json` if available.
- Inspect target view and direct dependencies only.
- Avoid whole-repo scans.

## Protected areas

Do not touch unless explicitly requested:

- navbar
- sidebar
- vendor/minified assets
- `assets/js/chart.js`
- unrelated views
- old context documents

## Style

- Keep white/light UI.
- Preserve GS1 visual style.
- Use Spanish labels.
- Prefer existing Bootstrap/custom CSS patterns.
- Avoid new frameworks.

## Git behavior

- Do not create a new branch unless the user explicitly asks.
- Do not commit or push unless explicitly requested.
- Keep diffs minimal and grouped by functionality.
