import { Check } from "lucide-react";
import { RadioGroupItem } from "@/components/ui/radio-group";
import type { Palette } from "./palettes";

/**
 * One colour theme in the profile panel's picker: a round swatch of its hero colour ringed by its
 * month-block colour, its name, and a tick when picked. The swatch takes the colours from
 * theme.css through `data-palette`, in the current light or dark. The radio itself is hidden, and
 * the whole label is the target. It must sit in a `RadioGroup`.
 */
export function PaletteSwatch({
  value,
  label,
}: {
  value: Palette;
  label: string;
}) {
  return (
    <label className="group/swatch flex min-w-0 cursor-pointer flex-col items-center gap-1 text-sm">
      {/* `absolute` and `size-px` replace the item's own `relative` and `size-4`, which beat sr-only. */}
      <RadioGroupItem value={value} className="sr-only absolute size-px" />
      <span
        aria-hidden="true"
        className="rounded-full border-2 border-transparent p-0.5 group-has-focus-visible/swatch:ring-3 group-has-focus-visible/swatch:ring-ring/50 group-has-data-checked/swatch:border-foreground"
      >
        <span
          data-palette={value}
          className="flex size-10 items-center justify-center rounded-full border-4 border-secondary bg-primary text-primary-foreground"
        >
          <Check className="hidden size-5 group-has-data-checked/swatch:block" />
        </span>
      </span>
      <span className="max-w-full truncate group-has-data-checked/swatch:font-semibold">
        {label}
      </span>
    </label>
  );
}
