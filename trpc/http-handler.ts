import type { AnyTRPCRouter } from "@trpc/server";
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { trpcEndpoint, trpcMaxBatchSize } from "./endpoint";

/** Serves a tRPC router over HTTP at `trpcEndpoint`. */
export function createTRPCHandler(router: AnyTRPCRouter) {
  return (request: Request) =>
    fetchRequestHandler({
      endpoint: trpcEndpoint,
      req: request,
      router,
      maxBatchSize: trpcMaxBatchSize,
      onError({ error, path, type }) {
        // 4xx responses aren't incidents. Log the path, never the input.
        if (error.code === "INTERNAL_SERVER_ERROR") {
          console.error("tRPC procedure failed", {
            path,
            type,
            cause: error.cause,
          });
        }
      },
    });
}
