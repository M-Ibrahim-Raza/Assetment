---
name: prototype-spec
description: Reads a feature's finalized prototype screens and returns a screen brief for its spec - user actions, one state per scenario, inputs, data shown, test data, edge cases, and the gaps the prototype fakes. Read-only. Use when writing a spec with /sdd-specify, or when the user asks what a prototype screen does or what its spec needs. Not for building, changing or finalizing a screen.
argument-hint: [feature ID or screen name]
---

# Screen brief for a spec

Turn the prototype screens of `$ARGUMENTS` into input for `specs/<feature>/spec.md`. If it's empty, ask which feature. `/sdd-specify` drafts the spec from the brief. This skill writes nothing.

Read first:

- `prototypes/CLAUDE.md` and `docs/adr/0007-screen-page-and-view.md`: how screens, scenarios and Views fit together.
- The `## features.md` section of `docs/README.md`.
- `docs/features.md`, the feature's `specs/<feature>/handoff.md`, and its journey.

Steps:

1. **Find the screens.** Take the Screens in the feature's handoff note. With no note, take the journey steps whose `Features` column has the ID. Map each URL to its route in `prototypes/app/` and its folder in `prototypes/screens/`.
2. **Check it's finalized.** Stop and send the user to `/prototype-finalize` if a screen has no route, `variants.ts` has more than one variant, or the open questions in `scenarios.ts` aren't "None.".
3. **Read each screen:** `scenarios.ts`, the View and every component it renders, and the fixtures they use. If the route renders a production View from `@/`, read that View. If it renders a fork of one, compare the two and brief only what changes.
4. **Write the brief**, one `## <Screen> (<URL>)` section per screen, with these parts:

| Part           | What goes in it                                                                             | Feeds spec section                |
| -------------- | ------------------------------------------------------------------------------------------- | --------------------------------- |
| Actions        | Each thing the user can do, and what they see after it, including while it's pending        | User Stories, Acceptance Criteria |
| States         | One line per scenario: when it happens, what the user sees and can do                       | Acceptance Criteria               |
| Inputs         | Each field: label, required or not, default, allowed values, error text shown               | Acceptance Criteria               |
| URL state      | Tab, filter, sort, search, page or selected item kept in the URL                            | Acceptance Criteria               |
| Data shown     | Each value on screen, in domain words. Mark money and dates                                 | Data Models, API Design           |
| Test data      | Fixture values worth testing: typical, zero, negative, long names, large totals             | Test Cases                        |
| Edge cases     | From the handoff note, the scenarios and the View's branches                                | Edge Cases                        |
| Other features | Parts of the screen that belong to other feature IDs                                        | Non-Goals                         |
| Gaps           | What the prototype fakes or skips that the spec must decide, each with a recommended answer | Open Questions                    |

5. **Return** the brief in chat, then the spec folder and the number of gaps. Under `/sdd-specify`, the gaps become open questions.

Rules:

- Behavior, not looks: what the user does and sees, in the screen's own words. No layout, colors or component names. The spec links the screen folder for those.
- Cite where each item comes from, e.g. `scenarios.ts: empty` or `add-account.tsx:42`, so it can be checked. The spec doesn't copy these citations.
- Only what the prototype shows. Saving, server errors, validation rules, sums, currency conversion and limits that it fakes go under Gaps. Never fill a gap with a guess.
- Gaps also list where the handoff note, the journey and the screen disagree.
- Don't restate `docs/ui-ux-rules.md`: it covers every screen. Note only the choices it leaves to the screen, like which action is primary or which one gets Undo.
- No how: no tRPC procedures, tables or file plans. That's `/sdd-plan`.
- Change no files. This runs inside the plan mode of `/sdd-specify`.
