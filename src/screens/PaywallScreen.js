import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import GoldButton from '../components/GoldButton';
import { PRODUCT_IDS, purchasePlan, restorePurchases } from '../services/subscription';

const FEATURES = ['scanner', 'offers', 'radius', 'backup', 'early'];

export default function PaywallScreen({ onClose, onUnlocked }) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState('season');
  const [loading, setLoading] = useState(false);

  const handlePurchase = async () => {
    setLoading(true);
    try {
      const productId = selected === 'season' ? PRODUCT_IDS.season : PRODUCT_IDS.monthly;
      const isPro = await purchasePlan(productId);
      if (isPro) { onUnlocked?.(); onClose?.(); }
    } catch (e) {
      Alert.alert(t('common.error'), e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRestore = async () => {
    setLoading(true);
    try {
      const isPro = await restorePurchases();
      if (isPro) { onUnlocked?.(); onClose?.(); }
      else Alert.alert('Info', 'Kein aktiver Kauf gefunden.');
    } catch {
      Alert.alert(t('common.error'), 'Wiederherstellung fehlgeschlagen.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <LinearGradient colors={['#0A2618', '#1B4332', '#2D6A4F']} style={styles.header}>
        <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.title}>{t('paywall.title')}</Text>
        <Text style={styles.subtitle}>{t('paywall.subtitle')}</Text>
      </LinearGradient>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Features list */}
        <View style={styles.featureList}>
          {FEATURES.map(f => (
            <View key={f} style={styles.featureRow}>
              <Text style={styles.checkmark}>✓</Text>
              <Text style={styles.featureText}>{t(`paywall.features.${f}`)}</Text>
            </View>
          ))}
        </View>

        {/* Plan selector */}
        <View style={styles.planRow}>
          <TouchableOpacity
            style={[styles.planCard, selected === 'monthly' && styles.planCardSelected]}
            onPress={() => setSelected('monthly')}
          >
            <Text style={styles.planName}>{t('paywall.monthly')}</Text>
            <Text style={styles.planPrice}>{t('paywall.monthlyPrice')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.planCard, selected === 'season' && styles.planCardSelected]}
            onPress={() => setSelected('season')}
          >
            <View style={styles.badgeRow}>
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{t('paywall.seasonBadge')}</Text>
              </View>
            </View>
            <Text style={styles.planName}>{t('paywall.season')}</Text>
            <Text style={styles.planPrice}>{t('paywall.seasonPrice')}</Text>
          </TouchableOpacity>
        </View>

        <GoldButton
          title={loading ? t('common.loading') : t('paywall.purchase')}
          onPress={handlePurchase}
          disabled={loading}
          style={{ marginTop: SPACING.xl }}
        />

        <TouchableOpacity onPress={handleRestore} style={styles.restoreBtn}>
          <Text style={styles.restoreText}>{t('paywall.restore')}</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.termsBtn}>
          <Text style={styles.termsText}>{t('paywall.terms')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.xl, paddingTop: SPACING.xxxl },
  closeBtn: { position: 'absolute', top: SPACING.xl, right: SPACING.xl },
  closeText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.xl },
  title: { color: COLORS.gold, fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.black, textAlign: 'center', marginTop: SPACING.xl },
  subtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textAlign: 'center', marginTop: SPACING.sm },
  content: { padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  featureList: { marginBottom: SPACING.xl },
  featureRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  checkmark: { color: COLORS.greenBright, fontSize: FONTS.sizes.lg, marginRight: SPACING.md, fontWeight: FONTS.weights.bold },
  featureText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, flex: 1 },
  planRow: { flexDirection: 'row', gap: SPACING.md },
  planCard: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.card,
  },
  planCardSelected: { borderColor: COLORS.gold, backgroundColor: COLORS.goldDeep },
  badgeRow: { marginBottom: SPACING.sm },
  badge: { backgroundColor: COLORS.gold, borderRadius: RADIUS.full, paddingHorizontal: SPACING.sm, paddingVertical: 2 },
  badgeText: { color: COLORS.textOnGold, fontSize: FONTS.sizes.xs, fontWeight: FONTS.weights.bold },
  planName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold, marginBottom: SPACING.xs },
  planPrice: { color: COLORS.gold, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  restoreBtn: { alignItems: 'center', marginTop: SPACING.lg },
  restoreText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
  termsBtn: { alignItems: 'center', marginTop: SPACING.md },
  termsText: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs },
});
