import { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';

export const EASING = {
  standard: Easing.bezier(0.25, 0.1, 0.25, 1.0),
  decelerate: Easing.bezier(0.0, 0.0, 0.2, 1.0),
  sine: Easing.inOut(Easing.sin),
  smooth: Easing.bezier(0.4, 0.0, 0.2, 1.0),
};

export function useEntryAnimation({ delay = 0, distance = 20, duration = 400 } = {}) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(distance)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration, delay, easing: EASING.decelerate, useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0, duration, delay, easing: EASING.decelerate, useNativeDriver: true,
      }),
    ]).start();
  }, []);

  return { opacity, transform: [{ translateY }] };
}

export function useFloatAnimation({ amplitude = 6, period = 3000, delay = 0 } = {}) {
  const translateY = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(translateY, {
          toValue: -amplitude, duration: period / 2, delay, easing: EASING.sine, useNativeDriver: true,
        }),
        Animated.timing(translateY, {
          toValue: amplitude, duration: period / 2, easing: EASING.sine, useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return { transform: [{ translateY }] };
}

export function useGlowPulse({ minOpacity = 0.3, maxOpacity = 0.8, period = 2000 } = {}) {
  const opacity = useRef(new Animated.Value(minOpacity)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: maxOpacity, duration: period / 2, easing: EASING.sine, useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: minOpacity, duration: period / 2, easing: EASING.sine, useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return { opacity };
}

export function usePressScale({ pressedScale = 0.95, bounciness = 8 } = {}) {
  const scale = useRef(new Animated.Value(1)).current;

  const onPressIn = () =>
    Animated.spring(scale, { toValue: pressedScale, bounciness, useNativeDriver: true }).start();

  const onPressOut = () =>
    Animated.spring(scale, { toValue: 1, bounciness, useNativeDriver: true }).start();

  return { scale: { transform: [{ scale }] }, onPressIn, onPressOut };
}

export function usePulseRing({ delay = 0, period = 1800, maxScale = 1.6 } = {}) {
  const scale = useRef(new Animated.Value(1)).current;
  const opacity = useRef(new Animated.Value(0.6)).current;

  useEffect(() => {
    const anim = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, {
          toValue: maxScale, duration: period, delay, easing: EASING.decelerate, useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0, duration: period, delay, easing: EASING.decelerate, useNativeDriver: true,
        }),
      ])
    );
    anim.start();
    return () => anim.stop();
  }, []);

  return { transform: [{ scale }], opacity };
}

export function useTabIconAnimation(focused) {
  const scale = useRef(new Animated.Value(focused ? 1.15 : 1)).current;

  useEffect(() => {
    Animated.spring(scale, {
      toValue: focused ? 1.15 : 1,
      bounciness: 10,
      useNativeDriver: true,
    }).start();
  }, [focused]);

  return { transform: [{ scale }] };
}
