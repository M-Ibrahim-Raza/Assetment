# Git Rules

Rules for people and AI agents. Use the git-tools plugin for every Git task.

## Branches

- Never commit to `main`. Every change goes through a PR from a short-lived branch.
- Create branches from an up-to-date `origin/main` with `/git-tools:switch-branch`.
- Name them `<type>/<short-desc>`, e.g. `docs/git-rules` or `feat/F03-sign-in`.
- Always confirm the branch name with the user before creating it.
- Update a branch with `git rebase origin/main`, never by merging `main` into it.

## Commits

- Commit only when the user asks in the chat. Never commit on your own.
- Use `/git-tools:commit`. Stage this change's files by path, then check `git diff --staged`.
- One logical change per commit. Squash fixups locally before opening the PR.
- Conventional Commits subject, plus a body that says why. commitlint checks it.
- Never skip hooks or commit secrets ([code-quality-rules.md](code-quality-rules.md)).
- No AI attribution trailers or lines in commits or PRs.

## Push, PR and merge

- Push only when the user asks, with `/git-tools:push-branch`. Force-push only with `--force-with-lease`.
- Open a PR only when asked, with `/git-tools:open-pr`. Its title is a Conventional Commit.
- Merge only after the user says yes, with `/git-tools:merge-pr`: merge commit or rebase, never squash.
- After merging, delete the branch locally and on GitHub, then run `git fetch --prune`.
- Ask before destructive commands: `reset --hard`, `clean`, `branch -D`, `push --delete`.

GitHub settings: [code-quality-stack.md](code-quality-stack.md).
