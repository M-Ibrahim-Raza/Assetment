# 0007. Neon for Postgres

**Status:** Accepted · **Date:** 2026-11-06

**Context:** User data goes in Postgres ([0005](0005-auth-library.md)). The app runs on Vercel, v1 must fit a free tier, and each PR should get its own database for its preview deploy. We compared Neon, Supabase and Prisma Postgres.

**Decision:** Use Neon, connected through the Vercel Marketplace. Each Vercel preview deploy gets a copy-on-write branch of the database.

**Consequences:**
- Free plan: 10 branches and 100 compute-hours per project each month, and 1 GB storage. Upgrade when we outgrow it.
- The database sleeps after 5 minutes idle, so the first request after that is slower.
- Supabase was rejected: branching is paid, and its built-in auth overlaps Better Auth. Prisma Postgres was rejected: no copy-on-write branching.
- Databricks has owned Neon since 2025. If its pricing or direction changes, write a new ADR.
