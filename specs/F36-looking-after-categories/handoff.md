# F36 – Looking after categories

**What:** add, rename, hide, merge and delete spending categories, on the Categories pages, where their history is.

**Screens:** `/spending/categories`, with Add category and the "Hidden · 2" row (`?scenario=hidden`). A category's page, such as `/spending/categories/groceries`, has a ⋯ menu with Rename, Hide, Merge into… and Delete.

**Decisions:** looked after on these pages, not in settings: a category is changed where its months and entries are.

**Edge cases:**

- Rename, Hide, and deleting a category with no entries happen at once, with Undo.
- Merge moves every entry into another category and is confirmed: "Move 42 entries to Eating out", with "Merge into Eating out".
- A category with entries can't be deleted: its Delete leads to Merge.
- A hidden category is left out of the pickers when adding an entry and keeps its history. Its page says so, and it's listed in the Hidden row at the end of Every category.
- After a rename or a merge, the old address forwards to the new one. An address that no longer exists shows "not found", with a way back to Categories (`?scenario=not-found`).
- After Delete: "Pets is deleted", with See all categories, and Undo in the message.
- A category just added, with nothing spent: "Nothing spent on Pets yet", with Log an expense.
