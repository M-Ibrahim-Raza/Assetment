# 0003. Solo developer with AI agents

**Status:** Accepted · **Date:** 2026-11-04

**Context:** One developer builds the app, and AI agents write most of the code. GitHub doesn't let you approve your own pull request, so a required approval would block every merge. Agents write code fast, but they can game checks with weak tests or disabled rules.

**Decision:** No human approval is required to merge. Required CI checks are the gate. Agents follow [code-quality-rules.md](../code-quality-rules.md).

**Consequences:**
- No waiting for reviews.
- No second person checks the design. CI only catches what it's built to check, so the checks are strict ([0004](0004-all-checks-required-from-day-one.md)). An AI review on each PR is allowed, as advice only.
- When a second developer joins, write a new ADR that turns on 1 required approval and Code Owners review.
