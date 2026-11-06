# 0010. Merge commits keep every commit

**Status:** Superseded by [0011](0011-no-signed-commits.md) · **Date:** 2026-11-06

**Context:** Squash merging turns a PR's commits into one commit on `main`. The small commits then exist only on the PR page, so history is hard to read, and `git blame` and `git bisect` land on large commits. Rebase and merge is not an option: GitHub rewrites the commits and can't sign them, and `main` requires signed commits.

**Decision:** PRs merge with a merge commit. Squash and rebase merging are off, and the linear history rule is removed from the `main` ruleset. The merge commit's title is the PR title and its body is the PR description. This applies from 2026-11-06. Earlier squash commits stay as they are.

**Consequences:**
- Every signed commit from a PR lands on `main` with its own diff. GitHub signs the merge commit.
- History is no longer linear. `git log --first-parent main` shows one line per PR.
- Each commit lands on `main` as it is. Keep commits small, atomic and Conventional, and squash fixups locally (signed) before opening the PR.
- PR branches are still updated with a local rebase on `origin/main`, never GitHub's rebase.
