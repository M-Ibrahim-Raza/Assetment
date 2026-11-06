# 0009. Zod for data validation

**Status:** Accepted · **Date:** 2026-11-06

**Context:** tRPC procedures need an input validator ([0006](0006-trpc-for-client-data.md)), and forms need the same rules. Zod is already installed as a dependency of Better Auth. We compared Zod, Valibot and ArkType.

**Decision:** Use Zod 4 (`zod`) for all input validation: tRPC inputs, forms and any other untrusted data.

**Consequences:**
- One schema checks data on the server and in the browser. tRPC and Better Auth support Zod directly.
- Use `zod/mini` in Client Components if bundle size becomes a problem.
- Valibot was rejected: smaller bundles, but fewer integrations. ArkType was rejected: fast, but a small ecosystem with mostly one maintainer.
- Validators need property tests with `@fast-check/vitest` ([code-quality-rules.md](../code-quality-rules.md)).
