"use client";

import {
  ChartPie,
  CircleUserRound,
  CreditCard,
  Eye,
  EyeOff,
  House,
  type LucideIcon,
  Plus,
  ReceiptText,
} from "lucide-react";
import { type ReactNode, use, useState } from "react";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { AmountsContext } from "./amounts";
import { DISPLAY } from "./display";
import { ScreenLink } from "./screen-link";

export type TabKey = "home" | "spending" | "portfolio" | "debts";

interface Tab {
  key: TabKey;
  label: string;
  /** The screen it opens, named as in the journeys' Screen column. */
  screen: string;
  icon: LucideIcon;
}

const HOME: Tab = {
  key: "home",
  label: "Home",
  screen: "Dashboard",
  icon: House,
};
const SPENDING: Tab = {
  key: "spending",
  label: "Spending",
  screen: "Spending",
  icon: ReceiptText,
};
const PORTFOLIO: Tab = {
  key: "portfolio",
  label: "Portfolio",
  screen: "Portfolio",
  icon: ChartPie,
};
const DEBTS: Tab = {
  key: "debts",
  label: "Debts",
  screen: "Debts",
  icon: CreditCard,
};
const TABS = [HOME, SPENDING, PORTFOLIO, DEBTS];

// Shown on controls whose screen isn't in the prototype yet. They look real, so the shell can be judged.
const NOT_BUILT = "Not built yet";

interface AppShellProps {
  /** The tab this screen belongs to. */
  current: TabKey;
  /** The screen's heading. */
  title: string;
  /**
   * Lets the screen run edge to edge. The shell then shows no header row, only a hidden heading,
   * and the screen places `ShellActions` itself.
   */
  bleed?: boolean;
  children: ReactNode;
}

/**
 * The frame around every signed-in screen: a bottom tab bar on phones, a sidebar from tablet width
 * up, and a header with the switch that hides amounts.
 */
export function AppShell({
  current,
  title,
  bleed = false,
  children,
}: AppShellProps) {
  const [amountsHidden, setAmountsHidden] = useState(false);
  const amounts = {
    hidden: amountsHidden,
    toggle: () => {
      setAmountsHidden((hidden) => !hidden);
    },
  };

  return (
    <AmountsContext value={amounts}>
      <div className="flex flex-1">
        {/* Focus rings inside the sidebar use its own ring colour, which is chosen to show on it. */}
        <aside className="sticky top-0 hidden h-svh w-56 shrink-0 flex-col gap-6 border-r border-sidebar-border bg-sidebar p-4 text-sidebar-foreground [--ring:var(--sidebar-ring)] md:flex">
          <p
            data-slot="brand"
            className={cn(DISPLAY, "px-3 text-lg font-semibold tracking-tight")}
          >
            Assetment
          </p>
          <Button
            size="lg"
            aria-disabled="true"
            title={NOT_BUILT}
            className="justify-start"
          >
            <Plus data-icon="inline-start" />
            Add
          </Button>
          <nav aria-label="Main" className="flex flex-col gap-1">
            {TABS.map((tab) => (
              <ScreenLink
                key={tab.key}
                screen={tab.screen}
                current={tab.key === current}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
                  tab.key === current
                    ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
                )}
              >
                <tab.icon aria-hidden="true" className="size-4 shrink-0" />
                {tab.label}
              </ScreenLink>
            ))}
          </nav>
        </aside>

        <div className="flex min-w-0 flex-1 flex-col">
          {bleed ? (
            <h1 className="sr-only">{title}</h1>
          ) : (
            <header className="mx-auto flex w-full max-w-5xl items-center justify-between gap-3 px-4 pt-4 pb-3 md:px-8 md:pt-6">
              <h1 className="text-xl font-semibold tracking-tight">{title}</h1>
              <ShellActions />
            </header>
          )}
          {/* The bottom padding keeps the last block clear of the tab bar, and of the ProtoBar on wide screens. */}
          <main
            className={cn(
              "flex-1 pb-28",
              !bleed && "mx-auto w-full max-w-5xl px-4 md:px-8",
            )}
          >
            {children}
          </main>
        </div>

        <nav
          aria-label="Main"
          className="fixed inset-x-0 bottom-0 z-40 grid h-16 grid-cols-5 border-t bg-card md:hidden"
        >
          <BarTab tab={HOME} current={current} />
          <BarTab tab={SPENDING} current={current} />
          <div className="flex justify-center">
            {/* Raised above the bar, so it reads as the one action among four places. */}
            <Button
              aria-label="Add"
              aria-disabled="true"
              title={NOT_BUILT}
              className="-mt-5 size-14 rounded-full shadow-md"
            >
              <Plus className="size-6" />
            </Button>
          </div>
          <BarTab tab={PORTFOLIO} current={current} />
          <BarTab tab={DEBTS} current={current} />
        </nav>

        {/* Inside the look, so toasts take its colours. Lifted above the tab bar on phones and the ProtoBar on wide screens. */}
        <Toaster
          position="bottom-center"
          offset={{ bottom: 88 }}
          mobileOffset={{ bottom: 88 }}
        />
      </div>
    </AmountsContext>
  );
}

/**
 * The switch that hides amounts, and the profile button. The shell's header shows them. A screen
 * that runs edge to edge places them itself.
 */
export function ShellActions() {
  const amounts = use(AmountsContext);
  return (
    <div className="flex items-center gap-1">
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Hide amounts"
        aria-pressed={amounts.hidden}
        onClick={amounts.toggle}
      >
        {amounts.hidden ? <EyeOff /> : <Eye />}
      </Button>
      <Button
        variant="ghost"
        size="icon-lg"
        aria-label="Profile and settings"
        aria-disabled="true"
        title={NOT_BUILT}
      >
        <CircleUserRound />
      </Button>
    </div>
  );
}

function BarTab({ tab, current }: { tab: Tab; current: TabKey }) {
  const active = tab.key === current;
  return (
    <ScreenLink
      screen={tab.screen}
      current={active}
      className={cn(
        "flex min-w-0 flex-col items-center justify-center gap-0.5 text-xs",
        active ? "font-semibold text-foreground" : "text-muted-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-7 w-12 items-center justify-center rounded-full",
          active && "bg-accent text-accent-foreground",
        )}
      >
        <tab.icon aria-hidden="true" className="size-5" />
      </span>
      <span className="max-w-full truncate">{tab.label}</span>
    </ScreenLink>
  );
}
