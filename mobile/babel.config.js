module.exports = function (api) {
  api.cache(true);
  // The hoisted preset cannot discover the mobile-only router dependency.
  const { createRequire } = require('node:module');
  const presetRequire = createRequire(require.resolve('babel-preset-expo'));
  let routerVisible = true;
  try {
    presetRequire.resolve('expo-router');
  } catch {
    routerVisible = false;
  }
  return {
    presets: ['babel-preset-expo'],
    plugins: routerVisible
      ? []
      : [require('babel-preset-expo/build/expo-router-plugin').expoRouterBabelPlugin],
  };
};
