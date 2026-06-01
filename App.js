import './src/i18n'; // i18n must be imported before any t() usage
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';

import { COLORS, NAV_THEME, FONTS, SPACING, RADIUS, SHADOWS } from './src/theme';
import { isOnboarded } from './src/services/storage';
import { initRevenueCat, getSubscriptionStatus } from './src/services/subscription';

import ScanScreen from './src/screens/ScanScreen';
import AlbumScreen from './src/screens/AlbumScreen';
import TradeScreen from './src/screens/TradeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { useTabIconAnimation } from './src/hooks/useAnimations';

const Tab = createBottomTabNavigator();

const TAB_ICONS = {
  Scanner: '📷',
  Album: '📒',
  Trade: '🔄',
  Schedule: '📅',
  Profile: '👤',
};

function TabBar({ state, descriptors, navigation }) {
  const { t } = useTranslation();
  const TAB_LABELS = {
    Scanner: t('tabs.scanner'),
    Album: t('tabs.album'),
    Trade: t('tabs.trade'),
    Schedule: t('tabs.schedule'),
    Profile: t('tabs.profile'),
  };

  return (
    <View style={tabStyles.bar}>
      <View style={tabStyles.goldLine} />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = TAB_LABELS[route.name] ?? route.name;
        const icon = TAB_ICONS[route.name] ?? '●';

        const onPress = () => {
          if (!focused) navigation.navigate(route.name);
        };

        return (
          <TabItem
            key={route.name}
            icon={icon}
            label={label}
            focused={focused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function TabItem({ icon, label, focused, onPress }) {
  const anim = useTabIconAnimation(focused);
  return (
    <TouchableOpacity style={tabStyles.item} onPress={onPress} activeOpacity={0.8}>
      {focused ? (
        <View style={tabStyles.activePill}>
          <Animated.Text style={[tabStyles.icon, anim]}>{icon}</Animated.Text>
          <Text style={tabStyles.activeLabel}>{label}</Text>
        </View>
      ) : (
        <Animated.Text style={[tabStyles.iconInactive, anim]}>{icon}</Animated.Text>
      )}
    </TouchableOpacity>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [appReady, setAppReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);

  useEffect(() => {
    const init = async () => {
      await initRevenueCat();
      const [ob, sub] = await Promise.all([
        isOnboarded(),
        getSubscriptionStatus(),
      ]);
      setOnboarded(ob);
      setIsPro(sub.isPro);
      setAppReady(true);
    };
    init();
  }, []);

  if (!appReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>⚽</Text>
        <Text style={styles.splashTitle}>StickerSwap</Text>
        <Text style={styles.splashSub}>World Cup 2026</Text>
      </View>
    );
  }

  if (!onboarded) {
    return (
      <SafeAreaProvider>
        <StatusBar style="light" />
        <OnboardingScreen onComplete={() => setOnboarded(true)} />
      </SafeAreaProvider>
    );
  }

  const sharedProps = {
    isPro,
    onShowPaywall: () => setShowPaywall(true),
  };

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar style="light" />
        <NavigationContainer theme={NAV_THEME}>
          <Tab.Navigator
            tabBar={props => <TabBar {...props} />}
            screenOptions={{
              headerStyle: { backgroundColor: '#111D14', borderBottomColor: COLORS.border, borderBottomWidth: 1 },
              headerTintColor: COLORS.textPrimary,
              headerTitleStyle: { fontWeight: FONTS.weights.bold, color: COLORS.textPrimary },
            }}
          >
            <Tab.Screen
              name="Scanner"
              options={{ title: t('scanner.title') }}
            >
              {() => <ScanScreen {...sharedProps} />}
            </Tab.Screen>

            <Tab.Screen
              name="Album"
              options={{ title: t('album.title') }}
            >
              {() => <AlbumScreen {...sharedProps} />}
            </Tab.Screen>

            <Tab.Screen
              name="Trade"
              options={{ title: t('trade.title') }}
            >
              {() => <TradeScreen {...sharedProps} />}
            </Tab.Screen>

            <Tab.Screen
              name="Schedule"
              options={{ title: t('schedule.title') }}
            >
              {() => <ScheduleScreen />}
            </Tab.Screen>

            <Tab.Screen
              name="Profile"
              options={{ title: t('profile.title') }}
            >
              {() => <ProfileScreen {...sharedProps} />}
            </Tab.Screen>
          </Tab.Navigator>
        </NavigationContainer>

        {/* Paywall modal */}
        <Modal visible={showPaywall} animationType="slide" statusBarTranslucent>
          <PaywallScreen
            onClose={() => setShowPaywall(false)}
            onUnlocked={() => { setIsPro(true); setShowPaywall(false); }}
          />
        </Modal>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  splashEmoji: { fontSize: 64, marginBottom: SPACING.lg },
  splashTitle: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.xxxl,
    fontWeight: FONTS.weights.black,
  },
  splashSub: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.xl,
    marginTop: SPACING.sm,
  },
});

const tabStyles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: '#111D14',
    paddingBottom: SPACING.xl,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    position: 'relative',
  },
  goldLine: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.gold,
    opacity: 0.4,
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 56,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.greenDim,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    gap: SPACING.xs,
    borderWidth: 1,
    borderColor: COLORS.greenLight,
  },
  icon: { fontSize: 18 },
  iconInactive: { fontSize: 20, opacity: 0.5 },
  activeLabel: {
    color: COLORS.greenBright,
    fontSize: FONTS.sizes.xs,
    fontWeight: FONTS.weights.semibold,
  },
});
