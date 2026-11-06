# CLAUDE.md

## Writing style

Rules for all content Claude writes in this repo (docs, specs, plans, tasks, notes):

- Write in short, understandable, clear and natural language.
- No filler and no paragraphs that over-explain.

## Source of truth

- `docs/product.md`: what the app is, who it's for and why.
- `docs/journeys.md`: the main user journeys, step by step, with screens and features.
- `docs/features.md`: feature list, handoff notes and the progress board.
- `docs/prototype-screens/`: screenshots of the chosen prototype screens.
- `docs/adr/`: project decisions, one file each.

Read `docs/README.md` before writing or editing any file in `docs/`. It defines what goes in each one.

## Writing a spec (`/sdd-specify`)

Before you draft `specs/<feature>/spec.md`, read:

1. `docs/product.md`
2. The feature's row and handoff note in `docs/features.md`
3. The feature's journey in `docs/journeys.md`
4. Every `docs/prototype-screens/<ID>-*.png` file for that feature

Don't restate the product in the spec. Link to `docs/product.md` instead. After the spec is saved, set the feature's Status to `specified` in `docs/features.md`. Update it the same way after each later phase: `planned`, `tasked`, `implemented`, `reviewed`, `documented`, `done`. When the feature's doc is written, add its link in the Docs column.

## Prototype

`prototype/` is throwaway. Code outside it must never import from it, and it gets deleted once every Must feature is specified. Use it to read decisions, not to copy code.

## Git

- PRs merge with a merge commit or a rebase merge ([ADR 0011](docs/adr/0011-no-signed-commits.md)), so every commit lands on `main` as it is. Keep each commit small and atomic. Squash fixups locally before opening the PR.

## Code quality

@docs/code-quality-rules.md

## Next.js

`next dev` writes this block. It points to the docs for the installed Next.js version.

@AGENTS.md
