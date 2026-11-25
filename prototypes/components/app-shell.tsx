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
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  type ComponentPropsWithRef,
  createContext,
  type MouseEvent,
  type ReactElement,
  type ReactNode,
  use,
  useEffect,
  useState,
  useSyncExternalStore,
} from "react";
import { Button, buttonVariants } from "@/components/ui/button";
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

/**
 * What Add does on a screen that opens Quick add in place: Quick add itself, once its panel is
 * closed. Without it, Add is a plain link to Quick add.
 */
export const AddActionContext = createContext<(() => void) | null>(null);

/**
 * The way in to Quick add: a link styled as a button. Other props, and the ref, reach the link, so
 * a tooltip trigger can render it.
 */
function AddLink({
  children,
  ...props
}: Omit<ComponentPropsWithRef<"a">, "href" | "onClick">) {
  const openHere = use(AddActionContext);
  const onClick = (event: MouseEvent<HTMLAnchorElement>) => {
    event.preventDefault();
    openHere?.();
  };

  return (
    <ScreenLink
      screen="Quick add"
      {...props}
      {...(openHere === null ? {} : { onClick })}
    >
      {children}
    </ScreenLink>
  );
}

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
  /**
   * Uses the full width with Home's 12 px gutter, but keeps the header row. "medium" stays within
   * 1280 px, centred. Others stay within 1024 px.
   */
  wide?: boolean | "medium";
  /** The screen's own header buttons, such as Customize. They sit before Hide amounts. */
  actions?: ReactNode;
  /** The way back up, such as a breadcrumb, over the title on a page inside a tab. */
  above?: ReactNode;
  /**
   * The screen's own heading row, in place of the plain title: a back button beside it, say. It
   * holds the page's h1, set in `PAGE_TITLE`.
   */
  heading?: ReactNode;
  children: ReactNode;
}

/** The page title's look: Fraunces, the logo's serif, at the logo's weight. */
export const PAGE_TITLE =
  "font-(family-name:--font-title) text-2xl font-[650] [font-variation-settings:'SOFT'_100]";

/**
 * The frame around every signed-in screen: a bottom tab bar on phones, a sidebar from tablet width
 * up, and a header with the switch that hides amounts.
 */
export function AppShell({
  current,
  title,
  bleed = false,
  wide = false,
  actions,
  above,
  heading,
  children,
}: AppShellProps) {
  const [amountsHidden, setAmountsHidden] = useState(false);
  const [collapsed, setCollapsed] = useSidebarCollapsed();
  // Spending's three pages show its tabs under the title, on every screen. The places stay five. A
  // category's page is a level down: it has its own way back, so no tabs. An open entry sits
  // beside the list on computers, under the tabs; on phones it is a page a level down, so no tabs.
  const pathname = usePathname();
  const inEntries = pathname === "/entries" || pathname.startsWith("/entries/");
  const page: SpendingPage =
    pathname === "/spending/categories"
      ? "categories"
      : inEntries
        ? "entries"
        : "overview";
  const showTabs =
    !bleed &&
    (pathname === "/spending" ||
      pathname === "/spending/categories" ||
      inEntries);
  // The column the header, the tabs and the page share.
  const column =
    wide === "medium"
      ? "mx-auto max-w-7xl px-4 md:px-8"
      : wide
        ? "px-3"
        : "mx-auto max-w-5xl px-4 md:px-8";
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
                <SideTooltip label="Add">
                  <AddLink
                    aria-label="Add"
                    className={cn(
                      buttonVariants({ size: "icon-lg" }),
                      "rounded-full",
                    )}
                  >
                    <Plus />
                  </AddLink>
                </SideTooltip>
              ) : (
                <AddLink
                  className={cn(
                    buttonVariants({ size: "lg" }),
                    "justify-start",
                  )}
                >
                  <Plus data-icon="inline-start" />
                  Add
                </AddLink>
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
            <header
              className={cn(
                "flex w-full items-center justify-between gap-3 pt-4 pb-3 md:pt-6",
                column,
              )}
            >
              <div className="flex flex-col">
                {above}
                {heading ?? <h1 className={PAGE_TITLE}>{title}</h1>}
              </div>
              {/* Under a breadcrumb, the buttons line up with the title. */}
              <div
                className={cn(
                  "flex items-center gap-1",
                  above !== undefined && "self-end",
                )}
              >
                {actions}
                <ShellActions />
              </div>
            </header>
          )}
          {showTabs && (
            <SpendingTabs
              page={page}
              className={cn(
                column,
                pathname.startsWith("/entries/") && "max-lg:hidden",
              )}
            />
          )}
          {/* The bottom padding keeps the last block clear of the tab bar, and of the ProtoBar on wide screens. */}
          <main className={cn("flex-1 pb-28", !bleed && cn("w-full", column))}>
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
            <AddLink
              aria-label="Add"
              className={cn(
                buttonVariants(),
                "-mt-5 size-14 rounded-full shadow-md",
              )}
            >
              <Plus className="size-6" />
            </AddLink>
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

type SpendingPage = "overview" | "categories" | "entries";

/**
 * Spending's three pages as tabs under the title, on every screen: the month's overview, every
 * category over the months, and every entry. A category's own page, a level down, has a way back
 * instead.
 */
function SpendingTabs({
  page,
  className,
}: {
  page: SpendingPage;
  className: string;
}) {
  const tabs = [
    { href: "/spending", label: "Overview", on: page === "overview" },
    {
      href: "/spending/categories",
      label: "Categories",
      on: page === "categories",
    },
    { href: "/entries", label: "Entries", on: page === "entries" },
  ] as const;
  return (
    <nav aria-label="Spending" className={cn("w-full pb-3", className)}>
      <ul className="flex gap-2 border-b border-foreground/10">
        {tabs.map((tab) => (
          <li key={tab.href}>
            <Link
              href={tab.href}
              aria-current={tab.on ? "page" : undefined}
              className={cn(
                "-mb-px inline-flex min-h-11 items-center rounded-t-md border-b-2 px-3 text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
                tab.on
                  ? "border-foreground text-foreground"
                  : "border-transparent text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
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
