module.exports = {
  preset: 'react-native',
  setupFiles: ['./jest.setup.ts'],
  transformIgnorePatterns: [
    'node_modules/(?!(' +
      '@react-native|react-native|' +
      '@react-navigation|' +
      'react-native-ble-plx|' +
      'react-native-mmkv|' +
      'react-native-screens|' +
      'react-native-safe-area-context|' +
      'react-native-haptic-feedback|' +
      'react-native-keep-awake' +
      ')/)',
  ],
};
