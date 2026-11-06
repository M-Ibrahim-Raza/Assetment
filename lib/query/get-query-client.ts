import { environmentManager, QueryClient } from "@tanstack/react-query";
import { isTRPCClientError } from "@trpc/client";
import type { AppRouter } from "@/trpc/app.router";

function retry(failureCount: number, error: Error) {
  // Keep the server default (no retries): a slow SSR response is worse than letting the client retry.
  if (environmentManager.isServer()) return false;
  // 4xx errors won't fix themselves. tRPC puts the status in error.data.httpStatus.
  if (
    isTRPCClientError<AppRouter>(error) &&
    (error.data?.httpStatus ?? 500) < 500
  ) {
    return false;
  }
  return failureCount < 3;
}

// No toast handlers or dehydrate options yet: they need sonner and server prefetching.
function makeQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Above 0 so data prefetched on the server isn't refetched as soon as it reaches the browser.
        staleTime: 60 * 1000,
        retry,
      },
    },
  });
}

let browserQueryClient: QueryClient | undefined;

export function getQueryClient() {
  // Server: a new client on every call, so cached data is never shared between users.
  if (environmentManager.isServer()) return makeQueryClient();
  // Browser: one client for the whole session. It also survives React suspending on the first render.
  browserQueryClient ??= makeQueryClient();
  return browserQueryClient;
}
