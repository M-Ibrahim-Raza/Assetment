"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Account } from "@proto/fixtures/accounts";
import { formatPkr } from "@proto/kit/format";
import { useProtoAction } from "@proto/kit/use-proto-action";
import type { DemoViewProps } from "../scenarios";

const KIND_LABEL = { bank: "Bank", wallet: "Wallet", cash: "Cash" } as const;

/** Variant A: one flat list with the total on top. */
export function DemoList(props: DemoViewProps) {
  if (props.status === "loading") {
    return (
      <main className="mx-auto w-full max-w-2xl p-6" aria-busy="true">
        <span className="sr-only">Loading accounts</span>
        <div className="h-8 w-40 animate-pulse rounded-md bg-foreground/10" />
        <ul className="mt-6 space-y-3">
          {[1, 2, 3, 4].map((row) => (
            <li
              key={row}
              className="h-12 animate-pulse rounded-md bg-foreground/10"
            />
          ))}
        </ul>
      </main>
    );
  }
  if (props.status === "error") return <ListError message={props.message} />;
  return <AccountList initial={props.accounts} />;
}

function ListError({ message }: { message: string }) {
  const router = useRouter();
  return (
    <main className="mx-auto w-full max-w-2xl p-6">
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

function AccountList({ initial }: { initial: readonly Account[] }) {
  const [items, setItems] = useState(initial);
  const add = useProtoAction(() => {
    setItems((current) => [
      ...current,
      {
        id: `new-${String(current.length + 1)}`,
        name: "New account",
        kind: "bank",
        balance: 0,
      },
    ]);
  });
  const total = items.reduce((sum, account) => sum + account.balance, 0);

  return (
    <main className="mx-auto w-full max-w-2xl p-6 pb-28">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Accounts</h1>
          <p className="text-foreground/70">Total {formatPkr(total)}</p>
        </div>
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
          <h2 className="font-medium">No accounts yet</h2>
          <p className="mt-1 text-foreground/70">
            Add your bank, wallet and cash accounts to see your net worth.
          </p>
        </section>
      ) : (
        <ul className="mt-6 divide-y divide-foreground/10">
          {items.map((account) => (
            <li
              key={account.id}
              className="flex items-center justify-between gap-4 py-3"
            >
              <div className="min-w-0">
                <p className="wrap-break-word">{account.name}</p>
                <p className="text-sm text-foreground/70">
                  {KIND_LABEL[account.kind]}
                </p>
              </div>
              <p className="shrink-0 tabular-nums">
                {formatPkr(account.balance)}
              </p>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
