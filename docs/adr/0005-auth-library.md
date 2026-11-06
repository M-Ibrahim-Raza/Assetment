# 0005. Better Auth for authentication

**Status:** Accepted · **Date:** 2026-11-06

**Context:** Users are individuals who sign in with email and password, and v1 needs two-factor auth. User data goes in Postgres. AI agents write most of the code ([0003](0003-solo-dev-with-ai-agents.md)), so hand-written password and 2FA code is a risk. We compared Auth.js, Better Auth and Clerk.

**Decision:** Use Better Auth (`better-auth`) 1.7.17 or later, which has the 1.7.16 security fixes. Use its built-in email and password sign-in and its `twoFactor` plugin. Users and sessions live in our Postgres database.

**Consequences:**
- Sign-up, password reset, email verification and 2FA are built in. User data stays in our database, with no per-user fees.
- Auth.js was rejected: the Better Auth team has given it security and urgent fixes only since September 2025, v5 is still in beta, and it has no built-in password or 2FA flows. Clerk was rejected: users live outside our database, and MFA needs a paid plan.
- Better Auth is young and changes fast, with several security advisories in 2026. Keep it patched, require email verification, and read the upgrade guide before each minor upgrade.
- Vercel bought Better Auth in July 2026. It stays MIT-licensed. If the license or direction changes, write a new ADR.
- Installed before it's used, so it's on knip's `ignoreDependencies` list until the first import ([tech-stack.md](../tech-stack.md)).
