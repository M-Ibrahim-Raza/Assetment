import type { Route } from "next";

/**
 * Journey screen name (the `Screen` column in docs/journeys/) → its prototype URL, the same as production.
 * Add a screen once its route exists. The index shows unlisted screens as "not built".
 */
// `Route` alone leaves out dynamic routes, so each one used here is named.
type ScreenRoute =
  Route | Route<"/spending/categories/groceries"> | Route<"/entries/e-1042">;

export const screenRoutes: Readonly<Partial<Record<string, ScreenRoute>>> = {
  Dashboard: "/dashboard",
  Setup: "/setup",
  "Quick add": "/add",
  "Sign up": "/sign-up",
  "Sign in": "/sign-in",
  "Forgot password": "/forgot-password",
  "Reset password": "/reset-password",
  Spending: "/spending",
  Categories: "/spending/categories",
  // One page per screen name, for the index. Each category's own link uses its own path.
  "Category detail": "/spending/categories/groceries",
  Entries: "/entries",
  // One page per screen name. Each row opens its own entry, /entries/<id>; this is the sample.
  "Entry detail": "/entries/e-1042",
};
