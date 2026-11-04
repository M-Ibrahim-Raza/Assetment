# Code Quality Stack

The code quality tools for this app, how they're set up, and where each check runs. The decisions behind it are in [adr/](adr/).

## 1. Tools

| Layer | Pick | Setup |
|---|---|---|
| Runtime | Node 24 LTS, pnpm | Node in `.nvmrc` and `engines`. Pin pnpm in `packageManager`; pnpm has the strongest supply-chain settings. |
| Format | Prettier | Owns all formatting. Never run it through ESLint. |
| Lint | ESLint (flat config) | `eslint-config-next` (core-web-vitals + typescript, jsx-a11y on), typescript-eslint `strictTypeChecked` + `stylisticTypeChecked` with `projectService`, `eslint-plugin-react-hooks` `recommended`, `@eslint-community/eslint-plugin-eslint-comments` (`require-description`, `no-unlimited-disable`). `reportUnusedDisableDirectives: "error"`. |
| Types | TypeScript 7 `tsc`, TypeScript 6 for ESLint | Both installed side by side, pinned. Strict tsconfig. `typedRoutes: true`. Run `next typegen` before `tsc --noEmit`. |
| Tests | Vitest + React Testing Library | Unit, component and integration `projects` |
| Property tests | `@fast-check/vitest` | Parsers, validators, money and date logic. |
| Coverage | Vitest (v8) + diff-cover | Branch coverage on. Floor: 80% lines and branches. Changed lines: at least 90%. |
| E2E | Playwright | Runs against `next build && next start`. |
| Mutation | StrykerJS (Vitest runner) | `--incremental`, changed files only. Thresholds: `high: 80`, `low: 60`, `break: 60`. |
| Structure | knip, dependency-cruiser, jscpd | knip: dead code and unused deps. dependency-cruiser: no `prototype/` imports, no cycles, layer rules. jscpd: duplication ≤3%. |
| Secrets | GitHub secret scanning + push protection | Free on public repos. Blocks pushes with known key formats and scans the full history. |
| Dependencies | Dependabot, `pnpm audit`, pnpm settings | Dependabot for `npm` and `github-actions`, 3-day cooldown. `pnpm audit --audit-level high` in CI. pnpm: `minimumReleaseAge: 1440`, `trustPolicy: no-downgrade`, `allowBuilds` allowlist, `--frozen-lockfile` in CI. `trustPolicyExclude` only for exact versions checked by hand, each with a reason. |
| SAST | CodeQL + Semgrep CE | CodeQL default setup: deep cross-file checks, free on public repos. Semgrep CE: fast pattern scan on every PR. |
| Workflows | Rules only, no scanner | Pin every Action by full SHA. Minimal `permissions:`. No `pull_request_target`. |
| Git hooks | lefthook | Config committed. Hooks install through the `prepare` script. |
| Commits | commitlint (`@commitlint/config-conventional`) | Conventional Commits on commits and PR titles. Squash merge only. |

## 2. Where each check runs

| Stage | Runs | Blocks merge? |
|---|---|---|
| Editor | Prettier on save, ESLint, TypeScript 7 extension | No, feedback only |
| Claude Code hook | After each file edit: Prettier and `eslint --fix` on that file | No, feedback only |
| pre-commit | Prettier and ESLint on staged files | No, can be skipped |
| commit-msg | commitlint | No, can be skipped |
| pre-push | Type check, unit tests | No, can be skipped |
| **CI (required)** | **The jobs below** | **Yes. This is the gate.** |
| Nightly | Full Stryker run | No. Fix findings the next day. |

Required CI jobs run in parallel on `pull_request`, `merge_group` and `push` to `main`. Keep the whole run under 10 minutes.

| Job | Runs |
|---|---|
| `lint` | `prettier --check`, `eslint --max-warnings 0`, commitlint on the PR title |
| `typecheck` | `next typegen && tsc --noEmit` |
| `test` | Vitest with the coverage floor, diff-cover on changed lines, under two `TZ` values |
| `e2e` | `next build`, `next start`, Playwright |
| `structure` | knip, dependency-cruiser, jscpd |
| `mutation` | Stryker on changed files |
| `security` | `pnpm audit --audit-level high`, Semgrep CE |
| CodeQL | GitHub default setup, required through the ruleset |

## 3. Scripts

```json
{
  "scripts": {
    "prepare": "lefthook install",
    "format": "prettier --write .",
    "format:check": "prettier --check .",
    "lint": "eslint . --max-warnings 0",
    "typecheck": "next typegen && tsc --noEmit",
    "test": "vitest run --coverage",
    "test:e2e": "playwright test",
    "test:mutation": "stryker run --incremental",
    "structure": "knip && depcruise . && jscpd .",
    "check": "pnpm format:check && pnpm lint && pnpm typecheck && pnpm test && pnpm structure"
  }
}
```

- `pnpm check` is the one command agents run before saying a task is done.
- `tsc` must resolve to the TypeScript 7 binary.
- The dependency-cruiser and jscpd configs exclude `.next/`, `node_modules/`, `coverage/` and `prototype/`.

## 4. GitHub settings *(human)*

- **Ruleset on `main`:**
  - Pull request required, 0 approvals (section 5), conversations resolved.
  - Required status checks: every CI job in section 2, by name. Branch must be up to date before merging.
  - Code scanning results required (CodeQL).
  - Force pushes and deletion blocked. Linear history. Squash merge only.
  - Signed commits, using SSH signing.
  - Merge queue only if the repo belongs to a GitHub organization.
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
- [ ] 2. Prettier
- [ ] 3. TypeScript 6 and 7, tsconfig
- [ ] 4. ESLint
- [ ] 5. Vitest and React Testing Library
- [ ] 6. Coverage: Vitest v8 floor and diff-cover
- [ ] 7. fast-check
- [ ] 8. Playwright
- [ ] 9. knip
- [ ] 10. dependency-cruiser
- [ ] 11. jscpd
- [ ] 12. Stryker
- [ ] 13. lefthook
- [ ] 14. commitlint
- [ ] 15. CI workflow: all required jobs, including Semgrep CE and `pnpm audit`
- [ ] 16. Dependabot config
- [ ] 17. After the setup PR is merged: CodeQL default setup (it needs code on `main`), then the `main` ruleset with required checks *(human)*
- [ ] 18. Claude Code hook in `.claude/settings.json`
