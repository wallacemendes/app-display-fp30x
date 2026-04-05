/**
 * Jest setup for mocking native modules that don't exist in the test environment.
 */

// Mock react-native-keep-awake
jest.mock('react-native-keep-awake', () => ({
  useKeepAwake: jest.fn(),
  activateKeepAwake: jest.fn(),
  deactivateKeepAwake: jest.fn(),
}));

// Mock react-native-mmkv (v4 API: createMMKV factory, remove instead of delete)
jest.mock('react-native-mmkv', () => {
  const store = new Map<string, string>();
  return {
    createMMKV: jest.fn().mockImplementation(() => ({
      getString: (key: string) => store.get(key),
      set: (key: string, value: string) => store.set(key, value),
      remove: (key: string) => store.delete(key),
      contains: (key: string) => store.has(key),
      getAllKeys: () => Array.from(store.keys()),
      clearAll: () => store.clear(),
    })),
  };
});

// Mock react-native-haptic-feedback
jest.mock('react-native-haptic-feedback', () => ({
  trigger: jest.fn(),
}));
