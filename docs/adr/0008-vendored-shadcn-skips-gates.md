# 0008. Vendored shadcn code skips test gates

**Status:** Accepted · **Date:** 2026-11-09

**Context:** Production owns shadcn/ui ([0006](0006-living-ui-prototype.md)), and the prototype will pull in many primitives. Every file the CLI copies into `components/ui/` would count toward coverage, the changed-lines check, mutation, duplication and knip.

**Decision:** `components/ui/` skips coverage, Stryker, jscpd and knip, like generated Prisma Client code. It is still type-checked and linted, a11y rules included. It holds only files the shadcn CLI installed, with no logic edits: the look comes from tokens, and behaviour changes go in a tested wrapper in `components/`. These files are thin wrappers over Radix or Base UI, which are tested upstream, and our bugs are in how we use them.

**Consequences:**
- View and feature tests still render the primitives we use.
- A dependency-cruiser rule stops `components/ui/` importing app code, so agents can't hide untested logic there ([0003](0003-solo-dev-with-ai-agents.md)).
