import React, { useRef, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS } from '../theme';
import GoldButton from '../components/GoldButton';
import { setOnboarded } from '../services/storage';

const { width } = Dimensions.get('window');

const SLIDES_DATA = [
  { key: 'slide1', emoji: '📷', titleKey: 'onboarding.slide1.title', textKey: 'onboarding.slide1.text' },
  { key: 'slide2', emoji: '📒', titleKey: 'onboarding.slide2.title', textKey: 'onboarding.slide2.text' },
  { key: 'slide3', emoji: '🔄', titleKey: 'onboarding.slide3.title', textKey: 'onboarding.slide3.text' },
];

export default function OnboardingScreen({ onComplete }) {
  const { t } = useTranslation();
  const listRef = useRef(null);
  const [activeIndex, setActiveIndex] = useState(0);

  const handleNext = () => {
    if (activeIndex < SLIDES_DATA.length - 1) {
      listRef.current?.scrollToIndex({ index: activeIndex + 1 });
      setActiveIndex(i => i + 1);
    } else {
      handleComplete();
    }
  };

  const handleComplete = async () => {
    await setOnboarded();
    onComplete?.();
  };

  return (
    <LinearGradient colors={GRADIENTS.heroGreen} style={styles.container}>
      {/* Skip button */}
      <TouchableOpacity style={styles.skipBtn} onPress={handleComplete}>
        <Text style={styles.skipText}>{t('onboarding.skip')}</Text>
      </TouchableOpacity>

      {/* Slides */}
      <FlatList
        ref={listRef}
        data={SLIDES_DATA}
        keyExtractor={s => s.key}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEnabled={false}
        renderItem={({ item }) => (
          <View style={styles.slide}>
            <Text style={styles.slideEmoji}>{item.emoji}</Text>
            <Text style={styles.slideTitle}>{t(item.titleKey)}</Text>
            <Text style={styles.slideText}>{t(item.textKey)}</Text>
          </View>
        )}
      />

      {/* Dots */}
      <View style={styles.dots}>
        {SLIDES_DATA.map((_, i) => (
          <View key={i} style={[styles.dot, i === activeIndex && styles.dotActive]} />
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <GoldButton
          title={activeIndex < SLIDES_DATA.length - 1 ? t('onboarding.next') : t('onboarding.start')}
          onPress={handleNext}
        />
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  skipBtn: { position: 'absolute', top: SPACING.xxxl, right: SPACING.xl, zIndex: 10 },
  skipText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  slide: {
    width,
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.xxxl,
  },
  slideEmoji: { fontSize: 80, marginBottom: SPACING.xl },
  slideTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  slideText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.lg,
    textAlign: 'center',
    lineHeight: 26,
  },
  dots: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.xl },
  dot: { width: 8, height: 8, borderRadius: RADIUS.full, backgroundColor: COLORS.border },
  dotActive: { backgroundColor: COLORS.gold, width: 24 },
  ctaArea: { padding: SPACING.xl, paddingBottom: SPACING.xxxl, alignItems: 'center' },
});
