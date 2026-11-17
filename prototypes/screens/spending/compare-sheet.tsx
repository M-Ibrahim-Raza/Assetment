"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { CHIP } from "@proto/screens/setup/look";
import { SHEET, SHEET_TITLE } from "./customize-sheet";
import type { MonthInfo } from "./math";

/**
 * Picks the month the whole screen compares with: every month that can be compared, newest year
 * first. A sheet from the bottom on phones, like Customize.
 */
export function CompareSheet({
  open,
  onOpenChange,
  shown,
  months,
  picked,
  onPick,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** The month on screen, to say what is compared. */
  shown: MonthInfo;
  /** The months to pick from, oldest first. */
  months: readonly MonthInfo[];
  /** The key of the month compared with now, if one was picked here. */
  picked: string | undefined;
  onPick: (key: string) => void;
}) {
  const years = [...new Set(months.map(({ year }) => year))].toReversed();
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={SHEET}>
        <DialogHeader className="pr-10">
          <DialogTitle className={SHEET_TITLE}>
            Compare with a month
          </DialogTitle>
          <DialogDescription className="text-base">
            {shown.name}&apos;s total, the chart and every category compare with
            the month you pick.
          </DialogDescription>
        </DialogHeader>
        <div className="-mx-1 flex flex-col gap-5 overflow-y-auto p-1">
          {years.map((year) => (
            <section key={year} className="flex flex-col gap-2">
              <h3 className="text-sm font-semibold text-muted-foreground">
                {year}
              </h3>
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
                {months
                  .filter((month) => month.year === year)
                  .map((month) => (
                    <Button
                      key={month.key}
                      variant="outline"
                      aria-pressed={month.key === picked}
                      aria-label={`${month.name} ${String(year)}`}
                      className={cn(CHIP, "h-11")}
                      onClick={() => {
                        onPick(month.key);
                        onOpenChange(false);
                      }}
                    >
                      {month.short}
                    </Button>
                  ))}
              </div>
            </section>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
