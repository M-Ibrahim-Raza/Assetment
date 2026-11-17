"use client";

import { useSearchParams } from "next/navigation";
import { optionParam, type ProtoOption } from "./options";

/** The option's value from the URL, else its default. */
export function useProtoOption<Value extends string>(
  option: ProtoOption<Value>,
): Value {
  const wanted = useSearchParams().get(optionParam(option.key));
  return (
    option.choices.find(({ value }) => value === wanted)?.value ??
    option.default
  );
}
