# 0006. tRPC for client-side data

**Status:** Accepted · **Date:** 2026-11-06

**Context:** Most screens are dashboards that need a shared client cache for filters, infinite scroll, polling and optimistic updates. Server Actions don't fit: they run one at a time and aren't meant for fetching. Only this app calls the API, and v1 needs no real-time updates. We compared tRPC, GraphQL, oRPC, and plain Route Handlers with TanStack Query.

**Decision:** Use tRPC 11 with TanStack Query for data that Client Components fetch and change. tRPC runs in one Route Handler, so [0001](0001-nextjs-only.md) still holds. It won: types reach the client with no code generation, and it's the most mature type-safe RPC option.

**Consequences:**
- Only TypeScript clients can call the API; a mobile app or public API needs a new ADR. oRPC came second: it adds OpenAPI but has one main maintainer.
- GraphQL was rejected: it solves a multi-client problem we don't have, with the most code and packages. Plain Route Handlers were rejected: hand-wired types could drift.
- New packages: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query` and an input validator. Each needs its own yes before install.
- Some tRPC Server Component helpers are `unstable_`. Check them on each upgrade.
