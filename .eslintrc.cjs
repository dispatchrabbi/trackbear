module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:vue/vue3-recommended',
  ],
  ignorePatterns: ['dist', '.eslintrc.cjs'],
  parser: "vue-eslint-parser",
  "parserOptions": {
    parser: "@typescript-eslint/parser",
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    "@typescript-eslint/ban-ts-comment": "off"
  },
}
