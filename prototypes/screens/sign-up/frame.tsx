"use client";

import { Clock, Gauge, Lock } from "lucide-react";
import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { cn } from "@/lib/utils";
import { Logo } from "@proto/components/logo";
import { ScreenLink } from "@proto/components/screen-link";

/**
 * The frame around sign-up. Signed out, so there's no tab bar or sidebar: only the logo, and Sign
 * in for people who already have an account.
 */
export function SignUpFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pt-3 md:px-6">
        <Logo />
        <p className="flex items-center gap-1">
          <span className="max-sm:hidden">Have an account?</span>
          <ScreenLink
            screen="Sign in"
            className={buttonVariants({ variant: "ghost", size: "lg" })}
          >
            Sign in
          </ScreenLink>
        </p>
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

const TRUST = [
  {
    Icon: Gauge,
    line: "Assess all your assets in one place, and measure how you're doing.",
  },
  { Icon: Lock, line: "Only you can see what you own and owe." },
  { Icon: Clock, line: "See your net worth in about 5 minutes." },
] as const;

/** Why it's safe to type in their wealth: the persona's main worry before signing up. */
export function TrustLines({ className }: { className?: string }) {
  return (
    <ul className={cn("flex flex-col gap-3", className)}>
      {TRUST.map(({ Icon, line }) => (
        <li key={line} className="flex items-start gap-3">
          <Icon aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
          <span>{line}</span>
        </li>
      ))}
    </ul>
  );
}
