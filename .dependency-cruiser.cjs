// Import rules for this repo. Agents follow them (docs/code-quality-rules.md).
// Started from `depcruise --init`; every rule is an error (ADR 0004).

const testFile = "[.](?:spec|test)[.](?:js|mjs|cjs|jsx|ts|mts|cts|tsx)$";
const testFolder = "^(?:test|e2e)/";
const configFile = "(^|/)[^/]+[.]config[.](?:js|cjs|mjs|ts|cts|mts)$";

/** @type {import('dependency-cruiser').IConfiguration} */
module.exports = {
  forbidden: [
    {
      name: "no-prototype-imports",
      comment:
        "Production never imports the UI prototype in prototypes/ (ADR 0007).",
      severity: "error",
      from: { pathNot: "^prototypes/" },
      to: { path: "^prototypes/" },
    },
    {
      name: "ui-imports-no-app-code",
      comment:
        "components/ui/ holds only shadcn CLI files, so app logic can't hide there (ADR 0008).",
      severity: "error",
      from: { path: "^components/ui/" },
      to: {
        pathNot: "^(?:components/ui/|hooks/|lib/utils[.]ts$|node_modules/)",
      },
    },
    {
      name: "no-circular",
      comment:
        "Circular imports make load order fragile and hide design problems.",
      severity: "error",
      from: {},
      to: { circular: true },
    },
    {
      name: "no-orphans",
      comment: "A file that imports nothing and that nothing imports is dead.",
      severity: "error",
      from: {
        orphan: true,
        pathNot: [
          "(^|/)[.][^/]+[.](?:js|cjs|mjs|ts|cts|mts|json)$",
          "[.]d[.]ts$",
          "(^|/)tsconfig[.]json$",
          configFile,
          // Tool plugins, loaded by path from a tool's config instead of imported.
          "^tools/",
          // The UI prototype. Its imports aren't followed (see options), so its files look orphaned.
          "^prototypes/",
        ],
      },
      to: {},
    },
    {
      name: "not-to-dev-dep",
      comment:
        "App code can't import devDependencies: they aren't installed in production.",
      severity: "error",
      from: { pathNot: [testFile, testFolder, configFile] },
      to: {
        dependencyTypes: ["npm-dev"],
        dependencyTypesNot: ["type-only"],
        pathNot: ["node_modules/@types/"],
      },
    },
    {
      name: "not-to-test",
      comment: "App code can't import test helpers.",
      severity: "error",
      from: { pathNot: [testFile, testFolder] },
      to: { path: testFolder },
    },
    {
      name: "not-to-spec",
      comment: "Nothing imports a test file.",
      severity: "error",
      from: {},
      to: { path: testFile },
    },
    {
      name: "no-non-package-json",
      comment: "Every imported package is listed in package.json.",
      severity: "error",
      from: {},
      to: { dependencyTypes: ["npm-no-pkg", "npm-unknown"] },
    },
    {
      name: "not-to-unresolvable",
      comment: "Every import resolves to a real file or package.",
      severity: "error",
      from: {},
      to: { couldNotResolve: true },
    },
    {
      name: "no-duplicate-dep-types",
      comment: "A package is in dependencies or devDependencies, not both.",
      severity: "error",
      from: {},
      to: {
        moreThanOneDependencyType: true,
        dependencyTypesNot: ["type-only"],
      },
    },
    {
      name: "peer-deps-used",
      comment: "Don't import a package that is only a peerDependency.",
      severity: "error",
      from: {},
      to: { dependencyTypes: ["npm-peer"] },
    },
    {
      name: "not-to-deprecated",
      comment: "Don't import a deprecated package.",
      severity: "error",
      from: {},
      to: { dependencyTypes: ["deprecated"] },
    },
    {
      name: "no-deprecated-core",
      comment: "Don't import deprecated Node.js core modules.",
      severity: "error",
      from: {},
      to: {
        dependencyTypes: ["core"],
        path: [
          "^v8/tools/codemap$",
          "^v8/tools/consarray$",
          "^v8/tools/csvparser$",
          "^v8/tools/logreader$",
          "^v8/tools/profile_view$",
          "^v8/tools/profile$",
          "^v8/tools/SourceMap$",
          "^v8/tools/splaytree$",
          "^v8/tools/tickprocessor-driver$",
          "^v8/tools/tickprocessor$",
          "^node-inspect/lib/_inspect$",
          "^node-inspect/lib/internal/inspect_client$",
          "^node-inspect/lib/internal/inspect_repl$",
          "^async_hooks$",
          "^punycode$",
          "^domain$",
          "^constants$",
          "^sys$",
          "^_linklist$",
          "^_stream_wrap$",
        ],
      },
    },
  ],
  options: {
    // Shows imports into prototypes/ (so the rule above catches them) without checking the prototype's own code.
    doNotFollow: { path: ["node_modules", "^prototypes/"] },
    // Build output, reports, and next-env.d.ts, which Next.js generates, for the app and the prototype.
    exclude: {
      path: "^(?:(?:(?:prototypes/)?\\.next|\\.stryker-tmp|coverage|reports|test-results|playwright-report)/|(?:prototypes/)?next-env[.]d[.]ts$)",
    },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
    detectProcessBuiltinModuleCalls: true,
    skipAnalysisNotInRules: true,
    enhancedResolveOptions: {
      exportsFields: ["exports"],
      conditionNames: ["import", "require", "node", "default", "types"],
      extensions: [".ts", ".tsx", ".mts", ".js", ".mjs", ".cjs", ".json"],
      mainFields: ["main", "types", "typings"],
    },
  },
};
