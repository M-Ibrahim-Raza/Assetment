// Claude Code PostToolUse hook. After Claude edits or writes a file, ESLint fixes it and
// Prettier formats it, the same order as the pre-commit hook. Problems ESLint can't fix go back
// to Claude (exit code 2). Feedback only: the edit already happened, and CI is the real gate.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();
const input = JSON.parse(readFileSync(0, "utf8"));
const file = input.tool_input?.file_path;

// Only files inside this repo that still exist.
if (typeof file !== "string" || !existsSync(file)) process.exit(0);
const relative = path.relative(projectDir, path.resolve(file));
if (relative.startsWith("..") || path.isAbsolute(relative)) process.exit(0);

// Run the project's own ESLint and Prettier with this Node, so pnpm needn't be on PATH.
const require = createRequire(path.join(projectDir, "package.json"));
const binOf = (pkg) => {
  const manifest = require.resolve(`${pkg}/package.json`);
  const { bin } = JSON.parse(readFileSync(manifest, "utf8"));
  return path.join(
    path.dirname(manifest),
    typeof bin === "string" ? bin : bin[pkg],
  );
};
const run = (pkg, args) =>
  spawnSync(process.execPath, [binOf(pkg), ...args, relative], {
    cwd: projectDir,
    encoding: "utf8",
  });

const problems = [];
if (/\.(?:js|mjs|cjs|ts|mts|tsx)$/.test(relative)) {
  const eslint = run("eslint", [
    "--fix",
    "--max-warnings",
    "0",
    "--no-warn-ignored",
  ]);
  if (eslint.status !== 0) problems.push(eslint.stdout + eslint.stderr);
}
const prettier = run("prettier", [
  "--write",
  "--ignore-unknown",
  "--log-level",
  "warn",
]);
if (prettier.status !== 0) problems.push(prettier.stdout + prettier.stderr);

if (problems.length > 0) {
  process.stderr.write(
    `${relative} still has problems the tools can't fix. Fix the cause; don't disable the rule.\n${problems.join("\n")}`,
  );
  process.exit(2);
}
