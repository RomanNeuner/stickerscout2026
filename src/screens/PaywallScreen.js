import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import * as Localization from 'expo-localization';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import GoldButton from '../components/GoldButton';
import { purchasePlan, restorePurchases } from '../services/subscription';

const EARLY_BIRD_DEADLINE = new Date('2026-06-15T23:59:59');
const getDaysLeft = () => Math.max(0, Math.ceil((EARLY_BIRD_DEADLINE - new Date()) / 86400000));
const isAustria = () => { try { return Localization.getLocales()?.[0]?.regionCode === 'AT'; } catch { return false; } };

const FEATURES = [
  { icon: '📷', label: 'Unbegrenzte Sticker-Scans' },
  { icon: '🔄', label: 'Alle Tauschplätze freischalten' },
  { icon: '🤖', label: 'KI-Duplikat-Erkennung' },
  { icon: '📊', label: 'Sammelalbum-Auswertung PDF' },
];

const MICRO_IAPS = [
  { id: 'at.ncn.stickerscout2026.scan50',  label: '+50 Scan-Boost',          price: '€0,99' },
  { id: 'at.ncn.stickerscout2026.trade7d', label: '+10 Trade-Slots (7 Tage)', price: '€0,99' },
  { id: 'at.ncn.stickerscout2026.report',  label: 'Completion Report PDF',    price: '€0,99' },
];

