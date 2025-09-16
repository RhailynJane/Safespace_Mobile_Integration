// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';
import globals from 'globals';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx,ts,tsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        ...globals.browser,
        ...globals.es2021,
        ...globals.node,
      },
      parserOptions: {
        ecmaFeatures: {
          jsx: true,
        },
      },
    },
    plugins: {
      react,
      'react-hooks': reactHooks,
      'react-native': reactNative,
    },
    rules: {
      ...react.configs.recommended.rules,
      ...reactHooks.configs.recommended.rules,
      'react/react-in-jsx-scope': 'off', // Not needed in React 17+
      
      // Custom rule to catch useInsertionEffect issues
      'no-restricted-syntax': [
        'error',
        {
          selector: "CallExpression[callee.name='useInsertionEffect'] ~ ExpressionStatement > CallExpression[callee.name=/^(set|dispatch|navigate|push|replace)/]",
          message: 'Do not schedule updates in useInsertionEffect. Use useEffect instead.'
        }
      ]
    },
    settings: {
      react: {
        version: 'detect',
      },
    },
  },
];