const { getDefaultConfig } = require('expo/metro-config');

// Expo SDK 52+ picks up pnpm/yarn monorepos on its own; we only add .sql for migrations.
const config = getDefaultConfig(__dirname);
config.resolver.sourceExts.push('sql');

module.exports = config;
