module.exports = {
  env: {
    node: true,
  },

  extends: [
    '@crycode/eslint-config-js',
  ],

  parserOptions: {
    ecmaVersion: 2021,
    sourceType: 'module',
  },

  rules: {
    'no-console': 'off',
  },
};
