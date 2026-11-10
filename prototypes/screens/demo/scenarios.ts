// Demo screen: the shape every prototype screen follows. Not a real screen.
//
// Open questions (write them here while exploring, resolve them in /prototype-finalize):
// - None.

import { accounts, type Account } from "@proto/fixtures/accounts";
import type { Scenarios } from "@proto/kit/scenarios";

/** The View's props. Loading and error are states the View shows, so they are props too. */
export type DemoViewProps =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; accounts: readonly Account[] };

export const scenarios = {
  default: { status: "ready", accounts: accounts(5) },
  empty: { status: "ready", accounts: [] },
  many: { status: "ready", accounts: accounts(60) },
  loading: { status: "loading" },
  error: {
    status: "error",
    message:
      "We couldn't load your accounts. Check your connection and try again.",
  },
} satisfies Scenarios<DemoViewProps>;
