/**
 * PaywallScreen — Redesign nach Spec v1.0 (5. Juni 2026)
 *
 * Fixes:
 * - Kein Abo-Disclaimer mehr (Einmalkauf)
 * - "KI-Duplikat-Erkennung" → "Dream Team Builder unbegrenzt"
 * - Kompakter Header (Trophy-Logo + AppName + X)
 * - Micro-IAPs ohne Scrollen sichtbar
 * - Preis dynamisch (AT €1,99 / Early Bird €2,99 / Standard €3,99)
 * - Early Bird Countdown dynamisch
 * - Vector-Icons statt Emojis
 */
import React, { useState, useMemo } from 'react';
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { purchasePlan, restorePurchases } from '../services/subscription';
import {
  getEarlyBirdDays, getWMPassPrice, getSavingsLabel, getPlanLabel, isEarlyBird,
} from '../services/pricing';
import { IAP_PRODUCTS } from '../config/iap';
import { OFFERINGS, PACKAGES } from '../config/revenueCat';

// Design-Tokens (aus theme, hier inline für Kompaktheit)
const C = {
  bg:              '#0D1F2D',
  gold:            '#F5C033',
  blue:            '#4FC3F7',
  white:           '#FFFFFF',
  textBody:        '#E4EEF5',
  textMuted:       '#8CA6B8',
  textDim:         '#5F7787',
  cardBg:          'rgba(255,255,255,0.04)',
  cardBorderGold:  'rgba(245,192,51,0.35)',
  earlyBirdBorder: 'rgba(245,192,51,0.40)',
  chipBlue:        'rgba(79,195,247,0.15)',
  microBg:         'rgba(255,255,255,0.04)',
  divider:         'rgba(255,255,255,0.10)',
};

