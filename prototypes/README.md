# Prototype

The living UI prototype of Assetment ([ADR 0006](../docs/adr/0006-living-ui-prototype.md)). Every UI change starts here, then moves to production.

Run it from the repo root with `pnpm proto`, then open http://localhost:3001. Check it with `pnpm proto:check`, which runs the type check and lint. CI runs both through `pnpm typecheck` and `pnpm lint`.

## Folders

| Path | What goes in it |
|---|---|
| `app/` | Thin routes with the same URLs as production. `/` lists every journey from `docs/journeys/`. |
| `screens/<screen>/` | Screens the prototype owns: not built yet, or a fork of a shipped View. `scenarios.ts`, plus the View or its variants. |
| `screens.ts` | Journey screen name → prototype URL, so the index can link it. |
| `components/` | Prototype-only components that several screens share. Create it when the first one is needed. |
| `fixtures/` | Fake data builders shared by screens. |
| `kit/` | Prototype tooling: `ProtoScreen`, `ProtoBar`, the scenario types, `useProtoAction`, and `screenshots.mts`, which shoots a screen at five widths. |

`/demo` (in `screens/demo/`) shows the shape every screen follows. It is not a real screen.

## In the browser

- `?variant=a` switches variants. ← and → do too, when nothing is focused.
- `?scenario=empty` switches state: `default`, `empty`, `loading`, `error`, `many`, and any others the screen defines.
- `?latency=slow` delays in-memory actions by 1.5 s, to show pending states.

The ProtoBar at the bottom sets all three, and the URL always reproduces what's on screen.

## Rules

- `@/` is the repo root, as in production. `@proto/` is this folder.
- UI comes from production (`@/components/ui`) and its tokens. No hardcoded colors.
- Once a screen ships, its route renders the production View with the scenarios here ([ADR 0007](../docs/adr/0007-screen-page-and-view.md)). To change it, fork the View into `screens/<screen>/` first.
- Production never imports from this folder.
