# Prototype rules

`prototypes/` is the living UI prototype ([ADR 0006](../docs/adr/0006-living-ui-prototype.md)). Run it with `pnpm proto` (port 3001). Build or change a screen with `/prototype-screen`. Finalize it with `/prototype-finalize` once a variant is picked. `/sdd-specify` reads it with `/prototype-spec`.

- One folder per screen in `screens/<screen>/`, named as in the journey's `Screen` column.
- Routes in `app/` use the same URLs as production. Keep pages thin.
- Shipped screens render the production View with scenario data. To change one, fork the View into `screens/` first ([ADR 0007](../docs/adr/0007-screen-page-and-view.md)).
- UI comes from `@/components/ui`. Add a missing primitive to production with the shadcn CLI first. Prototype-only composites go in `components/`.
- Use the design tokens. No hardcoded colors or spacing.
- Every screen exports scenarios: `default`, `empty`, `loading`, `error`, `many`, plus `no-results`, `partial`, `offline` or `near-limit` where they apply.
- Data comes from `fixtures/`: realistic Pakistani data (PKR, JazzCash, Easypaisa, PSX tickers, gold in tola, committees). No real APIs, env vars or auth.
- Variants: at most 3, structurally different, via `?variant=`. Delete the losers once one is chosen.
- Open questions go in the header comment of `scenarios.ts`.
- Check every scenario against the [UI/UX rules](../docs/ui-ux-rules.md) at 320, 375, 768, 1280 and 1920 px. `node prototypes/kit/screenshots.mts` takes the screenshots.
- Before saying a task is done, run `pnpm proto:check`.
