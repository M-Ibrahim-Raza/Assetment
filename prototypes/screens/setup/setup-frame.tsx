"use client";

import Image from "next/image";
import { useRouter } from "next/navigation";
import type { ReactNode, Ref } from "react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button, buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import logoOnDarkIcon from "@/logo/final/1-gold-light-text/assetment-gold-light-text-icon.svg";
import logoOnDark from "@/logo/final/1-gold-light-text/assetment-gold-light-text-logo.svg";
import logoOnLightIcon from "@/logo/final/2-gold-ink-text/assetment-gold-ink-text-icon.svg";
import logoOnLight from "@/logo/final/2-gold-ink-text/assetment-gold-ink-text-logo.svg";
import { Money } from "@proto/components/amounts";
import { BLOCK, EYEBROW, INK, PAD } from "@proto/components/blocks";
import { DISPLAY } from "@proto/components/display";
import { ScreenLink } from "@proto/components/screen-link";
import { formatLakhCrore, formatPkr } from "@proto/kit/format";
import { CountUp } from "./count-up";
import { BIG } from "./look";

/** A green field and its text, as on Home's net worth block. Its filled button is the light pill. */
export const ON_GREEN =
  "bg-primary text-primary-foreground [--ring:var(--primary-foreground)] [--secondary-foreground:var(--hero-action-foreground)] [--secondary:var(--hero-action)]";

/** The loud line of a block that has no number to show. */
export const LOUD = cn(
  DISPLAY,
  "text-4xl leading-none font-extrabold tracking-tight text-balance sm:text-5xl",
);

/**
 * The frame around every setup screen. It has no tab bar or sidebar, so there is one job on
 * screen: only the logo and "Finish later", which goes to Home.
 */
export function SetupFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pt-3 md:px-6">
        <h1 className="sr-only">Set up your net worth</h1>
        {/* The page is light by day and dark at night, so each has its own logo. Phones get the A alone. */}
        <Image
          src={logoOnLightIcon}
          alt="Assetment"
          loading="eager"
          className="size-9 sm:hidden dark:hidden"
        />
        <Image
          src={logoOnDarkIcon}
          alt="Assetment"
          loading="eager"
          className="hidden size-9 dark:block dark:sm:hidden"
        />
        <Image
          src={logoOnLight}
          alt="Assetment"
          loading="eager"
          className="hidden h-7 w-auto sm:block dark:hidden dark:sm:hidden"
        />
        <Image
          src={logoOnDark}
          alt="Assetment"
          loading="eager"
          className="hidden h-7 w-auto dark:sm:block"
        />
        <ScreenLink
          screen="Dashboard"
          className={buttonVariants({ variant: "ghost", size: "lg" })}
        >
          Finish later
        </ScreenLink>
      </header>
      {/* The bottom padding keeps the last block clear of the ProtoBar on wide screens. */}
      <main className="flex flex-1 flex-col p-3 sm:pb-28">{children}</main>
      <Toaster
        position="bottom-center"
        offset={{ bottom: 88 }}
        mobileOffset={{ bottom: 16 }}
      />
    </div>
  );
}

/** Setup couldn't load. It says what happened and what to do, as Home's error block does. */
export function SetupError({ message }: { message: string }) {
  const router = useRouter();
  return (
    <section
      role="alert"
      className={cn(
        "mx-auto flex w-full max-w-5xl flex-col items-start gap-5 py-10",
        ON_GREEN,
        BLOCK,
        PAD,
      )}
    >
      <h2 className={LOUD}>{"We couldn't load your setup"}</h2>
      <p className="max-w-md text-lg">{message}</p>
      <Button
        variant="secondary"
        className={BIG}
        onClick={() => {
          router.refresh();
        }}
      >
        Try again
      </Button>
    </section>
  );
}

/** Shown to someone who left setup half-way and came back. */
export function ResumedNote() {
  return (
    <Alert>
      <AlertTitle>Welcome back</AlertTitle>
      <AlertDescription>
        What you added is saved. Carry on from here.
      </AlertDescription>
    </Alert>
  );
}

interface RevealProps {
  /** Whole rupees. */
  netWorth: number;
  /** True when the user just got here, so the number counts up from zero. */
  animate: boolean;
  heading: Ref<HTMLHeadingElement>;
}

/** The finish: the net worth as the one big thing, with its lakh or crore note. Sits on green. */
export function Reveal({ netWorth, animate, heading }: RevealProps) {
  const spoken = formatLakhCrore(netWorth);
  // A crore-sized amount starts a step smaller, so it stays on one line on a phone.
  const long = formatPkr(netWorth).length > 12;
  return (
    <div className="flex flex-col gap-3">
      <h2 ref={heading} tabIndex={-1} className={cn(EYEBROW, "outline-none")}>
        Your net worth
      </h2>
      <p
        className={cn(
          DISPLAY,
          "leading-none font-extrabold tracking-tighter",
          long
            ? "text-3xl sm:text-5xl lg:text-6xl"
            : "text-4xl sm:text-6xl lg:text-7xl",
        )}
      >
        <CountUp value={netWorth} from={animate ? 0 : netWorth} />
      </p>
      {spoken !== null && <p className="text-xl font-semibold">{spoken}</p>}
    </div>
  );
}

interface OwnOweTilesProps {
  owned: number;
  owed: number;
  className?: string;
}

/** The two parts of net worth, as on Home: what you own on white, what you owe on ink. */
export function OwnOweTiles({ owned, owed, className }: OwnOweTilesProps) {
  return (
    <div className={cn("grid grid-cols-2 gap-3", className)}>
      <Tile
        label="Portfolio"
        caption="What you own"
        value={owned}
        className="bg-card text-card-foreground"
      />
      <Tile
        label="Debts"
        caption="What you owe"
        value={-owed}
        signed
        className={INK}
      />
    </div>
  );
}

interface TileProps {
  label: string;
  caption: string;
  /** Whole rupees. */
  value: number;
  signed?: boolean;
  className: string;
}

function Tile({ label, caption, value, signed = false, className }: TileProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-col gap-1 px-4 py-5 md:px-6",
        BLOCK,
        className,
      )}
    >
      <span className={EYEBROW}>{label}</span>
      <Money
        value={value}
        signed={signed}
        className="text-sm font-bold sm:text-xl"
      />
      <span className="text-sm">{caption}</span>
    </div>
  );
}
