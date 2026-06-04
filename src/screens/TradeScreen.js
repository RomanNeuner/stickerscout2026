import React, { useState, useCallback, useEffect } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, Modal, ScrollView, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { lookupSticker } from '../data/stickerCatalog';
import { TEAM_FLAGS } from '../data/stickerTypes';
import { loadCollection, loadOffers, saveOffer, deleteOffer, FREE_OFFER_LIMIT } from '../services/storage';
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

  // Live-Lookup mit Datenbank
  const offerSticker = offerInput.offerId.length >= 2 ? lookupSticker(offerInput.offerId) : null;
  const needSticker  = offerInput.needId.length  >= 2 ? lookupSticker(offerInput.needId)  : null;

  const handleCreateOffer = async () => {
    if (!isPro && myOffers.length >= FREE_OFFER_LIMIT) { onShowPaywall?.(); return; }
    if (!offerSticker || !needSticker) {
      Alert.alert('Fehler', 'Sticker-ID nicht gefunden. Beispiel: GER10, AUT4, CC2');
      return;
    }
    const updated = await saveOffer({
      offeredStickers: [offerSticker.id],
      wantedStickers:  [needSticker.id],
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
            {locationGranted ? 'Standort aktiv' : 'Standort nicht verfügbar'}
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
              <Text style={styles.locationEnable}>Aktivieren →</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Radius */}
        <Text style={styles.radiusLabel}>Tauschpartner-Radius</Text>
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
          { key: 'nearby', label: `In der Nähe (${nearbyOffers.length})` },
          { key: 'mine',   label: `Meine Angebote (${myOffers.length})` },
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
            💡 Du hast {duplicateIds.length} Doppelte — ideal zum Tauschen!
          </Text>
        </View>
      )}

      {/* Angebotsliste */}
      <FlatList
        data={displayOffers}
        keyExtractor={o => o.id}
        renderItem={({ item }) => (
          <OfferCard offer={item} isOwn={item.isOwn} onDelete={() => handleDeleteOffer(item.id)} />
        )}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🔄</Text>
            <Text style={styles.emptyText}>
              {tab === 'nearby'
                ? 'Keine Angebote in der Nähe.\nErweitere den Radius oder erstelle ein Angebot.'
                : 'Noch keine eigenen Angebote.\nTippe auf + um ein Angebot zu erstellen.'}
            </Text>
          </View>
        }
        contentContainerStyle={styles.list}
      />

      {/* FAB */}
      <View style={styles.fab}>
        {!isPro && myOffers.length >= FREE_OFFER_LIMIT ? (
          <TouchableOpacity onPress={onShowPaywall} style={styles.limitRow}>
            <Text style={styles.limitText}>Maximum {FREE_OFFER_LIMIT} Angebote (Free)</Text>
            <Text style={styles.limitUpgrade}>👑 Auf Premium upgraden →</Text>
          </TouchableOpacity>
        ) : (
          <GoldButton title="+ Tauschangebot erstellen" onPress={() => setShowCreateModal(true)} />
        )}
      </View>

      {/* Modal */}
      <Modal visible={showCreateModal} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <LinearGradient colors={GRADIENTS.cardDark} style={styles.modal}>
            <Text style={styles.modalTitle}>Tauschangebot erstellen</Text>

            {/* Ich biete */}
            <Text style={styles.fieldLabel}>Ich biete — Sticker-ID eingeben</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="z.B. GER10, MEX20, AUT4, CC2"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              value={offerInput.offerId}
              onChangeText={v => setOfferInput(p => ({ ...p, offerId: v.toUpperCase() }))}
              maxLength={8}
            />
            {offerInput.offerId.length >= 2 && (
              <View style={[styles.preview, offerSticker ? styles.previewOk : styles.previewErr]}>
                {offerSticker ? (
                  <Text style={styles.previewText}>
                    ✅ {offerSticker.id} · {offerSticker.name}
                    {offerSticker.teamName ? ` · ${TEAM_FLAGS[offerSticker.team] ?? ''} ${offerSticker.teamName}` : ''}
                  </Text>
                ) : (
                  <Text style={styles.previewTextErr}>❌ Sticker nicht gefunden</Text>
                )}
              </View>
            )}

            {/* Ich suche */}
            <Text style={[styles.fieldLabel, { marginTop: SPACING.lg }]}>Ich suche — Sticker-ID eingeben</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="z.B. AUT1, FRA8, CC11"
              placeholderTextColor={COLORS.textMuted}
              autoCapitalize="characters"
              value={offerInput.needId}
              onChangeText={v => setOfferInput(p => ({ ...p, needId: v.toUpperCase() }))}
              maxLength={8}
            />
            {offerInput.needId.length >= 2 && (
              <View style={[styles.preview, needSticker ? styles.previewOk : styles.previewErr]}>
                {needSticker ? (
                  <Text style={styles.previewText}>
                    ✅ {needSticker.id} · {needSticker.name}
                    {needSticker.teamName ? ` · ${TEAM_FLAGS[needSticker.team] ?? ''} ${needSticker.teamName}` : ''}
                  </Text>
                ) : (
                  <Text style={styles.previewTextErr}>❌ Sticker nicht gefunden</Text>
                )}
              </View>
            )}

            {/* Doppelte als Schnellauswahl */}
            {duplicateIds.length > 0 && (
              <View style={styles.quickPick}>
                <Text style={styles.quickPickLabel}>💡 Deine Doppelten:</Text>
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
                title="Angebot erstellen"
                onPress={handleCreateOffer}
                disabled={!offerSticker || !needSticker}
                style={{ flex: 1, marginRight: SPACING.sm }}
              />
              <TouchableOpacity onPress={() => { setShowCreateModal(false); setOfferInput({ offerId: '', needId: '' }); }} style={styles.cancelBtn}>
                <Text style={styles.cancelText}>Abbrechen</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>
        </View>
      </Modal>
    </View>
  );
}

