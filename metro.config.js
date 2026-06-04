const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .m4r (iOS Ringtone format) als Asset-Extension registrieren
config.resolver.assetExts.push('m4r');

module.exports = config;
