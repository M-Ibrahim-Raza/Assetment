import js from "@eslint/js";
import comments from "@eslint-community/eslint-plugin-eslint-comments/configs";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import betterTailwind from "eslint-plugin-better-tailwindcss";
import jsxA11y from "eslint-plugin-jsx-a11y";
import { defineConfig, globalIgnores } from "eslint/config";
import tseslint from "typescript-eslint";

export default defineConfig(
  globalIgnores([
    ".next/**",
    "out/**",
    "build/**",
    "coverage/**",
    "prototype/**",
    "next-env.d.ts",
  ]),
  js.configs.recommended,
  ...nextVitals,
  ...nextTs,
  tseslint.configs.strictTypeChecked,
  tseslint.configs.stylisticTypeChecked,
  {
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    linterOptions: { reportUnusedDisableDirectives: "error" },
    rules: {
      "@typescript-eslint/consistent-type-imports": "error",
      "@typescript-eslint/switch-exhaustiveness-check": "error",
    },
  },
  // The full accessibility set. eslint-config-next turns on only a few rules.
  { files: ["**/*.{jsx,tsx}"], rules: jsxA11y.flatConfigs.recommended.rules },
  {
    files: ["**/*.{ts,tsx}"],
    extends: [betterTailwind.configs.recommended],
    settings: { "better-tailwindcss": { entryPoint: "app/globals.css" } },
    rules: {
      // Prettier owns class order and formatting.
      "better-tailwindcss/enforce-consistent-class-order": "off",
      "better-tailwindcss/enforce-consistent-line-wrapping": "off",
    },
  },
  // Disable comments: one line only, naming the rule, with a reason.
  comments.recommended,
  {
    rules: {
      "@eslint-community/eslint-comments/require-description": "error",
      "@eslint-community/eslint-comments/no-unlimited-disable": "error",
      "@eslint-community/eslint-comments/no-use": [
        "error",
        { allow: ["eslint-disable-next-line"] },
      ],
      "@eslint-community/eslint-comments/no-restricted-disable": [
        "error",
        "react-hooks/rules-of-hooks",
        "react-hooks/exhaustive-deps",
      ],
    },
  },
  // CommonJS config files, such as .dependency-cruiser.cjs.
  {
    files: ["**/*.cjs"],
    languageOptions: {
      sourceType: "commonjs",
      globals: { module: "readonly", require: "readonly" },
    },
  },
  // Config files are plain JS outside the tsconfig, so skip type-aware rules.
  {
    files: ["**/*.{js,mjs,cjs}"],
    extends: [tseslint.configs.disableTypeChecked],
  },
);
