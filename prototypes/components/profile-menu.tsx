"use client";

import {
  CircleUserRound,
  LogOut,
  Moon,
  Settings,
  Sun,
  SunMoon,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Separator } from "@/components/ui/separator";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";

const NOT_BUILT = "Not built yet";

// "system" is next-themes' name for following the device.
const THEMES = [
  { value: "system", label: "Auto", icon: SunMoon },
  { value: "light", label: "Light", icon: Sun },
  { value: "dark", label: "Dark", icon: Moon },
] as const;

/**
 * The profile button and the panel it opens: the theme choice, and stand-ins for Settings and Sign
 * out. Esc, a tap outside or × closes it, and focus goes back to the button.
 */
export function ProfileMenu() {
  const [open, setOpen] = useState(false);
  const { theme = "system", setTheme } = useTheme();
  const themeLabel = useId();

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            variant="ghost"
            size="icon-lg"
            aria-label="Profile and settings"
          >
            <CircleUserRound />
          </Button>
        }
      />
      <PopoverContent align="end" className="gap-4 p-4">
        <div className="flex items-center justify-between gap-2">
          <PopoverTitle className="font-semibold">
            Profile and settings
          </PopoverTitle>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-label="Close"
            onClick={() => {
              setOpen(false);
            }}
          >
            <X />
          </Button>
        </div>

        <div className="flex flex-col gap-2">
          <p id={themeLabel} className="font-medium">
            Theme
          </p>
          {/* One is always picked: pressing the picked one again leaves it on. */}
          <ToggleGroup
            aria-labelledby={themeLabel}
            variant="outline"
            size="lg"
            spacing={0}
            value={[theme]}
            onValueChange={(value) => {
              const next = value[0];
              if (next !== undefined) setTheme(next);
            }}
            className="w-full"
          >
            {THEMES.map(({ value, label, icon: Icon }) => (
              <ToggleGroupItem
                key={value}
                value={value}
                className="flex-1 aria-pressed:bg-foreground aria-pressed:text-background"
              >
                <Icon data-icon="inline-start" />
                {label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-muted-foreground">Auto follows your device.</p>
        </div>

        <Separator />

        <div className="-mx-2 flex flex-col">
          <Button
            variant="ghost"
            size="lg"
            aria-disabled="true"
            title={NOT_BUILT}
            className="justify-start"
          >
            <Settings data-icon="inline-start" />
            Settings
          </Button>
          <Button
            variant="ghost"
            size="lg"
            aria-disabled="true"
            title={NOT_BUILT}
            className="justify-start"
          >
            <LogOut data-icon="inline-start" />
            Sign out
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
