import path from "node:path";
import type { NextConfig } from "next";

// The UI prototype (ADR 0006). Keep these flags the same as ../next.config.ts, so screens behave
// the same. Next.js can't import that file from here.
const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  reactCompiler: true,
  typedRoutes: true,
  // The root AGENTS.md already holds these rules. Without this, `next dev` writes a copy here.
  agentRules: false,
  // The ProtoBar owns the bottom of the screen. Errors still show without the indicator.
  devIndicators: false,
  turbopack: {
    // The repo root, so the prototype can import production code.
    root: path.join(__dirname, ".."),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
