import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import ts_eslint from 'typescript-eslint';
import vue from 'eslint-plugin-vue';
import vitest from '@vitest/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';

import vueParser from 'vue-eslint-parser';

export default ts_eslint.config(
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue'],
    languageOptions: {
      sourceType: 'module',
    },
  },
  {
    files: ['server/**/*.ts', './*.ts', './*.js', 'scripts/**/*.js'],
    languageOptions: {
      globals: { ...globals.node },
    },
  },
  {
    files: ['src/**/*.ts', 'src/**/*.vue'],
    languageOptions: {
      globals: { ...globals.browser },
    },
  },
  defineConfig([globalIgnores([
    'node_modules/',
    'dist/',
    'generated/',
    'coverage/',
    'src/themes/primevue-presets/',
    'help-docs/.vitepress/cache/',
    'help-docs/.vitepress/dist/',
  ])]),
  eslint.configs.recommended,
  ts_eslint.configs.recommended,
  vue.configs['flat/recommended'],
  // this is vitest_eslint.configs.recommended, but with typechecking on to enable passing functions in describe() and it()
  {
    files: ['**/*.test.ts'],
    plugins: { vitest },
    rules: { ...vitest.configs.recommended.rules },
    settings: {
      vitest: {
        typecheck: true,
      },
    },
  },
  stylistic.configs.customize({
    indent: 2,
    quotes: 'single',
    semi: true,
    jsx: false,
    arrowParens: false,
    braceStyle: '1tbs',
    blockSpacing: true,
    quoteProps: 'consistent',
    commaDangle: 'always-multiline',
  }),
  {
    plugins: {
      '@stylistic': stylistic,
    },
    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: ts_eslint.parser,
        sourceType: 'module',
        projectService: {
          allowDefaultProject: ['*.js'],
        },
        tsconfigRootDir: import.meta.dirname,
        extraFileExtensions: ['.vue'],
      },
      ecmaVersion: 'latest',
    },
    rules: {
      '@typescript-eslint/ban-ts-comment': 'off',
      '@typescript-eslint/no-misused-promises': ['error', {
        // do not flag async functions being passed when a void-returning function is expected
        'checksVoidReturn': false,
      }],

      '@stylistic/arrow-parens': ['error', 'as-needed', {
        requireForBlockBody: false,
      }],
      '@stylistic/keyword-spacing': ['error', {
        overrides: {
          if: { after: false },
          for: { after: false },
          while: { after: false },
          catch: { after: true }, // TODO: keep an eye on https://github.com/eslint-stylistic/eslint-stylistic/pull/770
        },
      }],
      '@stylistic/max-statements-per-line': ['error', {
        max: 1,
        ignoredNodes: ['ReturnStatement'], // allow a single-line if() { return; }
      }],
      '@stylistic/operator-linebreak': ['error', 'after'],
      '@stylistic/quotes': ['error', 'single', {
        allowTemplateLiterals: true,
        avoidEscape: true,
      }],
      '@stylistic/space-before-function-paren': ['error', {
        anonymous: 'never',
        named: 'never',
        asyncArrow: 'always',
      }],
    },
  },
);
