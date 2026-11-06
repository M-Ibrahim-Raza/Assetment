import { initTRPC } from "@trpc/server";

// Set explicitly: tRPC's default is "NODE_ENV isn't production", which is also true when NODE_ENV is unset.
const isDev = process.env.NODE_ENV === "development";

// The only initTRPC in the app. Context, domain-error mapping and protectedProcedure
// come with auth and the first procedure.
const t = initTRPC.create({
  isDev,
  errorFormatter({ shape, error }) {
    // tRPC copies the cause's message into the response, so hide unexpected errors outside dev.
    const hide = error.code === "INTERNAL_SERVER_ERROR" && !isDev;
    return hide ? { ...shape, message: "Internal server error" } : shape;
  },
});

// Export named helpers only. Never export `t`, so every procedure starts from a base below.
export const router = t.router;
export const publicProcedure = t.procedure;
