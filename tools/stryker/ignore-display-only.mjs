// Stryker ignorer: skips mutants in display-only code that unit tests must not assert
// such as class names and exact text. Logic is still mutated.

const reasons = {
  className: "Class names are display-only; unit tests must not assert them.",
  jsxText:
    "Text between JSX elements is display-only; unit tests must not assert it.",
};

const displayOnly = {
  shouldIgnore(path) {
    if (path.isJSXAttribute() && path.node.name.name === "className") {
      return reasons.className;
    }
    if (
      path.isJSXExpressionContainer() &&
      (path.parentPath.isJSXElement() || path.parentPath.isJSXFragment()) &&
      path.get("expression").isStringLiteral()
    ) {
      return reasons.jsxText;
    }
    return undefined;
  },
};

export const strykerPlugins = [
  { kind: "Ignore", name: "display-only", value: displayOnly },
];
