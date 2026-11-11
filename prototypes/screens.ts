import type { Route } from "next";

/**
 * Journey screen name (the `Screen` column in docs/journeys/) → its prototype URL, the same as production.
 * Add a screen once its route exists. The index shows unlisted screens as "not built".
 */
export const screenRoutes: Readonly<Partial<Record<string, Route>>> = {
  Dashboard: "/dashboard",
};
