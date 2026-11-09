---
name: new-journey
description: Creates a new user journey file in docs/journeys/ from a rough idea, following the journey rules in docs/README.md, and links it from the journeys index and product.md. Use when the user wants to add, draft or define a new journey, user flow or main task in the app, even if they don't say "journey". Not for editing an existing journey.
argument-hint: [journey idea]
---

# New journey

Turn the user's idea (`$ARGUMENTS`, if given) into a new journey. If there's no idea yet, ask what task the user comes to the app to do.

Read first:

- The `## journeys/` section of `docs/README.md`. Every rule there applies.
- `docs/product.md`: personas and non-goals.
- All files in `docs/journeys/`: IDs, steps and screen names in use.

Steps:

1. **Check scope.** Stop and say why if the idea is a non-goal, repeats an existing journey, or needs a persona `product.md` doesn't have. Those are product decisions for the user.
2. **Fill gaps.** Ask with AskUserQuestion for a missing goal or step, with one option marked recommended. Don't guess: features and specs are built from the journey.
3. **Draft the file.**
   - ID: one above the highest `J` number in `docs/journeys/` or its git history. IDs are never reused.
   - Short name: 2–4 kebab-case words.
   - One row per user action, in order. Reuse an existing screen name when it's the same screen, so screens map cleanly to the prototype.
4. **Show the draft.** Write nothing until the user says yes.
5. **Write:**
   - `docs/journeys/<ID>-<short-name>.md`
   - its line in `docs/journeys/README.md`
   - its line in the Core journeys list of `docs/product.md`
6. **Check** `wc -l` is under 20, then list the files changed.
