# Code Quality Rules

Rules for every AI agent writing code in this repo. Tools, checks and settings: [code-quality-stack.md](code-quality-stack.md).

- Use pnpm. Never npm or yarn.
- Before saying a task is done, run `pnpm check`. If you changed a user flow, also run `pnpm test:e2e`. Report the exact commands and their results.
- When a check fails, fix the cause. Never weaken the check: don't lower thresholds, exclude files (the one exception is `components/ui/`, below), skip hooks (`--no-verify`, `LEFTHOOK=0`, `LEFTHOOK_EXCLUDE`) or edit lint, test or CI config to get green. If a hook itself is broken, stop and say so.
- `components/ui/` holds only files the shadcn CLI installs, and skips coverage, mutation, jscpd and knip ([ADR 0008](adr/0008-vendored-shadcn-skips-gates.md)). Never add logic there: put it in a tested wrapper in `components/`.
- Fix every problem the Claude Code hook reports before the next edit.
- No `any`, no `@ts-ignore`, no non-null `!`. Disable a lint rule only for one line, naming the rule and a reason: `// eslint-disable-next-line <rule> -- <reason>`.
- Tests first: write or update the test, see it fail, then make it pass.
- Never delete, skip or loosen a test, or change its expected value, to make it pass. If a test looks wrong, stop and say why.
- Every test must check results, not just run code. Add property tests (`@fast-check/vitest`) for parsers, validators, money and date logic.
- Always ask before adding a dependency, even one an ADR or `tech-stack.md` names. Name the package and version, then wait for a clear yes. A skipped or rejected question is not a yes. Double-check the package name.
- Reuse existing code instead of copying it. Never import from `prototype/`. Follow the import rules in `.dependency-cruiser.cjs`.
- Never commit secrets or `.env` files. Never put a secret in a `NEXT_PUBLIC_` variable.
- Don't change CI workflows, `.claude/`, or lint, test or coverage config unless the task is about them.
