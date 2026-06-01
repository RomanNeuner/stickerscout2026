import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { STICKER_BY_NUMBER, STICKER_BY_ID } from '../data/stickerCatalog';
import { TEAMS } from '../data/stickerTypes';
import { loadCollection, loadOffers, saveOffer, deleteOffer, FREE_OFFER_LIMIT } from '../services/storage';
import GoldButton from '../components/GoldButton';

const RADIUS_OPTIONS = [
  { key: '1km', label: '1 km', value: 1 },
  { key: '5km', label: '5 km', value: 5 },
  { key: '10km', label: '10 km', value: 10 },
  { key: 'anywhere', label: '∞', value: 9999 },
];

export default function TradeScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const [offers, setOffers] = useState([]);
  const [collection, setCollection] = useState({ have: [], need: [], duplicates: {} });
  const [tab, setTab] = useState('nearby'); // 'nearby' | 'mine'
  const [radiusKey, setRadiusKey] = useState('10km');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [offerInput, setOfferInput] = useState({ offerNum: '', needNum: '' });

  useFocusEffect(useCallback(() => {
    loadCollection().then(setCollection);
    loadOffers().then(setOffers);
  }, []));

  const myOffers = offers.filter(o => o.isOwn);
  const nearbyOffers = offers.filter(o => !o.isOwn);

  const handleCreateOffer = async () => {
    if (!isPro && myOffers.length >= FREE_OFFER_LIMIT) {
      onShowPaywall?.();
      return;
    }
    const offerSticker = STICKER_BY_NUMBER[parseInt(offerInput.offerNum)];
    const needSticker = STICKER_BY_NUMBER[parseInt(offerInput.needNum)];
    if (!offerSticker || !needSticker) return;

    const updated = await saveOffer({
      offeredStickers: [offerSticker.id],
      wantedStickers: [needSticker.id],
      isOwn: true,
      location: null,
      status: 'ACTIVE',
    });
    setOffers(updated);
    setShowCreateModal(false);
    setOfferInput({ offerNum: '', needNum: '' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteOffer = async (id) => {
    const updated = await deleteOffer(id);
    setOffers(updated);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const displayOffers = tab === 'mine' ? myOffers : nearbyOffers;

  return (
    <View style={styles.container}>
      {/* Radius selector */}
      <LinearGradient colors={GRADIENTS.greenHeader} style={styles.header}>
        <Text style={styles.radiusLabel}>{t('trade.radius.label')}</Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.radiusBtn, radiusKey === opt.key && styles.radiusBtnActive]}
              onPress={() => setRadiusKey(opt.key)}
            >
              <Text style={[styles.radiusBtnText, radiusKey === opt.key && styles.radiusBtnTextActive]}>
                {t(`trade.radius.${opt.key}`)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        <TouchableOpacity
          style={[styles.tab, tab === 'nearby' && styles.tabActive]}
          onPress={() => setTab('nearby')}
        >
          <Text style={[styles.tabText, tab === 'nearby' && styles.tabTextActive]}>
            {t('trade.nearbyOffers')} ({nearbyOffers.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'mine' && styles.tabActive]}
          onPress={() => setTab('mine')}
        >
          <Text style={[styles.tabText, tab === 'mine' && styles.tabTextActive]}>
            {t('trade.myOffers')} ({myOffers.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Offers list */}
      <FlatList
        data={displayOffers}
        keyExtractor={o => o.id}
        renderItem={({ item }) => (
          <OfferCard
            offer={item}
            isOwn={item.isOwn}
            onDelete={() => handleDeleteOffer(item.id)}
          />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>
              {tab === 'nearby' ? t('trade.noOffers') : 'Keine eigenen Angebote'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* Create Offer FAB */}
      <View style={styles.fab}>
        {!isPro && myOffers.length >= FREE_OFFER_LIMIT ? (
          <TouchableOpacity onPress={onShowPaywall} style={styles.limitRow}>
            <Text style={styles.limitText}>{t('trade.limits.maxOffers')}</Text>
            <Text style={styles.limitUpgrade}>{t('trade.limits.upgradeHint')}</Text>
          </TouchableOpacity>
        ) : (
          <GoldButton
            title={`+ ${t('trade.createOffer')}`}
            onPress={() => setShowCreateModal(true)}
          />
        )}
      </View>

      {/* Create offer modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={GRADIENTS.cardDark} style={styles.modal}>
            <Text style={styles.modalTitle}>{t('trade.createOffer')}</Text>

            <Text style={styles.fieldLabel}>{t('trade.offer.iOffer')} (Sticker-Nummer)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="z.B. 187"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={offerInput.offerNum}
              onChangeText={v => setOfferInput(p => ({ ...p, offerNum: v }))}
            />
            {offerInput.offerNum && STICKER_BY_NUMBER[parseInt(offerInput.offerNum)] && (
              <Text style={styles.stickerPreview}>
                → {STICKER_BY_NUMBER[parseInt(offerInput.offerNum)]?.playerName ?? 'Sticker gefunden'}
              </Text>
            )}

            <Text style={styles.fieldLabel}>{t('trade.offer.iNeed')} (Sticker-Nummer)</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="z.B. 23"
              placeholderTextColor={COLORS.textMuted}
              keyboardType="number-pad"
              value={offerInput.needNum}
              onChangeText={v => setOfferInput(p => ({ ...p, needNum: v }))}
            />
            {offerInput.needNum && STICKER_BY_NUMBER[parseInt(offerInput.needNum)] && (
              <Text style={styles.stickerPreview}>
                → {STICKER_BY_NUMBER[parseInt(offerInput.needNum)]?.playerName ?? 'Sticker gefunden'}
              </Text>
            )}

            <View style={styles.modalActions}>
              <GoldButton title={t('common.confirm')} onPress={handleCreateOffer} style={{ flex: 1, marginRight: SPACING.sm }} />
              <TouchableOpacity onPress={() => setShowCreateModal(false)} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

function OfferCard({ offer, isOwn, onDelete }) {
  const { t } = useTranslation();
  const offered = offer.offeredStickers?.map(id => STICKER_BY_ID[id]).filter(Boolean) ?? [];
  const wanted = offer.wantedStickers?.map(id => STICKER_BY_ID[id]).filter(Boolean) ?? [];

  return (
    <View style={styles.offerCard}>
      <View style={styles.offerRow}>
        <View style={styles.offerSide}>
          <Text style={styles.offerSideLabel}>{t('trade.offer.iOffer')}</Text>
          {offered.map(s => (
            <Text key={s.id} style={styles.offerSticker}>
              #{s.number} {s.playerName ?? s.teamNameDE}
            </Text>
          ))}
        </View>
        <Text style={styles.offerArrow}>⇄</Text>
        <View style={styles.offerSide}>
          <Text style={styles.offerSideLabel}>{t('trade.offer.iNeed')}</Text>
          {wanted.map(s => (
            <Text key={s.id} style={styles.offerSticker}>
              #{s.number} {s.playerName ?? s.teamNameDE}
            </Text>
          ))}
        </View>
      </View>
      {offer.distanceKm != null && (
        <Text style={styles.offerDistance}>
          {t('trade.offer.distance', { km: offer.distanceKm.toFixed(1) })}
        </Text>
      )}
      <View style={styles.offerActions}>
        {isOwn ? (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>{t('common.delete')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>{t('trade.offer.contact')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { padding: SPACING.lg },
  radiusLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  radiusRow: { flexDirection: 'row', gap: SPACING.sm },
  radiusBtn: {
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  radiusBtnActive: { backgroundColor: COLORS.greenDim, borderColor: COLORS.greenLight },
  radiusBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  radiusBtnTextActive: { color: COLORS.greenBright, fontWeight: FONTS.weights.semibold },
  tabRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.gold },
  tabText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  tabTextActive: { color: COLORS.gold, fontWeight: FONTS.weights.semibold },
  list: { padding: SPACING.md, paddingBottom: 100 },
  empty: { alignItems: 'center', marginTop: SPACING.xxxl },
  emptyText: { color: COLORS.textMuted, fontSize: FONTS.sizes.lg },
  fab: { position: 'absolute', bottom: SPACING.xxl, left: SPACING.xl, right: SPACING.xl, alignItems: 'center' },
  limitRow: { alignItems: 'center' },
  limitText: { color: COLORS.red, fontSize: FONTS.sizes.sm },
  limitUpgrade: { color: COLORS.gold, fontSize: FONTS.sizes.xs, marginTop: 2 },
  offerCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.card,
  },
  offerRow: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.sm },
  offerSide: { flex: 1 },
  offerSideLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, marginBottom: 4 },
  offerSticker: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  offerArrow: { color: COLORS.gold, fontSize: FONTS.sizes.xl, marginHorizontal: SPACING.md },
  offerDistance: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  offerActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.red },
  deleteBtnText: { color: COLORS.red, fontSize: FONTS.sizes.sm },
  contactBtn: { paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md, borderRadius: RADIUS.sm, backgroundColor: COLORS.greenDim },
  contactBtnText: { color: COLORS.greenBright, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, marginBottom: SPACING.xl },
  fieldLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  modalInput: {
    backgroundColor: COLORS.surfaceRaised,
    color: COLORS.textPrimary,
    padding: SPACING.md,
    borderRadius: RADIUS.md,
    fontSize: FONTS.sizes.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    marginBottom: SPACING.sm,
  },
  stickerPreview: { color: COLORS.greenBright, fontSize: FONTS.sizes.sm, marginBottom: SPACING.md },
  modalActions: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl },
  cancelBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  cancelText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
});
