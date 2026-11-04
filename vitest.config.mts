import { configDefaults, defineConfig } from "vitest/config";

const exclude = [...configDefaults.exclude, ".next/**", "prototype/**"];

export default defineConfig({
  resolve: { tsconfigPaths: true }, // the @/* alias from tsconfig.json
  test: {
    restoreMocks: true,
    unstubEnvs: true,
    unstubGlobals: true,
    sequence: { shuffle: true }, // random order; rerun a failure with --sequence.seed=<seed>
    tags: [
      {
        name: "quarantine",
        description: "Flaky; tracked in a ticket (testing.md §13)",
      },
    ],
    coverage: {
      provider: "v8", // reports branches as well as lines
      include: ["**/*.{ts,tsx}"],
      exclude: [
        ...exclude,
        "**/*.test.{ts,tsx}",
        "**/*.int.test.ts",
        "**/*.d.ts",
        "*.config.{ts,mts}",
        "test/**",
        "e2e/**",
        "coverage/**",
      ],
      reporter: ["text-summary", "html", "cobertura"],
      // Raised by hand, never lowered. No thresholds.autoUpdate: it rewrites this file on every local run.
      thresholds: { lines: 80, branches: 80 },
    },
    projects: [
      {
        extends: true,
        test: {
          name: "unit",
          include: ["**/*.test.ts"],
          exclude: [...exclude, "**/*.int.test.ts"],
          environment: "node",
          setupFiles: ["./test/setup-msw.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "components",
          include: ["**/*.test.tsx"],
          exclude,
          environment: "jsdom",
          setupFiles: ["./test/setup-dom.ts", "./test/setup-msw.ts"],
        },
      },
      {
        extends: true,
        test: {
          name: "integration",
          include: ["**/*.int.test.ts"],
          exclude,
          environment: "node",
          setupFiles: ["./test/setup-msw.ts"],
        },
      },
    ],
  },
});
