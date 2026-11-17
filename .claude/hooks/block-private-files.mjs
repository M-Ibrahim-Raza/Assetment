// Claude Code PreToolUse hook. The Read deny rules in .claude/settings.json only stop the Read
// and Edit tools, so `cat tasks.md` in Bash would still work. This hook blocks any Bash command
// that names a file those rules protect. It covers exact Read(./path) rules for files in the
// repo root. A command that never names the file, like `grep -r foo .`, still gets through.
import { readFileSync } from "node:fs";
import path from "node:path";

const projectDir = process.env.CLAUDE_PROJECT_DIR ?? process.cwd();

const readJson = (source) => {
  try {
    return JSON.parse(readFileSync(source, "utf8"));
  } catch {
    return undefined;
  }
};

const command = readJson(0)?.tool_input?.command;
if (typeof command !== "string") process.exit(0);

// Read(./tasks.md) -> tasks.md. Rules with wildcards, like Read(./**/*.pem), are skipped.
const denyRules = ["settings.json", "settings.local.json"].flatMap((name) => {
  const deny = readJson(path.join(projectDir, ".claude", name))?.permissions
    ?.deny;
  return Array.isArray(deny) ? deny : [];
});
const protectedFiles = new Set(
  denyRules
    .map((rule) =>
      typeof rule === "string"
        ? /^Read\(\.\/([^*?[\]{}]+)\)$/.exec(rule)?.[1]
        : undefined,
    )
    .filter((file) => file !== undefined),
);

// Split on shell separators, then drop a leading ./ or project path, so
// `cat "./tasks.md"`, `git show HEAD:tasks.md` and `$CLAUDE_PROJECT_DIR/tasks.md` all match,
// while specs/F01-x/tasks.md and mytasks.md don't.
const toRootPath = (token) => {
  if (token.startsWith(`${projectDir}/`))
    return token.slice(projectDir.length + 1);
  return token.replace(
    /^(?:\.\/|\$CLAUDE_PROJECT_DIR\/|\$\{CLAUDE_PROJECT_DIR\}\/)/,
    "",
  );
};
const named = command
  .split(/[\s'"`=:;|&()<>]+/)
  .map(toRootPath)
  .find((token) => protectedFiles.has(token));
if (named === undefined) process.exit(0);

console.log(
  JSON.stringify({
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: `${named} is private. The Read deny rules in .claude/settings.json protect it, so Bash commands that name it are blocked too. Ask the user if you need something from it.`,
    },
  }),
);
