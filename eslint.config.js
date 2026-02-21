import js from "@eslint/js";
import { defineConfig } from "eslint/config";
import importPlugin from "eslint-plugin-import";
import simpleImportSort from "eslint-plugin-simple-import-sort";
import solid from "eslint-plugin-solid/configs/recommended";
import globals from "globals";
import tseslint from "typescript-eslint";

export default defineConfig([
  {
    files: ["**/*.{js,jsx}"],
    plugins: { js },
    extends: ["js/recommended"],
    languageOptions: {
      globals: globals.browser,
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
  },
  banImportsFromSiblings("popup"),
  banImportsFromSiblings("background"),
  banImportsFromSiblings("offscreen"),
  tseslint.configs.recommended,
  solid,
  {
    plugins: {
      "simple-import-sort": simpleImportSort,
      import: importPlugin,
    },
    rules: {
      "simple-import-sort/imports": "error",
      "simple-import-sort/exports": "error",
      "import/first": "error",
      "import/newline-after-import": "error",
      "import/no-duplicates": "error",
    },
  },
]);

function banImportsFromSiblings(topFolder) {
  const topFolders = ["popup", "background", "offscreen"];
  return {
    files: [`src/${topFolder}/**/*.{ts,tsx}`],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          patterns: topFolders
            .filter((f) => f !== topFolder)
            .map((f) => `@/${f}/*`),
        },
      ],
    },
  };
}
