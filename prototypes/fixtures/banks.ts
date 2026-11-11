import type { AccountKind } from "./accounts";

/**
 * Names offered as one-tap choices when adding an account, the most common first. Real Pakistani
 * banks and wallets, including one long name to test wrapping.
 */
export const ACCOUNT_NAMES = {
  bank: [
    "Meezan Bank",
    "HBL",
    "UBL",
    "MCB",
    "Bank Alfalah",
    "Allied Bank",
    "Standard Chartered Pakistan",
    "Faysal Bank",
  ],
  wallet: ["JazzCash", "Easypaisa", "SadaPay", "NayaPay"],
  cash: ["Cash in hand"],
} as const satisfies Record<AccountKind, readonly string[]>;
