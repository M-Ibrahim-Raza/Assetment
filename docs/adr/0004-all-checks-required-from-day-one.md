# 0004. All checks required from day one

- **Status:** Accepted
- **Date:** 2026-11-04

## Context

The codebase starts empty. Turning on strict checks later means fixing or baselining many existing problems. AI agents produce a lot of code quickly, so problems pile up fast.

## Decision

Every check in [code-quality-stack.md](../code-quality-stack.md) is a required CI check from the first commit. This includes mutation testing, structure checks and security scans.

## Consequences

- No legacy issues and no baselines to maintain. Problems are caught while they're small.
- More setup up front, and slower PRs. The whole CI run must stay under 10 minutes.
