import { defineConfig, globalIgnores } from 'eslint/config';
import eslint from '@eslint/js';
import ts_eslint from 'typescript-eslint';
import vue_eslint from 'eslint-plugin-vue';
import vitest_eslint from '@vitest/eslint-plugin';
import stylistic from '@stylistic/eslint-plugin';

import vueParser from 'vue-eslint-parser';

export default ts_eslint.config(
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue'],
  },
  defineConfig([globalIgnores([
    'dist/',
    'node_modules/',
    'coverage/',
    'src/themes/primevue-presets/',
  ])]),
  eslint.configs.recommended,
  ts_eslint.configs.recommended,
  vue_eslint.configs['flat/recommended'],
  vitest_eslint.configs.recommended,
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
        'checksVoidReturn': { 'arguments': false },
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
  {
    files: ['**/*.test.ts'],
    rules: {
      '@typescript-eslint/unbound-method': 'off',
      'vitest/valid-title': ['error', {
        // allow passing the actual function to `describe` instead of a string
        ignoreTypeOfDescribeName: true,
        // allowArguments: true, // it should be this but this option doesn't work for some reason?
      }],
    },
  },
);
