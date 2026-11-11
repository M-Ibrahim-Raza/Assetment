import { useSyncExternalStore } from "react";

const KEY = "assetment:sidebar-collapsed";

// Until the user chooses, tablets (768 to 1023 px) start with the rail and desktops with the full sidebar.
const TABLET = "(max-width: 1023px)";

// Used when the browser blocks storage (private windows, previews): the choice then lasts until reload.
let memory: boolean | null = null;
const listeners = new Set<() => void>();

function byWidth(): boolean {
  return window.matchMedia(TABLET).matches;
}

function read(): boolean {
  try {
    const stored = localStorage.getItem(KEY);
    if (stored !== null) return stored === "1";
  } catch {
    // Storage is blocked: fall back to `memory`.
  }
  return memory ?? byWidth();
}

function write(collapsed: boolean): void {
  memory = collapsed;
  try {
    localStorage.setItem(KEY, collapsed ? "1" : "0");
  } catch {
    // Storage is blocked, so `memory` carries the choice.
  }
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  // Another tab changed it, or the window crossed the tablet width before any choice was made.
  window.addEventListener("storage", listener);
  const media = window.matchMedia(TABLET);
  media.addEventListener("change", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
    media.removeEventListener("change", listener);
  };
}

/**
 * Whether the sidebar is collapsed to its icon rail, and a setter. The user's choice is kept in
 * this browser, so it survives a reload. Before any choice, it follows the window width. The
 * server renders it expanded.
 */
export function useSidebarCollapsed(): readonly [
  boolean,
  (collapsed: boolean) => void,
] {
  const collapsed = useSyncExternalStore(subscribe, read, () => false);
  return [collapsed, write];
}
