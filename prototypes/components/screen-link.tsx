import Link from "next/link";
import type { ReactNode } from "react";
import { screenRoutes } from "@proto/screens";

interface ScreenLinkProps {
  /** The screen to open, named as in the journeys' Screen column, e.g. "Portfolio". */
  screen: string;
  /** Marks it as the page the user is on. */
  current?: boolean;
  className?: string;
  children?: ReactNode;
}

/**
 * A link to another prototype screen. While that screen isn't built, it renders a stand-in that
 * looks the same but goes nowhere, and turns into a real link once the screen is in `screenRoutes`.
 */
export function ScreenLink({
  screen,
  current = false,
  className,
  children,
}: ScreenLinkProps) {
  const route = screenRoutes[screen];
  if (route === undefined) {
    return (
      <span aria-disabled="true" title="Not built yet" className={className}>
        {children}
      </span>
    );
  }
  return (
    <Link
      href={route}
      aria-current={current ? "page" : undefined}
      className={className}
    >
      {children}
    </Link>
  );
}
