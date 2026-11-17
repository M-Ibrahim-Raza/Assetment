"use client";

import { type ReactNode, useLayoutEffect, useSyncExternalStore } from "react";
import {
  DEFAULT_PALETTE,
  isPalette,
  PALETTE_KEY,
  PALETTES,
  type Palette,
} from "./palettes";

/** Tells this tab about a change. The `storage` event only reaches other tabs. */
const CHANGE_EVENT = "assetment:palette-change";

/** Runs while the page is parsed, before the first paint, so a reload in Plum never flashes Green. */
const SCRIPT = `(function(){try{var p=localStorage.getItem(${JSON.stringify(PALETTE_KEY)});if(${JSON.stringify(PALETTES.map(({ value }) => value))}.indexOf(p)>-1)document.documentElement.dataset.palette=p}catch(e){}})()`;

/** The pick, also kept in memory for when the browser blocks storage. */
let current: Palette | undefined;

function stored(): Palette {
  try {
    const value = localStorage.getItem(PALETTE_KEY);
    return isPalette(value) ? value : DEFAULT_PALETTE;
  } catch {
    return DEFAULT_PALETTE;
  }
}

function read(): Palette {
  current ??= stored();
  return current;
}

function apply(palette: Palette) {
  document.documentElement.dataset.palette = palette;
}

function subscribe(onChange: () => void) {
  // Another tab picked a colour: follow it.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== PALETTE_KEY) return;
    current = stored();
    apply(current);
    onChange();
  };
  window.addEventListener("storage", onStorage);
  window.addEventListener(CHANGE_EVENT, onChange);
  return () => {
    window.removeEventListener("storage", onStorage);
    window.removeEventListener(CHANGE_EVENT, onChange);
  };
}

function setPalette(palette: Palette) {
  current = palette;
  apply(palette);
  try {
    localStorage.setItem(PALETTE_KEY, palette);
  } catch {
    // Storage is blocked, so the pick lasts until the page reloads.
  }
  window.dispatchEvent(new Event(CHANGE_EVENT));
}

/**
 * Colours the phone's browser bar to match the page, in the current theme and mode. The bar needs
 * a plain colour, so the page colour is painted on a 1 px canvas and read back as rgb.
 */
function paintBrowserBar() {
  const context = document.createElement("canvas").getContext("2d");
  if (context === null) return;
  context.fillStyle = getComputedStyle(document.body).backgroundColor;
  context.fillRect(0, 0, 1, 1);
  const [red = 0, green = 0, blue = 0] = context.getImageData(0, 0, 1, 1).data;
  let meta = document.querySelector<HTMLMetaElement>(
    'meta[name="theme-color"]',
  );
  if (meta === null) {
    meta = document.createElement("meta");
    meta.name = "theme-color";
    document.head.append(meta);
  }
  meta.content = `rgb(${String(red)} ${String(green)} ${String(blue)})`;
}

/** The colour theme, and a setter that applies it at once and remembers it. */
export function usePalette(): readonly [Palette, (palette: Palette) => void] {
  const palette = useSyncExternalStore(subscribe, read, () => DEFAULT_PALETTE);
  return [palette, setPalette];
}

/**
 * Puts the colour theme on <html> as `data-palette`, which app/theme.css reads. next-themes
 * handles only one choice, light or dark, so the colour has its own script and store. It also
 * keeps the phone's browser bar in the page colour.
 */
export function PaletteProvider({ children }: { children: ReactNode }) {
  useLayoutEffect(() => {
    // In development, Strict Mode's remount clears attributes React doesn't manage on <html>, so
    // apply the pick again before paint. In production it is already there.
    apply(read());
    paintBrowserBar();
    // The mode (next-themes' class) and the colour both live on <html>: repaint after either.
    const observer = new MutationObserver(paintBrowserBar);
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class", "data-palette"],
    });
    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <>
      {/* React warns when a client render makes a <script>, so the client's copy is text/plain,
          which the browser never runs. */}
      <script
        type={typeof window === "undefined" ? "text/javascript" : "text/plain"}
        suppressHydrationWarning
        dangerouslySetInnerHTML={{ __html: SCRIPT }}
      />
      {children}
    </>
  );
}
