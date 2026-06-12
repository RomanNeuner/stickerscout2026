const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// .m4r für iOS-Klingeltöne als Asset registrieren
config.resolver.assetExts.push('m4r');

module.exports = config;
