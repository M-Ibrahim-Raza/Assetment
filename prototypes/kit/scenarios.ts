import type { ComponentType } from "react";

/** Named states of one screen, as View props. `default` is required. Others: `empty`, `loading`, `error`, `many`, … */
export type Scenarios<Props> = Readonly<
  { default: Props } & Record<string, Props>
>;

export interface Variant<Props> {
  /** Short name shown in the ProtoBar, e.g. "Cards by type". */
  name: string;
  View: ComponentType<Props>;
}

/** Up to 3 structurally different versions of one screen, keyed `a`, `b`, `c`. */
export type Variants<Props> = Readonly<Record<string, Variant<Props>>>;

/** The entry named in the URL, else `default`, else the first one. */
export function pick<T>(
  entries: Readonly<Record<string, T>>,
  wanted: string | string[] | undefined,
): { key: string; value: T } {
  const list = Object.entries(entries);
  const found =
    list.find(([key]) => key === wanted) ??
    list.find(([key]) => key === "default") ??
    list[0];
  if (found === undefined) {
    throw new Error(
      "A prototype screen needs at least one variant and one scenario.",
    );
  }
  const [key, value] = found;
  return { key, value };
}
