import type { Variants } from "@proto/kit/scenarios";
import type { EntriesViewProps } from "./scenarios";
import { LedgerView } from "./variants/a-ledger";
import { MonthsView } from "./variants/b-months";
import { AskView } from "./variants/c-ask";

// Three structurally different Entries screens. Each is also Entry detail, with one entry open.
export const variants = {
  a: { name: "Ledger", View: LedgerView },
  b: { name: "Months", View: MonthsView },
  c: { name: "Ask", View: AskView },
} satisfies Variants<EntriesViewProps>;
