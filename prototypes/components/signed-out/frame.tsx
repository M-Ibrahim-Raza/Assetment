"use client";

import type { ReactNode } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { Logo } from "@proto/components/logo";

/** The look of the header's one link, such as Sign in on Sign up. */
export const HEADER_LINK = buttonVariants({ variant: "ghost", size: "lg" });

interface SignedOutFrameProps {
  /** The words before the link, hidden on phones, e.g. "Have an account?". */
  prompt: string;
  /** The link to the other way in, styled with HEADER_LINK. */
  link: ReactNode;
  children: ReactNode;
}

/**
 * The frame around the signed-out screens, such as Sign up and Sign in. There's no tab bar or
 * sidebar: only the logo, and one link to the other way in.
 */
export function SignedOutFrame({
  prompt,
  link,
  children,
}: SignedOutFrameProps) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex items-center justify-between gap-3 px-4 pt-3 md:px-6">
        <Logo />
        <p className="flex items-center gap-1">
          <span className="max-sm:hidden">{prompt}</span>
          {link}
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
