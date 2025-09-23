// eslint.config.js
import js from '@eslint/js';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactNative from 'eslint-plugin-react-native';

export default [
  js.configs.recommended,
  {
    files: ['**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2021,
      sourceType: 'module',
      globals: {
        // Common browser globals
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        setTimeout: 'readonly',
        setInterval: 'readonly',
        clearTimeout: 'readonly',
        clearInterval: 'readonly',
        fetch: 'readonly',
        // ES2021 globals
        Promise: 'readonly',
        // React Native specific globals (if needed)
        __DEV__: 'readonly',
        // Add other globals you actually use
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
      'react/react-in-jsx-scope': 'off',
      
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