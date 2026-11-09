"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Account } from "@proto/fixtures/accounts";
import { formatPkr } from "@proto/kit/format";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { DemoViewProps } from "../scenarios";

const GROUPS = [
  { kind: "bank", label: "Banks" },
  { kind: "wallet", label: "Wallets" },
  { kind: "cash", label: "Cash" },
] as const;

/** Variant B: cards grouped by account type, each group with its subtotal. */
export function DemoCards(props: DemoViewProps) {
  if (props.status === "loading") {
    return (
      <main className="mx-auto w-full max-w-3xl p-6" aria-busy="true">
        <span className="sr-only">Loading accounts</span>
        <div className="grid gap-3 sm:grid-cols-2">
          {[1, 2, 3, 4].map((card) => (
            <div
              key={card}
              className="h-24 animate-pulse rounded-lg bg-foreground/10"
            />
          ))}
        </div>
      </main>
    );
  }
  if (props.status === "error") return <CardsError message={props.message} />;
  return <AccountCards initial={props.accounts} />;
}

function CardsError({ message }: { message: string }) {
  const router = useRouter();
  return (
    <main className="mx-auto w-full max-w-3xl p-6">
      <div role="alert" className="rounded-lg border border-foreground/20 p-4">
        <p>{message}</p>
        <button
          type="button"
          className="mt-3 rounded-md bg-foreground px-4 py-2 font-medium text-background"
          onClick={() => {
            router.refresh();
          }}
        >
          Try again
        </button>
      </div>
    </main>
  );
}

function AccountCards({ initial }: { initial: readonly Account[] }) {
  const [items, setItems] = useState(initial);
  const add = useProtoAction(() => {
    setItems((current) => [
      ...current,
      {
        id: `new-${String(current.length + 1)}`,
        name: "New wallet",
        kind: "wallet",
        balance: 0,
      },
    ]);
  });

  return (
    <main className="mx-auto w-full max-w-3xl p-6 pb-28">
      <header className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-semibold">Accounts</h1>
        <button
          type="button"
          disabled={add.pending}
          className="rounded-md bg-foreground px-4 py-2 font-medium text-background disabled:opacity-60"
          onClick={() => {
            add.run();
          }}
        >
          {add.pending ? "Adding…" : "Add account"}
        </button>
      </header>

      {items.length === 0 ? (
        <section className="mt-10 rounded-lg border border-dashed border-foreground/30 p-6 text-center">
          <h2 className="font-medium">Start with where your money is</h2>
          <p className="mt-1 text-foreground/70">
            Add a bank account, a wallet like JazzCash, or your cash in hand.
          </p>
        </section>
      ) : (
        <div className="mt-6 space-y-8">
          {GROUPS.map(({ kind, label }) => {
            const group = items.filter((account) => account.kind === kind);
            if (group.length === 0) return null;
            const subtotal = group.reduce((sum, a) => sum + a.balance, 0);
            return (
              <section key={kind} aria-labelledby={`group-${kind}`}>
                <div className="flex items-baseline justify-between gap-4">
                  <h2 id={`group-${kind}`} className="text-lg font-medium">
                    {label}
                  </h2>
                  <p className="text-foreground/70 tabular-nums">
                    {formatPkr(subtotal)}
                  </p>
                </div>
                <ul className="mt-3 grid gap-3 sm:grid-cols-2">
                  {group.map((account) => (
                    <li
                      key={account.id}
                      className="rounded-lg border border-foreground/15 p-4"
                    >
                      <p className="font-medium wrap-break-word">
                        {account.name}
                      </p>
                      <p className="mt-2 text-xl tabular-nums">
                        {formatPkr(account.balance)}
                      </p>
                    </li>
                  ))}
                </ul>
              </section>
            );
          })}
        </div>
      )}
    </main>
  );
}
