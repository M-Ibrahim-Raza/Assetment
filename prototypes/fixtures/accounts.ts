export type AccountKind = "bank" | "wallet" | "cash";

export interface Account {
  id: string;
  name: string;
  kind: AccountKind;
  /** Whole rupees. */
  balance: number;
}

// Realistic Pakistani accounts, including a long name to test wrapping.
const SAMPLES = [
  { name: "Meezan Bank – Salary", kind: "bank", balance: 245_300 },
  { name: "JazzCash", kind: "wallet", balance: 6_420 },
  { name: "HBL Current", kind: "bank", balance: 82_150 },
  { name: "Cash in hand", kind: "cash", balance: 12_000 },
  { name: "Easypaisa", kind: "wallet", balance: 1_975 },
  {
    name: "UBL Bachat Savings Account (joint with Ammi)",
    kind: "bank",
    balance: 1_250_000,
  },
] as const satisfies readonly Omit<Account, "id">[];

/** `count` accounts, the same every time. After the samples run out, names get a number. */
export function accounts(count: number): Account[] {
  return Array.from({ length: count }, (_, index) => {
    const sample = SAMPLES[index % SAMPLES.length] ?? SAMPLES[0];
    const round = Math.floor(index / SAMPLES.length);
    return {
      ...sample,
      id: `account-${String(index + 1)}`,
      name: round === 0 ? sample.name : `${sample.name} ${String(round + 1)}`,
    };
  });
}
