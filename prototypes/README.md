# Prototype

The living UI prototype of Assetment ([ADR 0006](../docs/adr/0006-living-ui-prototype.md)). Every UI change starts here, then moves to production.

Run it from the repo root with `pnpm proto`, then open http://localhost:3001. Check it with `pnpm proto:check`, which runs the type check and lint. CI runs both through `pnpm typecheck` and `pnpm lint`.

## Folders

| Path | What goes in it |
|---|---|
| `app/` | Thin routes with the same URLs as production. `/` lists every journey from `docs/journeys/`. |
| `screens/<screen>/` | Screens the prototype owns: not built yet, or a fork of a shipped View. `scenarios.ts`, plus the View or its variants. |
| `screens.ts` | Journey screen name → prototype URL, so the index can link it. |
| `components/` | Prototype-only components that several screens share, such as `AppShell` (tab bar, a sidebar with the logo that collapses to an icon rail, header with the profile panel), `ThemeProvider`, `Money` and `ScreenLink`. `blocks.ts` holds the look's shared classes: block corners, padding, headings and the ink field. |
| `fixtures/` | Fake data builders shared by screens. |
| `kit/` | Prototype tooling: `ProtoScreen`, `ProtoBar`, the scenario types, `useProtoAction`, the money formatters, and `screenshots.mts`, which shoots a screen at five widths, in light and dark. |

`/demo` (in `screens/demo/`) shows the shape every screen follows. It is not a real screen.

## In the browser

- `?variant=a` switches variants. ← and → do too, when nothing is focused.
- `?scenario=empty` switches state: `default`, `empty`, `loading`, `error`, `many`, and any others the screen defines.
- `?latency=slow` delays in-memory actions by 1.5 s, to show pending states.

The ProtoBar at the bottom sets all three, and the URL always reproduces what's on screen. On phones it shrinks to a "Proto" pill at the top, so it doesn't cover the app's tab bar. Tap the pill to open the bar, and × to hide it.

The profile button opens a panel that switches the theme: Auto (follows the device), Light or Dark.

## Rules

- `@/` is the repo root, as in production. `@proto/` is this folder.
- UI comes from production (`@/components/ui`) and its tokens. No hardcoded colors.
- `app/prototype.css` imports production's `app/globals.css` and makes Tailwind scan the whole repo. Without it, classes used only in production components are never generated here.
- `app/theme.css` holds the chosen look: colours, the block corners and the display face (Bricolage Grotesque, as `DISPLAY` from `components/display.ts`). It overrides production's stock values until F06 moves the look into production. Its `.dark` block gives every colour a dark value. Fill ink blocks with `--ink`, never `foreground`, which turns light in dark mode.
- The logo comes from `logo/final/`. Import its SVG from there, and never copy the file or type out the name. `logo.d.ts` types the import.
- Toasts come from `AppShell`, which mounts the shadcn `Toaster`. Call `toast()` from `sonner`.
- A link to another screen goes through `ScreenLink`. It turns into a real link once that screen is in `screens.ts`.
- Once a screen ships, its route renders the production View with the scenarios here ([ADR 0007](../docs/adr/0007-screen-page-and-view.md)). To change it, fork the View into `screens/<screen>/` first.
- Production never imports from this folder.
