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
import React, { useState, useMemo, useEffect, useRef } from 'react';
import Purchases from 'react-native-purchases';
// Purchases wird direkt für purchasePackage benötigt (Early Bird Flow)
import {
  View, Text, TouchableOpacity, ScrollView, StyleSheet, Alert,
} from 'react-native';
import { Ionicons, Feather } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';

import { purchasePackageFromOffering, restorePurchases, getWMPassPackage } from '../services/subscription';
import { logPurchaseEvent } from '../services/firebase';
import {
  getEarlyBirdDays, getWMPassPrice, getPlanLabel, isEarlyBird, getStandardPrice,
} from '../services/pricing';
import { IAP_PRODUCTS } from '../config/iap';
import { OFFERINGS, PACKAGES } from '../config/revenueCat';

// Mapping: Produkt-ID → Offering + Package
const PRODUCT_OFFERING = {
  [IAP_PRODUCTS.WM_PASS]:    { offering: OFFERINGS.DEFAULT,      pkg: PACKAGES.WM_PASS },
  [IAP_PRODUCTS.SCAN_BOOST]: { offering: OFFERINGS.SCAN_UPSELL,  pkg: PACKAGES.SCAN_BOOST },
  [IAP_PRODUCTS.TRADE_SLOTS]:{ offering: OFFERINGS.TRADE_UPSELL, pkg: PACKAGES.TRADE_SLOTS },
  [IAP_PRODUCTS.REPORT_PDF]: { offering: OFFERINGS.REPORT,       pkg: PACKAGES.REPORT_PDF },
};

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

  // RC-Paket State — wird async geladen
  const [wmPackage, setWmPackage]         = useState(null); // RC Package-Objekt
  const [rcEarlyBird, setRcEarlyBird]     = useState(null); // null = noch laden
  const [rcPriceString, setRcPriceString] = useState(null);
  const [rcSavings, setRcSavings]         = useState(null);
  const [rcRegularPrice, setRcRegularPrice] = useState(null);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;
    getWMPassPackage().then(result => {
      if (!isMounted.current) return;
      setWmPackage(result.pkg);
      setRcEarlyBird(result.isEarlyBird);
      setRcPriceString(result.priceString);
      setRcSavings(result.savingsPercent);
      setRcRegularPrice(result.regularPriceString);
    });
    return () => { isMounted.current = false; };
  }, []);

  const days      = useMemo(() => getEarlyBirdDays(), []);
  const planLabel = useMemo(() => getPlanLabel(), []);

  // Preis: RC-Preis bevorzugen (zeigt AT-Preis automatisch), Fallback hardcoded
  const earlyBird = rcEarlyBird ?? isEarlyBird();
  const price     = rcPriceString ?? getWMPassPrice();
  const priceOld  = rcRegularPrice ?? (earlyBird ? getStandardPrice() : null);
  // Savings: RC-Berechnung bevorzugen
  const savingsLabel = rcSavings ? t('paywall.savingsLabel', { pct: rcSavings }) : null;

  // Feature-Liste
  const features = [
    { icon: <Ionicons name="infinite-outline"          size={20} color={C.gold} />, label: t('paywall.feature1') },
    { icon: <Ionicons name="swap-horizontal-outline"   size={20} color={C.gold} />, label: t('paywall.feature2') },
    { icon: <Feather  name="users"                     size={20} color={C.gold} />, label: t('paywall.feature3') },
    { icon: <Feather  name="file-text"                 size={20} color={C.gold} />, label: t('paywall.feature4') },
  ];

  // Micro-IAPs
  const micros = [
    { icon: 'camera-outline',      label: t('paywall.micro1'), product: IAP_PRODUCTS.SCAN_BOOST  },
    { icon: 'swap-horizontal',     label: t('paywall.micro2'), product: IAP_PRODUCTS.TRADE_SLOTS },
    { icon: 'document-text-outline',label: t('paywall.micro3'), product: IAP_PRODUCTS.REPORT_PDF  },
  ];

  // ── Kauf WM Pass — direkt das geladene RC-Package verwenden ─────────────────
  const handlePurchase = async () => {
    setLoading(true);
    try {
      // Paket schon geladen → direkt kaufen (korrekte Offering/Produkt-Kombination)
      if (wmPackage) {
        const { customerInfo, transaction } = await Purchases.purchasePackage(wmPackage);
        const isPro = Object.keys(customerInfo.entitlements.active).includes('Pro')
                   || Object.keys(customerInfo.entitlements.active).includes('wm_pass');
        if (isPro) {
          logPurchaseEvent(wmPackage.product, transaction).catch(() => {});
          onUnlocked?.(); onClose?.();
        } else Alert.alert(t('common.error'), t('paywall.purchaseFailed'));
      } else {
        // Fallback: Package neu laden und kaufen
        const result = await getWMPassPackage();
        if (!result.pkg) throw new Error('WM Pass Package nicht verfügbar');
        const { customerInfo, transaction } = await Purchases.purchasePackage(result.pkg);
        const isPro = Object.keys(customerInfo.entitlements.active).length > 0;
        if (isPro) {
          logPurchaseEvent(result.pkg.product, transaction).catch(() => {});
          onUnlocked?.(); onClose?.();
        }
      }
    } catch (e) {
      if (!e?.userCancelled) Alert.alert(t('common.error'), t('paywall.purchaseFailed'));
    } finally { setLoading(false); }
  };

  // ── Micro-IAP Kauf — via Offering ────────────────────────────────────────────
  const handleMicro = async (productId) => {
    setLoading(true);
    try {
      const map = PRODUCT_OFFERING[productId];
      if (!map) throw new Error('Produkt nicht konfiguriert: ' + productId);
      const res = await purchasePackageFromOffering(map.offering, map.pkg);
      if (res?.success) Alert.alert(t('paywall.purchased'), t('paywall.purchasedMsg'));
    } catch (e) {
      if (!e?.userCancelled) Alert.alert(t('common.error'), t('paywall.purchaseFailed'));
    } finally { setLoading(false); }
  };

  // ── Restore ─────────────────────────────────────────────────────────────────
  const handleRestore = async () => {
    setLoading(true);
    try {
      const res = await restorePurchases();
      if (res?.isPro) { onUnlocked?.(); onClose?.(); }
      else Alert.alert(t('paywall.restored'), t('paywall.noPurchases'));
    } catch { Alert.alert(t('common.error'), t('paywall.restoreFailed')); }
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
            <Ionicons name="trophy-outline" size={16} color={C.bg} />
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
            <Text style={s.ebSub}>{t('paywall.earlyBirdSub', { price: priceOld ?? getStandardPrice() })}</Text>
          </View>
        </View>
      )}

      {/* ── 4. Preis-Card ────────────────────────────────────────────────────── */}
      <View style={s.priceCard}>
        <View style={s.badges}>
          <View style={s.badgeGold}>
            <Text style={s.badgeGoldTxt}>{planLabel}</Text>
          </View>
          {savingsLabel && (
            <View style={s.badgeBlue}>
              <Text style={s.badgeBlueTxt}>{savingsLabel}</Text>
            </View>
          )}
        </View>

        <View style={s.priceRow}>
          <Text style={s.price}>{price}</Text>
          {priceOld && (
            <Text style={s.priceOld}>{priceOld}</Text>
          )}
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
      <Text style={s.ctaSub}>
        {t('paywall.ctaSubPart1')}{' '}
        <Text style={{ color: C.gold, fontWeight: '700' }}>{t('paywall.ctaSubKeinAbo')}</Text>
        {' '}{t('paywall.ctaSubPart2')}
      </Text>

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
          onPress={() => handleMicro(m.product)}
          disabled={loading}
        >
          <View style={s.microLeft}>
            <Ionicons name={m.icon} size={16} color={C.textMuted} />
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

      {/* Disclaimer */}
      <Text style={s.disclaimer}>{t('legal.disclaimer')}</Text>
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
  badgeBlue:    { backgroundColor: C.chipBlue, paddingHorizontal: 12, paddingVertical: 5, borderRadius: 8 },
  badgeBlueTxt: { color: C.blue, fontSize: 14, fontWeight: '700' },

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
  ctaSub: { textAlign: 'center', color: C.textDim, fontSize: 14, marginTop: 8, lineHeight: 20 },

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
  disclaimer:   { color: C.textDim, fontSize: 10, textAlign: 'center', lineHeight: 14, marginTop: 10, paddingHorizontal: 8, opacity: 0.7 },
});
