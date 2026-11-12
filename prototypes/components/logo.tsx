import Image from "next/image";
import logoOnDarkIcon from "@/logo/final/1-gold-light-text/assetment-gold-light-text-icon.svg";
import logoOnDark from "@/logo/final/1-gold-light-text/assetment-gold-light-text-logo.svg";
import logoOnLightIcon from "@/logo/final/2-gold-ink-text/assetment-gold-ink-text-icon.svg";
import logoOnLight from "@/logo/final/2-gold-ink-text/assetment-gold-ink-text-logo.svg";

/**
 * The logo at the top of a screen without the app shell, such as Sign up and Setup. The page is
 * light by day and dark at night, so each has its own logo. Phones get the A alone.
 */
export function Logo() {
  return (
    <>
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
    </>
  );
}
