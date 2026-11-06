"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import type { ReactNode } from "react";
import { getQueryClient } from "@/lib/query/get-query-client";
import { TRPCReactProvider } from "@/trpc/client";

export function Providers({ children }: { children: ReactNode }) {
  // Not useState: with no Suspense boundary above this component, React throws the state away
  // if the first render suspends, and a second client would be created.
  const queryClient = getQueryClient();

  return (
    <QueryClientProvider client={queryClient}>
      <TRPCReactProvider>{children}</TRPCReactProvider>
    </QueryClientProvider>
  );
}
