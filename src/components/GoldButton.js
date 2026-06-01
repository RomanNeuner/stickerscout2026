import React from 'react';
import { TouchableOpacity, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { usePressScale } from '../hooks/useAnimations';

export default function GoldButton({ title, onPress, style, disabled, small }) {
  const { scale, onPressIn, onPressOut } = usePressScale();

  return (
    <Animated.View style={[scale, style]}>
      <TouchableOpacity
        onPress={onPress}
        onPressIn={onPressIn}
        onPressOut={onPressOut}
        disabled={disabled}
        activeOpacity={1}
      >
        <LinearGradient
          colors={disabled ? ['#3A3A3A', '#555'] : GRADIENTS.goldButton}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={[styles.button, small && styles.small, disabled && styles.disabled]}
        >
          <Text style={[styles.label, small && styles.labelSmall]}>{title}</Text>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  button: {
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.gold,
  },
  small: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
  },
  disabled: {},
  label: {
    color: COLORS.textOnGold,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    letterSpacing: 0.5,
  },
  labelSmall: {
    fontSize: FONTS.sizes.md,
  },
});
