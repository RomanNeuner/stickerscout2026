/**
 * RingtonesScreen — WM 2026 Klingeltöne & Full Tracks
 *
 * Songs:
 *   song1 — United Voices   "One World, One Game"    🌍 INT
 *   song2 — Leo Falk        "Wir halten zusammen"    🇩🇪 DE
 *   song3 — Da Austro-Bua   "Unaufhoitboa"           🇦🇹 AT
 *
 * IAPs:
 *   ringtone.song[1-3]  — €0,99  Klingelton-Version
 *   fulltrack.song[1-3] — €1,99  Vollständiger Song
 *
 * Upsell: nach Klingelton-Kauf → Modal "Ganzen Song für €1,00 mehr"
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer, useAudioPlayerStatus } from 'expo-audio';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Purchases from 'react-native-purchases';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { RINGTONE_IDS, FULLTRACK_IDS } from '../services/subscription';
import { SONGS as SONGS_CONFIG } from '../config/iap';
import GoldButton from '../components/GoldButton';

// SONGS aus zentraler Config + lokale UI-Extras
const SONGS = [
  { ...SONGS_CONFIG.song1, id: 1, market: '🌍', marketLabel: 'International', duration: '0:38', accentColor: '#F5C033', full: SONGS_CONFIG.song1.fulltrack },
  { ...SONGS_CONFIG.song2, id: 2, market: '🇩🇪', marketLabel: 'Deutschland',  duration: '0:42', accentColor: '#4FC3F7', full: SONGS_CONFIG.song2.fulltrack },
  { ...SONGS_CONFIG.song3, id: 3, market: '🇦🇹', marketLabel: 'Österreich',   duration: '0:45', accentColor: '#FF6B6B', full: SONGS_CONFIG.song3.fulltrack },
];

// ──────────────────────────────────────────────────────────────────────────────
export default function RingtonesScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [ownedRingtones, setOwnedRingtones] = useState(new Set());
  const [ownedFulltracks, setOwnedFulltracks] = useState(new Set());
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [upsellSong, setUpsellSong] = useState(null);
  const [currentSource, setCurrentSource] = useState(null);
  const player = useAudioPlayer(currentSource);
  const playerStatus = useAudioPlayerStatus(player);

  // Playback Ende erkennen
  useEffect(() => {
    if (playerStatus?.didJustFinish) {
      setPlayingId(null);
      setCurrentSource(null);
    }
  }, [playerStatus?.didJustFinish]);

  useFocusEffect(useCallback(() => {
    loadOwned();
    return () => {
      player?.pause();
      setPlayingId(null);
      setCurrentSource(null);
    };
  }, []));

  const loadOwned = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      const txIds = (info.nonSubscriptionTransactions ?? []).map(t => t.productIdentifier);
      const active = Object.keys(info.entitlements.active ?? {});
      const allOwned = new Set([...txIds, ...active]);
      setOwnedRingtones(new Set(RINGTONE_IDS.filter(id => allOwned.has(id))));
      setOwnedFulltracks(new Set(FULLTRACK_IDS.filter(id => allOwned.has(id))));
    } catch { /* RevenueCat nicht verfügbar */ }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Audio (expo-audio)
  // ──────────────────────────────────────────────────────────────────────────
  const handlePlayPreview = async (song) => {
    if (playingId === song.id) {
      player?.pause();
      setPlayingId(null);
      setCurrentSource(null);
      return;
    }
    // Stop current
    player?.pause();
    setPlayingId(null);
    setLoadingId(song.id);
    try {
      setCurrentSource(song.preview);
      setPlayingId(song.id);
      setTimeout(() => player?.play(), 150); // kurz warten bis Source geladen
    } catch {
      Alert.alert('Fehler', 'Vorschau konnte nicht geladen werden.');
    } finally {
      setLoadingId(null);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Kauf — Klingelton
  // ──────────────────────────────────────────────────────────────────────────
  const handleBuyRingtone = async (song) => {
    setBuyingId(`rt_${song.id}`);
    try {
      const products = await Purchases.getProducts([song.ringtoneId]);
      if (!products.length) throw new Error('Produkt nicht gefunden');
      await Purchases.purchaseStoreProduct(products[0]);
      const updated = new Set(ownedRingtones);
      updated.add(song.ringtoneId);
      setOwnedRingtones(updated);
      // Upsell anzeigen (nur wenn Full Track noch nicht gekauft)
      if (!ownedFulltracks.has(song.fulltrackId)) {
        setTimeout(() => setUpsellSong(song), 400);
      } else {
        Alert.alert('✅ Klingelton freigeschaltet!', `"${song.title}" wurde gespeichert.`);
      }
    } catch (e) {
      if (!e.userCancelled) Alert.alert('Fehler', 'Kauf fehlgeschlagen. Bitte erneut versuchen.');
    } finally { setBuyingId(null); }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Kauf — Full Track
  // ──────────────────────────────────────────────────────────────────────────
  const handleBuyFulltrack = async (song) => {
    setBuyingId(`ft_${song.id}`);
    setUpsellSong(null);
    try {
      const products = await Purchases.getProducts([song.fulltrackId]);
      if (!products.length) throw new Error('Produkt nicht gefunden');
      await Purchases.purchaseStoreProduct(products[0]);
      const updated = new Set(ownedFulltracks);
      updated.add(song.fulltrackId);
      setOwnedFulltracks(updated);
      Alert.alert('✅ Song gekauft!', `"${song.title}" — für immer deins!`);
    } catch (e) {
      if (!e.userCancelled) Alert.alert('Fehler', 'Kauf fehlgeschlagen. Bitte erneut versuchen.');
    } finally { setBuyingId(null); }
  };

  const handleRestore = async () => {
    try {
      await Purchases.restorePurchases();
      await loadOwned();
      Alert.alert('✅ Wiederhergestellt', 'Deine Käufe wurden wiederhergestellt.');
    } catch { Alert.alert('Fehler', 'Wiederherstellung fehlgeschlagen.'); }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Klingelton setzen
  // ──────────────────────────────────────────────────────────────────────────
  const handleSetRingtone = async (song) => {
    if (Platform.OS === 'ios') {
      try {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          // .m4r für iOS (echter Klingelton), fallback auf .mp3
          const source = song.ringtoneIOS ?? song.ringtone;
          await Sharing.shareAsync(source, {
            mimeType: 'audio/x-m4r',
            UTI: 'com.apple.m4r-audio',
            dialogTitle: 'Als Klingelton setzen',
          });
        } else {
          Alert.alert('Info', t('ringtones.iosHint'));
        }
      } catch { Alert.alert('Info', t('ringtones.iosHint')); }
    } else {
      Alert.alert('📱 Klingelton setzen', t('ringtones.androidHint'), [{ text: 'OK' }]);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#1A3A52', COLORS.bg]} style={styles.header}>
        <Text style={styles.title}>🔔 {t('ringtones.title')}</Text>
        <Text style={styles.subtitle}>{t('ringtones.subtitle')}</Text>
        <Text style={styles.previewNote}>🎵 {t('ringtones.previewNote')}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {SONGS.map(song => {
          const hasRingtone = ownedRingtones.has(song.ringtoneId);
          const hasFulltrack = ownedFulltracks.has(song.fulltrackId);
          const isPlaying = playingId === song.id;
          const isLoadingPreview = loadingId === song.id;
          const isBuyingRt = buyingId === `rt_${song.id}`;
          const isBuyingFt = buyingId === `ft_${song.id}`;

          return (
            <View key={song.id} style={[styles.songCard, { borderColor: song.accentColor + '30' }]}>
              {/* Cover + Info */}
              <View style={styles.songTop}>
                <View style={[styles.coverWrap, { borderColor: song.accentColor + '60' }]}>
                  <Image source={song.cover} style={styles.cover} resizeMode="cover" />
                  {/* Market Badge */}
                  <View style={styles.marketBadge}>
                    <Text style={styles.marketEmoji}>{song.market}</Text>
                  </View>
                </View>
                <View style={styles.songMeta}>
                  <Text style={[styles.artist, { color: song.accentColor }]}>{song.artist}</Text>
                  <Text style={styles.songTitle}>{song.title}</Text>
                  <Text style={styles.songDuration}>{song.marketLabel} · {song.duration}</Text>
                </View>
              </View>

              {/* Preview Button */}
              <TouchableOpacity
                style={[styles.previewBtn, isPlaying && { borderColor: song.accentColor + '80', backgroundColor: song.accentColor + '15' }]}
                onPress={() => handlePlayPreview(song)}
                disabled={isLoadingPreview}
              >
                {isLoadingPreview ? (
                  <ActivityIndicator size="small" color={song.accentColor} />
                ) : (
                  <Ionicons name={isPlaying ? 'stop-circle' : 'play-circle'} size={20} color={song.accentColor} />
                )}
                <Text style={[styles.previewBtnText, { color: song.accentColor }]}>
                  {isPlaying ? t('ringtones.stop') : t('ringtones.preview')}
                </Text>
              </TouchableOpacity>

              {/* Klingelton Button */}
              {hasRingtone ? (
                <TouchableOpacity style={[styles.setBtn, { borderColor: song.accentColor + '50' }]} onPress={() => handleSetRingtone(song)}>
                  <Ionicons name="phone-portrait-outline" size={16} color={song.accentColor} />
                  <Text style={[styles.setBtnText, { color: song.accentColor }]}>🔔 {t('ringtones.setRingtone')}</Text>
                </TouchableOpacity>
              ) : (
                <TouchableOpacity
                  style={[styles.buyBtn, { backgroundColor: song.accentColor }]}
                  onPress={() => handleBuyRingtone(song)}
                  disabled={isBuyingRt}
                >
                  {isBuyingRt ? <ActivityIndicator size="small" color={COLORS.bg} /> : (
                    <>
                      <Ionicons name="musical-note-outline" size={16} color={COLORS.bg} />
                      <Text style={styles.buyBtnText}>🔔 Klingelton — €0,99</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}

              {/* Full Track Button */}
              {hasFulltrack ? (
                <View style={styles.ownedFulltrack}>
                  <Ionicons name="checkmark-circle" size={16} color={COLORS.green} />
                  <Text style={styles.ownedFulltrackText}>✓ Ganzer Song — besessen</Text>
                </View>
              ) : (
                <TouchableOpacity
                  style={styles.fulltrackBtn}
                  onPress={() => handleBuyFulltrack(song)}
                  disabled={isBuyingFt}
                >
                  {isBuyingFt ? <ActivityIndicator size="small" color={COLORS.textSecondary} /> : (
                    <>
                      <Ionicons name="download-outline" size={16} color={COLORS.textSecondary} />
                      <Text style={styles.fulltrackBtnText}>⬇ Ganzer Song — €1,99</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
          );
        })}

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={styles.restoreText}>{t('ringtones.restore')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Upsell Modal */}
      <Modal visible={!!upsellSong} transparent animationType="fade">
        <View style={styles.upsellOverlay}>
          <View style={styles.upsellCard}>
            <Text style={styles.upsellEmoji}>🎵</Text>
            <Text style={styles.upsellTitle}>Du hast den Klingelton!</Text>
            <Text style={styles.upsellBody}>
              Hol dir jetzt{'\n'}
              <Text style={styles.upsellSongName}>"{upsellSong?.title}"</Text>
              {'\n'}als vollständigen Song für nur{'\n'}
              <Text style={styles.upsellPrice}>€1,00 mehr!</Text>
            </Text>
            <GoldButton
              title="⬇ Ganzen Song laden — €1,99"
              onPress={() => upsellSong && handleBuyFulltrack(upsellSong)}
              style={{ marginTop: SPACING.lg }}
            />
            <TouchableOpacity style={styles.upsellDismiss} onPress={() => setUpsellSong(null)}>
              <Text style={styles.upsellDismissText}>Nein danke</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { paddingHorizontal: SPACING.xl, paddingTop: SPACING.lg, paddingBottom: SPACING.xxl },
  title: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xxl, fontWeight: FONTS.weights.black, marginBottom: SPACING.xs },
  subtitle: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, marginBottom: SPACING.sm },
  previewNote: { color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  content: { padding: SPACING.lg, gap: SPACING.lg },

  songCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    padding: SPACING.lg,
    borderWidth: 1,
    gap: SPACING.sm,
    ...SHADOWS.card,
  },
  songTop: { flexDirection: 'row', gap: SPACING.lg, alignItems: 'center', marginBottom: SPACING.xs },
  coverWrap: {
    width: 80, height: 80,
    borderRadius: RADIUS.lg,
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
  },
  cover: { width: '100%', height: '100%' },
  marketBadge: {
    position: 'absolute', bottom: 4, right: 4,
    backgroundColor: 'rgba(0,0,0,0.6)',
    borderRadius: RADIUS.sm,
    padding: 2,
  },
  marketEmoji: { fontSize: 14 },
  songMeta: { flex: 1 },
  artist: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.bold, marginBottom: 2 },
  songTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.black, marginBottom: 4 },
  songDuration: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },

  previewBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.15)',
  },
  previewBtnText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },

  setBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    borderWidth: 1, backgroundColor: 'rgba(255,255,255,0.04)',
  },
  setBtnText: { fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },

  buyBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.md, borderRadius: RADIUS.md,
  },
  buyBtnText: { color: COLORS.bg, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.bold },

  fulltrackBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.sm, borderRadius: RADIUS.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  fulltrackBtnText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.medium },

  ownedFulltrack: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  ownedFulltrackText: { color: COLORS.green, fontSize: FONTS.sizes.sm },

  restoreBtn: { alignItems: 'center', paddingVertical: SPACING.lg },
  restoreText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },

  // Upsell Modal
  upsellOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.75)', justifyContent: 'center', alignItems: 'center', padding: SPACING.xl },
  upsellCard: {
    backgroundColor: COLORS.surfaceRaised ?? '#1A2E3D',
    borderRadius: RADIUS.xl,
    padding: SPACING.xxl,
    alignItems: 'center',
    width: '100%',
    borderWidth: 1,
    borderColor: 'rgba(245,192,51,0.3)',
    ...SHADOWS.modal,
  },
  upsellEmoji: { fontSize: 48, marginBottom: SPACING.md },
  upsellTitle: { color: COLORS.gold, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.black, marginBottom: SPACING.md },
  upsellBody: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textAlign: 'center', lineHeight: 24 },
  upsellSongName: { color: COLORS.textPrimary, fontWeight: FONTS.weights.bold },
  upsellPrice: { color: COLORS.gold, fontWeight: FONTS.weights.black, fontSize: FONTS.sizes.lg },
  upsellDismiss: { marginTop: SPACING.lg, padding: SPACING.md },
  upsellDismissText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
});
