import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // Claude Code runs these hooks from .claude/settings.json, which knip doesn't read.
  entry: [".claude/hooks/*.mjs"],
  // The UI prototype is a separate Next.js app with its own aliases (ADR 0006). CI type-checks and lints it.
  // components/ui/ holds shadcn CLI files, which the prototype uses before production does (ADR 0008).
  ignore: ["prototypes/**", "components/ui/**"],
  // Expected system tool: diff-cover runs through uv's uvx (see docs/code-quality-stack.md).
  ignoreBinaries: ["uvx"],
  // Approved, but no code uses them yet. Once one is used, knip fails until it's removed from this list.
  ignoreDependencies: [
    "@fast-check/vitest",
    "@prisma/adapter-pg",
    "@prisma/client",
    "@testing-library/user-event",
    "better-auth",
    "prisma",
    "zod",
  ],
};

export default config;
