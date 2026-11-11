"use client";

import { useRouter } from "next/navigation";
import { Button, buttonVariants } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { AppShell } from "@proto/components/app-shell";
import { ScreenLink } from "@proto/components/screen-link";
import type { Dashboard, DashboardViewProps } from "./scenarios";
import { ChecksBlock } from "./checks-block";
import { MonthBlock } from "./month-block";
import { NetWorthHero } from "./net-worth-hero";
import { BLOCK, DISPLAY, HeroBlock, INK, PAD } from "./parts";
import { RecentBlock } from "./recent-block";
import { SpendingBlock } from "./spending-block";

// The loud line of a hero that has no number to show: first use, and the error state.
const HERO_LINE = cn(
  DISPLAY,
  "text-4xl leading-none font-extrabold tracking-tight text-balance @sm:text-5xl @2xl:text-6xl",
);

// The blocks stack on phones. From desktop width up they sit two to a row and fill their cells,
// like a mosaic, with the same gap between.
const MOSAIC = "flex flex-col gap-3 lg:grid lg:grid-cols-2";
// Net worth and its two parts span the full width.
const TOP = "flex flex-col gap-3 lg:col-span-2";

/**
 * Home as rounded blocks of colour instead of cards: net worth alone on the green block, its two
 * parts as a split block, the month on sage, and the rest as white blocks, with gaps between.
 */
export function DashboardView(props: DashboardViewProps) {
  return (
    <AppShell current="home" title="Home" bleed>
      <div className="p-3">
        <DashboardBody {...props} />
      </div>
    </AppShell>
  );
}

function DashboardBody(props: DashboardViewProps) {
  if (props.status === "loading") return <LoadingBlocks />;
  if (props.status === "error") return <ErrorBlock message={props.message} />;

  const { dashboard } = props;
  if (isFirstUse(dashboard)) return <FirstUseBlock />;

  return (
    <div className={MOSAIC}>
      <div className={TOP}>
        <NetWorthHero netWorth={dashboard.netWorth} />
      </div>
      <MonthBlock
        month={dashboard.month}
        netWorthChange={dashboard.netWorth.changeThisMonth}
      />
      <ChecksBlock checks={dashboard.checks} />
      <SpendingBlock categories={dashboard.spending} />
      <RecentBlock entries={dashboard.recent} />
    </div>
  );
}

/** Nothing owned, nothing owed and nothing logged: the user has only just signed up. */
function isFirstUse({ netWorth, recent }: Dashboard): boolean {
  return (
    netWorth.portfolio === 0 && netWorth.debts === 0 && recent.length === 0
  );
}

/**
 * Home before anything is added. New users go through the setup wizard after sign-up, so this is
 * for someone who skipped it: the button picks the wizard up again.
 */
function FirstUseBlock() {
  return (
    <HeroBlock>
      <div className="flex flex-col items-start gap-5 py-6">
        <h2 className={HERO_LINE}>{"Let's find your number."}</h2>
        <p className="max-w-md text-lg text-primary-foreground/80">
          {
            "A few short steps: your accounts, gold, stocks, property and debts. Skip anything you don't have, and your net worth shows straight away."
          }
        </p>
        {/* A real link styled as the hero's button: it opens the setup wizard. */}
        <ScreenLink
          screen="Setup"
          className={buttonVariants({ variant: "secondary", size: "lg" })}
        >
          Set up your net worth
        </ScreenLink>
      </div>
    </HeroBlock>
  );
}

function ErrorBlock({ message }: { message: string }) {
  const router = useRouter();
  return (
    <HeroBlock>
      <div role="alert" className="flex flex-col items-start gap-5 py-6">
        <h2 className={HERO_LINE}>{"We couldn't load your dashboard"}</h2>
        <p className="max-w-md text-lg text-primary-foreground/80">{message}</p>
        <Button
          variant="secondary"
          size="lg"
          onClick={() => {
            router.refresh();
          }}
        >
          Try again
        </Button>
      </div>
    </HeroBlock>
  );
}

/** Shaped like the ready state: the hero, the split block, then the month block and a plain one. */
function LoadingBlocks() {
  return (
    <div aria-busy="true" className={MOSAIC}>
      <span className="sr-only">Loading your dashboard</span>
      <div className={TOP}>
        <HeroBlock>
          <div className="flex flex-col gap-3">
            <Skeleton className="h-3 w-24 bg-primary-foreground/20" />
            <Skeleton className="h-12 w-64 max-w-full bg-primary-foreground/20" />
            <Skeleton className="h-6 w-28 bg-primary-foreground/20" />
          </div>
          <Skeleton className="h-8 w-60 max-w-full bg-primary-foreground/20" />
          <Skeleton className="h-16 w-full bg-primary-foreground/20" />
        </HeroBlock>
        <div className="grid grid-cols-2 gap-3">
          <div className={cn("flex flex-col gap-2 bg-card py-5", BLOCK, PAD)}>
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-6 w-28 max-w-full" />
          </div>
          <div className={cn("flex flex-col gap-2 py-5", INK, BLOCK, PAD)}>
            <Skeleton className="h-3 w-20 bg-(--ink-foreground)/20" />
            <Skeleton className="h-6 w-28 max-w-full bg-(--ink-foreground)/20" />
          </div>
        </div>
      </div>
      <div className={cn("flex flex-col gap-5 bg-secondary py-8", BLOCK, PAD)}>
        <Skeleton className="h-3 w-32 bg-foreground/10" />
        <Skeleton className="h-10 w-64 max-w-full bg-foreground/10" />
        <Skeleton className="h-6 w-full bg-foreground/10" />
        <Skeleton className="h-8 w-full bg-foreground/10" />
        <Skeleton className="h-8 w-full bg-foreground/10" />
        <Skeleton className="h-8 w-full bg-foreground/10" />
      </div>
      <div className={cn("flex flex-col gap-5 bg-card py-8", BLOCK, PAD)}>
        <Skeleton className="h-8 w-56 max-w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
        <Skeleton className="h-12 w-full" />
      </div>
    </div>
  );
}
