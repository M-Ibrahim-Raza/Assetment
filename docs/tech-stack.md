# Tech Stack

Every tool this app uses or has chosen. Versions come from `pnpm-lock.yaml`. Settings and where each check runs: [code-quality-stack.md](code-quality-stack.md). Big decisions: [adr/](adr/). Tool choices live here.

## Languages and runtime

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Node.js | 24 (range: `.nvmrc` is `24`, `engines` is `>=24.14.0`) | Runs the app, tools and CI | - | - | - |
| pnpm | 11.2.2 | Package manager, pinned in `packageManager` | Strongest supply-chain settings (release-age wait, trust policy, build-script allowlist) | npm, yarn | - |
| TypeScript 7 (`@typescript/native`) | 7.0.2 | `tsc` type checks with a strict `tsconfig.base.json` | One language for the UI and the backend (ADR 0001) | - | - |
| TypeScript 6 (`typescript`, aliased to `@typescript/typescript6`) | 6.0.2 | The TypeScript that ESLint and other tools load | - | - | - |
| `@types/node` | 24.19.2 | Types for Node | - | - | - |
| `@types/react` | 19.3.0 | Types for React | - | - | - |
| `@types/react-dom` | 19.3.0 | Types for React DOM | - | - | - |

## Web framework

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Next.js | 16.4.5 | The whole app. Server Components, Server Actions and route handlers are the backend. Turbopack, `cacheComponents`, `partialPrefetching` and `typedRoutes` are on | One codebase, one deploy and one set of quality tools (ADR 0001) | A separate backend API service | - |
| React | 19.3.1 | UI library | Next.js is built on it | - | - |
| React DOM | 19.3.1 | Renders React in the browser | Next.js is built on it | - | - |
| React Compiler (`babel-plugin-react-compiler`) | 1.0.0 | Automatic memoization, turned on with `reactCompiler: true` | - | - | - |

## API and data fetching

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| tRPC server (`@trpc/server`) | 11.24.0 | Type-safe API procedures, served by one route handler at `/api/trpc` (`app/api/trpc/[trpc]/route.ts`). `trpc/init.ts` holds the one `initTRPC`, and the router in `trpc/app.router.ts` stays empty until a feature adds a procedure | Types flow from server to client with no code generation (ADR 0005) | GraphQL (Yoga + Pothos), oRPC, plain Route Handlers with TanStack Query | - |
| tRPC client (`@trpc/client`) | 11.24.0 | Calls the procedures from the browser and batches requests (`httpBatchLink`) | Part of the tRPC setup (ADR 0005) | - | - |
| `@trpc/tanstack-react-query` | 11.24.0 | Connects tRPC to TanStack Query. `TRPCReactProvider` in `trpc/client.tsx` uses the app's one QueryClient, inside `app/providers.tsx` | Part of the tRPC setup (ADR 0005) | - | - |
| TanStack Query (`@tanstack/react-query`) | 5.106.0 | Client-side data cache: caching, polling and optimistic updates. `getQueryClient()` in `lib/query/get-query-client.ts` gives each server render a new cache and the browser one cache, with a 60-second `staleTime` | Dashboards need a shared client cache, and Server Actions run one at a time, so they can't fetch (ADR 0005) | - | - |

## Authentication

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Better Auth (`better-auth`) | 1.7.17 | Email and password sign-in, two-factor auth (`twoFactor` plugin) and sessions, stored in Postgres. Installed but not wired in yet, so it's on knip's `ignoreDependencies` list | Sign-up, password reset, email verification and 2FA are built in, so AI agents don't hand-write auth code. Users stay in our database, with no per-user fees | Auth.js (security fixes only since September 2025, v5 in beta, no built-in 2FA), Clerk (users outside our database, paid MFA) | Patch promptly (≥1.7.17). Require email verification. Read upgrade guides before minors. Revisit if license changes |

