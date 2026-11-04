// Runs Stryker on the source files changed since origin/main: CI's `mutation` job.
// The nightly workflow runs every file. Source files are picked with the `mutate` patterns
// in stryker.config.json, so this script and a full run always agree on what counts.
import { execFileSync, spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { matchesGlob } from "node:path";

const git = (...args) =>
  execFileSync("git", args, { encoding: "utf8" }).split("\n").filter(Boolean);

const { mutate } = JSON.parse(readFileSync("stryker.config.json", "utf8"));
const include = mutate.filter((pattern) => !pattern.startsWith("!"));
const exclude = mutate
  .filter((pattern) => pattern.startsWith("!"))
  .map((pattern) => pattern.slice(1));

// Committed, uncommitted and new files since the branch left main. Deleted files have nothing to mutate.
const base = git("merge-base", "origin/main", "HEAD")[0];
const changed = [
  ...git("diff", "--name-only", "--diff-filter=ACMR", base),
  ...git("ls-files", "--others", "--exclude-standard"),
];

const files = [...new Set(changed)].filter(
  (file) =>
    include.some((pattern) => matchesGlob(file, pattern)) &&
    !exclude.some((pattern) => matchesGlob(file, pattern)),
);

if (files.length === 0) {
  console.log("No source files changed since origin/main. Nothing to mutate.");
} else {
  console.log(
    `Mutating ${String(files.length)} changed file(s):\n${files.join("\n")}`,
  );
  const { status } = spawnSync(
    "pnpm",
    ["exec", "stryker", "run", "--mutate", files.join(",")],
    { stdio: "inherit" },
  );
  process.exitCode = status ?? 1;
}
