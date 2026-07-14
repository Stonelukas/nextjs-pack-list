# Documentation System Summary

The active documentation is organized around the Vite/React Router/Clerk/Convex application.

## Operator entry points

- [README.md](README.md): Bun-only local development and architecture overview.
- [DEPLOYMENT.md](DEPLOYMENT.md): static Vercel SPA deployment and verification.
- [CLERK_SETUP.md](CLERK_SETUP.md): Clerk React, Convex JWT, webhook, and roles.
- [PRODUCTION_CHECKLIST.md](PRODUCTION_CHECKLIST.md): release gates.
- [KNOWLEDGE_BASE.md](KNOWLEDGE_BASE.md): repository navigation.

## Persistent implementation references

- [.taskmaster/docs/CURRENT_WORK_SESSION.md](.taskmaster/docs/CURRENT_WORK_SESSION.md)
- [.taskmaster/docs/INDEX.md](.taskmaster/docs/INDEX.md)
- [.taskmaster/docs/FEATURE_IMPLEMENTATIONS.md](.taskmaster/docs/FEATURE_IMPLEMENTATIONS.md)
- [.taskmaster/docs/CODE_PATTERNS.md](.taskmaster/docs/CODE_PATTERNS.md)
- [.taskmaster/docs/API_REFERENCE.md](.taskmaster/docs/API_REFERENCE.md)
- [.taskmaster/docs/TROUBLESHOOTING.md](.taskmaster/docs/TROUBLESHOOTING.md)
- [.taskmaster/docs/ARCHITECTURE.md](.taskmaster/docs/ARCHITECTURE.md)
- [.taskmaster/docs/CONVEX_INTEGRATION_SUMMARY.md](.taskmaster/docs/CONVEX_INTEGRATION_SUMMARY.md)
- [.taskmaster/docs/QUICK_REFERENCE.md](.taskmaster/docs/QUICK_REFERENCE.md)

## Current documentation rules

- Application commands use Bun.
- Browser values and Convex deployment secrets are documented separately.
- Convex-authoritative persistence, typed hooks, and server authorization are the default model.
- Zustand is presentation-only.
- The legacy `pack-list-storage` shape is documented only as untrusted migration input.
- Offline behavior is described as cached-shell reading, never queued editing.
- Vercel documentation assumes static `dist` output and filesystem-before-rewrite behavior.
- Tests are split between `bun run check`, `bun run test:convex`, and `bun run test:e2e`.

## Historical records

September 2025 reports and generated guides are retained only when clearly marked as archival or rewritten to point to current interfaces. Migration plans, design specifications, and `.superpowers/sdd` reports remain historical execution records and are intentionally not rewritten as runtime documentation.
