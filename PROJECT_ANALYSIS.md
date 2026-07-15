# Archived Project Analysis — September 2025

> **Archive notice:** This report described the pre-rewrite application and is retained only as historical project evidence. Its framework, persistence, testing, monitoring, performance, and deployment claims are not current and must not be used as operator instructions.

The active application is documented in:

- [README.md](README.md)
- [PROJECT_SUMMARY.md](PROJECT_SUMMARY.md)
- [DEPLOYMENT.md](DEPLOYMENT.md)
- [.taskmaster/docs/ARCHITECTURE.md](.taskmaster/docs/ARCHITECTURE.md)
- [.taskmaster/docs/CURRENT_WORK_SESSION.md](.taskmaster/docs/CURRENT_WORK_SESSION.md)

Current facts that supersede the archived report:

- The browser application uses Vite, React, and React Router.
- Clerk accounts and Clerk-backed Convex authentication are implemented.
- Convex is the authoritative domain store; Zustand is presentation-only.
- Automated Vitest, `convex-test`, and Chromium Playwright suites exist.
- Sentry React, Vercel Analytics, Speed Insights, and Web Vitals are integrated.
- The PWA caches only the static shell; it does not provide offline domain editing.
- Static Vercel deployment is controlled by `vercel.json` and publishes `dist`.
- Performance numbers require a measurement against the exact release and are not inferred from this archive.

Historical migration specifications and SDD reports remain under `docs/superpowers/` and `.superpowers/sdd/`.
