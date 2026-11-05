# Tech Stack

Every tool this app installs and uses. Versions come from `pnpm-lock.yaml`. Settings and where each check runs: [code-quality-stack.md](code-quality-stack.md). Decisions: [adr/](adr/).

## Languages and runtime

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Node.js | 24 (range: `.nvmrc` is `24`, `engines` is `>=24.14.0`) | Runs the app, tools and CI | - | - |
| pnpm | 11.2.2 | Package manager, pinned in `packageManager` | Strongest supply-chain settings (release-age wait, trust policy, build-script allowlist) | npm, yarn |
| TypeScript 7 (`@typescript/native`) | 7.0.2 | `tsc` type checks with a strict `tsconfig.base.json` | One language for the UI and the backend (ADR 0001) | - |
| TypeScript 6 (`typescript`, aliased to `@typescript/typescript6`) | 6.0.2 | The TypeScript that ESLint and other tools load | - | - |
| `@types/node` | 24.19.2 | Types for Node | - | - |
| `@types/react` | 19.3.0 | Types for React | - | - |
| `@types/react-dom` | 19.3.0 | Types for React DOM | - | - |

## Web framework

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Next.js | 16.4.5 | The whole app. Server Components, Server Actions and route handlers are the backend. Turbopack, `cacheComponents`, `partialPrefetching` and `typedRoutes` are on | One codebase, one deploy and one set of quality tools (ADR 0001) | A separate backend API service |
| React | 19.3.1 | UI library | Next.js is built on it | - |
| React DOM | 19.3.1 | Renders React in the browser | Next.js is built on it | - |
| React Compiler (`babel-plugin-react-compiler`) | 1.0.0 | Automatic memoization, turned on with `reactCompiler: true` | - | - |

## Styling

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Tailwind CSS | 4.3.4 | Utility CSS, imported in `app/globals.css` | - | - |
| `@tailwindcss/turbopack` | 4.3.4 | Runs Tailwind on CSS files in Turbopack | - | - |
| Geist and Geist Mono (`next/font/google`) | Part of Next.js | App fonts, loaded in `app/layout.tsx` | - | - |

## Formatting

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Prettier | 3.9.10 | Formats all code, but not Markdown, because docs are hand-written | - | - |
| `prettier-plugin-tailwindcss` | 0.8.1 | Sorts Tailwind classes | - | - |

## Linting

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| ESLint | 9.39.5 | Linter, flat config, zero warnings allowed | Stays on 9 until `eslint-config-next`'s plugins support 10 | - |
| `@eslint/js` | 9.39.5 | ESLint's recommended rules | - | - |
| `eslint-config-next` | 16.4.5 | Next.js rules (core-web-vitals, TypeScript, React hooks) | - | - |
| `typescript-eslint` | 8.72.1 | Type-aware rules (`strictTypeChecked`, `stylisticTypeChecked`) | - | - |
| `eslint-plugin-jsx-a11y` | 6.10.2 | The full accessibility rule set | `eslint-config-next` turns on only a few of these rules | - |
| `eslint-plugin-better-tailwindcss` | 4.10.0 | Checks Tailwind classes. Class order is left to Prettier | - | - |
| `@eslint-community/eslint-plugin-eslint-comments` | 4.8.1 | Allows only one-line disable comments that name the rule and give a reason | AI agents can game checks by disabling rules (ADR 0003) | - |

## Unit and component testing

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Vitest | 5.1.0 | Test runner with unit, component and integration projects, in random order | - | - |
| jsdom | 30.1.3 | Browser DOM for component tests | - | - |
| React Testing Library (`@testing-library/react`) | 16.3.3 | Renders components and finds elements by role | - | - |
| `@testing-library/dom` | 10.4.2 | Peer of React Testing Library | - | - |
| `@testing-library/jest-dom` | 7.0.1 | DOM matchers such as `toHaveAttribute` | - | - |
| MSW | 3.0.3 | Mocks network requests and fails any test that sends a request without a handler | - | - |

## Coverage

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| `@vitest/coverage-v8` | 5.1.0 | Line and branch coverage, with an 80% floor | v8 reports branches as well as lines | - |
| diff-cover | 10.6.0 | Needs at least 90% coverage on lines changed since `origin/main`. Runs through `uvx`, so it isn't in `package.json`'s dependencies | - | - |

## End-to-end testing

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Playwright (`@playwright/test`) | 1.64.1 | End-to-end tests against a fresh production build, in Chromium only | - | - |

## Mutation testing

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| StrykerJS (`@stryker-mutator/core`, `vitest-runner`, `typescript-checker`) | 10.1.1 | Mutation tests on changed files in each PR, and on every file each night | AI agents can game checks with weak tests (ADR 0003), and every check is required from day one (ADR 0004) | - |

## Code structure

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| knip | 6.44.1 | Finds unused files, exports and packages | - | - |
| dependency-cruiser | 18.7.2 | Import rules: no imports from `prototype/`, no cycles, no orphan files | - | - |
| jscpd | 5.4.2 | Fails if more than 3% of the code is duplicated | - | - |

## Git hooks and commits

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| lefthook | 2.2.1 | Git hooks. Runs ESLint and Prettier before a commit, commitlint on the message, and the type check and tests before a push. Held at 2.2.1 because 2.2.2 was published without provenance | - | - |
| commitlint (`@commitlint/cli`, `@commitlint/config-conventional`) | 21.2.4 | Enforces Conventional Commits on commits and PR titles | - | - |

## CI

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| GitHub Actions | - | Runs the required checks (lint, typecheck, tests in two time zones, e2e, structure, mutation, security) on `ubuntu-24.04`, plus a nightly full mutation run | CI is the merge gate, since no human approval is required (ADR 0003) | - |
| `actions/checkout` | 7.0.1 | Checks out the repo | - | - |
| `actions/setup-node` | 7.1.0 | Installs Node from `.nvmrc` | - | - |
| `pnpm/action-setup` | 6.1.0 | Installs pnpm from `packageManager` | - | - |
| `actions/upload-artifact` | 7.0.2 | Uploads coverage, Playwright and mutation reports | - | - |
| `astral-sh/setup-uv` | 10.3.3 | Installs uv in CI | - | - |
| uv | 0.13.6 | Runs the Python tools diff-cover and Semgrep with `uvx`. Needed locally too, for `pnpm check` | - | - |

## Security

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| CodeQL (GitHub default setup) | - | Deep code scanning, where high alerts block the merge | Free on public repos (ADR 0002) | - |
| Semgrep CE | 1.182.1 | A fast pattern scan on every PR (`p/default`, `p/typescript`, `p/react`, `p/nextjs`, `p/github-actions`). Runs through `uvx` | Fast pattern checks on every PR, alongside CodeQL's deeper cross-file checks | - |
| pnpm audit | Part of pnpm | Fails CI on high-severity advisories | - | - |
| GitHub secret scanning and push protection | - | Blocks pushes that contain known key formats | Free on public repos (ADR 0002) | - |
| Dependabot | - | Weekly updates for npm packages and GitHub Actions, after a 7-day wait | - | - |

## Code hosting

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| GitHub | - | Public repo. The `main` ruleset requires every CI check and allows squash merges only | Public, so CodeQL, secret scanning and push protection are free (ADR 0002) | A private repo |

## AI coding

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Claude Code | - | AI agents write most of the code. A PostToolUse hook runs `eslint --fix`, then Prettier, on each edited file (`.claude/hooks/format-and-lint.mjs`) | One developer builds the app with AI agents (ADR 0003) | - |
