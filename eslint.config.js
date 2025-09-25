import js from "@eslint/js";
import tseslint from "typescript-eslint";
import prettier from "eslint-config-prettier";

export default [
  // Apply to all files
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
  },

  // Ignore patterns (equivalent to ignorePatterns in legacy config)
  {
    ignores: ["dist/**/*", "node_modules/**/*"],
  },

  // Base ESLint recommended rules
  js.configs.recommended,

  // TypeScript ESLint recommended rules
  ...tseslint.configs.recommended,

  // Custom rules and parser options
  {
    files: ["**/*.{js,mjs,cjs,ts}"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      parserOptions: {
        project: false,
      },
    },
    rules: {
      "@typescript-eslint/consistent-type-definitions": ["error", "type"],
    },
  },

  // Prettier config should be last to override other formatting rules
  prettier,
];