export default function PaywallScreen({ onClose, onUnlocked }) {
  const { t }    = useTranslation();
  const insets   = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);

  const days      = useMemo(() => getEarlyBirdDays(), []);
  const price     = useMemo(() => getWMPassPrice(), []);
  const savings   = useMemo(() => getSavingsLabel(), []);
  const planLabel = useMemo(() => getPlanLabel(), []);
  const earlyBird = useMemo(() => isEarlyBird(), []);

  // Feature-Liste
  const features = [
    { icon: <MaterialCommunityIcons name="infinity"          size={20} color={C.gold} />, label: t('paywall.feature1') },
    { icon: <MaterialCommunityIcons name="swap-horizontal"   size={20} color={C.gold} />, label: t('paywall.feature2') },
    { icon: <Feather                name="users"             size={20} color={C.gold} />, label: t('paywall.feature3') },
    { icon: <Feather                name="file-text"         size={20} color={C.gold} />, label: t('paywall.feature4') },
  ];

  // Micro-IAPs
  const micros = [
    { icon: 'camera-plus',   label: t('paywall.micro1'), product: IAP_PRODUCTS.SCAN_BOOST,  pkg: PACKAGES.SCAN_BOOST  },
    { icon: 'swap-horizontal',label: t('paywall.micro2'), product: IAP_PRODUCTS.TRADE_SLOTS, pkg: PACKAGES.TRADE_SLOTS },
    { icon: 'file-document',  label: t('paywall.micro3'), product: IAP_PRODUCTS.REPORT_PDF,  pkg: PACKAGES.REPORT_PDF  },
  ];

  // ── Kauf WM Pass ────────────────────────────────────────────────────────────
  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await purchasePlan(
        IAP_PRODUCTS.WM_PASS,
        OFFERINGS.DEFAULT,
        PACKAGES.WM_PASS,
      );
      if (res?.success) { onUnlocked?.(); onClose?.(); }
      else if (!res?.cancelled) Alert.alert('Fehler', 'Kauf fehlgeschlagen.');
    } catch (e) {
      Alert.alert('Fehler', e.message ?? 'Kauf fehlgeschlagen.');
    } finally { setLoading(false); }
  };

  // ── Micro-IAP Kauf ──────────────────────────────────────────────────────────
  const handleMicro = async (product, pkg) => {
    setLoading(true);
    try {
      await purchasePlan(product, OFFERINGS.DEFAULT, pkg);
    } catch (e) {
      if (!e?.userCancelled) Alert.alert('Fehler', e.message ?? 'Kauf fehlgeschlagen.');
    } finally { setLoading(false); }
  };

  // ── Restore ─────────────────────────────────────────────────────────────────
  const handleRestore = async () => {
    setLoading(true);
    try {
      const res = await restorePurchases();
      if (res?.isPro) { onUnlocked?.(); onClose?.(); }
      else Alert.alert('Wiederhergestellt', 'Keine aktiven Käufe gefunden.');
    } catch { Alert.alert('Fehler', 'Wiederherstellung fehlgeschlagen.'); }
    finally { setLoading(false); }
  };

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={[s.content, { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 24 }]}
      bounces={false}
    >
      {/* ── 1. Header ────────────────────────────────────────────────────────── */}
      <View style={s.header}>
        <View style={s.headerLeft}>
          <View style={s.logo}>
            <MaterialCommunityIcons name="trophy" size={16} color={C.bg} />
          </View>
          <Text style={s.appName}>StickerScout 2026</Text>
        </View>
        <TouchableOpacity style={s.closeBtn} onPress={onClose}>
          <Feather name="x" size={18} color={C.textMuted} />
        </TouchableOpacity>
      </View>

      {/* ── 2. Headline ──────────────────────────────────────────────────────── */}
      <Text style={s.h1}>{t('paywall.headline1')}</Text>
      <Text style={[s.h1, { color: C.gold }]}>{t('paywall.headline2')}</Text>

      {/* ── 3. Early Bird Badge ──────────────────────────────────────────────── */}
      {earlyBird && days > 0 && (
        <View style={s.earlyBird}>
          <Feather name="clock" size={18} color={C.gold} />
          <View style={{ marginLeft: 10, flex: 1 }}>
            <Text style={s.ebTitle}>{t('paywall.earlyBird', { days })}</Text>
            <Text style={s.ebSub}>{t('paywall.earlyBirdSub')}</Text>
          </View>
        </View>
      )}

      {/* ── 4. Preis-Card ────────────────────────────────────────────────────── */}
      <View style={s.priceCard}>
        <View style={s.badges}>
          <View style={s.badgeGold}>
            <Text style={s.badgeGoldTxt}>{planLabel}</Text>
          </View>
          {savings && (
            <View style={s.badgeBlue}>
              <Text style={s.badgeBlueTxt}>{savings}</Text>
            </View>
          )}
        </View>

        <View style={s.priceRow}>
          <Text style={s.price}>{price}</Text>
          <Text style={s.priceOld}>€3,99</Text>
          <Text style={s.priceSuffix}>{t('paywall.once')}</Text>
        </View>

        {features.map((f, i) => (
          <View key={i} style={s.featureRow}>
            <View style={s.featureIcon}>{f.icon}</View>
            <Text style={s.featureLabel}>{f.label}</Text>
          </View>
        ))}
      </View>

      {/* ── 5. CTA-Button ────────────────────────────────────────────────────── */}
      <TouchableOpacity
        style={[s.cta, loading && { opacity: 0.7 }]}
        onPress={handlePurchase}
        disabled={loading}
      >
        <Text style={s.ctaTxt}>{t('paywall.cta', { price })}</Text>
      </TouchableOpacity>

      {/* ── 6. CTA-Subtext ───────────────────────────────────────────────────── */}
      <Text style={s.ctaSub}>{t('paywall.ctaSub')}</Text>

      {/* ── 7. Divider ───────────────────────────────────────────────────────── */}
      <View style={s.dividerRow}>
        <View style={s.dividerLine} />
        <Text style={s.dividerTxt}>{t('paywall.orSingle')}</Text>
        <View style={s.dividerLine} />
      </View>

      {/* ── 8. Micro-IAPs ────────────────────────────────────────────────────── */}
      {micros.map((m, i) => (
        <TouchableOpacity
          key={i}
          style={s.micro}
          onPress={() => handleMicro(m.product, m.pkg)}
          disabled={loading}
        >
          <View style={s.microLeft}>
            <MaterialCommunityIcons name={m.icon} size={16} color={C.textMuted} />
            <Text style={s.microLabel}>{m.label}</Text>
          </View>
          <View style={s.microPrice}>
            <Text style={s.microPriceTxt}>€0,99</Text>
          </View>
        </TouchableOpacity>
      ))}

      {/* ── 9. Footer ────────────────────────────────────────────────────────── */}
      <TouchableOpacity onPress={onClose} style={s.freeLinkWrap}>
        <Text style={s.freeLink}>{t('paywall.continueFree')}</Text>
      </TouchableOpacity>

      <View style={s.legalRow}>
        <TouchableOpacity onPress={handleRestore}>
          <Text style={s.legalLink}>{t('paywall.restore')}</Text>
        </TouchableOpacity>
        <Text style={s.legalDot}> · </Text>
        <Text style={s.legalTxt}>{t('paywall.legal')}</Text>
      </View>
    </ScrollView>
  );
}

