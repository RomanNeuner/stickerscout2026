const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Hinweis: .m4r NICHT als assetExt registrieren!
// Android behandelt .m4r und .mp3 mit gleichem Basisnamen als Duplicate-Resource.
// iOS-Klingeltöne werden über expo-file-system + expo-sharing als .mp3 geteilt.

module.exports = config;
