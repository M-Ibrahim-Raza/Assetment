---
name: prototype-screen
description: Builds a new screen in the living UI prototype (prototypes/), or forks a shipped screen to change it, with scenarios, up to 3 variants and a screenshot check at five widths. Use when the user wants to prototype, mock up, design, redesign or change a screen, page or flow, or says "try a few designs", even if they don't say "prototype". Not for building a screen in production.
argument-hint: [screen name or change]
allowed-tools: Bash(node prototypes/kit/screenshots.mts *), Bash(pnpm proto:check)
---

# Prototype a screen

Build or change the screen in `$ARGUMENTS`. If it's empty, ask which screen.

Read first:

- `prototypes/CLAUDE.md` and `docs/ui-ux-rules.md`. Every rule there applies.
- `docs/product.md`, and each journey in `docs/journeys/` whose `Screen` column names this screen.
- `prototypes/screens/demo/`, `prototypes/app/demo/page.tsx` and `prototypes/kit/`: the shape every screen follows. The demo predates `components/ui/`, so don't copy its hand-styled buttons.
- `prototypes/fixtures/`, to reuse data builders.

Steps:

1. **Pin the inputs.** Ask with AskUserQuestion only for what's missing, with one option marked recommended:
   - Screen name, exactly as in a journey's `Screen` column. If no journey has it, stop and say so: the journey comes first.
   - URL, the same one production will use. Suggest one that fits the existing routes.
   - New screen, or a change to a shipped one. A shipped screen's route in `prototypes/app/` renders a View from `@/`.
   - Variants: 1 by default, up to 3 when the layout is still open.
2. **Folder.** Create `prototypes/screens/<screen>/`, named in kebab-case. For a shipped screen, copy its production View there as the fork and keep its `scenarios.ts`. If your change keeps the View's props as they are, also keep the production View as variant `a`, named "Current". The ProtoBar's arrows then switch between today's screen and your change, with the same data.
3. **Fixtures.** Reuse builders from `fixtures/`. New ones follow `fixtures/accounts.ts`: typed, the same output every time, realistic Pakistani data, and one long name to test wrapping.
4. **Scenarios.** In `scenarios.ts`, export the View's props type and the scenarios, `satisfies Scenarios<Props>`. Loading and error are props too. Each state follows the States rules in `docs/ui-ux-rules.md`. `default` is a typical user's data. `many` has enough rows to test scrolling, wrapping and large totals. Write open questions in the header comment.
5. **Variants.** One file per variant in `variants/`, keyed `a`, `b`, `c` in `variants.ts`.
   - They differ in layout or hierarchy, not just color or spacing.
   - Use primitives from `@/components/ui` and the design tokens.
   - Missing primitive: run `pnpm exec shadcn add <name> --dry-run`. If it adds a package, name it with its version and wait for a yes. Then add it to production and use it.
   - Run actions in memory through `useProtoAction`, so `?latency=slow` shows the pending state.
6. **Route.** Add `prototypes/app/<url>/page.tsx`, shaped like the demo page. Add the screen to `screenRoutes` in `prototypes/screens.ts`, keyed by its exact journey name, so the index links it.
7. **Screenshots.**
   - If http://localhost:3001 doesn't answer, start `pnpm proto` in the background.
   - If `pnpm proto` says another server is already running, stop and ask the user. Never kill their server.
   - Run `node prototypes/kit/screenshots.mts <url> --variants a,b`. It shoots every scenario of each variant at 320, 375, 768, 1280 and 1920 px. It lists sideways scroll, console errors, failed loads and unknown keys.
   - If the script says Chromium is missing, run `pnpm exec playwright install chromium`.
   - Fix everything it lists.
   - Look at every shot at 320 and 1280 px, and at `default` at the other widths. Fix anything that breaks the UI/UX rules, then run the script again.
8. **Check.** Run `pnpm proto:check`. If step 5 added to production, run `pnpm check` too.
9. **Report:**
   - a link for each variant and scenario, like `http://localhost:3001/accounts/new?variant=a&scenario=empty`
   - the open questions
   - the files changed, and each check with its result.

Don't commit, and don't delete variants: the user picks one after trying them.
