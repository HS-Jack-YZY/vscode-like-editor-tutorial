/* eslint-env node */
module.exports = {
  // root: true,
  // parser: "@typescript-eslint/parser",
  parserOptions: {
    sourceType: "module",
    ecmaVersion: "latest",
    project: false
  },
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/recommended",
    "prettier"
  ],
  rules: {
    "@typescript-eslint/consistent-type-definitions": ["error", "type"]
  },
  ignorePatterns: ["dist", "node_modules"]
};