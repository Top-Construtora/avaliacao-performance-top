import js from '@eslint/js';
import globals from 'globals';
import tseslint from 'typescript-eslint';

// Config flat (ESLint 9). `.mjs` porque o backend não é "type": "module".
export default tseslint.config(
  { ignores: ['dist', 'node_modules'] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ['**/*.ts'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      globals: globals.node,
    },
    rules: {
      // Pragmático para a base atual (o código usa `any` e console de propósito).
      // Apertar gradualmente via ADR — não bloquear a adoção do gate agora.
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_' },
      ],
      'no-console': 'off',
    },
  },
);
