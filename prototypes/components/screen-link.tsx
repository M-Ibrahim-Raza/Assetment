import Link from "next/link";
import type { ComponentPropsWithRef } from "react";
import { screenRoutes } from "@proto/screens";

type ScreenLinkProps = Omit<ComponentPropsWithRef<"a">, "href"> & {
  /** The screen to open, named as in the journeys' Screen column, e.g. "Portfolio". */
  screen: string;
  /** Marks it as the page the user is on. */
  current?: boolean;
};

/**
 * A link to another prototype screen. While that screen isn't built, it renders a stand-in that
 * looks the same but goes nowhere: an `<a>` with no `href`, which isn't focusable. It turns into a
 * real link once the screen is in `screenRoutes`. Other props, and the ref, reach the `<a>`, so a
 * tooltip trigger can render it.
 */
export function ScreenLink({
  screen,
  current = false,
  children,
  ...props
}: ScreenLinkProps) {
  const route = screenRoutes[screen];
  if (route === undefined) {
    return (
      <a aria-disabled="true" title="Not built yet" {...props}>
        {children}
      </a>
    );
  }
  // Link types these three without `undefined`, so they go through only when set.
  const { onClick, onMouseEnter, onTouchStart, ...rest } = props;
  return (
    <Link
      href={route}
      aria-current={current ? "page" : undefined}
      {...rest}
      {...(onClick ? { onClick } : {})}
      {...(onMouseEnter ? { onMouseEnter } : {})}
      {...(onTouchStart ? { onTouchStart } : {})}
    >
      {children}
    </Link>
  );
}
