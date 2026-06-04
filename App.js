import './src/i18n'; // i18n must be imported before any t() usage
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, Modal, Animated, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppIcon from './src/components/AppIcon';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import * as Notifications from 'expo-notifications';

import { COLORS, NAV_THEME, FONTS, SPACING, RADIUS, SHADOWS } from './src/theme';
import { isOnboarded } from './src/services/storage';
import { initRevenueCat, getSubscriptionStatus } from './src/services/subscription';
import { initNotifications } from './src/services/notifications';

import ScanScreen from './src/screens/ScanScreen';
import AlbumScreen from './src/screens/AlbumScreen';
import TradeScreen from './src/screens/TradeScreen';
import ScheduleScreen from './src/screens/ScheduleScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import RingtonesScreen from './src/screens/RingtonesScreen';
import OnboardingScreen from './src/screens/OnboardingScreen';
import PaywallScreen from './src/screens/PaywallScreen';
import { useTabIconAnimation } from './src/hooks/useAnimations';

const Tab = createBottomTabNavigator();

// Custom icon names per tab (AppIcon)
const TAB_ICONS = {
  Scanner:   'scan',
  Album:     'album-book',
  Trade:     null,
  Schedule:  'calendar',
  Assistant: null,
  Ringtones: null,
  Profile:   'profile-user',
};

const TAB_LABEL_KEYS = {
  Scanner:   'tabs.scanner',
  Album:     'tabs.album',
  Trade:     'tabs.trade',
  Schedule:  'tabs.schedule',
  Assistant: 'tabs.assistant',
  Ringtones: 'tabs.ringtones',
  Profile:   'tabs.profile',
};

function TabBar({ state, descriptors, navigation }) {
  const { t } = useTranslation();
  return (
    <View style={tabStyles.bar}>
      <View style={tabStyles.topLine} />
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const customIcon = TAB_ICONS[route.name];
        const label = t(TAB_LABEL_KEYS[route.name] ?? route.name);
        const onPress = () => { if (!focused) navigation.navigate(route.name); };
        const fallback = route.name === 'Trade'
          ? (focused ? 'swap-horizontal' : 'swap-horizontal-outline')
          : route.name === 'Assistant'
          ? (focused ? 'chatbubble-ellipses' : 'chatbubble-ellipses-outline')
          : route.name === 'Ringtones'
          ? (focused ? 'musical-notes' : 'musical-notes-outline')
          : 'ellipse';
        return (
          <TabItem
            key={route.name}
            customIcon={customIcon}
            fallbackIcon={fallback}
            label={label}
            focused={focused}
            onPress={onPress}
          />
        );
      })}
    </View>
  );
}

function TabItem({ customIcon, fallbackIcon, label, focused, onPress }) {
  const anim = useTabIconAnimation(focused);
  return (
    <TouchableOpacity style={tabStyles.item} onPress={onPress} activeOpacity={0.75}>
      <Animated.View style={[tabStyles.iconWrap, focused && tabStyles.iconWrapActive, anim]}>
        {customIcon ? (
          <AppIcon name={customIcon} variant={focused ? 'gold' : 'grey'} size={28} />
        ) : (
          <Ionicons name={fallbackIcon} size={26} color={focused ? COLORS.gold : '#888'} />
        )}
      </Animated.View>
      <Text style={[tabStyles.label, focused && tabStyles.labelActive]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

export default function App() {
  const { t } = useTranslation();
  const [appReady, setAppReady] = useState(false);
  const [onboarded, setOnboarded] = useState(false);
  const [isPro, setIsPro] = useState(false);
  const [showPaywall, setShowPaywall] = useState(false);
  const navigationRef = useRef(null);
  const notifResponseListener = useRef(null);

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

      // Push-Notifications initialisieren (Permission + geplante Notifications)
      initNotifications().catch(() => {});
    };
    init();
  }, []);

  // Notification-Tap Handler — zur richtigen Seite navigieren
  useEffect(() => {
    notifResponseListener.current = Notifications.addNotificationResponseReceivedListener(
      response => {
        const data = response.notification.request.content.data ?? {};
        const nav  = navigationRef.current;
        if (!nav) return;
        switch (data.type) {
          case 'trade_match':
            nav.navigate('Trade');
            break;
          case 'game_reminder':
          case 'game_kickoff':
            nav.navigate('Schedule');
            break;
          case 'early_bird':
            setShowPaywall(true);
            break;
          case 'milestone':
          case 'scan_reset':
            nav.navigate('Album');
            break;
          default:
            break;
        }
      }
    );
    return () => {
      if (notifResponseListener.current) {
        Notifications.removeNotificationSubscription(notifResponseListener.current);
      }
    };
  }, []);

  if (!appReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashEmoji}>🏆</Text>
        <Text style={styles.splashTitle}>StickerScout 2026</Text>
        <Text style={styles.splashSub}>Scannen. Tauschen. Sammeln.</Text>
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
        <NavigationContainer theme={NAV_THEME} ref={navigationRef}>
          <Tab.Navigator
            tabBar={props => <TabBar {...props} />}
            screenOptions={{
              headerShown: false,
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
              name="Assistant"
              options={{ title: 'Assistent' }}
            >
              {() => <AssistantScreen />}
            </Tab.Screen>

            <Tab.Screen
              name="Ringtones"
              options={{ title: t('tabs.ringtones') }}
            >
              {() => <RingtonesScreen {...sharedProps} />}
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
    backgroundColor: '#141414',
    paddingBottom: SPACING.xxl,
    paddingTop: SPACING.sm,
    paddingHorizontal: SPACING.xs,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  topLine: {
    position: 'absolute',
    top: 0, left: 0, right: 0,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  item: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: SPACING.sm,
  },
  iconWrap: {
    width: 52, height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: RADIUS.md,
  },
  iconWrapActive: {
    backgroundColor: 'rgba(255,215,0,0.12)',
  },
  label: {
    fontSize: 12,
    color: '#888',
    marginTop: 3,
    fontWeight: '500',
  },
  labelActive: {
    color: COLORS.gold,
    fontWeight: '700',
  },
  // legacy (keep for safety)
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
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
