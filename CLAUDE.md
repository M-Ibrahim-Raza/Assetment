# CLAUDE.md

## Source of truth

- `docs/product.md`: the problem, personas, core journeys and v1 non-goals.
- `docs/features.md`: the feature list (ID, journey, priority, dependencies, status) and one handoff note per feature. Its Status column is the progress board for the whole build.
- `docs/prototype-screens/<ID>-<screen>.png`: screenshots of the chosen prototype screens for each feature.

## Writing a spec (`/sdd-specify`)

Before you draft `specs/<feature>/spec.md`, read:

1. `docs/product.md`
2. The feature's row and handoff note in `docs/features.md`
3. Every `docs/prototype-screens/<ID>-*.png` file for that feature

Don't restate the product in the spec. Link to `docs/product.md` instead. After the spec is saved, set the feature's Status to `specified` in `docs/features.md`. Update it the same way after each later phase: `planned`, `tasked`, `implemented`.

## Prototype

`prototype/` is throwaway. Code outside it must never import from it, and it gets deleted once every Must feature is specified. Use it to read decisions, not to copy code.

## Engineering rules

Follow `/Applications/BetterStack/Best Practices/` (start with its `AGENTS.md`) for the real app.
