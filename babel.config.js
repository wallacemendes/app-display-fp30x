module.exports = function (api) {
  api.cache(true);

  const isTest = process.env.NODE_ENV === 'test';

  return {
    presets: ['module:@react-native/babel-preset'],
    // NativeWind babel plugin is only for Metro, not Jest
    plugins: isTest ? [] : ['nativewind/babel'],
  };
};
