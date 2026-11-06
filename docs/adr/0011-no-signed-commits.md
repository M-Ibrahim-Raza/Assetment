# 0011. No signed commits required, rebase merging allowed

**Status:** Accepted · **Date:** 2026-11-06

**Context:** Requiring signed commits on `main` made everyday work harder. GitHub's "Update branch" rebase created unsigned commits that blocked merges, so commits had to be re-signed locally and force-pushed. It also ruled out rebase merging ([0010](0010-merge-commits.md)).

**Decision:** `main` no longer requires signed commits. PRs merge with a merge commit or a rebase merge. Squash merging stays off. This supersedes [0010](0010-merge-commits.md).

**Consequences:**
- GitHub's "Update branch" and rebase merging work without extra steps.
- Commits on `main` may be unsigned, so GitHub doesn't verify who made them. The pull request rule and required checks still guard `main`.
- Every commit still lands on `main` as it is. Keep commits small, atomic and Conventional, and squash fixups locally before opening the PR.
- Signing local commits is optional. Nothing depends on it.
