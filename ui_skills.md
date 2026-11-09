# UI prototype skills: findings

Notes for writing the prototype skills later. Nothing here is built yet. The decisions behind it are in ADRs [0006](docs/adr/0006-living-ui-prototype.md), [0007](docs/adr/0007-screen-page-and-view.md) and [0008](docs/adr/0008-vendored-shadcn-skips-gates.md), and the `## Prototype` section of `CLAUDE.md`.

## How the prototype works

- `prototypes/` is a separate Next.js app on port 3001 (`pnpm proto`), with the same URLs as production.
- One folder per screen in `screens/<screen>/`. Names match the `Screen` column in `docs/journeys/`.
- `app/` holds thin routes. `components/` holds prototype-only composites. `fixtures/` holds fake data. `kit/` holds ProtoBar, the scenario and variant hooks, the in-memory store and `delay()`.
- The index page at `/` lists J1–J5 from `docs/journeys/`, and each step links to its screen.
- A shipped screen renders its production View with scenario data. To change it, fork the View into `screens/<screen>/`, change it, build the change in production, then delete the fork.
- Checks: `pnpm proto:check` runs the type check and lint. Both also run in CI. No tests on prototype code.
- Docs: journeys stay in `docs/journeys/`. Handoff notes in `docs/features.md` list Screens (URLs), Decisions (chosen variant and why) and Edge cases. User stories go in `specs/<feature>/spec.md`.

## Proposed skills

Three skills, one per moment. Name them `prototype-*` so they don't clash with the global `prototype` skill.

### `/prototype-screen`: build or change a screen

**Description:** Build a new prototype screen, or fork a shipped one to change it, in `prototypes/`. Use when the user wants to prototype, mock up, design or change a screen or flow, or says "try a few designs".

