import type { Route } from "next";

/**
 * Journey screen name (the `Screen` column in docs/journeys/) → its prototype URL, the same as production.
 * Add a screen once its route exists. The index shows unlisted screens as "not built".
 */
// `Route` alone leaves out dynamic routes, so each one used here is named.
type ScreenRoute = Route | Route<"/spending/categories/groceries">;

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
  // One fixed page per screen name: every "Open <category>" on Spending lands on Groceries for now.
  "Category detail": "/spending/categories/groceries",
};
