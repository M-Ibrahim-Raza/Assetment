import { appRouter } from "@/trpc/app.router";
import { createTRPCHandler } from "@/trpc/http-handler";

const handler = createTRPCHandler(appRouter);

// Queries are GET and mutations are POST: export both, or calls fail with 405.
export { handler as GET, handler as POST };
