# 0008. Prisma 7 as the ORM

**Status:** Accepted · **Date:** 2026-11-06

**Context:** The app needs typed access to Postgres ([0007](0007-neon-postgres.md)), and Better Auth needs a database adapter ([0005](0005-auth-library.md)). The developer chose Prisma. Prisma 8 is a release candidate and a rewrite: new CLI, no `schema.prisma` and a new query API. Better Auth doesn't support it yet.

**Decision:** Use Prisma ORM 7. Pin `prisma`, `@prisma/client` and `@prisma/adapter-pg` to the same exact version, now 7.10.1. Connect over TCP with `@prisma/adapter-pg`.

**Consequences:**
- `prisma@latest` now installs Prisma 8, so Dependabot skips Prisma majors. Prisma 7 gets fixes for 18 months after Prisma 8 ships. Move to 8 on purpose before then.
- `prisma@7.10.1` has no npm provenance ([prisma/orm#30850](https://github.com/prisma/orm/issues/30850)). It's in `trustPolicyExclude` after a hand check. Check each new 7.x release the same way.
- Prisma's install scripts stay blocked. The CLI downloads its engine on first use.
- Once the client is generated, ESLint, jscpd, coverage and Stryker will need to skip its folder.
- `@prisma/adapter-pg` works with Neon and with a local Postgres in tests, where MSW would block Neon's HTTP driver. Drizzle was the alternative: no code generation, but not at 1.0 yet.
