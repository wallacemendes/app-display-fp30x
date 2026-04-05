module.exports = {
  root: true,
  extends: '@react-native',
  rules: {
    // Enforce strict TypeScript patterns
    '@typescript-eslint/no-unused-vars': [
      'error',
      {argsIgnorePattern: '^_', varsIgnorePattern: '^_'},
    ],
    '@typescript-eslint/no-explicit-any': 'error',
    '@typescript-eslint/consistent-type-imports': [
      'error',
      {prefer: 'type-imports'},
    ],

    // React Native best practices
    'react-native/no-inline-styles': 'off',
    'no-bitwise': 'off', // BLE MIDI framing requires bit manipulation
    'react/react-in-jsx-scope': 'off',

    // General code quality
    'no-console': ['warn', {allow: ['warn', 'error']}],
    eqeqeq: ['error', 'always'],
    'no-var': 'error',
    'prefer-const': 'error',
  },
  ignorePatterns: [
    'node_modules/',
    'ios/',
    'android/',
    'coverage/',
    '*.config.js',
    '.eslintrc.js',
    '.prettierrc.js',
  ],
};
