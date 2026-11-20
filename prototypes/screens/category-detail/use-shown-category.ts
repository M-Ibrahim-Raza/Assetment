"use client";

import { useState } from "react";
import type { BookState } from "@proto/screens/categories/manage";

/**
 * The category a page shows, following a rename, its Undo and a merge, and knowing when it was
 * deleted. `state` wraps the book's so a rename is followed. `shown` is undefined once the
 * category is gone: merged away from an old link, or deleted.
 */
export function useShownCategory(base: BookState, start: string) {
  // Every name this page has shown, newest last.
  const [names, setNames] = useState<readonly string[]>([start]);
  const [deleted, setDeleted] = useState<string | null>(null);
  const shown = names.findLast((name) => base.book.categories.includes(name));
  const state: BookState = {
    ...base,
    rename: (from, to) => {
      base.rename(from, to);
      setNames((now) => [...now, to]);
    },
  };
  return {
    shown,
    deleted,
    state,
    onMerged: (into: string) => {
      setNames((now) => [...now, into]);
    },
    onDeleted: () => {
      if (shown !== undefined) setDeleted(shown);
    },
  };
}
