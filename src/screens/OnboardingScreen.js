import React from 'react';
import {
  View, Text, StyleSheet, Image, TouchableOpacity,
  Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { setOnboarded } from '../services/storage';

const { width, height } = Dimensions.get('window');

export default function OnboardingScreen({ onComplete }) {
  const { t } = useTranslation();

  const handleComplete = async () => {
    await setOnboarded();
    onComplete?.();
  };

  return (
    <View style={styles.container}>
      {/* Background pattern overlay */}
      <View style={styles.bgPatternTop} />
      <View style={styles.bgPatternBottom} />

      {/* Icon area */}
      <View style={styles.iconArea}>
        {/* Scan brackets */}
        <View style={styles.bracketTopLeft} />
        <View style={styles.bracketTopRight} />

        <Image
          source={require('../../assets/icon.png')}
          style={styles.icon}
          resizeMode="contain"
        />

        {/* Scan brackets bottom */}
        <View style={styles.bracketBottomLeft} />
        <View style={styles.bracketBottomRight} />
      </View>

      {/* 2026 badge */}
      <Text style={styles.yearBadge}>2026</Text>

      {/* Title */}
      <View style={styles.titleRow}>
        <Text style={styles.titleWhite}>StickerScout </Text>
        <Text style={styles.titleGold}>2026</Text>
      </View>

      {/* Divider line */}
      <View style={styles.divider} />

      {/* Tagline */}
      <Text style={styles.tagline}>{t('onboarding.tagline')}</Text>

      {/* CTA Button */}
      <TouchableOpacity
        style={styles.ctaButton}
        onPress={handleComplete}
        activeOpacity={0.85}
      >
        <LinearGradient
          colors={['#C8A800', '#FFD700', '#FFE44D', '#FFD700', '#C8A800']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={styles.ctaGradient}
        >
          <Ionicons name="scan-outline" size={24} color={COLORS.textOnGold} style={styles.ctaIcon} />
          <Text style={styles.ctaText}>{t('onboarding.start')}</Text>
          <Ionicons name="chevron-forward" size={22} color={COLORS.textOnGold} />
        </LinearGradient>
      </TouchableOpacity>


      {/* Feature icons */}
      <View style={styles.features}>
        {[
          { icon: 'scan-outline', label: t('onboarding.feature1') },
          { icon: 'swap-horizontal-outline', label: t('onboarding.feature2') },
          { icon: 'albums-outline', label: t('onboarding.feature3') },
        ].map((f, i) => (
          <View key={i} style={styles.featureItem}>
            <Ionicons name={f.icon} size={28} color={COLORS.gold} />
            <Text style={styles.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}

const BRACKET_SIZE = 22;
const BRACKET_THICKNESS = 3;
const BRACKET_COLOR = COLORS.gold;
const BRACKET_OFFSET = -4;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0D1F2D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xl,
  },

  bgPatternTop: {
    position: 'absolute', top: -60, right: -60,
    width: 220, height: 220,
    borderRadius: 110,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.07)',
  },
  bgPatternBottom: {
    position: 'absolute', bottom: 80, left: -80,
    width: 280, height: 280,
    borderRadius: 140,
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.05)',
  },

  iconArea: {
    width: 200, height: 200,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  icon: {
    width: 160, height: 160,
    ...SHADOWS.goldGlow,
  },

  // Scan brackets
  bracketTopLeft: {
    position: 'absolute', top: BRACKET_OFFSET, left: BRACKET_OFFSET,
    width: BRACKET_SIZE, height: BRACKET_SIZE,
    borderTopWidth: BRACKET_THICKNESS, borderLeftWidth: BRACKET_THICKNESS,
    borderColor: BRACKET_COLOR,
  },
  bracketTopRight: {
    position: 'absolute', top: BRACKET_OFFSET, right: BRACKET_OFFSET,
    width: BRACKET_SIZE, height: BRACKET_SIZE,
    borderTopWidth: BRACKET_THICKNESS, borderRightWidth: BRACKET_THICKNESS,
    borderColor: BRACKET_COLOR,
  },
  bracketBottomLeft: {
    position: 'absolute', bottom: BRACKET_OFFSET, left: BRACKET_OFFSET,
    width: BRACKET_SIZE, height: BRACKET_SIZE,
    borderBottomWidth: BRACKET_THICKNESS, borderLeftWidth: BRACKET_THICKNESS,
    borderColor: BRACKET_COLOR,
  },
  bracketBottomRight: {
    position: 'absolute', bottom: BRACKET_OFFSET, right: BRACKET_OFFSET,
    width: BRACKET_SIZE, height: BRACKET_SIZE,
    borderBottomWidth: BRACKET_THICKNESS, borderRightWidth: BRACKET_THICKNESS,
    borderColor: BRACKET_COLOR,
  },

  yearBadge: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    letterSpacing: 3,
    marginBottom: SPACING.lg,
    textShadowColor: 'rgba(255,215,0,0.5)',
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 12,
  },

  titleRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: SPACING.sm,
  },
  titleWhite: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
  },
  titleGold: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
  },

  divider: {
    width: 60, height: 1,
    backgroundColor: COLORS.gold,
    opacity: 0.5,
    marginBottom: SPACING.lg,
  },

  tagline: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.lg,
    marginBottom: SPACING.xxl + SPACING.lg,
    letterSpacing: 0.5,
  },

  ctaButton: {
    width: '100%',
    borderRadius: RADIUS.full,
    overflow: 'hidden',
    marginBottom: SPACING.lg,
    ...SHADOWS.goldGlow,
  },
  ctaGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    gap: SPACING.sm,
  },
  ctaIcon: { marginRight: SPACING.xs },
  ctaText: {
    color: COLORS.textOnGold,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    flex: 1,
    textAlign: 'center',
    marginLeft: -28,
  },

  skipBtn: {
    marginBottom: SPACING.xxxl,
    paddingVertical: SPACING.sm,
  },
  skipText: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.medium,
    textDecorationLine: 'underline',
  },

  features: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: SPACING.lg,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,215,0,0.1)',
  },
  featureItem: {
    alignItems: 'center',
    gap: SPACING.xs,
  },
  featureLabel: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    marginTop: SPACING.xs,
  },
});
