import { router } from "./init";

// Feature routers are added here as features need them (ADR 0006).
export const appRouter = router({});

export type AppRouter = typeof appRouter;
