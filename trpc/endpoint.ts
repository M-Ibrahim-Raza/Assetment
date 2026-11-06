/** Where the tRPC route handler listens. The browser client calls the same path. */
export const trpcEndpoint = "/api/trpc";

/** The most calls one batched request may carry. The server and the client use the same limit. */
export const trpcMaxBatchSize = 10;
