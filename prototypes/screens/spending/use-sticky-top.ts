"use client";

import { type RefObject, useEffect, useState } from "react";

// The gap between blocks, `gap-3`. The column keeps it from the window's top, or its bottom.
const GAP = 12;

/**
 * Where a sticky column stops. When it fits in the window, a gap below the window's top. When
 * it's taller, it scrolls with the page until its bottom shows, a gap above the window's bottom,
 * and stops there, so every part of it can be reached.
 */
export function useStickyTop(ref: RefObject<HTMLElement | null>): number {
  const [top, setTop] = useState(GAP);
  useEffect(() => {
    const column = ref.current;
    if (column === null) return;
    const update = () => {
      setTop(Math.min(GAP, window.innerHeight - column.offsetHeight - GAP));
    };
    // It reports the size once on observe, then on every change.
    const observer = new ResizeObserver(update);
    observer.observe(column);
    window.addEventListener("resize", update);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [ref]);
  return top;
}
