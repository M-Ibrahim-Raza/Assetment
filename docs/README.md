# docs/

What each file here is for and what goes in it.

| File | What it is |
|---|---|
| `product.md` | One page on what the app is, who it's for and why |
| `journeys/` | One file per main task users do, step by step, with the screen and features for each step |
| `features.md` | Feature list, handoff notes, progress board |
| `tech-stack.md` | Every tool, with its version, purpose, reason, alternatives and notes. Tool choices live here, not in ADRs |
| `code-quality-stack.md` | The code quality tools picked for this app, their setup and where each check runs |
| `code-quality-rules.md` | Code quality rules every AI agent follows. `CLAUDE.md` imports it |
| `git-rules.md` | Git rules every person and AI agent follows. `CLAUDE.md` imports it |
| `ui-ux-rules.md` | UI/UX rules every person and AI agent follows, grouped by topic. `CLAUDE.md` imports it |
| `adr/` | Important decisions: architecture and how we work. One file each, with reasons and trade-offs |

Order: `product.md` → `journeys/` → the prototype in `prototypes/` → `features.md` → `specs/<feature>/spec.md`.

## product.md

No features or code. Specs link to it instead of repeating it.

- **Problem:** what's painful today, who has it, and what they did the last time it happened.
- **Personas (1–2):** one type of user each: who they are, what they're trying to do, how they do it today, what frustrates them.
- **Goal and success metric:** what v1 must achieve, plus one measurable number that shows it works.
- **Appetite:** time budget for v1. Scope is cut to fit it.
- **Core journeys:** one line per journey (`J1 – <name>`), linking to its file in `journeys/`. No steps here.
- **Non-goals:** what v1 deliberately won't do.

## journeys/

The main tasks a user comes to the app to do. One file per journey, plus a `README.md` that lists them all. Create a journey with `/new-journey`.

- **File name:** `<ID>-<short-name>.md`, e.g. `J1-set-up-net-worth.md`. IDs are `J1`, `J2`, … Never reused.
- **Length:** each journey file is under 20 lines, as `wc -l` counts them.
- **Heading:** `# J1 – <name>`.
- **Persona and goal:** who does it and what they get done.
- **Steps table** with columns `#`, `Step`, `Screen`, `Features`. Steps are in order. Each step needs a screen in the prototype. `Features` lists the feature IDs that make the step work, filled in while building the prototype.
- **`README.md`:** one line per journey, linking to its file. Add the line with each new journey.

## features.md

**Feature table**, one row per feature:

| Column | Meaning |
|---|---|
| ID | `F01`, `F02`, … Never reused. |
| Feature | Short name. Links to `specs/<folder>` once specified. |
| Journey | Journey ID, linked to its file in `journeys/`, e.g. `[J1](journeys/J1-set-up-net-worth.md)`. |
| Priority | Must / Should / Could / Won't (v1). |
| Depends on | IDs that must be built first. |
| Status | Phase 1: `open` → `approved` or `rejected`. Build: `specified` → `planned` → `tasked` → `implemented` → `reviewed` → `documented` → `done`. `done` means the feature is complete, with nothing left to do. `on hold` can be set at any stage: paused on purpose, resumed later from the same stage. |
| Docs | Link to the feature's doc in `docs/`, added once it's written (`/update-app-docs`). |

**Handoff note**, one per Must feature, written at freeze. `/sdd-specify` starts from it.

- **What:** what it does, in 2–3 lines.
- **Screens:** prototype screen(s) it covers, with their URLs, e.g. `/dashboard`.
- **Decisions:** the chosen variant and why, in one line.
- **Edge cases:** odd situations noticed while clicking.

## tech-stack.md

One table per `## <Domain>` heading, one row per tool. Name headings by the need (e.g. `## Styling`), not the tool.

- **Columns:** Tool, Version, Purpose, Why, Alternatives considered, and an optional Notes column. Write `-` when there's nothing to say.
- **Alternatives considered:** a few words on why each one lost, e.g. `Drizzle (not 1.0 yet)`.
- **Notes:** what to watch or do later: pins, limits, upgrade plans, when to revisit. About 15 words at most.
- **Versions:** exact, from `pnpm-lock.yaml`. Mark it as a range when there's no locked version.
- **Which tools get a row:** tools in use, plus tools chosen or installed but not wired in yet. Their Purpose cell says which.
- Update it whenever a tool is added, removed or upgraded.

## code-quality-stack.md

This project's code quality decisions: tools and settings, scripts, CI jobs, GitHub settings. Update it whenever a tool or check changes.

## code-quality-rules.md

Short rules for AI agents writing code. `CLAUDE.md` imports it, so every agent loads it. Keep it short: details belong in `code-quality-stack.md`.

## git-rules.md

Branches, commits, pushing, PRs and merging. At most 30 lines, each under 20 words. GitHub settings stay in `code-quality-stack.md`.

## ui-ux-rules.md

UI/UX rules for every screen. A heading, one line of intro, then one `##` section per topic, such as Forms or Navigation. Each rule is one bullet on one line.

## adr/

Architecture Decision Records: one file per important decision. Record one with `/new-adr`.

Write an ADR only for a decision that:

- sets how the app is built: its architecture, or a pattern every feature follows (e.g. 0005, tRPC for client data),
- sets how we work: CI, reviews, repo settings,
- or changes a rule in another doc. Update that doc in the same change.

Picking a tool or service is not an ADR. Add it to `tech-stack.md`. When a tool comes with a big decision, the ADR records the decision and `tech-stack.md` records the tool. Git rules go in `git-rules.md`, not in an ADR.

- **Name:** `NNNN-short-title.md`, e.g. `0001-nextjs-only.md`. Numbers are never reused.
- **Length:** 200 words at most for the whole file, as `wc -w` counts them. Cut words, not sections.
- **Header:** `# NNNN. Title`, then one line with Status (`Accepted` or `Superseded by [NNNN](NNNN-short-title.md)`) and Date.
- **Sections:** bold labels, not headings. **Context** (why a decision is needed) and **Decision** (what we chose and why) are one short paragraph each. **Consequences** (good and bad results) is at most 5 bullets.
- **Decision only:** don't list the options compared or why they lost. Agents read ADRs as rules, and rejected options confuse them.
- **Changing a decision:** write a new ADR and mark the old one superseded. Never delete an accepted ADR or change its decision. Fixing its format or wording is fine.

Template:

```markdown
# NNNN. Title

**Status:** Accepted · **Date:** YYYY-MM-DD

**Context:** ...

**Decision:** ...

**Consequences:**
- ...
```
