# CLAUDE.md

## Writing style

Rules for all content Claude writes in this repo (docs, specs, plans, tasks, notes):

- Write in short, understandable, clear and natural language.
- No filler and no paragraphs that over-explain.

## Source of truth

- `docs/product.md`: what the app is, who it's for and why.
- `docs/journeys/`: one file per main user journey, step by step, with screens and features.
- `docs/features.md`: feature list, handoff notes and the progress board.
- `prototypes/`: the living UI prototype, one folder per screen.
- `docs/adr/`: important decisions, one file each. Tool choices go in `docs/tech-stack.md`.

Read `docs/README.md` before writing or editing any file in `docs/`. It defines what goes in each one.

## Writing a spec (`/sdd-specify`)

Before you draft `specs/<feature>/spec.md`, read:

1. `docs/product.md`
2. The feature's row and handoff note in `docs/features.md`
3. The feature's journey file in `docs/journeys/`
4. The code of each screen in the handoff note: `prototypes/screens/<screen>/`, or its production View once the screen has shipped

Don't restate the product in the spec. Link to `docs/product.md` instead. After the spec is saved, set the feature's Status to `specified` in `docs/features.md`. Update it the same way after each later phase: `planned`, `tasked`, `implemented`, `reviewed`, `documented`, `done`. When the feature's doc is written, add its link in the Docs column.

## Prototype

`prototypes/` is the living UI prototype of the whole app, one folder per screen ([ADR 0006](docs/adr/0006-living-ui-prototype.md)). It is never deleted.

- Every UI change starts in the prototype, then moves to production.
- Each production screen has a data-loading page and a View that takes props ([ADR 0007](docs/adr/0007-screen-page-and-view.md)). The prototype renders shipped Views with fake data.
- To change a shipped screen, fork its View into `prototypes/`, change it, build the change in production, then delete the fork.
- Losing variants are deleted once one is chosen.
- Production code may start from a prototype screen's code, but never imports from `prototypes/`.

## Git

@docs/git-rules.md

## Code quality

@docs/code-quality-rules.md

## UI/UX

@docs/ui-ux-rules.md

## Next.js

`next dev` writes this block. It points to the docs for the installed Next.js version.

@AGENTS.md
