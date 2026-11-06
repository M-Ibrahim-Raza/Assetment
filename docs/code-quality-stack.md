# Code Quality Stack

The code quality tools for this app, how they're set up, and where each check runs. The decisions behind it are in [adr/](adr/).

## 1. Tools

| Layer | Pick | Setup |
|---|---|---|
| Runtime | Node 24 LTS, pnpm | Node in `.nvmrc` and `engines`. Pin pnpm in `packageManager`; pnpm has the strongest supply-chain settings. |
| Format | Prettier + `prettier-plugin-tailwindcss` | Owns all formatting and sorts Tailwind classes. Never run it through ESLint. Skips Markdown: docs are hand-written. |
| Lint | ESLint 9 (flat config) | ESLint 9 until `eslint-config-next`'s plugins support 10. `@eslint/js` recommended, `eslint-config-next` (core-web-vitals + typescript, which also turns on `react-hooks` `recommended`), the full `jsx-a11y` recommended set, typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` with `projectService`, `eslint-plugin-better-tailwindcss` `recommended` (class order off: Prettier owns it), `@eslint-community/eslint-plugin-eslint-comments` (`require-description`, `no-unlimited-disable`, `no-use` except `eslint-disable-next-line`, no disabling the two core hook rules). `reportUnusedDisableDirectives: "error"`. |
| Types | TypeScript 7 `tsc`, TypeScript 6 for ESLint | Both installed side by side, pinned with `~` (`@typescript/native` → 7, `typescript` → 6). Strict baseline in `tsconfig.base.json`, extended by `tsconfig.json`. `typedRoutes: true`. Run `next typegen` before `tsc --noEmit`. |
| Tests | Vitest + React Testing Library + MSW | Unit (`*.test.ts`), component (`*.test.tsx`, jsdom) and integration (`*.int.test.ts`) `projects`, next to the code. Random order; mocks, env and globals restored after each test. MSW fails any test that sends a request without a handler. A flaky test gets the `quarantine` tag and a ticket: `pnpm test` skips it, and a non-required CI job keeps running it. |
| Property tests | `@fast-check/vitest` | Parsers, validators, money and date logic. Import `fc` and `test` from it. A failure prints the seed and the smallest failing input; add each bug it finds as a fixed `examples` case. |
| Coverage | Vitest (v8) + diff-cover | Branch coverage on. Floor: 80% lines and branches, raised by hand (no `autoUpdate`, which rewrites the config). Changed lines: at least 90%, checked by diff-cover 10.6.0 on the Cobertura report against `origin/main`, untracked files included. diff-cover is a Python tool run with `uvx` and a 7-day cooldown, so it isn't in `package.json`. |
| E2E | Playwright | `e2e/*.spec.ts`. Runs against a fresh `next build && next start` on port 3100, never a running dev server. Chromium only. No retries; traces kept for failed tests. |
| Mutation | StrykerJS (Vitest runner + TypeScript checker) | Locally `--incremental`. In CI, `tools/stryker/run-changed.mjs` mutates only the files changed since `origin/main`, picked with the `mutate` patterns from the Stryker config; the nightly run tests every file. Both scripts run `next typegen` first, because the TypeScript checker needs Next's generated types. Thresholds: `high: 80`, `low: 60`, `break: 60`. Plugins listed by name, because pnpm hides them from auto-discovery. Skipped, with the reason in the report: code that only runs when a file loads (`ignoreStatic`), and display-only code (class names, JSX text) that unit tests must not assert (`tools/stryker/ignore-display-only.mjs`). After changing the Stryker config, delete `reports/stryker-incremental.json`: incremental mode doesn't notice config changes. |
| Structure | knip, dependency-cruiser, jscpd | knip: unused files, exports and packages, and unlisted packages. Config hints are errors, so every exception in `knip.config.ts` must still be needed. Add `prototype/**` to its `ignore` once the prototype has files. dependency-cruiser (`.dependency-cruiser.cjs`, every rule an error): no `prototype/` imports, no cycles, no orphan files, no dev-only packages or test helpers in app code, every import resolves and is listed. Add layer rules once the layers exist (e.g. the `data/` access layer). jscpd (`.jscpd.json`): duplication ≤3% of code lines. Scans only TS, TSX, JS and CSS, so the lockfile and docs can't dilute the percentage. |
| Secrets | GitHub secret scanning + push protection | Free on public repos. Blocks pushes with known key formats and scans the full history. |
| Dependencies | Dependabot, `pnpm audit`, pnpm settings | Dependabot (`.github/dependabot.yml`): weekly, 7-day cooldown (Semgrep's minimum; security updates skip it), for `npm` and `github-actions`, including the composite action in `.github/actions/setup`. Packages that must move together share a PR (`next` + `eslint-config-next`, `vitest` + `@vitest/*`, …), and all actions share one. Commit prefixes `build(deps)`, `build(deps-dev)` and `ci(deps)` pass commitlint. Skipped: TypeScript (upgraded by hand, on purpose), ESLint and `@eslint/js` majors, `@types/node` majors, lefthook 2.2.2, Prisma majors (Prisma 8 is a rewrite, ADR 0008). Dependabot doesn't see the uv version in the workflows or the diff-cover and Semgrep versions in `package.json`, so update those by hand. `pnpm audit --audit-level high` in CI. pnpm: `minimumReleaseAge: 1440`, `trustPolicy: no-downgrade`, `allowBuilds` allowlist, `--frozen-lockfile` in CI. `trustPolicyExclude` only for exact versions checked by hand, each with a reason. `overrides` only for security fixes in indirect dependencies whose parent pins a vulnerable version: scoped to that parent (`parent>package`), with the advisory IDs, and removed once the parent updates. Semgrep wants a 7-day wait, but we keep 1 day (suppressed with a reason): a longer wait holds back security fixes, and with pnpm checking the lockfile it would also have meant downgrading `next`, `vitest`, `knip` and `dependency-cruiser`. |
| SAST | CodeQL + Semgrep CE | CodeQL default setup: deep cross-file checks, free on public repos. Semgrep CE 1.182.1: fast pattern scan on every PR, run with `uvx` and a 7-day cooldown (not in `package.json`). Rulesets: `p/default`, `p/typescript`, `p/react`, `p/nextjs`, `p/github-actions`. Metrics off. |
| Workflows | Rules only, no scanner | Pin every Action by full SHA, with the version in a comment, at least 7 days old (as Dependabot waits). Minimal `permissions:`. No `pull_request_target`. `persist-credentials: false` on checkout. Untrusted values such as the PR title go through `env:`, never straight into `run:`. Semgrep's `p/github-actions` rules catch script injection. Shared setup lives in `.github/actions/setup`. |
| Git hooks | lefthook 2.2.1 | Config committed. Hooks install through the `prepare` script; lefthook's own install script stays blocked. pre-commit runs ESLint `--fix`, then Prettier, on staged files and re-stages the fixes. 2.2.2 was uploaded by hand without provenance, so stay on 2.2.1 until a release comes from the verified pipeline again. |
| Commits | commitlint (`@commitlint/config-conventional`) | Conventional Commits on commits (`commit-msg` hook) and PR titles (CI). Merge commits only ([ADR 0010](adr/0010-merge-commits.md)). Don't start a body line with `word:`: commitlint reads it as a footer. |

## 2. Where each check runs

| Stage | Runs | Blocks merge? |
|---|---|---|
| Editor | Prettier on save, ESLint, TypeScript 7 extension | No, feedback only |
| Claude Code hook | After each Edit or Write: `eslint --fix`, then Prettier, on that file (`.claude/hooks/format-and-lint.mjs`). Problems ESLint can't fix go back to Claude. | No, feedback only |
| pre-commit | Prettier and ESLint on staged files | No, but never skip it |
| commit-msg | commitlint | No, but never skip it |
| pre-push | Type check, unit tests | No, but never skip it |
| **CI (required)** | **The jobs below** | **Yes. This is the gate.** |
| Nightly | Full Stryker run (`.github/workflows/nightly.yml`, 03:17 UTC, or by hand) | No. Fix findings the next day. |

Feedback stages don't block the merge, but what they report isn't optional: fix it before moving on. Never skip a hook (`--no-verify`, `LEFTHOOK=0`, `LEFTHOOK_EXCLUDE`). If a hook itself is broken, stop and say so. CI runs every check again anyway.

Required CI jobs (`.github/workflows/ci.yml`) run in parallel on `pull_request`, `merge_group` and `push` to `main`. Keep the whole run under 10 minutes; each job stops after 10.

| Job (check name) | Runs |
|---|---|
| `lint` | `pnpm format:check`, `pnpm lint`, commitlint on the PR title |
| `typecheck` | `pnpm typecheck` |
| `test (UTC)`, `test (Pacific/Kiritimati)` | `pnpm test` (coverage floor), `pnpm test:changed-lines`. The second zone is UTC+14, so code that uses the machine's zone by accident fails. Uploads coverage and JUnit reports. |
| `e2e` | `pnpm test:e2e` against a fresh production build. Uploads the Playwright report and traces when it fails. |
| `structure` | `pnpm structure` |
| `mutation` | `pnpm test:mutation:changed`. Uploads the mutation report. |
| `security` | `pnpm security`: `pnpm audit --audit-level high`, Semgrep CE |
| CodeQL | GitHub default setup, required through the ruleset |

Not required: `quarantine` runs `pnpm test:quarantine`, the tests tagged `quarantine`.

## 3. Scripts

```json
{
  "scripts": {
    "prepare": "lefthook install",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "next typegen && tsc --noEmit",
    "test": "vitest run --coverage --tagsFilter='!quarantine'",
    "test:quarantine": "vitest run --tagsFilter=quarantine --passWithNoTests",
    "test:changed-lines": "uvx --exclude-newer \"7 days\" --from diff-cover==10.6.0 diff-cover coverage/cobertura-coverage.xml --compare-branch=origin/main --include-untracked --fail-under=90",
    "test:e2e": "playwright test",
    "test:mutation": "next typegen && stryker run --incremental",
    "test:mutation:changed": "next typegen && node tools/stryker/run-changed.mjs",
    "structure": "knip --treat-config-hints-as-errors && depcruise . && jscpd .",
    "security": "pnpm audit --audit-level high && uvx --exclude-newer \"7 days\" semgrep==1.182.1 scan --config p/default --config p/typescript --config p/react --config p/nextjs --config p/github-actions --error --metrics=off",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm test:changed-lines && pnpm structure"
  }
}
```

- `pnpm check` is the one command agents run before saying a task is done. It needs `uv` installed, for diff-cover.
- Mutation and `pnpm security` run in CI only. They're slower, and Semgrep downloads its rules on each run. Run them locally when you need to.
- `tsc` must resolve to the TypeScript 7 binary.
- The dependency-cruiser and jscpd configs exclude `.next/`, `node_modules/`, `coverage/` and `prototype/`.

## 4. GitHub settings *(human)*

- **Ruleset on `main`:**
  - Pull request required, 0 approvals (section 5), conversations resolved.
  - Required status checks: every required CI job in section 2, by name, from GitHub Actions. Branch must be up to date before merging.
  - Code scanning results required (CodeQL: high or higher security alerts, and errors).
  - Force pushes and deletion blocked. Merge commits only ([ADR 0010](adr/0010-merge-commits.md)). Bypass list empty.
  - Signed commits. GitHub signs its own web merges and Dependabot's commits. Sign local commits with an SSH key: add the public key on GitHub as a **Signing key**, then run `git config --local gpg.format ssh`, `git config --local user.signingkey <path to the .pub>` and `git config --local commit.gpgsign true`. A PR with unsigned commits can't merge.
  - Merge queue only if the repo belongs to a GitHub organization.
- **Merge settings:** merge commits only ([ADR 0010](adr/0010-merge-commits.md)). The merge commit's title is the PR title and its body is the PR description. Merged branches are deleted automatically.
- **Security:** secret scanning and push protection, Dependabot alerts, security updates and version updates, CodeQL default setup.
- **Optional:** AI review (`claude-code-action`) on each PR. Advisory only, never a required check.

## 5. Where we differ from Best Practices

| Best Practices | Here | Why |
|---|---|---|
| 1 required approval | 0 approvals | Solo dev, and GitHub won't let you approve your own PR. Every check is required instead ([ADR 0003](adr/0003-solo-dev-with-ai-agents.md)). |
| Code Owners review | Off | Solo dev ([ADR 0003](adr/0003-solo-dev-with-ai-agents.md)). |
| Mutation testing SHOULD NOT be a required PR check | Required | Full strictness from day one ([ADR 0004](adr/0004-all-checks-required-from-day-one.md)). Incremental runs on changed files keep it fast. |

## 6. Setup checklist

One tool per step, in this order. After each step, `pnpm check` must pass before the next one.

- [x] 0. Node 24, pnpm and the Next.js app (pnpm supply-chain settings before the first install)
- [x] 1. GitHub security settings: secret scanning, push protection, Dependabot alerts and security updates *(human)*
- [x] 2. Prettier
- [x] 3. TypeScript 6 and 7, tsconfig
- [x] 4. ESLint
- [x] 5. Vitest and React Testing Library
- [x] 6. Coverage: Vitest v8 floor and diff-cover
- [x] 7. fast-check
- [x] 8. Playwright
- [x] 9. knip
- [x] 10. dependency-cruiser
- [x] 11. jscpd
- [x] 12. Stryker
- [x] 13. lefthook
- [x] 14. commitlint
- [x] 15. CI workflow: all required jobs, including Semgrep CE and `pnpm audit`
- [x] 16. Dependabot config
- [x] 17. After the setup PR is merged: CodeQL default setup (it needs code on `main`), then the `main` ruleset with required checks. Check that Dependabot's first run has no config errors (Insights → Dependency graph → Dependabot) *(human)*
- [x] 18. Claude Code hook in `.claude/settings.json`
