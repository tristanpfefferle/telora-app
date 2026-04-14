const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Ensure Metro resolves modules from the correct directories
config.resolver.nodeModulesPaths = [
  __dirname,
  __dirname + '/node_modules',
];

// Watch the mobile directory only
config.watchFolders = [__dirname];

module.exports = config;
