const { getDefaultConfig } = require('expo/metro-config');
const { createRequire } = require('node:module');

const mobileRequire = createRequire(__filename);
const config = getDefaultConfig(__dirname);

// On Windows the React Native Gradle plugin passes an app-relative entry to
// Expo's embedded bundler. Keep the monorepo watch folders for hoisted imports.
if (process.platform === 'win32' && process.argv.includes('export:embed')) {
  config.server.unstable_serverRoot = __dirname;
}

// Web and native use different React patch versions. Resolve every native React
// import from this app so hoisted React Native also gets its matching renderer.
config.resolver.resolveRequest = (context, name, platform) => {
  const isReact = name === 'react' || name.startsWith('react/');
  const target = isReact ? mobileRequire.resolve(name) : name;
  return context.resolveRequest(context, target, platform);
};

module.exports = config;