// ── Styles ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: C.bg },
  content: { paddingHorizontal: 20, paddingBottom: 24 },

  // Header
  header:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logo:       { width: 30, height: 30, borderRadius: 8, backgroundColor: C.gold, alignItems: 'center', justifyContent: 'center' },
  appName:    { color: C.white, fontSize: 15, fontWeight: '500' },
  closeBtn:   { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.08)', alignItems: 'center', justifyContent: 'center' },

  // Headline
  h1: { color: C.white, fontSize: 27, fontWeight: '700', lineHeight: 32, letterSpacing: -0.5, marginTop: 14 },

  // Early Bird
  earlyBird: {
    flexDirection: 'row', alignItems: 'center',
    marginTop: 12, padding: 12,
    borderWidth: 1, borderColor: C.earlyBirdBorder,
    borderRadius: 12,
    backgroundColor: 'rgba(245,192,51,0.06)',
  },
  ebTitle: { color: C.gold, fontSize: 14, fontWeight: '600' },
  ebSub:   { color: C.textMuted, fontSize: 12, marginTop: 1 },

  // Price Card
  priceCard: {
    marginTop: 12,
    backgroundColor: C.cardBg,
    borderWidth: 1, borderColor: C.cardBorderGold,
    borderRadius: 16, padding: 16,
  },
  badges:       { flexDirection: 'row', gap: 8, marginBottom: 12 },
  badgeGold:    { backgroundColor: C.gold, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeGoldTxt: { color: C.bg, fontSize: 11, fontWeight: '700' },
  badgeBlue:    { backgroundColor: C.chipBlue, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  badgeBlueTxt: { color: C.blue, fontSize: 11, fontWeight: '600' },

  priceRow:    { flexDirection: 'row', alignItems: 'baseline', gap: 10, marginBottom: 14 },
  price:       { color: C.gold, fontSize: 42, fontWeight: '700', letterSpacing: -1 },
  priceOld:    { color: C.textDim, fontSize: 18, textDecorationLine: 'line-through' },
  priceSuffix: { color: C.textDim, fontSize: 14 },

  featureRow:  { flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 11 },
  featureIcon: { width: 24, alignItems: 'center' },
  featureLabel:{ color: C.textBody, fontSize: 15 },

  // CTA
  cta:    { marginTop: 14, backgroundColor: C.gold, borderRadius: 14, padding: 16, alignItems: 'center' },
  ctaTxt: { color: C.bg, fontSize: 17, fontWeight: '700' },
  ctaSub: { textAlign: 'center', color: C.textDim, fontSize: 12, marginTop: 8, lineHeight: 17 },

  // Divider
  dividerRow:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  dividerLine: { flex: 1, height: 1, backgroundColor: C.divider },
  dividerTxt:  { color: C.textDim, fontSize: 12 },

  // Micro IAPs
  micro:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: C.microBg, borderRadius: 10, padding: 13, marginTop: 8 },
  microLeft:  { flexDirection: 'row', alignItems: 'center', gap: 8 },
  microLabel: { color: '#B8CAD6', fontSize: 14 },
  microPrice: { borderWidth: 1, borderColor: C.earlyBirdBorder, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12 },
  microPriceTxt: { color: C.gold, fontSize: 13, fontWeight: '600' },

  // Footer
  freeLinkWrap: { alignItems: 'center', marginTop: 18 },
  freeLink:     { color: '#7A93A5', fontSize: 14, textDecorationLine: 'underline' },
  legalRow:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', flexWrap: 'wrap', marginTop: 10 },
  legalLink:    { color: C.textDim, fontSize: 11, textDecorationLine: 'underline' },
  legalDot:     { color: C.textDim, fontSize: 11 },
  legalTxt:     { color: C.textDim, fontSize: 11 },
});
