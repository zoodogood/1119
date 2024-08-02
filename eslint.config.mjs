import { FlatCompat } from "@eslint/eslintrc";
import js from "@eslint/js";
import perfectionist from "eslint-plugin-perfectionist";
import prettier from "eslint-plugin-prettier";
import svelte from "eslint-plugin-svelte";
import globals from "globals";
import path from "node:path";
import { fileURLToPath } from "node:url";
import parser from "svelte-eslint-parser";

const configFile = fileURLToPath(import.meta.url);
const baseDirectory = path.dirname(configFile);
const compat = new FlatCompat({
  baseDirectory,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default [
  ...compat.extends(
    "eslint:recommended",
    "plugin:svelte/prettier",
    "prettier",
    "plugin:prettier/recommended",
  ),
  {
    plugins: {
      prettier,
      svelte,
      perfectionist,
    },

    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.node,
      },

      ecmaVersion: "latest",
      sourceType: "module",
    },

    rules: {
      "prettier/prettier": ["error"],
      eqeqeq: ["error", "always"],
      "no-constant-condition": ["off"],
      "prefer-const": ["error"],
      "no-fallthrough": ["off"],
      "no-async-promise-executor": ["off"],

      "no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
        },
      ],

      "perfectionist/sort-classes": ["error"],
    },
  },
  ...compat.extends("plugin:svelte/prettier").map((config) => ({
    ...config,
    files: ["**/*.svelte"],
  })),
  {
    files: ["**/*.svelte"],

    languageOptions: {
      parser,
    },

    rules: {
      "prettier/prettier'": "off",
    },
  },
];
