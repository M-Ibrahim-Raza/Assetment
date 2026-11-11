"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";

/** Where the browser keeps the theme choice. The same naming as the sidebar's saved choice. */
const THEME_KEY = "assetment:theme";

/**
 * Puts the `dark` class on `<html>` for the dark look. Auto ("system") follows the device until the
 * user picks Light or Dark in the profile panel, and the browser remembers the pick. An inline
 * script applies it before the first paint, so a dark reload never flashes light.
 */
export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="system"
      enableSystem
      disableTransitionOnChange
      storageKey={THEME_KEY}
      // The script runs from the server's HTML. React warns when a client render makes a <script>,
      // so the client's copy is text/plain, which the browser never runs.
      scriptProps={{
        type: typeof window === "undefined" ? "text/javascript" : "text/plain",
      }}
    >
      {children}
    </NextThemesProvider>
  );
}
