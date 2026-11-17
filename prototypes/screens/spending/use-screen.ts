"use client";

import { useSyncExternalStore } from "react";
import type { ScreenKind } from "./layout";

// Where the app swaps the tab bar for the sidebar: Tailwind's `md`, 48rem.
const WIDE = "(min-width: 48rem)";

function subscribe(onChange: () => void) {
  const query = window.matchMedia(WIDE);
  query.addEventListener("change", onChange);
  return () => {
    query.removeEventListener("change", onChange);
  };
}

/**
 * Which layout this screen shows: a phone's, under 48rem, or a tablet's and computer's. It follows
 * the window as it's resized or turned. The server, which can't know, renders the wider one.
 */
export function useScreen(): ScreenKind {
  return useSyncExternalStore(
    subscribe,
    () => (window.matchMedia(WIDE).matches ? "wide" : "phone"),
    () => "wide",
  );
}
