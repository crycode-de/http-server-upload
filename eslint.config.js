import { defineConfig } from 'eslint/config';
import crycode from '@crycode/eslint-config';

export default defineConfig(
  ...crycode.configs.js,
  ...crycode.configs.stylistic,

  {
    languageOptions: {
      globals: {
        console: 'readonly',
        process: 'readonly',
      },
    },

    rules: {
      'no-console': 'off',
    },
  },
);