export default function PaywallScreen({ onClose, onUnlocked }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const daysLeft = useMemo(() => getDaysLeft(), []);
  const isAT     = useMemo(() => isAustria(), []);

  const price    = isAT ? '€1,99' : '€2,99';
  const priceOld = '€3,99';
  const savings  = isAT ? '50% sparen' : '25% sparen';
  const planLabel = isAT ? '🇦🇹 ÖSTERREICH PREIS' : 'BESTES PAKET';
  const ctaText   = isAT ? `WM Pass für ${price} holen 🇦🇹` : `WM Pass für ${price} holen`;
  const badgeText = isAT
    ? `🇦🇹 Österreich Early Bird — noch ${daysLeft} Tage`
    : `⏱ Early Bird — noch ${daysLeft} Tage`;
  const badgeSub  = isAT
    ? `Exklusiv für Österreich · Danach ${priceOld}`
    : `Danach regulär ${priceOld}`;

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const res = await purchasePlan('at.ncn.stickerscout2026.wmpass');
      if (res?.success) { onUnlocked?.(); onClose?.(); }
    } catch (e) { Alert.alert('Fehler', e.message ?? 'Kauf fehlgeschlagen.'); }
    finally { setLoading(false); }
  };

  const handleMicro = async (id) => {
    setLoading(true);
    try { await purchasePlan(id); } catch (e) { Alert.alert('Fehler', e.message ?? 'Kauf fehlgeschlagen.'); }
    finally { setLoading(false); }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const res = await restorePurchases();
      if (res?.isPro) { onUnlocked?.(); onClose?.(); }
      else Alert.alert('Kein Kauf gefunden', 'Kein aktiver Kauf auf diesem Account.');
    } catch {} finally { setLoading(false); }
  };

  return (
    <View style={[styles.wrap, { paddingTop: insets.top }]}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Close button ── */}
        <TouchableOpacity style={[styles.closeBtn, { top: SPACING.md }]} onPress={onClose}>
          <Text style={styles.closeX}>✕</Text>
        </TouchableOpacity>

        {/* ── Hero ── */}
        <View style={styles.hero}>
          <Text style={styles.heroEmoji}>🏆</Text>
          <Text style={styles.headline}>{'Mehr sammeln.\nSchneller komplett.'}</Text>
          <Text style={styles.heroSub}>Schalte alle Premium-Funktionen frei.</Text>
        </View>

        {/* ── Early Bird Badge ── */}
        {daysLeft > 0 && (
          <View style={[styles.badge, isAT ? styles.badgeRed : styles.badgeGold]}>
            <Text style={[styles.badgeTitle, isAT && { color: COLORS.red }]}>{badgeText}</Text>
            <Text style={styles.badgeSub}>{badgeSub}</Text>
          </View>
        )}

        {/* ── Plan Card ── */}
        <View style={styles.card}>
          {/* Top row: label + savings chip */}
          <View style={styles.cardTopRow}>
            <View style={[styles.labelChip, isAT && styles.labelChipRed]}>
              <Text style={[styles.labelChipText, isAT && { color: COLORS.red }]}>{planLabel}</Text>
            </View>
            <View style={styles.savingsChip}>
              <Text style={styles.savingsText}>{savings}</Text>
            </View>
          </View>

          {/* Price */}
          <View style={styles.priceRow}>
            <Text style={styles.price}>{price}</Text>
            <View>
              <Text style={styles.priceOld}>{priceOld}</Text>
              <Text style={styles.priceNote}>einmalig</Text>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.cardDivider} />

          {/* Features */}
          {FEATURES.map((f, i) => (
            <View key={i} style={styles.featureRow}>
              <View style={styles.featureIcon}>
                <Text>{f.icon}</Text>
              </View>
              <Text style={styles.featureText}>
                <Text style={styles.featureCheck}>✓  </Text>
                {f.label}
              </Text>
            </View>
          ))}
        </View>

        {/* ── CTA ── */}
        <View style={styles.ctaWrap}>
          <TouchableOpacity
            style={[styles.ctaBtn, loading && styles.ctaBtnDisabled]}
            onPress={handlePurchase}
            disabled={loading}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={loading ? ['#555', '#444'] : ['#C49A28', '#F5C033', '#F9D46A', '#F5C033', '#C49A28']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={styles.ctaGradient}
            >
              <Text style={styles.ctaText}>{loading ? 'Lade…' : ctaText}</Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={styles.ctaSub}>Einmal zahlen. Während der WM 2026 nutzen.</Text>
        </View>

        {/* ── Kostenlos ── */}
        <TouchableOpacity onPress={onClose} style={styles.freeBtn}>
          <Text style={styles.freeText}>Kostenlos weitermachen</Text>
        </TouchableOpacity>

        {/* ── Divider ── */}
        <View style={styles.orRow}>
          <View style={styles.orLine} />
          <Text style={styles.orText}>oder einzeln kaufen</Text>
          <View style={styles.orLine} />
        </View>

        {/* ── Micro-IAPs ── */}
        {MICRO_IAPS.map(item => (
          <TouchableOpacity
            key={item.id}
            style={styles.microRow}
            onPress={() => handleMicro(item.id)}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={styles.microLabel}>{item.label}</Text>
            <View style={styles.microChip}>
              <Text style={styles.microPrice}>{item.price}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <TouchableOpacity onPress={handleRestore}>
            <Text style={styles.footerLink}>Kauf wiederherstellen</Text>
          </TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity><Text style={styles.footerLink}>Datenschutz</Text></TouchableOpacity>
          <Text style={styles.dot}>·</Text>
          <TouchableOpacity><Text style={styles.footerLink}>AGB</Text></TouchableOpacity>
        </View>

        <Text style={styles.legal}>
          Abonnements werden über deinen App Store Account abgerechnet und automatisch verlängert,
          sofern nicht mindestens 24 Stunden vor Ende der Laufzeit gekündigt wird.
        </Text>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap:   { flex: 1, backgroundColor: COLORS.bg },
  scroll: { paddingBottom: 60 },

  closeBtn: {
    position: 'absolute', right: SPACING.lg, zIndex: 10,
    width: 34, height: 34, borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.12)',
    alignItems: 'center', justifyContent: 'center',
  },
  closeX: { color: COLORS.textSecondary, fontSize: 15, fontWeight: '600' },

  // Hero
  hero: {
    alignItems: 'center',
    paddingTop: SPACING.xxxl + SPACING.xl,
    paddingBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
  },
  heroEmoji:  { fontSize: 52, marginBottom: SPACING.md },
  headline:   { color: COLORS.textPrimary, fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 34, marginBottom: SPACING.sm },
  heroSub:    { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textAlign: 'center' },

  // Badge
  badge: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 0.5, alignItems: 'center',
  },
  badgeGold:  { backgroundColor: 'rgba(245,192,51,0.08)',  borderColor: 'rgba(245,192,51,0.35)' },
  badgeRed:   { backgroundColor: 'rgba(255,107,107,0.08)', borderColor: 'rgba(255,107,107,0.40)' },
  badgeTitle: { color: COLORS.gold, fontSize: FONTS.sizes.md, fontWeight: '700', marginBottom: 2 },
  badgeSub:   { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },

  // Plan Card
  card: {
    marginHorizontal: SPACING.lg, marginBottom: SPACING.lg,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderRadius: 16, borderWidth: 0.5, borderColor: 'rgba(245,192,51,0.40)',
    padding: SPACING.xl,
    ...SHADOWS.goldGlow,
  },
  cardTopRow:    { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.lg },
  labelChip:     { backgroundColor: 'rgba(245,192,51,0.12)', borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(245,192,51,0.40)' },
  labelChipRed:  { backgroundColor: 'rgba(255,107,107,0.12)', borderColor: 'rgba(255,107,107,0.50)' },
  labelChipText: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: '800', letterSpacing: 0.8 },
  savingsChip:   { backgroundColor: 'rgba(79,195,247,0.12)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.md, paddingVertical: 4, borderWidth: 0.5, borderColor: 'rgba(79,195,247,0.35)' },
  savingsText:   { color: '#4FC3F7', fontSize: FONTS.sizes.xs, fontWeight: '700' },

  priceRow:  { flexDirection: 'row', alignItems: 'flex-end', gap: SPACING.md, marginBottom: SPACING.lg },
  price:     { color: COLORS.gold, fontSize: 44, fontWeight: '900', lineHeight: 48, ...SHADOWS.goldGlow },
  priceOld:  { color: COLORS.textMuted, fontSize: FONTS.sizes.lg, textDecorationLine: 'line-through', lineHeight: 22 },
  priceNote: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, lineHeight: 18 },

  cardDivider: { height: 0.5, backgroundColor: 'rgba(255,255,255,0.10)', marginBottom: SPACING.lg },

  featureRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md, gap: SPACING.md },
  featureIcon:  { width: 30, height: 30, borderRadius: 8, backgroundColor: 'rgba(245,192,51,0.10)', borderWidth: 0.5, borderColor: 'rgba(245,192,51,0.20)', alignItems: 'center', justifyContent: 'center' },
  featureText:  { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, flex: 1, lineHeight: 22 },
  featureCheck: { color: COLORS.gold, fontWeight: '700' },

  // CTA
  ctaWrap:       { paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  ctaBtn:        { borderRadius: 14, overflow: 'hidden', ...SHADOWS.goldGlow },
  ctaBtnDisabled:{ opacity: 0.5 },
  ctaGradient:   { paddingVertical: 15, alignItems: 'center' },
  ctaText:       { color: '#0D1F2D', fontSize: FONTS.sizes.lg, fontWeight: '800' },
  ctaSub:        { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, textAlign: 'center', marginTop: SPACING.sm },

  // Free
  freeBtn: { alignItems: 'center', paddingVertical: SPACING.lg },
  freeText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textDecorationLine: 'underline' },

  // Or divider
  orRow:  { flexDirection: 'row', alignItems: 'center', marginHorizontal: SPACING.lg, marginVertical: SPACING.lg, gap: SPACING.sm },
  orLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(255,255,255,0.10)' },
  orText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },

  // Micro-IAPs
  microRow: {
    flexDirection: 'row', alignItems: 'center',
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderRadius: 10, borderWidth: 0.5, borderColor: 'rgba(255,255,255,0.07)',
    paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg,
  },
  microLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, flex: 1 },
  microChip:  { backgroundColor: 'rgba(245,192,51,0.08)', borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 3, borderWidth: 0.5, borderColor: 'rgba(245,192,51,0.40)' },
  microPrice: { color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: '700' },

  // Footer
  footer:     { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: SPACING.sm, marginTop: SPACING.xl, marginBottom: SPACING.sm },
  footerLink: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  dot:        { color: COLORS.textMuted },
  legal:      { color: COLORS.textMuted, fontSize: 10, textAlign: 'center', marginHorizontal: SPACING.xl, lineHeight: 15 },
});