## Database

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Neon | - | Serverless Postgres for production, plus a copy-on-write branch for each Vercel preview deploy. Set up through the Vercel Marketplace. Not connected yet | Its free plan fits v1 and includes a branch per PR | Supabase (branching is paid, and its auth overlaps Better Auth), Prisma Postgres (no copy-on-write branching) | Free tier: 10 branches, 100 compute-hours/month, 1 GB; sleeps after 5 idle min. Watch pricing |
| Prisma CLI (`prisma`) | 7.10.1 | Schema, migrations and client generation. Pinned to 7, because `prisma@latest` installs the Prisma 8 rewrite. In `trustPolicyExclude` (no provenance, [prisma/orm#30850](https://github.com/prisma/orm/issues/30850)), with its install scripts blocked, so the CLI downloads its engine on first use. Installed but not wired in yet, so it's on knip's `ignoreDependencies` list | The developer's choice of ORM. Prisma 7 works with Better Auth, and the Prisma 8 rewrite doesn't yet | Drizzle (no code generation, but not 1.0 yet) | Move to Prisma 8 within 18 months of its release. Hand-check each 7.x's provenance |
| Prisma Client (`@prisma/client`) | 7.10.1 | Typed queries, generated from the Prisma schema. Must match the CLI version. Not wired in yet | Part of Prisma | - | Once generated, ESLint, jscpd, coverage and Stryker must skip its folder |
| `@prisma/adapter-pg` | 7.10.1 | Connects Prisma Client to Postgres over TCP with `pg`. Must match the CLI version. Not wired in yet | Works with Neon and with a local Postgres in tests | `@prisma/adapter-neon` (MSW would block its HTTP driver in tests) | - |

## Data validation

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Zod (`zod`) | 4.6.7 | Validates tRPC inputs, forms and other untrusted data. Not wired in yet, so it's on knip's `ignoreDependencies` list | One schema checks data on the server and in the browser. Already a Better Auth dependency, and tRPC and Better Auth support it directly | Valibot (smaller bundles, but fewer integrations), ArkType (small ecosystem, mostly one maintainer) | Use `zod/mini` in Client Components if bundle size becomes a problem |

## Logging

| Tool | Version | Purpose | Why | Alternatives considered |
|---|---|---|---|---|
| Pino (`pino`) | 10.4.0 | Structured JSON logs to stdout from server code (Server Components, Server Actions, tRPC, route handlers), read in Vercel runtime logs. Built-in `redact` and per-request child loggers in `AsyncLocalStorage` for `request_id`. Chosen, not installed yet | Fastest and most used Node logger, and on Next.js 16.1+'s built-in `serverExternalPackages` list, so Turbopack needs no config. The handbook's logger for Next.js | LogTape (one maintainer), Winston (no built-in redaction, slow releases), Consola (CLI printer, no JSON logs) |
| `pino-pretty` | 13.2.0 | Readable logs in development, piped: `next dev \| pino-pretty`. Dev dependency only, never in production. Chosen, not installed yet | Keeps production free of transports, which start worker threads that bundlers handle badly | - |

## Styling

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Tailwind CSS | 4.3.4 | Utility CSS, imported in `app/globals.css` | - | - | - |
| `@tailwindcss/turbopack` | 4.3.4 | Runs Tailwind on CSS files in Turbopack | - | - | - |
| Geist and Geist Mono (`next/font/google`) | Part of Next.js | App fonts, loaded in `app/layout.tsx` | - | - | - |

## UI components

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| shadcn/ui (`shadcn`) | 4.23.0 | CLI that copies components into `components/ui/` and writes `components.json`. Its `shadcn/tailwind.css` is imported in `app/globals.css` | Production owns the design system, and the prototype imports it (ADR 0006). The components are code we own | - | Run the CLI pinned: `pnpm dlx shadcn@4.23.0` |
| Base UI (`@base-ui/react`) | 1.9.0 | Behaviour and accessibility under the shadcn/ui components in `components/ui/` | shadcn's default base since July 2026. Native Combobox, Autocomplete, Number Field and multi-value Select fit ticker search and multi-select filters | Radix (no combobox or multi-value Select, slower releases), React Aria (fewest shadcn examples, needs an ADR) | Pass `-b base` to every `shadcn init`. Write `render`, never `asChild` |
| lucide (`lucide-react`) | 1.70.0 | Icons, set as `iconLibrary` in `components.json` | shadcn's default outline icons, so every example and agent uses them. Covers wallet, bank, receipt and coins | Tabler (5,000+ icons, but shadcn examples need translating), Phosphor (no release since May 2025) | Switch to Tabler with `shadcn migrate icons` if lucide lacks an icon |
| `class-variance-authority` | 0.7.1 | Variants (`cva`) inside shadcn components | Part of shadcn/ui | - | - |
| `cn` | 0.5.2 | Merges class names. Re-exported from `lib/utils.ts` | Part of shadcn/ui. Replaces clsx and tailwind-merge | - | - |
| `tw-animate-css` | 1.4.0 | Animation utilities, imported in `app/globals.css` | Part of shadcn/ui | - | - |
| Sonner (`sonner`) | 2.0.8 | Toasts, through shadcn's `components/ui/sonner.tsx`. Undo after a reversible action. Only the prototype uses it so far | shadcn's toast component: an action button, a set duration (Undo needs 10 s) and a live region for screen readers | - | - |
| `next-themes` | 0.4.6 | Tells the toasts whether the theme is light or dark. Nothing sets a theme yet, so they follow the system | Required by shadcn's sonner component | - | Revisit when light and dark support is decided |

## Formatting

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Prettier | 3.9.10 | Formats all code, but not Markdown, because docs are hand-written | - | - | - |
| `prettier-plugin-tailwindcss` | 0.8.1 | Sorts Tailwind classes | - | - | - |

## Linting

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| ESLint | 9.39.5 | Linter, flat config, zero warnings allowed | - | - | Stay on 9 until `eslint-config-next`'s plugins support 10 |
| `@eslint/js` | 9.39.5 | ESLint's recommended rules | - | - | - |
| `eslint-config-next` | 16.4.5 | Next.js rules (core-web-vitals, TypeScript, React hooks) | - | - | - |
| `typescript-eslint` | 8.72.1 | Type-aware rules (`strictTypeChecked`, `stylisticTypeChecked`) | - | - | - |
| `eslint-plugin-jsx-a11y` | 6.10.2 | The full accessibility rule set | `eslint-config-next` turns on only a few of these rules | - | - |
| `eslint-plugin-better-tailwindcss` | 4.10.0 | Checks Tailwind classes. Class order is left to Prettier | - | - | - |
| `@eslint-community/eslint-plugin-eslint-comments` | 4.8.1 | Allows only one-line disable comments that name the rule and give a reason | AI agents can game checks by disabling rules (ADR 0003) | - | - |

## Unit and component testing

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Vitest | 5.1.0 | Test runner with unit, component and integration projects, in random order | - | - | - |
| jsdom | 30.1.3 | Browser DOM for component tests | - | - | - |
| React Testing Library (`@testing-library/react`) | 16.3.3 | Renders components and finds elements by role | - | - | - |
| `@testing-library/dom` | 10.4.2 | Peer of React Testing Library | - | - | - |
| `@testing-library/jest-dom` | 7.0.1 | DOM matchers such as `toHaveAttribute` | - | - | - |
| MSW | 3.0.3 | Mocks network requests and fails any test that sends a request without a handler | - | - | - |

## Coverage

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| `@vitest/coverage-v8` | 5.1.0 | Line and branch coverage, with an 80% floor | v8 reports branches as well as lines | - | - |
| diff-cover | 10.6.0 | Needs at least 90% coverage on lines changed since `origin/main`. Runs through `uvx`, so it isn't in `package.json`'s dependencies | - | - | - |

## End-to-end testing

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Playwright (`@playwright/test`) | 1.64.1 | End-to-end tests against a fresh production build, in Chromium only. Also screenshots prototype screens (`prototypes/kit/screenshots.mts`) | - | - | - |

## Mutation testing

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| StrykerJS (`@stryker-mutator/core`, `vitest-runner`, `typescript-checker`) | 10.1.1 | Mutation tests on changed files in each PR, and on every file each night | AI agents can game checks with weak tests (ADR 0003), and every check is required from day one (ADR 0004) | - | - |

## Code structure

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| knip | 6.44.1 | Finds unused files, exports and packages | - | - | - |
| dependency-cruiser | 18.7.2 | Import rules: no imports from `prototypes/`, no cycles, no orphan files | - | - | - |
| jscpd | 5.4.2 | Fails if more than 3% of the code is duplicated | - | - | - |

## Git hooks and commits

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| lefthook | 2.2.1 | Git hooks. Runs ESLint and Prettier before a commit, commitlint on the message, and the type check and tests before a push | - | - | Held at 2.2.1: 2.2.2 was published without provenance |
| commitlint (`@commitlint/cli`, `@commitlint/config-conventional`) | 21.2.4 | Enforces Conventional Commits on commits and PR titles | - | - | - |

## CI

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| GitHub Actions | - | Runs the required checks (lint, typecheck, tests in two time zones, e2e, structure, mutation, security) on `ubuntu-24.04`, plus a nightly full mutation run | CI is the merge gate, since no human approval is required (ADR 0003) | - | - |
| `actions/checkout` | 7.0.1 | Checks out the repo | - | - | - |
| `actions/setup-node` | 7.1.0 | Installs Node from `.nvmrc` | - | - | - |
| `pnpm/action-setup` | 6.1.0 | Installs pnpm from `packageManager` | - | - | - |
| `actions/upload-artifact` | 7.0.2 | Uploads coverage, Playwright and mutation reports | - | - | - |
| `astral-sh/setup-uv` | 10.3.3 | Installs uv in CI | - | - | - |
| uv | 0.13.6 | Runs the Python tools diff-cover and Semgrep with `uvx`. Needed locally too, for `pnpm check` | - | - | - |

## Security

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| CodeQL (GitHub default setup) | - | Deep code scanning, where high alerts block the merge | Free on public repos (ADR 0002) | - | - |
| Semgrep CE | 1.182.1 | A fast pattern scan on every PR (`p/default`, `p/typescript`, `p/react`, `p/nextjs`, `p/github-actions`). Runs through `uvx` | Fast pattern checks on every PR, alongside CodeQL's deeper cross-file checks | - | - |
| pnpm audit | Part of pnpm | Fails CI on high-severity advisories | - | - | - |
| GitHub secret scanning and push protection | - | Blocks pushes that contain known key formats | Free on public repos (ADR 0002) | - | - |
| Dependabot | - | Weekly updates for npm packages and GitHub Actions, after a 7-day wait | - | - | - |

## Code hosting

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| GitHub | - | Public repo. The `main` ruleset requires every CI check and allows merge commits or rebase merging ([git-rules.md](git-rules.md)) | Public, so CodeQL, secret scanning and push protection are free (ADR 0002) | A private repo | - |

## AI coding

| Tool | Version | Purpose | Why | Alternatives considered | Notes |
|---|---|---|---|---|---|
| Claude Code | - | AI agents write most of the code. A PostToolUse hook runs `eslint --fix`, then Prettier, on each edited file (`.claude/hooks/format-and-lint.mjs`) | One developer builds the app with AI agents (ADR 0003) | - | - |
| shadcn skill (`shadcn/ui` repo, `skills/shadcn`) | `4233ed1` (2026-10-14) | Teaches agents the shadcn CLI, component rules and theming, from `.claude/skills/shadcn/`. Claude loads it whenever it works with shadcn/ui | Agents use the real component APIs instead of inventing them | - | Markdown files only. `SKILL.md` patched to `pnpm exec shadcn`. Redo both when updating |
| shadcn MCP server (`shadcn mcp`) | 4.23.0 | Lets agents search, view and get install commands for registry items. `.mcp.json` runs the pinned CLI | Agents find existing components and blocks before writing custom UI | - | Don't run `shadcn mcp init`: it installs `shadcn@latest` and writes `npx` |
