/**
 * Notes people wrote on a category's month, to say why it was big. Keyed by category, then by
 * month ("2026-03"). They sit on the spikes in `category-history.ts`. The same every time.
 */
export function categoryNotes(): Readonly<
  Record<string, Readonly<Record<string, string>>>
> {
  return {
    Groceries: { "2026-03": "Ramadan, then Eid: guests most evenings" },
    "Gifts and shaadi season": { "2025-12": "Bilal's and Sana's weddings" },
    Travel: { "2026-08": "Nathia Gali with the kids" },
    "Charity and zakat": { "2026-03": "Zakat, paid in Ramadan" },
  };
}

/** One category's notes, by month. None for a category without any. */
export function notesFor(category: string): Readonly<Record<string, string>> {
  return categoryNotes()[category] ?? {};
}
