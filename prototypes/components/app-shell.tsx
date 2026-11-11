"use client";

import {
  ChartPie,
  ChevronLeft,
  ChevronRight,
  CreditCard,
  Eye,
  EyeOff,
  House,
  type LucideIcon,
  Plus,
  ReceiptText,
} from "lucide-react";
import Image from "next/image";
import {
  type ReactElement,
  type ReactNode,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { Button } from "@/components/ui/button";
import { Kbd } from "@/components/ui/kbd";
import { Toaster } from "@/components/ui/sonner";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";
import logoIcon from "@/logo/final/1-gold-light-text/assetment-gold-light-text-icon.svg";
import logo from "@/logo/final/1-gold-light-text/assetment-gold-light-text-logo.svg";
import { AmountsContext } from "./amounts";
import { ProfileMenu } from "./profile-menu";
import { ScreenLink } from "./screen-link";
import { useSidebarCollapsed } from "./use-sidebar-collapsed";

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

// Only from tablet width up: phones have no sidebar.
const HAS_SIDEBAR = "(min-width: 768px)";

const noSubscription = () => () => undefined;

/** "⌘B" on Apple devices, "Ctrl+B" elsewhere. The server, which can't tell, says "Ctrl+B". */
function useShortcutLabel(): string {
  return useSyncExternalStore(
    noSubscription,
    () => (/Mac|iPhone|iPad/.test(navigator.userAgent) ? "⌘B" : "Ctrl+B"),
    () => "Ctrl+B",
  );
}

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
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  const toggleLabel = collapsed ? "Expand sidebar" : "Collapse sidebar";
  const shortcut = useShortcutLabel();

  // Ctrl+B or ⌘B toggles the sidebar, as in most apps with one. It takes the key over from the browser.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() !== "b") return;
      if (!(event.metaKey || event.ctrlKey) || event.altKey || event.shiftKey) {
        return;
      }
      // In rich text, the same keys mean bold.
      if (
        event.target instanceof HTMLElement &&
        event.target.isContentEditable
      ) {
        return;
      }
      if (!window.matchMedia(HAS_SIDEBAR).matches) return;
      event.preventDefault();
      setCollapsed(!collapsed);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [collapsed, setCollapsed]);
  const amounts = {
    hidden: amountsHidden,
    toggle: () => {
      setAmountsHidden((hidden) => !hidden);
    },
  };

  return (
    <AmountsContext value={amounts}>
      <div className="flex flex-1">
        <TooltipProvider>
          {/* The sidebar and its edge handle. The handle sits outside the sidebar, which clips while its width animates. */}
          <div className="sticky top-0 z-20 hidden h-svh shrink-0 md:block">
            <SideTooltip
              label={
                <>
                  {toggleLabel} <Kbd>{shortcut}</Kbd>
                </>
              }
            >
              <Button
                variant="outline"
                size="icon-xs"
                aria-label={toggleLabel}
                aria-keyshortcuts="Control+B Meta+B"
                onClick={() => {
                  setCollapsed(!collapsed);
                }}
                // A 24 px circle on the edge. Its invisible hit area grows up, down and outward, never over the + on the rail.
                className="absolute top-5 -right-3 z-10 rounded-full bg-card shadow-sm before:absolute before:-inset-y-2 before:-right-2 before:left-0"
              >
                {collapsed ? <ChevronRight /> : <ChevronLeft />}
              </Button>
            </SideTooltip>
            {/* Focus rings inside the sidebar use its own ring colour, which is chosen to show on it. */}
            <aside
              className={cn(
                "flex h-full flex-col gap-6 overflow-hidden border-r border-sidebar-border bg-sidebar py-4 text-sidebar-foreground transition-[width] duration-200 ease-out [--ring:var(--sidebar-ring)] motion-reduce:transition-none",
                collapsed ? "w-20 items-center px-2" : "w-56 px-4",
              )}
            >
              {/* The sidebar is ink in both themes, so it takes the logo for dark backgrounds. The rail has room for the A only, at the same size. */}
              {collapsed ? (
                <Image
                  src={logoIcon}
                  alt="Assetment"
                  loading="eager"
                  className="size-10 shrink-0"
                />
              ) : (
                <Image
                  src={logo}
                  alt="Assetment"
                  loading="eager"
                  className="ml-3 h-7 w-auto self-start"
                />
              )}
              {collapsed ? (
                <SideTooltip label={`Add · ${NOT_BUILT.toLowerCase()}`}>
                  <Button
                    size="icon-lg"
                    aria-label="Add"
                    aria-disabled="true"
                    className="rounded-full"
                  >
                    <Plus />
                  </Button>
                </SideTooltip>
              ) : (
                <Button
                  size="lg"
                  aria-disabled="true"
                  title={NOT_BUILT}
                  className="justify-start"
                >
                  <Plus data-icon="inline-start" />
                  Add
                </Button>
              )}
              <nav
                aria-label="Main"
                className={cn(
                  "flex flex-col gap-1",
                  collapsed && "w-full gap-2",
                )}
              >
                {TABS.map((tab) => (
                  <SideNavItem
                    key={tab.key}
                    tab={tab}
                    current={current}
                    collapsed={collapsed}
                  />
                ))}
              </nav>
            </aside>
          </div>
        </TooltipProvider>

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
 * The switch that hides amounts, and the profile button with its panel (theme, settings). The
 * shell's header shows them. A screen that runs edge to edge places them itself.
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
      <ProfileMenu />
    </div>
  );
}

/** A tooltip to the right of an icon-only sidebar control, on hover or keyboard focus. */
function SideTooltip({
  label,
  children,
}: {
  label: ReactNode;
  children: ReactElement;
}) {
  return (
    <Tooltip>
      <TooltipTrigger render={children} />
      <TooltipContent side="right">{label}</TooltipContent>
    </Tooltip>
  );
}

interface SideNavItemProps {
  tab: Tab;
  current: TabKey;
  /** The rail: the icon with its name in small text under it, like the phone tab bar. */
  collapsed: boolean;
}

function SideNavItem({ tab, current, collapsed }: SideNavItemProps) {
  const active = tab.key === current;

  if (!collapsed) {
    return (
      <ScreenLink
        screen={tab.screen}
        current={active}
        className={cn(
          "flex items-center gap-3 rounded-lg px-3 py-2 text-sm",
          active
            ? "bg-sidebar-accent font-medium text-sidebar-accent-foreground"
            : "text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
        )}
      >
        <tab.icon aria-hidden="true" className="size-4 shrink-0" />
        {tab.label}
      </ScreenLink>
    );
  }
  // Names are always visible, so touch users don't need a tooltip.
  return (
    <ScreenLink
      screen={tab.screen}
      current={active}
      className={cn(
        "group flex min-w-0 flex-col items-center gap-1 rounded-lg text-xs",
        active
          ? "font-medium text-sidebar-accent-foreground"
          : "text-sidebar-foreground/70 hover:text-sidebar-foreground",
      )}
    >
      <span
        className={cn(
          "flex h-8 w-12 items-center justify-center rounded-full",
          active ? "bg-sidebar-accent" : "group-hover:bg-sidebar-accent/60",
        )}
      >
        <tab.icon aria-hidden="true" className="size-5" />
      </span>
      <span className="max-w-full truncate">{tab.label}</span>
    </ScreenLink>
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
