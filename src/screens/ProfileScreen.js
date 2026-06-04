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
import * as ExpoClipboard from 'expo-clipboard';
import {
  getPushEnabled,
  setPushEnabled,
  requestNotificationPermission,
  getPermissionStatus,
  initNotifications,
} from '../services/notifications';

const PROMO_CODES = [
  {
    id: 'fifa',
    emoji: '⚽',
    title: 'FIFA Digital Packs',
    code: 'FIFA-2026-PLAY',
    reward: 'Deluxe Digital Packs',
    how: 'In der FIFA Panini Collection App eingeben',
    url: 'https://fifa.com/paninistickeralbum',
    expires: '30.09.2026',
  },
  {
    id: 'rewards',
    emoji: '🏆',
    title: 'FIFA Rewards',
    code: 'QR-Code im Album scannen',
    reward: 'Offizieller digitaler Stempel + FIFA Points',
    how: 'QR-Code im Album mit Kamera scannen',
    url: 'https://rewards.fifa.com',
    expires: null,
  },
  {
    id: 'nachbestellung',
    emoji: 'ðŸ“¦',
    title: 'Panini Nachbestellung',
    code: '00540AD',
    reward: '10% Rabatt auf fehlende Sticker',
    how: 'Auf panini.de beim Checkout eingeben',
    url: 'https://www.panini.de/shp_deu_de/sticker-sammeln/nachbestellservice',
    expires: null,
  },
];
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
      Alert.alert('Feedback', `Schreib uns an:\n${SUPPORT_EMAIL}`);
    }
  };

  const handleVersionTap = () => {
    versionTapCount.current += 1;
    if (versionTapCount.current >= 5) {
      versionTapCount.current = 0;
      Alert.alert(
        '🔧 Admin',
        'Scan-Zähler zurücksetzen?',
        [
          { text: 'Abbrechen', style: 'cancel' },
          {
            text: 'Reset', style: 'destructive',
            onPress: async () => {
              await resetScanCount();
              Alert.alert('✅', 'Scan-Zähler zurückgesetzt');
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

  const handleSaveName = async () => {
    const updated = await saveProfile({ displayName: nameInput });
    setProfile(updated);
    setEditingName(false);
  };

  const handleRadiusChange = async (value) => {
    const updated = await saveProfile({ matchRadius: value });
    setProfile(updated);
  };

  const handleLanguageToggle = async () => {
    const newLang = i18n.language === 'de' ? 'en' : 'de';
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
          '🔔 Benachrichtigungen',
          'Benachrichtigungen sind in den System-Einstellungen deaktiviert. Bitte dort aktivieren.',
          [
            { text: 'Abbrechen', style: 'cancel' },
            {
              text: 'Einstellungen öffnen',
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
              {profile.displayName || 'Collector'} ✎
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
        <Text style={styles.cardTitle}>💰 Kosten bis Fertigstellung</Text>
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
            <Text style={styles.langText}>{i18n.language === 'de' ? '🇩🇪 DE' : '🇬🇧 EN'}</Text>
          </TouchableOpacity>
        </View>

        {/* Push Notifications */}
        <View style={styles.settingRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.settingLabel}>🔔 Benachrichtigungen</Text>
            <Text style={styles.settingHint}>Spielerinnerungen, Tausch-Matches, Meilensteine</Text>
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
        <View style={styles.settingRow}>
          <Text style={styles.settingLabel}>{t('profile.settings.premium')}</Text>
          <TouchableOpacity
            onPress={isPro ? undefined : onShowPaywall}
            style={[styles.proBadge, isPro && styles.proBadgeActive]}
          >
            <Text style={[styles.proBadgeText, isPro && styles.proBadgeTextActive]}>
              {isPro ? '✅ Premium aktiv' : 'Premium freischalten'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Feedback Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>💬 Support & Feedback</Text>
        <TouchableOpacity onPress={handleSendFeedback} style={styles.feedbackBtn}>
          <Text style={styles.feedbackText}>ðŸ“§ Feedback senden</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={handleSendFeedback} style={[styles.feedbackBtn, { marginTop: SPACING.sm }]}>
          <Text style={styles.feedbackText}>🐛 Bug melden</Text>
        </TouchableOpacity>
      </View>

      {/* Promo Codes Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>🎁 Promo Codes & Links</Text>
        {PROMO_CODES.map(promo => (
          <View key={promo.id} style={styles.promoItem}>
            <View style={styles.promoHeader}>
              <Text style={styles.promoEmoji}>{promo.emoji}</Text>
              <Text style={styles.promoTitle}>{promo.title}</Text>
              {promo.expires && <Text style={styles.promoExpires}>bis {promo.expires}</Text>}
            </View>
            <TouchableOpacity
              style={styles.promoCodeBox}
              onPress={() => {
                ExpoClipboard.setStringAsync(promo.code);
                Alert.alert('Kopiert!', `"${promo.code}" wurde in die Zwischenablage kopiert.`);
              }}
            >
              <Text style={styles.promoCode}>{promo.code}</Text>
              <Text style={styles.promoCopy}>ðŸ“‹</Text>
            </TouchableOpacity>
            <Text style={styles.promoReward}>🎁 {promo.reward}</Text>
            <Text style={styles.promoHow}>â„¹ï¸ {promo.how}</Text>
            <TouchableOpacity onPress={() => Linking.openURL(promo.url)} style={styles.promoLink}>
              <Text style={styles.promoLinkText}>🌐 Jetzt öffnen →</Text>
            </TouchableOpacity>
          </View>
        ))}
      </View>

      {/* Version â€” 5x tippen fÃ¼r Admin-Reset */}
      <TouchableOpacity onPress={handleVersionTap} style={styles.versionRow}>
        <Text style={styles.versionText}>StickerScout 2026 Â· v{APP_VERSION} Â· NCN-NetConsulting GmbH</Text>
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
  displayName: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg, marginBottom: SPACING.md },
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
  proBadge: { backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  proBadgeActive: { backgroundColor: COLORS.goldDeep, borderColor: COLORS.gold },
  proBadgeText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  proBadgeTextActive: { color: COLORS.gold, fontWeight: '600' },
  feedbackBtn: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  feedbackText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
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
