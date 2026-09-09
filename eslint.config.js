// Flat ESLint config shared by every package in the workspace.
// Individual concept/challenge packages do NOT need their own eslint config —
// run `pnpm lint` from the repo root.
import js from "@eslint/js";
import globals from "globals";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";

export default tseslint.config(
  {
    ignores: ["**/dist/**", "**/coverage/**", "**/node_modules/**", "**/*.config.js"],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    // Plain-JS/JSX packages (e.g. playground/) skip TypeScript, so unlike
    // .ts/.tsx files they don't get browser globals from a tsconfig `lib` —
    // declare them here so `no-undef` doesn't flag `document`, `window`, etc.
    files: ["**/*.{js,jsx}"],
    languageOptions: {
      globals: globals.browser,
    },
  },
  {
    files: ["**/*.{ts,tsx,jsx}"],
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": [
        "warn",
        { argsIgnorePattern: "^_", varsIgnorePattern: "^_" },
      ],
    },
  },
);
