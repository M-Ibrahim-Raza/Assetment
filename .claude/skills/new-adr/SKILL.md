---
name: new-adr
description: Records an architecture decision as an ADR in docs/adr/, following the ADR rules in docs/README.md, and supersedes the old ADR when a decision changes. Use when the user wants to record, write or log a decision, mentions an ADR, or changes or reverses a past decision, even if they don't say "ADR".
argument-hint: [decision]
---

# New ADR

Record the decision in `$ARGUMENTS`. If it's empty, ask what was decided.

Read first:

- The `## adr/` section of `docs/README.md`. Every rule there applies, including the template.
- Every file in `docs/adr/`, to spot overlaps and any ADR this one replaces.

Steps:

1. **Check it's ADR-worthy.** It must match one of the cases in the rules. 
2. **Fill gaps.** Ask with AskUserQuestion for what's missing: why decide now, what was chosen, and why. When you offer options, mark one as recommended. Don't invent reasons: an ADR is only worth keeping if its reasons are real. Don't write the options compared or why they lost into the ADR.
3. **Draft.**
   - Number: one above the highest in `docs/adr/`.
   - Title: 2–5 kebab-case words. Date: today.
   - Link related ADRs, like `[0001](0001-nextjs-only.md)`.
   - Over 200 words by `wc -w`: cut words, not sections.
4. **If it replaces an ADR:** set the old one's Status to `Superseded by [NNNN](NNNN-short-title.md)`. Don't change its decision. If the longer Status line pushes it over 200 words, trim wording only. Grep `docs/` and `CLAUDE.md` for the old number and file name, and add fixes for references that now point to the wrong decision.
5. **Show the draft** with every change and wait for a yes.
6. **Write**, check `wc -w` again, and list the files changed.
