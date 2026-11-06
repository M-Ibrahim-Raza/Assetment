---
name: ship
description: Run the full Git flow for the current change, one step at a time - switch to a new branch, commit, open a PR, then merge it. Manual only, run with /ship.
argument-hint: [branch-name]
disable-model-invocation: true
---

# Ship

Take the current change from `main` to merged, following [docs/git-rules.md](../../../docs/git-rules.md). Running `/ship` counts as the user asking to commit, push and open a PR. Count as a yes to merge.

Run these four skills in order with the Skill tool. Finish each one before starting the next. If a step fails, is cancelled, or the user says stop, stop there and report where the flow ended.

1. **Branch**: `/git-tools:switch-branch`. Use `$ARGUMENTS` as the branch name if given. Otherwise suggest a `<type>/<short-desc>` name from the change. Either way, confirm the name with the user first. Skip this step if already on a non-`main` branch the user wants to keep.
2. **Commit**: `/git-tools:commit`. Stage only this change's files, by path.
3. **PR**: `/git-tools:open-pr`. It pushes the branch with `/git-tools:push-branch`.
4. **Merge**: `/git-tools:merge-pr` for the PR from step 3. Only merge commit or rebase, never squash. Delete the branch also.

After the merge, run `git switch main`, `git pull --ff-only` and `git fetch --prune`. Then report the PR URL and the merge commit.
