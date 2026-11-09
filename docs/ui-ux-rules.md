# UI/UX Rules

Rules for people and AI agents who design, build or review a screen.

## Layout and features

- One primary action per screen, styled as the only primary button in view.
- Rare actions sit one step away (overflow menu, settings), but every feature stays reachable from a visible place.
- At most 2 levels of disclosure. Never hide what the user needs to decide (amounts, consequences, required fields).
- Put actions next to the item they act on.
- The same action has the same label, icon and position everywhere.

## States and feedback

- Build loading, empty, error and success states. Errors say what to do next.
- Visible feedback within 100 ms of every action. A progress indicator for anything over 1 s. Percent or steps, plus Cancel, for anything over 10 s.
- Reversible actions: do it at once, with an Undo toast. Confirm only irreversible ones, naming the object and the consequence, with a button that repeats the verb ("Delete 3 accounts").
- A toast with an action stays at least 10 s. A toast is never the only place for an error.

## Forms

- Labels above fields. Never use a placeholder as the label.
- Give fields a default when one value fits most users. Prefill date, account and category.
- Set the right `type`, `inputmode` and `autocomplete`, so amounts get the number keypad. Always allow paste.
- Errors as text next to the field. Never while the user is still typing in it for the first time.
- Keep everything the user typed after a failed submit.

## Navigation

- Tab, filters, sort, search, page and the selected item live in the URL, so Back and reload keep the view.
- Mark the current nav item with `aria-current="page"`.

## Money

- One PKR format everywhere, right-aligned digits, and + or − on gains and losses, not just color.

## Responsive and accessible

- Phone first: every screen works at 320 px wide and 200% zoom, with no sideways scroll.
- Meet WCAG 2.2 AA. Everything works by keyboard and touch. Nothing needs hover.
- Every overlay closes with Esc and a visible close button.
