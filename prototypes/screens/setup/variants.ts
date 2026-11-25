import type { Variants } from "@proto/kit/scenarios";
import { DebtsA } from "./debts-variants";
import type { SetupViewProps } from "./scenarios";
import { SetupView } from "./setup";

// Finalized on 2026-11-11: "Tick what you have" (it was variant C) won over Build your number and
// One question at a time. It took A's named step bar and white card. Future changes go into this
// one View.
//
// F09's gold and silver form: "Add a piece" (it was variant d) won over Jeweller's slip, One at a
// time and Piece by piece. Their forms were deleted.
//
// F10's stocks and funds form: "Add a holding" (it was stocks-a) won over Copy from your broker app
// and Pick, then fill. Their forms were deleted.
//
// F11's property form: "Size × rate" (it was property-c) won over Add a property and Value first,
// then was reworked into an address-first form. The other forms were deleted.
//
// F12 and F20's debts and money lent forms: "Add a debt" (debts-a) won over Timeline and In a
// sentence, which were deleted (2026-11-22). It's still the same View with its forms swapped in, until
// it's finalized. `a` keeps the stand-ins.
export const variants = {
  a: { name: "Tick what you have", View: SetupView },
  "debts-a": { name: "Debts: Add a debt", View: DebtsA },
} satisfies Variants<SetupViewProps>;
