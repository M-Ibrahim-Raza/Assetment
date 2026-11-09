# 0006. Living UI prototype

**Status:** Accepted · **Date:** 2026-11-09

**Context:** We design screens and find features in a prototype before writing production code. It needs a home that agents can read and that stays out of production.

**Decision:** `prototypes/` is a permanent prototype of the whole app, organised by screen. Every UI change starts there, then moves to production. It runs as a separate Next.js app with the same URLs as production, so links in reused screens ([0007](0007-screen-page-and-view.md)) stay inside it. It imports UI and tokens from production, keeping no copy. Agents can read a screen while building it, and a production build can never include it.

**Consequences:**
- Prototype code is type-checked and linted in CI, with no tests or coverage.
- It runs on its own port, with its own `next.config.ts` and `tsconfig.json`.
- New UI primitives are added to production first, then used in the prototype.
