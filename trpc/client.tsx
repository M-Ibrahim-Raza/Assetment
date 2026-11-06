"use client";

import { useQueryClient } from "@tanstack/react-query";
import { createTRPCClient, httpBatchLink } from "@trpc/client";
import { createTRPCContext } from "@trpc/tanstack-react-query";
import { useState, type ReactNode } from "react";
import type { AppRouter } from "./app.router";
import { trpcEndpoint, trpcMaxBatchSize } from "./endpoint";

const { TRPCProvider } = createTRPCContext<AppRouter>();

// No loggerLink, subscription or FormData links yet (trpc.md §12): no procedure needs them.
function makeTRPCClient() {
  return createTRPCClient<AppRouter>({
    links: [
      httpBatchLink({
        url: trpcEndpoint, // same origin, so no credentials override
        maxItems: trpcMaxBatchSize, // same as the server's maxBatchSize
        maxURLLength: 2083, // split a batch before its GET URL gets too long
      }),
    ],
  });
}

/** Mount inside <Providers> so tRPC uses the app's one QueryClient. */
export function TRPCReactProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const [trpcClient] = useState(makeTRPCClient);

  return (
    <TRPCProvider trpcClient={trpcClient} queryClient={queryClient}>
      {children}
    </TRPCProvider>
  );
}
