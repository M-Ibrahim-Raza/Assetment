# 0006. tRPC for client-side data

**Status:** Accepted · **Date:** 2026-11-06

**Context:** Most screens are dashboards that fetch data in the browser: filters, infinite scroll, polling and optimistic updates. They need a shared client cache. Server Actions can't do this job: Next.js runs them one at a time per client, and its docs say not to use them for fetching. Only this Next.js app calls the API, and v1 needs no real-time updates. We compared tRPC, GraphQL (Yoga + Pothos), oRPC, and plain Route Handlers with TanStack Query.

**Decision:** Use tRPC 11 with TanStack Query for data that Client Components fetch and change. tRPC runs in one Route Handler inside the Next.js app, so [0001](0001-nextjs-only.md) still holds. Why tRPC: types flow from server to client with no code generation, TanStack Query brings caching, polling and optimistic updates, and it's the most mature type-safe RPC option, with an active team and wide use in Next.js apps.

**Consequences:**
- Only TypeScript clients can call the API. A mobile app or public API needs a new ADR. oRPC was the runner-up for that case: it works like tRPC and can publish an OpenAPI spec, but it has one main maintainer.
- GraphQL was rejected: it solves a multi-client problem this app doesn't have, and adds the most code and packages. Plain Route Handlers with TanStack Query were rejected: request and response types would be wired by hand and could drift.
- New packages: `@trpc/server`, `@trpc/client`, `@trpc/tanstack-react-query`, `@tanstack/react-query` and an input validator. Each still needs a clear yes before it's installed. Add them to [tech-stack.md](../tech-stack.md) once installed.
- Some of tRPC's Server Component helpers are marked `unstable_`. Check them on each upgrade.
