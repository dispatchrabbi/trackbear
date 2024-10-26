import eslint from '@eslint/js';
import ts_eslint from 'typescript-eslint';
import vue_eslint from 'eslint-plugin-vue';
// import prettier_eslint from 'eslint-plugin-prettier/recommended';

import vueParser from 'vue-eslint-parser';

export default ts_eslint.config({
  files: ['**/*.js', '**/*.ts', '**/*.vue'],
  ignores: ['dist/**'],

  languageOptions: {
    parser: vueParser,
    parserOptions: {
      parser: ts_eslint.parser,
      sourceType: 'module',
    },
    ecmaVersion: 'latest',
  },

  extends: [
    eslint.configs.recommended,
    ...ts_eslint.configs.recommended,
    ...vue_eslint.configs['flat/recommended'],
    // prettier_eslint,
  ],
  rules: {
    '@typescript-eslint/ban-ts-comment': 'off',
  },
});
