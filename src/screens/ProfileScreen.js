import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Share, Switch,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import i18n from '../i18n';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { TOTAL_STICKERS } from '../data/stickerCatalog';
import { TEAMS, GROUPS } from '../data/stickerTypes';
import { loadCollection, loadProfile, saveProfile } from '../services/storage';
import { STICKER_BY_ID } from '../data/stickerCatalog';
import GoldButton from '../components/GoldButton';

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

  useFocusEffect(useCallback(() => {
    loadCollection().then(setCollection);
    loadProfile().then(p => { setProfile(p); setNameInput(p.displayName); });
  }, []));

  if (!profile) return null;

  const owned = collection.have.length;
  const missing = TOTAL_STICKERS - owned;
  const percent = Math.round((owned / TOTAL_STICKERS) * 100);
  const packsNeeded = Math.ceil(missing / STICKERS_PER_PACK);
  const costEUR = (packsNeeded * PACK_PRICE_EUR).toFixed(2);
  const costUSD = (packsNeeded * PACK_PRICE_USD).toFixed(2);
  const isDE = i18n.language === 'de';

  const teamsComplete = Object.keys(TEAMS).filter(code => {
    const teamStickers = Object.values(STICKER_BY_ID).filter(s => s.team === code);
    return teamStickers.length > 0 && teamStickers.every(s => collection.have.includes(s.id));
  }).length;

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
              {isPro ? '★ Premium aktiv' : 'Premium freischalten'}
            </Text>
          </TouchableOpacity>
        </View>
      </View>
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
  saveNameBtn: { marginLeft: SPACING.md, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, backgroundColor: COLORS.greenDim, borderRadius: RADIUS.sm },
  saveNameText: { color: COLORS.greenBright, fontSize: FONTS.sizes.sm },
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
  langToggle: { backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs },
  langText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  radiusRow: { flexDirection: 'row', gap: SPACING.sm, marginTop: SPACING.sm },
  radiusBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceRaised, borderWidth: 1, borderColor: COLORS.border },
  radiusBtnActive: { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenLight },
  radiusBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  radiusBtnTextActive: { color: COLORS.greenBright, fontWeight: FONTS.weights.semibold },
  proBadge: { backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, borderWidth: 1, borderColor: COLORS.border },
  proBadgeActive: { backgroundColor: COLORS.goldDeep, borderColor: COLORS.gold },
  proBadgeText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  proBadgeTextActive: { color: COLORS.gold, fontWeight: FONTS.weights.semibold },
});
