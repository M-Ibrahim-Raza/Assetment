---
name: prototype-finalize
description: Finalizes a prototype screen once the user picks a variant - deletes the losing variants, resolves the open questions, and records the screen's features in docs/features.md, their handoff notes in specs/<feature>/handoff.md, and the feature IDs in its journeys. Use when the user picks a variant, says a screen is done or final, or wants to hand screens to /sdd-specify. Not for building or changing a screen.
argument-hint: [screen] [winning variant]
---

# Finalize a prototype screen

Finalize the screen in `$ARGUMENTS`. If it's empty, ask which screen.

Read first:

- The `## journeys/` and `## features.md` sections of `docs/README.md`. Every rule there applies.
- `prototypes/CLAUDE.md`.
- Everything in `prototypes/screens/<screen>/`.
- `docs/features.md`, and each journey whose `Screen` column names this screen.

Steps:

1. **Winner.** Ask which variant won and why, in one line, if not given. If the user wants a mix of variants, build it with `/prototype-screen` first.
2. **Open questions.** Ask each one in the header of `scenarios.ts` with AskUserQuestion, with one option marked recommended. If an answer changes the screen, stop and change it with `/prototype-screen` first.
3. **Draft the docs.**
   - Features: one row for each thing the screen lets the user do. Reuse a row that already covers it. A new ID is one above the highest in `docs/features.md` or its git history. Suggest Priority and Depends on.
   - Handoff note for each Must feature, in `specs/<feature>/handoff.md`. Link the feature's row to that folder. Screens lists every URL that uses the feature. Decisions names the winner and why. Edge cases come from the scenarios and the answers in step 2.
   - Journeys: the feature IDs in the `Features` column of each step on this screen.
4. **Show the draft** and wait for a yes. Status is `approved` for the features the user agrees to, and `open` for the ones they want to decide later.
5. **Clean up the screen.**
   - Delete the losing variants. Move the winner to `screens/<screen>/<screen>.tsx`, and keep only it in `variants.ts`.
   - If a shipped screen's "Current" variant won, delete the fork instead, so the route shows the production View again.
   - In `scenarios.ts`, replace the open questions with "None."
6. **Write** the docs, run `pnpm proto:check`, and list the files changed.

Don't commit. Building the screen in production starts from `/sdd-specify`.