**Inputs** (ask only what's missing):
- Screen name, from the journey's `Screen` column, and its URL.
- Journey step(s) it serves.
- New screen, or a change to a shipped one.
- Number of variants: 1 by default, up to 3 when the layout is still open.

**Steps:**
1. Read `docs/product.md`, the journey file(s), `prototypes/CLAUDE.md` and the UX checklist below.
2. Shipped screen: copy its production View into `screens/<screen>/` as the fork. New screen: create the folder.
3. Add data builders to `fixtures/`. Reuse existing ones first.
4. Write `scenarios.ts`: `default`, `empty`, `loading`, `error`, `many`, plus `no-results`, `partial`, `offline` or `near-limit` where they apply. Put open questions in its header comment.
5. Build each variant from `@/components/ui`. Variants must differ in layout or hierarchy, not just color. If a primitive is missing, stop and add it to production with the shadcn CLI first (ask before any new package).
6. Add the route in `app/` at the production URL, and map the screen in `screens.ts` so the index links it.
7. Open every scenario and variant in the browser at 320, 375, 768, 1280 and 1920 px. Fix anything that breaks the UX checklist.
8. Run `pnpm proto:check`.

**Output:** the URL for each variant and scenario, and the open questions.

### `/prototype-freeze`: pick a variant and record it

**Description:** Lock a prototype screen once a variant is chosen, and record it in the docs. Use when the user picks a variant, says a screen is done, or wants to hand screens to `/sdd-specify`.

**Steps:**
1. Ask which variant won and why, in one line, if not given.
2. Delete the losing variants. The winner becomes `<screen>.tsx`.
3. Resolve the open questions in `scenarios.ts` with the user.
4. Fill the journey's `Features` column for the steps on this screen.
5. Add or update the rows in `docs/features.md` and each handoff note: What, Screens (URLs), Decisions, Edge cases.
6. Run `pnpm proto:check`.

### `/prototype-promote`: build it in production

**Description:** Build a frozen prototype screen in production and point the prototype at it. Use when implementing a feature whose screen is in `prototypes/`, usually from the SDD implement step.

**Steps:**
1. Read the spec, the handoff note and `screens/<screen>/`.
2. Tests first: turn each scenario into a component test of the View. Rebuild the data inside the test, never import from `prototypes/`.
3. Build the production View from the screen code. Copy what fits, then follow production rules.
4. Build the page or container that loads data and passes it to the View as props.
5. Point the prototype route at the production View. Its scenarios must `satisfies` the View's props type.
6. Delete the fork's component files and keep `scenarios.ts`.
7. Run `pnpm check` and `pnpm proto:check`, plus `pnpm test:e2e` if a user flow changed.

## Draft `prototypes/CLAUDE.md`

```markdown
# Prototype rules

`prototypes/` is the living UI prototype ([ADR 0006](../docs/adr/0006-living-ui-prototype.md)). Run it with `pnpm proto` (port 3001).

- One folder per screen in `screens/<screen>/`, named as in the journey's `Screen` column.
- Routes in `app/` use the same URLs as production. Keep pages thin.
- Shipped screens render the production View with scenario data. To change one, fork the View into `screens/` first ([ADR 0007](../docs/adr/0007-screen-page-and-view.md)).
- UI comes from `@/components/ui`. Add a missing primitive to production with the shadcn CLI first. Prototype-only composites go in `components/`.
- Use the design tokens. No hardcoded colors or spacing.
- Every screen exports scenarios: `default`, `empty`, `loading`, `error`, `many`, plus `no-results`, `partial`, `offline` or `near-limit` where they apply.
- Data comes from `fixtures/`: realistic Pakistani data (PKR, JazzCash, Easypaisa, PSX tickers, gold in tola, committees). No real APIs, env vars or auth.
- Variants: at most 3, structurally different, via `?variant=`. Delete the losers once one is chosen.
- Open questions go in the header comment of `scenarios.ts`.
- Check every scenario against the UX checklist at 320, 375, 768, 1280 and 1920 px.
- Before saying a task is done, run `pnpm proto:check`.
```

## UX checklist

Distilled from the team's Engineering Handbook (`ui-ux.md`, researched 2026-11-09). The handbook isn't in this repo, so the skills must carry these rules themselves.

**Layout and features**
- One primary action per screen, styled as the only primary button in view.
- Rare actions sit one step away (overflow menu, settings), but every feature stays reachable from a visible place.
- At most 2 levels of disclosure. Never hide what the user needs to decide (amounts, consequences, required fields).
- Give fields a default when one value fits most users.
- Put actions next to the item they act on.

**States**
- Loading: a skeleton shaped like the content. On refresh, keep the current content visible.
- Empty, first use: what this area is for, plus a button to create the first item.
- No results: show the query or filters that caused it, plus "Clear filters". Never the first-use message.
- Error: what happened in plain words, plus Retry. Keep the user's input.
- Also, where they apply: partial, offline, no access, success with a next step, near a limit.
- Never show an empty state while data is loading.

**Feedback**
- Visible feedback within 100 ms of every action. A progress indicator for anything over 1 s. Percent or steps, plus Cancel, for anything over 10 s.
- Reversible actions: do it at once, with an Undo toast. Confirm only irreversible ones, naming the object and the consequence, with a button that repeats the verb ("Delete 3 accounts").
- A toast with an action stays at least 10 s. A toast is never the only place for an error.

**Forms**
- Labels above fields. Never use a placeholder as the label.
- Errors as text next to the field. Never while the user is still typing in it for the first time.
- Keep everything the user typed after a failed submit.
- Set the right `type`, `inputmode` and `autocomplete`. Always allow paste.

**Navigation**
- Tab, filters, sort, search, page and the selected item live in the URL.
- Mark the current nav item with `aria-current="page"`.

**Responsive and accessibility**
- Works at 320 px wide and at 200% zoom, with no horizontal page scroll.
- Nothing is reachable only by hover, drag or a tooltip.
- Every overlay closes with Esc and a visible close button.
- Meets WCAG 2.2 AA.

**Words**
- Use the user's words, not code or database names.
- The same action has the same label, icon and position everywhere.

## Agent tools

- **shadcn skill** (`pnpm dlx skills add shadcn/ui`): gives agents current shadcn APIs and registry workflows, so they don't invent components. It adds external files to the repo, so ask first.
- **shadcn MCP** (`pnpm dlx shadcn@latest mcp init --client claude`): lets agents search the registry and get the right install commands. It writes `.mcp.json`.
- **Browser self-check:** Claude's built-in browser, or Playwright (already installed), to open each scenario at the five widths.
- **Global `prototype` skill** (`~/.agents/skills/prototype`): its variant switcher (floating bar, `?variant=`, arrow keys) matches ours and can be reused. Its "delete when done" rule doesn't apply here, so the project skills must take priority.

## SDD hooks

- `/sdd-specify` already reads the screen code (step 4 in `CLAUDE.md`).
- The SDD implement step should call `/prototype-promote` for each screen in the feature.

## Sources

- [Field study: prototypes over mockups (Dust, UX Collective)](https://uxdesign.cc/field-study-prototypes-over-mockups-8581f20102ff)
- [Figma prototype vs code prototype (Eleken, 2026-10)](https://www.eleken.co/blog-posts/figma-prototype-vs-code-prototype)
- [When to prototype in code instead of Figma (tcules, 2026-10-18)](https://www.tcules.com/insights/when-to-prototype-in-code-instead-of-figma)
- [shadcn CLI v4 changelog (2026-03)](https://ui.shadcn.com/docs/changelog/2026-03-cli-v4)
- [shadcn skills](https://ui.shadcn.com/docs/skills.md)
