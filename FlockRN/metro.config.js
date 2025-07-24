const { getDefaultConfig } = require('@expo/metro-config');
const { getSentryExpoConfig } = require('@sentry/react-native/metro');

let config = getDefaultConfig(__dirname);
config = getSentryExpoConfig(__dirname, config);

config.resolver.resolveRequest = (context, moduleImport, platform) => {
  if (moduleImport.startsWith('@firebase/')) {
    return context.resolveRequest(
      {
        ...context,
        isESMImport: true,
      },
      moduleImport,
      platform,
    );
  }

  return context.resolveRequest(context, moduleImport, platform);
};

module.exports = config;
