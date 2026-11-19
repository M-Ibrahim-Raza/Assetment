"use client";

import type { Ref } from "react";
import { AddHoldingForm } from "@proto/components/stocks/add-holding-form";
import type { HoldingDraft } from "@proto/components/stocks/form";
import {
  displayName,
  GROUP_OF,
  type HoldingGroup,
  inGroup,
  securityOf,
  valueOf,
} from "@proto/components/stocks/holding";
import { type Holding, stockPrices } from "@proto/fixtures/stocks";
import type { Setup, SetupItem } from "./scenarios";
import type { SetupState } from "./use-setup";

/** Shares and ETFs, and mutual funds, are ticked and added apart, as banks and wallets are. */
type StocksKind = "shares" | "funds";

const GROUP: Readonly<Record<StocksKind, HoldingGroup>> = {
  shares: "listed",
  funds: "funds",
};

// Each heading names the user's own, and its line names both ways in: each buy or the average for
// shares and funds alike.
const QUESTION: Readonly<Record<StocksKind, { title: string; help: string }>> =
  {
    shares: {
      title: "Your shares and ETFs",
      help: "Shares and ETFs on PSX. Add each buy, or just your average price, and we work out today's value.",
    },
    funds: {
      title: "Your mutual funds",
      help: "From any AMC. Add each buy, or just your units and average price, and we work out today's value.",
    },
  };

interface StocksStepProps {
  kind: StocksKind;
  state: SetupState;
  stocks: Setup["stocks"];
  /** A holding whose save failed or is saving. Null once it's saved. */
  draft: HoldingDraft | null;
  heading: Ref<HTMLHeadingElement>;
  /** "Next: Mutual funds", or "See my net worth" when it's the last step. */
  nextLabel: string;
  /** Called after a holding is saved, so a failed draft isn't shown again. */
  onSaved: () => void;
  onDone: () => void;
}

/** Setup's shares and ETFs, or its mutual funds: the stocks and funds form, fed from what setup holds. */
export function StocksStep({
  kind,
  state,
  stocks,
  draft,
  heading,
  nextLabel,
  onSaved,
  onDone,
}: StocksStepProps) {
  const { title, help } = QUESTION[kind];
  const group = GROUP[kind];
  const prices = stocks?.prices ?? stockPrices;
  const holdings = inGroup(
    state.items.flatMap((item) =>
      item.holding === undefined ? [] : [item.holding],
    ),
    group,
  );
  // A draft that didn't save, and a search typed before, open in their own kind's step.
  const toItem = (holding: Holding): SetupItem => ({
    id: holding.id,
    kind,
    name: displayName(securityOf(holding.symbol)),
    amount: valueOf(holding, prices),
    holding,
  });

  return (
    <AddHoldingForm
      group={group}
      title={title}
      help={help}
      holdings={holdings}
      prices={prices}
      onSave={(holding) => {
        state.saveItem(toItem(holding));
        onSaved();
      }}
      onRemove={(holding) => {
        const item = state.items.find((row) => row.id === holding.id);
        if (item !== undefined) state.removeItem(item);
      }}
      draft={
        draft !== null &&
        GROUP_OF[securityOf(draft.holding.symbol).kind] === group
          ? draft
          : null
      }
      search={group === "listed" ? (stocks?.search ?? "") : ""}
      heading={heading}
      done={{ label: nextLabel, onDone }}
      skip={{ label: "Skip for now", onSkip: onDone }}
    />
  );
}
