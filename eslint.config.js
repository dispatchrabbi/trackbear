import eslint from '@eslint/js';
import ts_eslint from 'typescript-eslint';
import vue_eslint from 'eslint-plugin-vue';
import vitest_eslint from '@vitest/eslint-plugin';
// import prettier_eslint from 'eslint-plugin-prettier/recommended';

import vueParser from 'vue-eslint-parser';

export default ts_eslint.config(
  eslint.configs.recommended,
  ts_eslint.configs.recommended,
  vue_eslint.configs['flat/recommended'],
  vitest_eslint.configs.recommended,
  {
    files: ['**/*.js', '**/*.ts', '**/*.vue'],
    ignores: ['dist/**'],

    languageOptions: {
      parser: vueParser,
      parserOptions: {
        parser: ts_eslint.parser,
        sourceType: 'module',
        projectService: {
          allowDefaultProject: ['*.js']
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
        "checksVoidReturn": { "arguments": false }
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
  }
  // prettier_eslint,
);