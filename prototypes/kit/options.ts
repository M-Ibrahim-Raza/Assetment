/**
 * A prototype-only switch in the ProtoBar, to try a design choice on and off with the same data.
 * It isn't part of the screen: once the choice is made, it is built in and the option goes.
 * Screens read it with `useProtoOption`. This file stays free of client-only code, so server pages
 * can pass options to the ProtoBar.
 */
export interface ProtoOption<Value extends string = string> {
  /** Kept in the URL as `opt-<key>`. */
  key: string;
  label: string;
  /** Two or more. An on/off option uses "on" and "off" and shows as a checkbox. */
  choices: readonly { value: Value; label: string }[];
  default: Value;
}

/** The URL param that holds an option. The ProtoBar keeps these when the variant or scenario changes. */
export function optionParam(key: string): string {
  return `opt-${key}`;
}

/** An option that is on or off. */
export function onOff(
  key: string,
  label: string,
  on = true,
): ProtoOption<"on" | "off"> {
  return {
    key,
    label,
    choices: [
      { value: "on", label: "On" },
      { value: "off", label: "Off" },
    ],
    default: on ? "on" : "off",
  };
}

/** True for an option made with `onOff`. */
export function isOnOff(option: ProtoOption): boolean {
  return (
    option.choices.length === 2 &&
    option.choices.every(({ value }) => value === "on" || value === "off")
  );
}
