// eslint.config.js
export default {
  env: {
    browser: true,
    es2021: true,
    "react-native/react-native": true,
  },
  extends: [
    "eslint:recommended",
    "plugin:react/recommended",
    "plugin:react-native/all",
  ],
  plugins: [
    "react",
    "react-native",
  ],
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 13, 
    sourceType: "module",
  },
  rules: {
    // Add custom rules here if needed
  },
}
