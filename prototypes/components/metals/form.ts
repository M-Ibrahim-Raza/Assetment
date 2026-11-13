import type { ComponentType, Ref } from "react";
import type {
  Karat,
  Metal,
  MetalForm,
  MetalPiece,
  MetalRates,
} from "@proto/fixtures/metals";

// The gold and silver form's contract. Setup uses it now. Quick add's "Add asset" and Portfolio
// will use the same form later, so it knows nothing about the screen around it.

export interface MetalsFormProps {
  /** The heading, e.g. "Your gold and silver". */
  title: string;
  /** One line under the heading, saying what counts. */
  help: string;
  pieces: readonly MetalPiece[];
  rates: MetalRates;
  /** The user's buy-back deduction on jewellery, as a share: 0.1 is 10%. 0 is the full rate. */
  deduction: number;
  /** Adds the piece, or changes the one with its id. */
  onSave: (piece: MetalPiece) => void;
  onRemove: (piece: MetalPiece) => void;
  /** A piece whose save failed, or is still saving. The form opens on it, filled in. */
  draft: { piece: MetalPiece; status: "failed" | "saving" } | null;
  heading: Ref<HTMLHeadingElement>;
  /** The way on once something is added, e.g. "Next: Credit cards". */
  done: { label: string; onDone: () => void };
  /** A way past while nothing is added, e.g. "Skip for now". */
  skip: { label: string; onSkip: () => void } | null;
}

/** A gold and silver form: Setup holds it now, and Quick add and Portfolio will later. */
export type MetalsForm = ComponentType<MetalsFormProps>;

/** A common piece, as a one-tap name. Its weight is a typical one, for a guess. */
export interface PieceKind {
  name: string;
  metal: Metal;
  form: MetalForm;
  karat: Karat | null;
  /** A typical weight in tola, offered when the user doesn't know theirs. */
  about: number;
}

/** "Something else": a typed name, 21K jewellery until the user says otherwise. */
export const OTHER_KIND: PieceKind = {
  name: "",
  metal: "gold",
  form: "jewellery",
  karat: "21K",
  about: 1,
};

/** Typical weights, for someone who doesn't know theirs. Saved with ≈. */
export const TYPICAL_WEIGHTS: readonly { label: string; tola: number }[] = [
  { label: "Ring", tola: 0.5 },
  { label: "Earrings", tola: 0.5 },
  { label: "Chain", tola: 1 },
  { label: "Pair of bangles", tola: 2 },
  { label: "Necklace", tola: 3 },
  { label: "Bridal set", tola: 10 },
];
