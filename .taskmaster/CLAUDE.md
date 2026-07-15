# Task Master Integration — Route Ledger Project Rules

This file is imported by the repository-root `CLAUDE.md`. The project-specific rules below override generic Task Master examples, CLI suggestions, and agent defaults.

## Active rewrite source of truth

The Vite React rewrite is **not** represented by the checked-in Task Master task IDs.

- Read `.taskmaster/docs/CURRENT_WORK_SESSION.md` before acting.
- Read the applicable `.superpowers/sdd/task-<n>-brief.md` for rewrite requirements.
- Treat `.superpowers/sdd/task-*-report.md` and migration plans/specifications as historical execution records unless the active brief says otherwise.
- The legacy Task Master database remains at `.taskmaster/tasks/tasks.json` on tag `master`. Its task 11 is an unrelated completed historical task.

Do not translate an SDD rewrite task number into a Task Master database ID.

## Current no-mutation rule

Until `.taskmaster/docs/CURRENT_WORK_SESSION.md` explicitly permits it, agents working on this rewrite must not:

- run `task-master init`, `parse-prd`, `add-task`, `expand`, `update`, `update-task`, `update-subtask`, `set-status`, `generate`, `fix-dependencies`, or any other command that writes Task Master state;
- manually edit `.taskmaster/tasks/tasks.json`, `.taskmaster/config.json`, or generated Task Master state;
- create a commit, push, deploy, create a pull request, or create/use a worktree for rewrite work.

A user request to implement an SDD task is not authorization to mutate the unrelated legacy Task Master record. Follow the active session document and the user's explicit instructions instead.

## Safe legacy inspection

Task Master is not installed as a repository package script. When inspection of a real legacy record is explicitly needed, use the package-qualified read-only CLI form:

```bash
bunx --package task-master-ai task-master list
bunx --package task-master-ai task-master show <legacy-id>
bunx --package task-master-ai task-master validate-dependencies
```

Direct `task-master`, `bunx task-master`, and `bun run task-master` are not valid repository commands in this checkout.

Before using `show <id>`, confirm that the requested ID is a real legacy Task Master ID rather than an SDD rewrite task number. Read-only output does not override `CURRENT_WORK_SESSION.md`.

## Existing project paths

These paths exist and have distinct roles:

- `.taskmaster/tasks/tasks.json` — legacy Task Master database; CLI-managed only when a future active session explicitly authorizes mutation.
- `.taskmaster/config.json` — legacy Task Master model/configuration state; do not edit manually.
- `.taskmaster/reports/task-complexity-report.json` — legacy analysis output.
- `.taskmaster/templates/example_prd.txt` — example template only, not the active rewrite requirements.
- `.taskmaster/docs/CURRENT_WORK_SESSION.md` — active rewrite status, constraints, verification, and blockers.
- `.taskmaster/docs/INDEX.md` — active documentation navigation.
- `.superpowers/sdd/task-*-brief.md` — authoritative rewrite task briefs.

There is no active PRD under `.taskmaster/docs/`, no generated `.taskmaster/tasks/task-*.md` set, and no reason to initialize or reinitialize this repository.

## Authorized future Task Master workflow

The commands below are a reference for a future session that explicitly authorizes work on the legacy Task Master database. They are not the current rewrite workflow.

```bash
# Read-only discovery
bunx --package task-master-ai task-master list
bunx --package task-master-ai task-master next
bunx --package task-master-ai task-master show <legacy-id>
bunx --package task-master-ai task-master validate-dependencies

# Mutating commands — only after active-session and user authorization
bunx --package task-master-ai task-master set-status --id=<legacy-id> --status=in-progress
bunx --package task-master-ai task-master update-subtask --id=<legacy-id> --prompt="implementation notes"
bunx --package task-master-ai task-master set-status --id=<legacy-id> --status=done
```

Before any authorized mutation:

1. Confirm the ID with `show <legacy-id>`.
2. Confirm dependencies and acceptance criteria.
3. Confirm the active session permits Task Master database writes.
4. Preserve user changes and use Task Master commands rather than manually editing `tasks.json`.
5. Mark work done only after the specified verification passes.

AI-powered Task Master commands may require configured provider credentials and can take time. Do not change `.taskmaster/config.json` or model settings unless the user explicitly requests that configuration work.

## Git and deployment boundaries

Task Master guidance never grants permission to change repository or external state.

- Do not commit or push unless the user explicitly asks and the active session permits it.
- Do not create or enter a worktree unless the user explicitly asks and the active session permits it.
- Do not deploy Vercel, Convex, Clerk, or any other service unless the user explicitly asks.
- Do not add deployment credentials to repository files.

For the current rewrite, `.taskmaster/docs/CURRENT_WORK_SESSION.md` prohibits commits, pushes, worktrees, and deployments until review is complete.

## Documentation discipline

When implementation behavior changes, update the active references required by the root `CLAUDE.md`:

- `.taskmaster/docs/CURRENT_WORK_SESSION.md`
- `.taskmaster/docs/FEATURE_IMPLEMENTATIONS.md`
- `.taskmaster/docs/CODE_PATTERNS.md`
- `.taskmaster/docs/API_REFERENCE.md`
- `.taskmaster/docs/TROUBLESHOOTING.md`
- `.taskmaster/docs/ARCHITECTURE.md`
- `.taskmaster/docs/CONVEX_INTEGRATION_SUMMARY.md`
- `.taskmaster/docs/QUICK_REFERENCE.md`

Validate links, referenced paths, commands, JSON, stale operational claims, and the relevant test/build gates before describing the work as complete.
