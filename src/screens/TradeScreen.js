import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { lookupSticker } from '../data/stickerCatalog';
import { lookupAdrenalyn, CARD_TYPE_LABELS } from '../data/adrenalynCatalog';
import { TEAM_FLAGS } from '../data/stickerTypes';
import { loadCollection, loadOffers, saveOffer, deleteOffer, removeFromNeed, FREE_OFFER_LIMIT } from '../services/storage';
import GoldButton from '../components/GoldButton';
import AppIcon from '../components/AppIcon';

const RADIUS_OPTIONS = [
  { key: '1km',      label: '1 km',  value: 1 },
  { key: '5km',      label: '5 km',  value: 5 },
  { key: '10km',     label: '10 km', value: 10 },
  { key: 'anywhere', label: '∞',     value: 9999 },
];

export default function TradeScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const [offers, setOffers] = useState([]);
  const [collection, setCollection] = useState({ have: [], need: [], duplicates: {} });
  const [tab, setTab] = useState('nearby');
  const [radiusKey, setRadiusKey] = useState('10km');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [offerInput, setOfferInput] = useState({ offerId: '', needId: '' });
  const [tradeType, setTradeType] = useState('sticker'); // 'sticker' | 'adrenalyn'
  const [location, setLocation] = useState(null);
  const [locationGranted, setLocationGranted] = useState(false);

  // --- Standort anfragen ---
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        setLocationGranted(true);
        const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
      }
    })();
  }, []);

  useFocusEffect(useCallback(() => {
    loadCollection().then(setCollection);
    loadOffers().then(setOffers);
  }, []));

  const myOffers = offers.filter(o => o.isOwn);
  const nearbyOffers = offers.filter(o => !o.isOwn);

  // Live-Lookup — je nach Typ Sticker oder Adrenalyn
  const isAdrenalyn = tradeType === 'adrenalyn';
  const offerItem = offerInput.offerId.length >= 1
    ? (isAdrenalyn ? lookupAdrenalyn(offerInput.offerId) : lookupSticker(offerInput.offerId))
    : null;
  const needItem = offerInput.needId.length >= 1
    ? (isAdrenalyn ? lookupAdrenalyn(offerInput.needId) : lookupSticker(offerInput.needId))
    : null;

  const itemLabel = (item) => {
    if (!item) return null;
    if (isAdrenalyn) {
      const typeLabel = CARD_TYPE_LABELS[item.type] ?? item.type ?? '';
      return `#${item.number} · ${item.name ?? ''}${typeLabel ? ` · ${typeLabel}` : ''}`;
    }
    return `${item.id} · ${item.name}${item.teamName ? ` · ${TEAM_FLAGS[item.team] ?? ''} ${item.teamName}` : ''}`;
  };

  const handleCreateOffer = async () => {
    if (!isPro && myOffers.length >= FREE_OFFER_LIMIT) { onShowPaywall?.(); return; }
    if (!offerItem || !needItem) {
      Alert.alert(t('common.error'), isAdrenalyn
        ? t('trade.createOfferErrorAdrenalyn')
        : t('trade.createOfferErrorSticker'));
      return;
    }
    const offeredId = isAdrenalyn ? String(offerItem.number) : offerItem.id;
    const neededId  = isAdrenalyn ? String(needItem.number)  : needItem.id;
    const updated = await saveOffer({
      offerType:       tradeType,
      offeredStickers: [offeredId],
      wantedStickers:  [neededId],
      isOwn: true,
      location,
      status: 'ACTIVE',
    });
    setOffers(updated);
    setShowCreateModal(false);
    setOfferInput({ offerId: '', needId: '' });
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  };

  const handleDeleteOffer = async (id) => {
    setOffers(await deleteOffer(id));
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleRemoveFromNeed = async (stickerId) => {
    const col = await removeFromNeed(stickerId);
    setCollection(col);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleCreateOfferFromNeed = (needId) => {
    setOfferInput(p => ({ ...p, needId }));
    setShowCreateModal(true);
  };

  const displayOffers = tab === 'mine' ? myOffers : nearbyOffers;

  // Doppelte aus Sammlung als Vorschlag für "Ich biete"
  const duplicateIds = Object.keys(collection.duplicates ?? {}).filter(id => (collection.duplicates[id] ?? 0) > 0);

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={GRADIENTS.greenHeader} style={styles.header}>
        {/* Standort-Status */}
        <View style={styles.locationRow}>
          <Text style={styles.locationDot}>{locationGranted ? '🟢' : '🔴'}</Text>
          <Text style={styles.locationText}>
            {locationGranted ? t('trade.locationActive') : t('trade.locationUnavailable')}
          </Text>
          {!locationGranted && (
            <TouchableOpacity onPress={async () => {
              const { status } = await Location.requestForegroundPermissionsAsync();
              if (status === 'granted') {
                setLocationGranted(true);
                const loc = await Location.getCurrentPositionAsync({});
                setLocation({ lat: loc.coords.latitude, lng: loc.coords.longitude });
              }
            }}>
              <Text style={styles.locationEnable}>{t('trade.locationEnable')}</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Radius */}
        <Text style={styles.radiusLabel}>{t('trade.radiusLabel')}</Text>
        <View style={styles.radiusRow}>
          {RADIUS_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.key}
              style={[styles.radiusBtn, radiusKey === opt.key && styles.radiusBtnActive]}
              onPress={() => setRadiusKey(opt.key)}
            >
              <Text style={[styles.radiusBtnText, radiusKey === opt.key && styles.radiusBtnTextActive]}>
                {opt.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </LinearGradient>

      {/* Tabs */}
      <View style={styles.tabRow}>
        {[
          { key: 'nearby', label: t('trade.tabNearby', { count: nearbyOffers.length }) },
          { key: 'mine',   label: t('trade.tabMine',   { count: myOffers.length }) },
          { key: 'search', label: t('trade.tabSearch', { count: collection.need.length }) },
        ].map(tb => (
          <TouchableOpacity
            key={tb.key}
            style={[styles.tab, tab === tb.key && styles.tabActive]}
            onPress={() => setTab(tb.key)}
          >
            <Text style={[styles.tabText, tab === tb.key && styles.tabTextActive]}>{tb.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Doppelte-Hinweis */}
      {tab === 'mine' && duplicateIds.length > 0 && (
        <View style={styles.duplicateHint}>
          <Text style={styles.duplicateHintText}>
            {t('trade.duplicateHint', { count: duplicateIds.length })}
          </Text>
        </View>
      )}

      {/* Meine Suche */}
      {tab === 'search' ? (
        <FlatList
          data={collection.need}
          keyExtractor={id => id}
          renderItem={({ item }) => (
            <NeedCard
              stickerId={item}
              onRemove={() => handleRemoveFromNeed(item)}
              onCreateOffer={() => handleCreateOfferFromNeed(item)}
            />
          )}
          ListHeaderComponent={collection.need.length > 0 ? (
            <View style={styles.searchHint}>
              <Text style={styles.searchHintText}>
                {t('trade.searchHint', { count: collection.need.length })}
              </Text>
            </View>
          ) : null}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyEmoji}>🔍</Text>
              <Text style={styles.emptyText}>
                {t('trade.emptySearch')}
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      ) : (
        /* Angebotsliste */
        <FlatList
          data={displayOffers}
          keyExtractor={o => o.id}
          renderItem={({ item }) => (
            <OfferCard offer={item} isOwn={item.isOwn} onDelete={() => handleDeleteOffer(item.id)} />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <View style={styles.emptyIconWrap}>
            <Ionicons name="swap-horizontal" size={36} color={COLORS.gold} />
          </View>
              <Text style={styles.emptyText}>
                {tab === 'nearby' ? t('trade.emptyNearby') : t('trade.emptyMine')}
              </Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}

      {/* FAB */}
      <View style={styles.fab}>
        {!isPro && myOffers.length >= FREE_OFFER_LIMIT ? (
          <TouchableOpacity onPress={onShowPaywall} style={styles.limitRow}>
            <Text style={styles.limitText}>{t('trade.offerLimit', { limit: FREE_OFFER_LIMIT })}</Text>
            <Text style={styles.limitUpgrade}>{t('trade.upgradePrompt')}</Text>
          </TouchableOpacity>
        ) : (
          <GoldButton title={t('trade.addOffer')} onPress={() => setShowCreateModal(true)} />
        )}
      </View>

      {/* Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={GRADIENTS.cardDark} style={styles.modal}>
            <Text style={styles.modalTitle}>{t('trade.modalTitle')}</Text>

            {/* Typ-Toggle */}
            <View style={styles.typeToggle}>
              {[
                { key: 'sticker',   label: '🎴 Sticker' },
                { key: 'adrenalyn', label: '📇 Adrenalyn' },
              ].map(typeOpt => (
                <TouchableOpacity
                  key={typeOpt.key}
                  style={[styles.typeBtn, tradeType === typeOpt.key && styles.typeBtnActive]}
                  onPress={() => { setTradeType(typeOpt.key); setOfferInput({ offerId: '', needId: '' }); }}
                >
                  <Text style={[styles.typeBtnText, tradeType === typeOpt.key && styles.typeBtnTextActive]}>
                    {typeOpt.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Ich biete */}
            <Text style={styles.fieldLabel}>
              {isAdrenalyn ? t('trade.offerFieldAdrenalyn') : t('trade.offerFieldSticker')}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={isAdrenalyn ? t('trade.offerPlaceholderAdrenalyn') : t('trade.offerPlaceholderSticker')}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize={isAdrenalyn ? 'none' : 'characters'}
              keyboardType={isAdrenalyn ? 'numeric' : 'default'}
              value={offerInput.offerId}
              onChangeText={v => setOfferInput(p => ({ ...p, offerId: isAdrenalyn ? v.replace(/\D/g, '') : v.toUpperCase() }))}
              maxLength={isAdrenalyn ? 3 : 8}
            />
            {offerInput.offerId.length >= 1 && (
              <View style={[styles.preview, offerItem ? styles.previewOk : styles.previewErr]}>
                <Text style={offerItem ? styles.previewText : styles.previewTextErr}>
                  {offerItem ? `✅ ${itemLabel(offerItem)}` : t(isAdrenalyn ? 'trade.itemNotFoundCard' : 'trade.itemNotFoundSticker')}
                </Text>
              </View>
            )}

            {/* Ich suche */}
            <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>
              {isAdrenalyn ? t('trade.searchFieldAdrenalyn') : t('trade.searchFieldSticker')}
            </Text>
            <TextInput
              style={styles.modalInput}
              placeholder={isAdrenalyn ? t('trade.searchPlaceholderAdrenalyn') : t('trade.searchPlaceholderSticker')}
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize={isAdrenalyn ? 'none' : 'characters'}
              keyboardType={isAdrenalyn ? 'numeric' : 'default'}
              value={offerInput.needId}
              onChangeText={v => setOfferInput(p => ({ ...p, needId: isAdrenalyn ? v.replace(/\D/g, '') : v.toUpperCase() }))}
              maxLength={isAdrenalyn ? 3 : 8}
            />
            {offerInput.needId.length >= 1 && (
              <View style={[styles.preview, needItem ? styles.previewOk : styles.previewErr]}>
                <Text style={needItem ? styles.previewText : styles.previewTextErr}>
                  {needItem ? `✅ ${itemLabel(needItem)}` : t(isAdrenalyn ? 'trade.itemNotFoundCard' : 'trade.itemNotFoundSticker')}
                </Text>
              </View>
            )}

            {/* Schnellauswahl Doppelte — nur für Sticker */}
            {!isAdrenalyn && duplicateIds.length > 0 && (
              <View style={styles.quickPick}>
                <Text style={styles.quickPickLabel}>{t('trade.yourDuplicates')}</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {duplicateIds.slice(0, 8).map(id => (
                    <TouchableOpacity
                      key={id}
                      style={styles.quickPickChip}
                      onPress={() => setOfferInput(p => ({ ...p, offerId: id }))}
                    >
                      <Text style={styles.quickPickText}>{id}</Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <View style={styles.modalActions}>
              <GoldButton
                title={t('trade.addOffer')}
                onPress={handleCreateOffer}
                disabled={!offerItem || !needItem}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <TouchableOpacity
                onPress={() => { setShowCreateModal(false); setOfferInput({ offerId: '', needId: '' }); }}
                style={styles.cancelBtn}
              >
                <Text style={styles.cancelText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

function NeedCard({ stickerId, onRemove, onCreateOffer }) {
  const { t } = useTranslation();
  const sticker = lookupSticker(stickerId);
  const flag = sticker?.team ? (TEAM_FLAGS[sticker.team] ?? '🌍') : '🌍';
  return (
    <View style={styles.needCard}>
      <View style={styles.needInfo}>
        <Text style={styles.needFlag}>{flag}</Text>
        <View style={styles.needText}>
          <Text style={styles.needId}>{stickerId}</Text>
          {sticker && (
            <Text style={styles.needName} numberOfLines={1}>
              {sticker.name}{sticker.teamName ? ` · ${sticker.teamName}` : ''}
            </Text>
          )}
        </View>
      </View>
      <View style={styles.needActions}>
        <TouchableOpacity onPress={onCreateOffer} style={styles.needOfferBtn}>
          <Text style={styles.needOfferBtnText}>{t('trade.addOffer')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={onRemove} style={styles.needRemoveBtn}>
          <Text style={styles.needRemoveBtnText}>✕</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function OfferCard({ offer, isOwn, onDelete }) {
  const { t } = useTranslation();
  const isAdrenalyn = offer.offerType === 'adrenalyn';

  const resolveItem = (id) => {
    if (isAdrenalyn) {
      const card = lookupAdrenalyn(id);
      if (!card) return null;
      const typeLabel = CARD_TYPE_LABELS[card.type] ?? '';
      return { key: String(card.number), label: `#${card.number} · ${card.name ?? ''}${typeLabel ? ` · ${typeLabel}` : ''}` };
    }
    const s = lookupSticker(id);
    if (!s) return null;
    return { key: s.id, label: `${TEAM_FLAGS[s.team] ?? '🌍'} ${s.id} · ${s.name}` };
  };

  const offered = (offer.offeredStickers ?? []).map(resolveItem).filter(Boolean);
  const wanted  = (offer.wantedStickers  ?? []).map(resolveItem).filter(Boolean);

  return (
    <View style={styles.offerCard}>
      {isAdrenalyn && (
        <View style={styles.offerTypeBadge}>
          <Text style={styles.offerTypeBadgeText}>📇 Adrenalyn XL</Text>
        </View>
      )}
      <View style={styles.offerRow}>
        <View style={styles.offerSide}>
          <Text style={styles.offerSideLabel}>{t('trade.offer.iOffer')}</Text>
          {offered.map(item => (
            <Text key={item.key} style={styles.offerSticker}>{item.label}</Text>
          ))}
        </View>
        <Ionicons name="swap-horizontal" size={22} color={COLORS.gold} style={{ marginHorizontal: SPACING.sm, marginTop: SPACING.xs }} />
        <View style={styles.offerSide}>
          <Text style={styles.offerSideLabel}>{t('trade.offer.iNeed')}</Text>
          {wanted.map(item => (
            <Text key={item.key} style={styles.offerSticker}>{item.label}</Text>
          ))}
        </View>
      </View>
      {offer.distanceKm != null && (
        <Text style={styles.offerDistance}>📍 {offer.distanceKm.toFixed(1)} km entfernt</Text>
      )}
      <View style={styles.offerActions}>
        {isOwn ? (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>{t('trade.deleteOffer')}</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>{t('trade.contactOffer')}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: { padding: SPACING.lg, paddingBottom: SPACING.md },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  locationDot: { fontSize: 10 },
  locationText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },
  locationEnable: { color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: '600' },

  radiusLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600', marginBottom: SPACING.sm },
  radiusRow: { flexDirection: 'row', gap: SPACING.sm },
  radiusBtn: {
    paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.full, backgroundColor: COLORS.surfaceRaised,
    borderWidth: 1, borderColor: COLORS.border,
  },
  radiusBtnActive: { backgroundColor: COLORS.blueTint, borderColor: COLORS.borderBlue },
  radiusBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  radiusBtnTextActive: { color: COLORS.greenBright, fontWeight: '700' },

  tabRow: { flexDirection: 'row', backgroundColor: COLORS.surface, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  tab: { flex: 1, paddingVertical: SPACING.md, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: COLORS.gold },
  tabText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  tabTextActive: { color: COLORS.gold, fontWeight: '700' },

  duplicateHint: { backgroundColor: COLORS.blueTint, padding: SPACING.md, paddingHorizontal: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.border },
  duplicateHintText: { color: COLORS.greenBright, fontSize: FONTS.sizes.md },

  list: { padding: SPACING.md, paddingBottom: 120 },
  empty: { alignItems: 'center', marginTop: SPACING.xxxl, paddingHorizontal: SPACING.xxl },
  emptyIconWrap: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(245,192,51,0.12)',
    borderWidth: 1, borderColor: 'rgba(245,192,51,0.3)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: SPACING.lg,
  },
  emptyText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg, textAlign: 'center', lineHeight: 24 },

  fab: { position: 'absolute', bottom: SPACING.xxl, left: SPACING.xl, right: SPACING.xl },
  limitRow: { alignItems: 'center', padding: SPACING.md, backgroundColor: COLORS.surface, borderRadius: RADIUS.md, borderWidth: 1, borderColor: COLORS.red },
  limitText: { color: COLORS.red, fontSize: FONTS.sizes.md, fontWeight: '600' },
  limitUpgrade: { color: COLORS.gold, fontSize: FONTS.sizes.sm, marginTop: 4 },

  offerCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.card,
  },
  offerRow: { flexDirection: 'row', alignItems: 'flex-start', marginBottom: SPACING.sm },
  offerSide: { flex: 1 },
  offerSideLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: 4, fontWeight: '600' },
  offerSticker: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, lineHeight: 22 },
  offerTypeBadge: {
    backgroundColor: 'rgba(79,195,247,0.12)',
    borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 3,
    alignSelf: 'flex-start', marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: 'rgba(79,195,247,0.25)',
  },
  offerTypeBadgeText: { color: COLORS.blue, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  offerDistance: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  offerActions: { flexDirection: 'row', justifyContent: 'flex-end' },
  deleteBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.sm, borderWidth: 1, borderColor: COLORS.red },
  deleteBtnText: { color: COLORS.red, fontSize: FONTS.sizes.md },
  contactBtn: { paddingVertical: SPACING.sm, paddingHorizontal: SPACING.lg, borderRadius: RADIUS.sm, backgroundColor: COLORS.blueTint },
  contactBtnText: { color: COLORS.greenBright, fontSize: FONTS.sizes.md, fontWeight: '600' },

  modalOverlay: { flex: 1, backgroundColor: COLORS.overlay, justifyContent: 'flex-end' },
  modal: { borderTopLeftRadius: RADIUS.xl, borderTopRightRadius: RADIUS.xl, padding: SPACING.xl, paddingBottom: SPACING.xxxl },
  modalTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: '900', marginBottom: SPACING.xl },
  fieldLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600', marginBottom: SPACING.sm },
  modalInput: {
    backgroundColor: COLORS.surfaceRaised, color: COLORS.textPrimary,
    padding: SPACING.md, borderRadius: RADIUS.md,
    fontSize: FONTS.sizes.xl, fontWeight: '700',
    borderWidth: 1, borderColor: COLORS.border,
    marginBottom: SPACING.xs, letterSpacing: 2,
  },
  preview: { borderRadius: RADIUS.sm, padding: SPACING.sm, paddingHorizontal: SPACING.md, marginBottom: SPACING.sm },
  previewOk: { backgroundColor: 'rgba(82,183,136,0.15)', borderWidth: 1, borderColor: COLORS.greenBright },
  previewErr: { backgroundColor: 'rgba(230,57,70,0.1)', borderWidth: 1, borderColor: COLORS.red },
  previewText: { color: COLORS.greenBright, fontSize: FONTS.sizes.md },
  previewTextErr: { color: COLORS.red, fontSize: FONTS.sizes.md },

  quickPick: { marginTop: SPACING.sm, marginBottom: SPACING.md },
  quickPickLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginBottom: SPACING.sm },
  quickPickChip: { backgroundColor: COLORS.goldDeep, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.md, paddingVertical: SPACING.xs, marginRight: SPACING.sm, borderWidth: 1, borderColor: COLORS.gold },
  quickPickText: { color: COLORS.gold, fontSize: FONTS.sizes.md, fontWeight: '700' },

  typeToggle: {
    flexDirection: 'row', gap: SPACING.sm,
    marginBottom: SPACING.lg,
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md, padding: 4,
  },
  typeBtn: {
    flex: 1, paddingVertical: SPACING.sm, borderRadius: RADIUS.sm,
    alignItems: 'center',
  },
  typeBtnActive: { backgroundColor: COLORS.gold },
  typeBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  typeBtnTextActive: { color: '#0D1F2D', fontWeight: '800' },

  modalActions: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.lg },
  cancelBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  cancelText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },

  // Meine Suche
  searchHint: {
    backgroundColor: 'rgba(79,195,247,0.10)',
    borderRadius: RADIUS.md, padding: SPACING.md,
    marginBottom: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(79,195,247,0.25)',
  },
  searchHintText: { color: COLORS.blue, fontSize: FONTS.sizes.sm },

  needCard: {
    backgroundColor: COLORS.surface, borderRadius: RADIUS.lg,
    padding: SPACING.md, marginBottom: SPACING.sm,
    borderWidth: 1, borderColor: COLORS.border,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  needInfo: { flexDirection: 'row', alignItems: 'center', flex: 1, gap: SPACING.md },
  needFlag: { fontSize: 22 },
  needText: { flex: 1 },
  needId: { color: COLORS.gold, fontWeight: '800', fontSize: FONTS.sizes.lg },
  needName: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, marginTop: 2 },
  needActions: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm },
  needOfferBtn: {
    backgroundColor: COLORS.blueTint, borderRadius: RADIUS.sm,
    paddingVertical: SPACING.xs, paddingHorizontal: SPACING.md,
  },
  needOfferBtnText: { color: COLORS.greenBright, fontSize: FONTS.sizes.sm, fontWeight: '700' },
  needRemoveBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,107,107,0.12)',
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,107,107,0.3)',
  },
  needRemoveBtnText: { color: COLORS.red, fontSize: FONTS.sizes.md, fontWeight: '700' },
});
