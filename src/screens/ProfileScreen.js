import React, { useState, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Share, Alert, Linking, Switch, Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as MailComposer from 'expo-mail-composer';
import Constants from 'expo-constants';
import { Ionicons } from '@expo/vector-icons';
import * as ExpoClipboard from 'expo-clipboard';
import * as Notifications from 'expo-notifications';
import {
  getPushEnabled,
  setPushEnabled,
  requestNotificationPermission,
  getPermissionStatus,
  initNotifications,
  scheduleDailyScanReset,
} from '../services/notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Promo-Codes entfernt (Lizenzgründe)
import i18n from '../i18n';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { TOTAL_STICKERS, STICKER_BY_ID } from '../data/stickerCatalog';
import { loadCollection, loadProfile, saveProfile, resetScanCount } from '../services/storage';
import GoldButton from '../components/GoldButton';

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const SUPPORT_EMAIL = 'support@ncn.at';

const PACK_PRICE_EUR = 1.20;
const PACK_PRICE_USD = 1.30;
const STICKERS_PER_PACK = 5;

const RADIUS_OPTIONS = [
  { key: '1km', label: '1 km', value: 1 },
  { key: '5km', label: '5 km', value: 5 },
  { key: '10km', label: '10 km', value: 10 },
  { key: 'anywhere', label: '∞', value: 9999 },
];

export default function ProfileScreen({ isPro, onShowPaywall }) {
  const { t } = useTranslation();
  const [collection, setCollection] = useState({ have: [], need: [], duplicates: {} });
  const [profile, setProfile] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [nameInput, setNameInput] = useState('');
  const [pushEnabled, setPushEnabledState] = useState(true);
  const versionTapCount = useRef(0);

  useFocusEffect(useCallback(() => {
    loadCollection().then(setCollection);
    loadProfile().then(p => { setProfile(p); setNameInput(p.displayName); });
    getPushEnabled().then(setPushEnabledState);
  }, []));

  const handleSendFeedback = async () => {
    const available = await MailComposer.isAvailableAsync();
    if (available) {
      await MailComposer.composeAsync({
        recipients: [SUPPORT_EMAIL],
        subject: `StickerScout 2026 Feedback (v${APP_VERSION})`,
        body: `\n\n---\nApp Version: ${APP_VERSION}\nPlattform: ${require('react-native').Platform.OS}`,
      });
    } else {
      Alert.alert(t('profile.feedbackTitle'), t('profile.feedbackEmailPrompt', { email: SUPPORT_EMAIL }));
    }
  };

  const handleVersionTap = () => {
    versionTapCount.current += 1;
    if (versionTapCount.current >= 5) {
      versionTapCount.current = 0;
      Alert.alert(
        t('profile.adminTitle'),
        t('profile.adminBody'),
        [
          { text: t('common.cancel'), style: 'cancel' },
          {
            text: '🔔 Test-Notification',
            onPress: async () => {
              // Notification-Flag zurücksetzen → sofort neu planen → feuert in 5s
              await AsyncStorage.removeItem('@stickerscout_scan_reset_set');
              await Notifications.cancelAllScheduledNotificationsAsync();
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: '🏆 Bereit für neue Sticker?',
                  body: '10 Freiscans warten – scanne dein nächstes Sammelstück!',
                  data: { type: 'scan_reset' },
                  ...(Platform.OS === 'android' && { channelId: 'general' }),
                },
                trigger: { type: 'timeInterval', seconds: 5 },
              });
              Alert.alert('✅', 'Notification kommt in 5 Sekunden – App in den Hintergrund!');
            },
          },
          {
            text: t('profile.adminReset'), style: 'destructive',
            onPress: async () => {
              await resetScanCount();
              Alert.alert('✅', t('profile.adminResetDone'));
            },
          },
        ]
      );
    }
  };

  if (!profile) return null;

  const owned = collection.have.length;
  const missing = TOTAL_STICKERS - owned;
  const percent = Math.round((owned / TOTAL_STICKERS) * 100);
  const packsNeeded = Math.ceil(missing / STICKERS_PER_PACK);
  const costEUR = (packsNeeded * PACK_PRICE_EUR).toFixed(2);
  const costUSD = (packsNeeded * PACK_PRICE_USD).toFixed(2);
  const isDE = i18n.language === 'de';

  const teamsComplete = Object.values(STICKER_BY_ID)
    .reduce((acc, s) => { if (s.team) acc.add(s.team); return acc; }, new Set())
    .size > 0
    ? [...new Set(Object.values(STICKER_BY_ID).filter(s => s.team).map(s => s.team))]
        .filter(code => {
          const teamStickers = Object.values(STICKER_BY_ID).filter(s => s.team === code);
          return teamStickers.length > 0 && teamStickers.every(s => collection.have.includes(s.id));
        }).length
    : 0;

  const handleShare = async () => {
    const text = t('profile.shareText', { percent, missing });
    await Share.share({ message: text });
  };

  const handleShareApp = async () => {
    await Share.share({
      message: t('profile.shareAppText'),
    });
  };

  const handleSaveName = async () => {
    const updated = await saveProfile({ displayName: nameInput });
    setProfile(updated);
    setEditingName(false);
  };

  const handleRadiusChange = async (value) => {
    const updated = await saveProfile({ matchRadius: value });
    setProfile(updated);
  };

  const LANGUAGES = ['de', 'en', 'es', 'pt', 'fr'];
  const LANGUAGE_LABELS = { de: '🇩🇪 DE', en: '🇬🇧 EN', es: '🇪🇸 ES', pt: '🇧🇷 PT', fr: '🇫🇷 FR' };

  const handleLanguageToggle = async () => {
    const idx = LANGUAGES.indexOf(i18n.language);
    const newLang = LANGUAGES[(idx + 1) % LANGUAGES.length];
    await i18n.changeLanguage(newLang);
    await saveProfile({ language: newLang });
    setProfile(p => ({ ...p, language: newLang }));
  };

  const handlePushToggle = async (value) => {
    if (value) {
      // Einschalten: Permission anfordern, dann Notifications aktivieren
      const status = await getPermissionStatus();
      if (status === 'denied') {
        Alert.alert(
          t('profile.notificationsTitle'),
          t('profile.notificationsDenied'),
          [
            { text: t('common.cancel'), style: 'cancel' },
            {
              text: t('profile.notificationsOpenSettings'),
              onPress: () => {
                const { Linking } = require('react-native');
                Linking.openSettings();
              },
            },
          ]
        );
        return;
      }
      const granted = await requestNotificationPermission();
      if (granted) {
        await setPushEnabled(true);
        setPushEnabledState(true);
        await initNotifications();
      }
    } else {
      await setPushEnabled(false);
      setPushEnabledState(false);
    }
  };

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      {/* Hero card */}
      <LinearGradient colors={GRADIENTS.heroGreen} style={styles.hero}>
        {/* Name */}
        {editingName ? (
          <View style={styles.nameRow}>
            <TextInput
              style={styles.nameInput}
              value={nameInput}
              onChangeText={setNameInput}
              onSubmitEditing={handleSaveName}
              autoFocus
            />
            <TouchableOpacity onPress={handleSaveName} style={styles.saveNameBtn}>
              <Text style={styles.saveNameText}>{t('common.save')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setEditingName(true)}>
            <Text style={styles.displayName}>
              {profile.displayName || t('profile.defaultName')} ✎
            </Text>
          </TouchableOpacity>
        )}

        {/* Progress circle / stats */}
        <Text style={styles.percentDisplay}>{percent}%</Text>
        <Text style={styles.progressSub}>
          {t('profile.albumStats')}: {owned}/{TOTAL_STICKERS}
        </Text>
        <Text style={styles.teamsSub}>
          {t('profile.teamsComplete', { count: teamsComplete })}
        </Text>

        <GoldButton
          title={`🏆 ${t('profile.share')}`}
          onPress={handleShare}
          style={{ marginTop: SPACING.lg }}
          small
        />
      </LinearGradient>

      {/* Cost estimate */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.costTitle')}</Text>
        <Text style={styles.costLine}>
          {isDE
            ? t('profile.estimatedCost', { amount: costEUR })
            : t('profile.estimatedCost', { amount: costUSD })}
        </Text>
        <Text style={styles.packsLine}>{t('profile.packsNeeded', { packs: packsNeeded })}</Text>
      </View>

      {/* Settings */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>{t('profile.settings.title')}</Text>

        {/* Language */}
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profile.settings.language')}</Text>
          <TouchableOpacity onPress={handleLanguageToggle} style={styles.langToggle}>
            <Text style={styles.langText}>{LANGUAGE_LABELS[i18n.language] ?? '🇬🇧 EN'}</Text>
          </TouchableOpacity>
        </View>

        {/* Push Notifications */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>{t('profile.notificationsTitle')}</Text>
            <Text style={styles.settingHint}>{t('profile.notificationsHint')}</Text>
          </View>
          <Switch
            value={pushEnabled}
            onValueChange={handlePushToggle}
            trackColor={{ false: 'rgba(255,255,255,0.15)', true: 'rgba(245,192,51,0.45)' }}
            thumbColor={pushEnabled ? COLORS.gold : 'rgba(255,255,255,0.6)'}
            ios_backgroundColor="rgba(255,255,255,0.15)"
          />
        </View>

        {/* Match radius */}
        <View style={styles.settingBlock}>
          <Text style={styles.settingLabel}>{t('profile.settings.matchRadius')}</Text>
          <View style={styles.radiusRow}>
            {RADIUS_OPTIONS.map(opt => (
              <TouchableOpacity
                key={opt.key}
                style={[styles.radiusBtn, profile.matchRadius === opt.value && styles.radiusBtnActive]}
                onPress={() => handleRadiusChange(opt.value)}
              >
                <Text style={[styles.radiusBtnText, profile.matchRadius === opt.value && styles.radiusBtnTextActive]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Premium */}
        <View style={styles.premiumRow}>
          <TouchableOpacity
            onPress={isPro ? undefined : onShowPaywall}
            style={[styles.proBadge, isPro ? styles.proBadgeActive : styles.proBadgeUnlock, styles.proBadgeFull]}
            activeOpacity={isPro ? 1 : 0.75}
          >
            <Text style={[styles.proBadgeText, isPro ? styles.proBadgeTextActive : styles.proBadgeTextUnlock]}>
              {isPro ? t('profile.premiumActive') : t('profile.premiumUnlock')}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feedback Card */}
      <View style={styles.card}>
        <View style={styles.feedbackCardTitle}>
          <Ionicons name="chatbubble-ellipses-outline" size={20} color={COLORS.textPrimary} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.cardTitle, { marginBottom: 0, fontSize: FONTS.sizes.xl }]}>{t('profile.supportTitle')}</Text>
        </View>
        <TouchableOpacity onPress={handleShareApp} style={[styles.feedbackBtn, styles.feedbackBtnGold]}>
          <Ionicons name="share-social-outline" size={17} color={COLORS.gold} style={{ marginRight: SPACING.sm }} />
          <Text style={[styles.feedbackText, { color: COLORS.gold, fontWeight: FONTS.weights.semibold }]}>{t('profile.shareApp')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSendFeedback} style={[styles.feedbackBtn, { marginTop: SPACING.sm }]}>
          <Ionicons name="mail-outline" size={17} color={COLORS.textPrimary} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.feedbackText}>{t('profile.sendFeedback')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSendFeedback} style={[styles.feedbackBtn, { marginTop: SPACING.sm }]}>
          <Ionicons name="bug-outline" size={17} color={COLORS.textPrimary} style={{ marginRight: SPACING.sm }} />
          <Text style={styles.feedbackText}>{t('profile.reportBug')}</Text>
        </TouchableOpacity>
      </View>
      {/* Über die App / Disclaimer */}
      <View style={styles.disclaimerCard}>
        <Text style={styles.disclaimerTitle}>{t('legal.aboutApp')}</Text>
        <Text style={styles.disclaimerText}>{t('legal.disclaimer')}</Text>
      </View>

      {/* Version — 5x tippen für Admin-Reset */}
      <TouchableOpacity onPress={handleVersionTap} style={styles.versionRow}>
        <Text style={styles.versionText}>StickerScout 2026 · v{APP_VERSION} · NCN-NetConsulting GmbH</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  content: { paddingBottom: SPACING.xxxl },
  hero: { padding: SPACING.xl, alignItems: 'center' },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  nameInput: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.gold,
    paddingBottom: SPACING.xs,
    minWidth: 120,
  },
  saveNameBtn: { marginLeft: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.blueTint, borderRadius: RADIUS.sm },
  saveNameText: { color: COLORS.blue, fontSize: FONTS.sizes.sm },
  displayName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.bold, marginBottom: SPACING.md },
  percentDisplay: { color: COLORS.gold, fontSize: FONTS.sizes.display, fontWeight: FONTS.weights.black },
  progressSub: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semibold },
  teamsSub: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, marginTop: SPACING.xs },
  card: {
    backgroundColor: COLORS.surface,
    margin: SPACING.md,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  cardTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold, marginBottom: SPACING.md },
  costLine: { color: COLORS.gold, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semibold },
  packsLine: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, marginTop: SPACING.xs },
  settingRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingBlock: { paddingVertical: SPACING.md, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  settingLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  settingHint: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  langToggle: { backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  langText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  radiusRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  radiusBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: COLORS.border },
  radiusBtnActive: { backgroundColor: COLORS.blueTint, borderColor: COLORS.borderBlue },
  radiusBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  radiusBtnTextActive: { color: COLORS.blue, fontWeight: FONTS.weights.semibold },
  premiumRow: { paddingVertical: SPACING.md, alignItems: 'stretch' },
  proBadge: { backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  proBadgeFull: { alignItems: 'center' },
  proBadgeActive: { backgroundColor: COLORS.goldDeep, borderColor: COLORS.gold },
  proBadgeUnlock: { backgroundColor: 'rgba(245,192,51,0.12)', borderColor: COLORS.gold, borderWidth: 1.5, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.sm, borderRadius: RADIUS.full },
  proBadgeText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  proBadgeTextActive: { color: COLORS.gold, fontWeight: '600' },
  proBadgeTextUnlock: { color: COLORS.gold, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },
  feedbackCardTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  feedbackBtn: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    flexDirection: 'row',
    alignItems: 'center',
  },
  feedbackBtnGold: {
    borderColor: COLORS.gold,
    backgroundColor: 'rgba(245,192,51,0.08)',
  },
  feedbackText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  disclaimerCard: {
    margin: SPACING.md,
    marginTop: 0,
    padding: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: RADIUS.lg,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  disclaimerTitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: '700', marginBottom: SPACING.sm },
  disclaimerText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, lineHeight: 17 },
  versionRow: { alignItems: 'center', padding: SPACING.xl },
  versionText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },

  // Promo Codes
  promoItem: {
    borderTopWidth: 1, borderTopColor: COLORS.border,
    paddingTop: SPACING.md, marginTop: SPACING.md,
  },
  promoHeader: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.sm },
  promoEmoji: { fontSize: 18 },
  promoTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '700', flex: 1 },
  promoExpires: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
  promoCodeBox: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: COLORS.goldDeep, borderRadius: RADIUS.md,
    paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.gold, marginBottom: SPACING.sm,
  },
  promoCode: { color: COLORS.gold, fontSize: FONTS.sizes.md, fontWeight: '800', letterSpacing: 1 },
  promoCopy: { fontSize: 16 },
  promoReward: { color: COLORS.blue, fontSize: FONTS.sizes.sm, marginBottom: 2 },
  promoHow: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  promoLink: { alignSelf: 'flex-start' },
  promoLinkText: { color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: '600' },
});
