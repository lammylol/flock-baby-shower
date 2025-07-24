import globals from 'globals';
import { defineConfig } from 'eslint/config';
import tsParser from '@typescript-eslint/parser';
import * as tseslint from '@typescript-eslint/eslint-plugin';

export default defineConfig([
  {
    files: ['src/**/*.ts', 'src/**/*.tsx'], // 👈 restrict to just TS files in src
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        project: './tsconfig.json',
        sourceType: 'module',
        ecmaVersion: 2020,
      },
      globals: {
        ...globals.node,
      },
    },
    plugins: {
      '@typescript-eslint': tseslint,
    },
  },
]);