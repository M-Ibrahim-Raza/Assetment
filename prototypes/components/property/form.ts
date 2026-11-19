import type { Ref } from "react";
import type { Property } from "@proto/fixtures/property";

// The property form's contract. Setup uses it now. Quick add's "Add gold or property" and Portfolio
// may use the same form later, so it knows nothing about the screen around it.

/**
 * A property the form opens on, filled in: one whose save failed or is still saving, or a saved
 * one opened in place ("open"), for a scenario.
 */
export interface PropertyDraft {
  property: Property;
  status: "open" | "failed" | "saving";
}

export interface PropertyFormProps {
  /** The heading, e.g. "Your property". */
  title: string;
  /** One line under the heading, saying what counts. */
  help: string;
  properties: readonly Property[];
  /** This month, e.g. "2026-11": the month a typed value is from. */
  today: string;
  /** Adds the property, or changes the one with its id. */
  onSave: (property: Property) => void;
  onRemove: (property: Property) => void;
  draft: PropertyDraft | null;
  heading: Ref<HTMLHeadingElement>;
  /** The way on once something is added, e.g. "Next: Credit cards". */
  done: { label: string; onDone: () => void };
  /** A way past while nothing is added, e.g. "Skip for now". */
  skip: { label: string; onSkip: () => void } | null;
}
