/**
 * AppIcon — Custom PNG icons für StickerScout 2026
 * Varianten: gold | white | grey | dark
 */
import React from 'react';
import { Image, StyleSheet } from 'react-native';

// All requires must be static — Metro bundler cannot resolve dynamic paths
const ICON_MAP = {
  'scan':                 { gold: require('../../assets/icons/scan_gold_1024.png'),                 white: require('../../assets/icons/scan_white_1024.png'),                 grey: require('../../assets/icons/scan_grey_1024.png'),                 dark: require('../../assets/icons/scan_dark_1024.png') },
  'album-book':           { gold: require('../../assets/icons/album-book_gold_1024.png'),           white: require('../../assets/icons/album-book_white_1024.png'),           grey: require('../../assets/icons/album-book_grey_1024.png'),           dark: require('../../assets/icons/album-book_dark_1024.png') },
  'calendar':             { gold: require('../../assets/icons/calendar_gold_1024.png'),             white: require('../../assets/icons/calendar_white_1024.png'),             grey: require('../../assets/icons/calendar_grey_1024.png'),             dark: require('../../assets/icons/calendar_dark_1024.png') },
  'profile-user':         { gold: require('../../assets/icons/profile-user_gold_1024.png'),         white: require('../../assets/icons/profile-user_white_1024.png'),         grey: require('../../assets/icons/profile-user_grey_1024.png'),         dark: require('../../assets/icons/profile-user_dark_1024.png') },
  'camera':               { gold: require('../../assets/icons/camera_gold_1024.png'),               white: require('../../assets/icons/camera_white_1024.png'),               grey: require('../../assets/icons/camera_grey_1024.png'),               dark: require('../../assets/icons/camera_dark_1024.png') },
  'flash-zap':            { gold: require('../../assets/icons/flash-zap_gold_1024.png'),            white: require('../../assets/icons/flash-zap_white_1024.png'),            grey: require('../../assets/icons/flash-zap_grey_1024.png'),            dark: require('../../assets/icons/flash-zap_dark_1024.png') },
  'gallery-image':        { gold: require('../../assets/icons/gallery-image_gold_1024.png'),        white: require('../../assets/icons/gallery-image_white_1024.png'),        grey: require('../../assets/icons/gallery-image_grey_1024.png'),        dark: require('../../assets/icons/gallery-image_dark_1024.png') },
  'shutter-circle':       { gold: require('../../assets/icons/shutter-circle_gold_1024.png'),       white: require('../../assets/icons/shutter-circle_white_1024.png'),       grey: require('../../assets/icons/shutter-circle_grey_1024.png'),       dark: require('../../assets/icons/shutter-circle_dark_1024.png') },
  'arrow-left':           { gold: require('../../assets/icons/arrow-left_gold_1024.png'),           white: require('../../assets/icons/arrow-left_white_1024.png'),           grey: require('../../assets/icons/arrow-left_grey_1024.png'),           dark: require('../../assets/icons/arrow-left_dark_1024.png') },
  'question-mark-circle': { gold: require('../../assets/icons/question-mark-circle_gold_1024.png'), white: require('../../assets/icons/question-mark-circle_white_1024.png'), grey: require('../../assets/icons/question-mark-circle_grey_1024.png'), dark: require('../../assets/icons/question-mark-circle_dark_1024.png') },
  'crown-pro':            { gold: require('../../assets/icons/crown-pro_gold_1024.png'),            white: require('../../assets/icons/crown-pro_white_1024.png'),            grey: require('../../assets/icons/crown-pro_grey_1024.png'),            dark: require('../../assets/icons/crown-pro_dark_1024.png') },
  'barcode-number':       { gold: require('../../assets/icons/barcode-number_gold_1024.png'),       white: require('../../assets/icons/barcode-number_white_1024.png'),       grey: require('../../assets/icons/barcode-number_grey_1024.png'),       dark: require('../../assets/icons/barcode-number_dark_1024.png') },
  'home':                 { gold: require('../../assets/icons/home_gold_1024.png'),                 white: require('../../assets/icons/home_white_1024.png'),                 grey: require('../../assets/icons/home_grey_1024.png'),                 dark: require('../../assets/icons/home_dark_1024.png') },
};

export default function AppIcon({ name, variant = 'white', size = 24, style }) {
  const variants = ICON_MAP[name];
  if (!variants) return null;
  const source = variants[variant] ?? variants.white;
  return (
    <Image
      source={source}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
    />
  );
}
