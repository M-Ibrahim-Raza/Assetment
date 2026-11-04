# 0001. Next.js only

- **Status:** Accepted
- **Date:** 2026-11-04

## Context

The app needs a UI and a backend. One developer builds it with AI agents. A separate backend service would add a second codebase, a second deploy and a second set of quality tools.

## Decision

Build one Next.js app in TypeScript. Server Components, Server Actions and route handlers are the backend. No separate API service.

## Consequences

- One language, one deploy and one set of quality tools ([code-quality-stack.md](../code-quality-stack.md)).
- Work that doesn't fit a Next.js app well, such as long background jobs or a public API for other clients, needs a new ADR before a separate service is added.
