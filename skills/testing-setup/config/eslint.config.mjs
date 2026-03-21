// ESLint flat config for a TypeScript + React project.
// ADAPT: remove the react-hooks block if the project has no React frontend.
// ADAPT: add additional ignore paths for generated directories.

import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    // ADAPT: add other generated or vendored directories to ignore
    ignores: ['dist/**', 'node_modules/**', 'ui/node_modules/**'],
    rules: {
      '@typescript-eslint/no-unused-vars': [
        'error',
        {
          argsIgnorePattern:       '^_',
          varsIgnorePattern:       '^_',
          caughtErrorsIgnorePattern: '^_',
        },
      ],
    },
  },
  {
    // ADAPT: update glob to match your frontend source directory
    files: ['ui/src/**/*.{ts,tsx}'],
    plugins: { 'react-hooks': reactHooks },
    rules: {
      'react-hooks/rules-of-hooks':    'error',
      'react-hooks/exhaustive-deps':   'warn',
      // v7 strict rules — promote to 'error' once the codebase is clean
      'react-hooks/immutability':      'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'react-hooks/refs':              'warn',
    },
  }
);
