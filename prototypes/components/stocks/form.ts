import type { Ref } from "react";
import type { Holding, StockPrices } from "@proto/fixtures/stocks";
import type { HoldingGroup } from "./holding";

// The stocks and funds form's contract. Setup uses it now. Add trade and Portfolio may use the same
// form later, so it knows nothing about the screen around it.

/** A holding whose save failed, or is still saving. The form opens on it, filled in. */
export interface HoldingDraft {
  holding: Holding;
  status: "failed" | "saving";
}

export interface StocksFormProps {
  /** Which kind it adds: shares and ETFs, or mutual funds. Each has its own step, as banks and wallets do. */
  group: HoldingGroup;
  /** The heading, e.g. "Your shares and ETFs". */
  title: string;
  /** One line under the heading, saying what counts. */
  help: string;
  /** This kind's holdings only. */
  holdings: readonly Holding[];
  prices: StockPrices;
  /** Adds the holding, or changes the one with its id. */
  onSave: (holding: Holding) => void;
  onRemove: (holding: Holding) => void;
  draft: HoldingDraft | null;
  /** What was typed in the search when the form opened. Empty for a fresh search. */
  search: string;
  heading: Ref<HTMLHeadingElement>;
  /** The way on once something is added, e.g. "Next: Credit cards". */
  done: { label: string; onDone: () => void };
  /** A way past while nothing is added, e.g. "Skip for now". */
  skip: { label: string; onSkip: () => void } | null;
}
