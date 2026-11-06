import { router } from "./init";

// Feature routers are added here as features need them (ADR 0005).
export const appRouter = router({});

export type AppRouter = typeof appRouter;
