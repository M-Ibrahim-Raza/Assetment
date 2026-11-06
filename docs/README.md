# docs/

What each file here is for and what goes in it.

| File | What it is |
|---|---|
| `product.md` | One page on what the app is, who it's for and why |
| `journeys.md` | The main tasks users do, step by step, with the screen and features for each step |
| `features.md` | Feature list, handoff notes, progress board |
| `prototype-screens/` | Screenshots of the chosen prototype screens |
| `tech-stack.md` | Every tool the app installs and uses, with its version, purpose and reason |
| `code-quality-stack.md` | The code quality tools picked for this app, their setup and where each check runs |
| `code-quality-rules.md` | Code quality rules every AI agent follows. `CLAUDE.md` imports it |
| `adr/` | Project decisions, one file each, with the reasons and trade-offs |

Order: `product.md` → `journeys.md` → `features.md` → `prototype-screens/` → `specs/<feature>/spec.md`.

## product.md

No features or code. Specs link to it instead of repeating it.

- **Problem:** what's painful today, who has it, and what they did the last time it happened.
- **Personas (1–2):** one type of user each: who they are, what they're trying to do, how they do it today, what frustrates them.
- **Goal and success metric:** what v1 must achieve, plus one measurable number that shows it works.
- **Appetite:** time budget for v1. Scope is cut to fit it.
- **Core journeys:** one line per journey (`J1 – <name>`), linking to `journeys.md`. No steps here.
- **Non-goals:** what v1 deliberately won't do.

## journeys.md

The 3–5 main tasks a user comes to the app to do. One section per journey:

- **Heading:** `J1 – <name>`. IDs are `J1`, `J2`, … Never reused.
- **Persona and goal:** who does it and what they get done.
- **Steps table** with columns `#`, `Step`, `Screen`, `Features`. Steps are in order. Each step needs a screen in the prototype. `Features` lists the feature IDs that make the step work, filled in while building the prototype.

## features.md

**Feature table**, one row per feature:

| Column | Meaning |
|---|---|
| ID | `F01`, `F02`, … Never reused. |
| Feature | Short name. Links to `specs/<folder>` once specified. |
| Journey | Journey ID from `journeys.md` (`J1`, `J2`, …). |
| Priority | Must / Should / Could / Won't (v1). |
| Depends on | IDs that must be built first. |
| Status | Phase 1: `open` → `approved` or `rejected`. Build: `specified` → `planned` → `tasked` → `implemented` → `reviewed` → `documented` → `done`. `done` means the feature is complete, with nothing left to do. `on hold` can be set at any stage: paused on purpose, resumed later from the same stage. |
| Docs | Link to the feature's doc in `docs/`, added once it's written (`/update-app-docs`). |

**Handoff note**, one per Must feature, written at freeze. `/sdd-specify` starts from it.

- **What:** what it does, in 2–3 lines.
- **Screens:** prototype screen(s) it covers, with screenshot file names.
- **Edge cases:** odd situations noticed while clicking.

## prototype-screens/

- One PNG per chosen screen, named `<ID>-<screen>.png`.
- Only the chosen variant, not the rejected ones.
- Taken at 1440×900.

## tech-stack.md

One table per `## <Domain>` heading, one row per tool. Name headings by the need (e.g. `## Styling`), not the tool.

- **Columns:** Tool, Version, Purpose, Why, Alternatives considered. Write `-` when there's no written reason or alternative.
- **Versions:** exact, from `pnpm-lock.yaml`. Mark it as a range when there's no locked version.
- **Only tools in use:** imported in code, or wired into config, scripts or CI. Installed but unused packages stay out.
- Update it whenever a tool is added, removed or upgraded.

## code-quality-stack.md

This project's code quality decisions: tools and settings, scripts, CI jobs, GitHub settings. Update it whenever a tool or check changes.

## code-quality-rules.md

Short rules for AI agents writing code. `CLAUDE.md` imports it, so every agent loads it. Keep it short: details belong in `code-quality-stack.md`.

## adr/

Architecture Decision Records: one file per project decision.

- **Name:** `NNNN-short-title.md`, e.g. `0001-nextjs-only.md`. Numbers are never reused.
- **Length:** under 15 lines, counting the title and blank lines. Cut words, not sections.
- **Header:** `# NNNN. Title`, then one line with Status (`Accepted` or `Superseded by NNNN`) and Date.
- **Sections:** bold labels, not headings. **Context** (why a decision is needed, and the options compared) and **Decision** (what we chose and why) are one short paragraph each. **Consequences** (good and bad results, rejected options, and any rule it overrides) is at most 5 bullets.
- **Changing a decision:** write a new ADR and mark the old one superseded. Never delete or rewrite an accepted ADR.

Template:

```markdown
# NNNN. Title

**Status:** Accepted · **Date:** YYYY-MM-DD

**Context:** ...

**Decision:** ...

**Consequences:**
- ...
```