function OfferCard({ offer, isOwn, onDelete }) {
  const offered = (offer.offeredStickers ?? []).map(id => lookupSticker(id)).filter(Boolean);
  const wanted  = (offer.wantedStickers  ?? []).map(id => lookupSticker(id)).filter(Boolean);

  return (
    <View style={styles.offerCard}>
      <View style={styles.offerRow}>
        <View style={styles.offerSide}>
          <Text style={styles.offerSideLabel}>Ich biete</Text>
          {offered.map(s => (
            <Text key={s.id} style={styles.offerSticker}>
              {TEAM_FLAGS[s.team] ?? '🌍'} {s.id} · {s.name}
            </Text>
          ))}
        </View>
        <Text style={styles.offerArrow}>⇄</Text>
        <View style={styles.offerSide}>
          <Text style={styles.offerSideLabel}>Ich suche</Text>
          {wanted.map(s => (
            <Text key={s.id} style={styles.offerSticker}>
              {TEAM_FLAGS[s.team] ?? '🌍'} {s.id} · {s.name}
            </Text>
          ))}
        </View>
      </View>
      {offer.distanceKm != null && (
        <Text style={styles.offerDistance}>📍 {offer.distanceKm.toFixed(1)} km entfernt</Text>
      )}
      <View style={styles.offerActions}>
        {isOwn ? (
          <TouchableOpacity onPress={onDelete} style={styles.deleteBtn}>
            <Text style={styles.deleteBtnText}>🗑 Löschen</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity style={styles.contactBtn}>
            <Text style={styles.contactBtnText}>💬 Kontakt aufnehmen</Text>
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
  emptyEmoji: { fontSize: 48, marginBottom: SPACING.lg },
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
  offerArrow: { color: COLORS.gold, fontSize: FONTS.sizes.xxl, marginHorizontal: SPACING.md, marginTop: SPACING.xs },
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

  modalActions: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.lg },
  cancelBtn: { paddingVertical: SPACING.md, paddingHorizontal: SPACING.lg },
  cancelText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
});
