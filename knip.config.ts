import type { KnipConfig } from "knip";

const config: KnipConfig = {
  // Claude Code runs these hooks from .claude/settings.json, which knip doesn't read.
  entry: [".claude/hooks/*.mjs"],
  // Expected system tool: diff-cover runs through uv's uvx (see docs/code-quality-stack.md).
  ignoreBinaries: ["uvx"],
  // Approved, but no test uses them yet. Once one is used, knip fails until it's removed from this list.
  ignoreDependencies: ["@fast-check/vitest", "@testing-library/user-event"],
};

export default config;
