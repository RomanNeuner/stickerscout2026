import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import { STICKER_TYPE, RARITY } from '../data/stickerTypes';

const TYPE_STYLES = {
  [STICKER_TYPE.FOIL]: { bg: COLORS.goldDeep, text: COLORS.gold, label: '✨ Foil' },
  [STICKER_TYPE.LOGO]: { bg: COLORS.greenDeep, text: COLORS.greenBright, label: 'Logo' },
  [STICKER_TYPE.STADIUM]: { bg: '#1A1A2E', text: '#A78BFA', label: 'Stadium' },
  [STICKER_TYPE.NORMAL]: null,
};

export default function StickerBadge({ type }) {
  const style = TYPE_STYLES[type];
  if (!style) return null;
  return (
    <View style={[styles.badge, { backgroundColor: style.bg }]}>
      <Text style={[styles.text, { color: style.text }]}>{style.label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: SPACING.sm,
    paddingVertical: 2,
    borderRadius: RADIUS.sm,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
  },
});
