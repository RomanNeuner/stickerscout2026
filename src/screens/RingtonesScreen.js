/**
 * RingtonesScreen — WM 2026 Songs & Klingeltöne
 *
 * Songs:
 *   song1 — United Voices   "One World, One Game"    🌍 INT
 *   song2 — Leo Falk        "Wir halten zusammen"    🇩🇪 DE
 *   song3 — Da Austro-Bua   "Unaufhoitboa"           🇦🇹 AT
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Image, Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import Purchases from 'react-native-purchases';

import { COLORS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { RINGTONE_IDS, FULLTRACK_IDS } from '../services/subscription';
import { IAP_PRODUCTS } from '../config/iap';
import GoldButton from '../components/GoldButton';

// ──────────────────────────────────────────────────────────────────────────────
// Song-Definitionen (require lokal für sichere Metro-Auflösung)
// ──────────────────────────────────────────────────────────────────────────────
const SONGS = [
  {
    id: 1,
    artist: 'United Voices',
    title: 'One World, One Game',
    market: '🌍',
    marketLabel: 'International',
    accentColor: '#F5C033',
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG1,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG1,
    cover:    require('../../assets/ringtones/covers/song1_cover.png'),
    preview:  require('../../assets/ringtones/song1_preview.mp3'),
    ringtone: require('../../assets/ringtones/song1_ringtone.mp3'),
    fulltrack: require('../../assets/ringtones/song1_full.mp3'),
  },
  {
    id: 2,
    artist: 'Leo Falk',
    title: 'Wir halten zusammen',
    market: '🇩🇪',
    marketLabel: 'Deutschland',
    accentColor: '#4FC3F7',
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG2,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG2,
    cover:    require('../../assets/ringtones/covers/song2_cover.png'),
    preview:  require('../../assets/ringtones/song2_preview.mp3'),
    ringtone: require('../../assets/ringtones/song2_ringtone.mp3'),
    fulltrack: require('../../assets/ringtones/song2_full.mp3'),
  },
  {
    id: 3,
    artist: 'Da Austro-Bua',
    title: 'Unaufhoitboa',
    market: '🇦🇹',
    marketLabel: 'Österreich',
    accentColor: '#FF6B6B',
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG3,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG3,
    cover:    require('../../assets/ringtones/covers/song3_cover.png'),
    preview:  require('../../assets/ringtones/song3_preview.mp3'),
    ringtone: require('../../assets/ringtones/song3_ringtone.mp3'),
    fulltrack: require('../../assets/ringtones/song3_full.mp3'),
  },
];

// ──────────────────────────────────────────────────────────────────────────────
// Audio-Player Komponente (ein Player pro Song = stabile Hooks)
// ──────────────────────────────────────────────────────────────────────────────
function SongCard({ song, isPlaying, onPlay, ownedRingtone, ownedFulltrack, onBuyRingtone, onBuyFulltrack, onSetRingtone, buyingId }) {
  const player = useAudioPlayer(song.preview);

  // Play/Pause steuern
  useEffect(() => {
    if (isPlaying) {
      player.play();
    } else {
      player.pause();
    }
  }, [isPlaying]);

  // Cleanup wenn unmount
  useEffect(() => {
    return () => { try { player.pause(); } catch {} };
  }, []);

  const isBuyingRt = buyingId === `rt_${song.id}`;
  const isBuyingFt = buyingId === `ft_${song.id}`;

  return (
    <View style={[styles.songCard, { borderColor: song.accentColor + '35' }]}>
      {/* Cover groß */}
      <View style={[styles.coverWrap, { borderColor: song.accentColor + '70' }]}>
        <Image source={song.cover} style={styles.cover} resizeMode="cover" />
        {/* Market-Flag */}
        <View style={[styles.marketBadge, { backgroundColor: song.accentColor + 'DD' }]}>
          <Text style={styles.marketText}>{song.market} {song.marketLabel}</Text>
        </View>
        {/* Play-Button über Cover */}
        <TouchableOpacity
          style={[styles.playOverlay, isPlaying && { backgroundColor: 'rgba(0,0,0,0.55)' }]}
          onPress={onPlay}
          activeOpacity={0.85}
        >
          <View style={[styles.playCircle, { borderColor: song.accentColor }]}>
            <Ionicons
              name={isPlaying ? 'pause' : 'play'}
              size={28}
              color={song.accentColor}
            />
          </View>
          {isPlaying && (
            <Text style={[styles.playingLabel, { color: song.accentColor }]}>spielt…</Text>
          )}
        </TouchableOpacity>
      </View>

      {/* Artist + Titel */}
      <View style={styles.songInfo}>
        <Text style={[styles.artist, { color: song.accentColor }]}>{song.artist}</Text>
        <Text style={styles.songTitle}>{song.title}</Text>
      </View>

      {/* Klingelton Button */}
      {ownedRingtone ? (
        <TouchableOpacity
          style={[styles.rtOwnedBtn, { borderColor: song.accentColor + '60' }]}
          onPress={onSetRingtone}
        >
          <Ionicons name="phone-portrait-outline" size={18} color={song.accentColor} />
          <Text style={[styles.rtOwnedText, { color: song.accentColor }]}>
            🔔 Als Klingelton setzen
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          style={[styles.rtBuyBtn, { backgroundColor: song.accentColor }]}
          onPress={onBuyRingtone}
          disabled={isBuyingRt}
        >
          {isBuyingRt
            ? <ActivityIndicator size="small" color={COLORS.bg} />
            : <>
                <Ionicons name="musical-note" size={18} color={COLORS.bg} />
                <Text style={styles.rtBuyText}>🔔 Klingelton kaufen — €0,99</Text>
              </>
          }
        </TouchableOpacity>
      )}

      {/* Ganzer Song Button — GROSS */}
      {ownedFulltrack ? (
        <View style={styles.ftOwnedRow}>
          <Ionicons name="checkmark-circle" size={20} color={COLORS.green} />
          <Text style={styles.ftOwnedText}>Ganzer Song — in deiner Bibliothek</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.ftBuyBtn}
          onPress={onBuyFulltrack}
          disabled={isBuyingFt}
        >
          {isBuyingFt
            ? <ActivityIndicator size="small" color={COLORS.textPrimary} />
            : <>
                <Ionicons name="download" size={22} color={COLORS.textPrimary} />
                <View>
                  <Text style={styles.ftBuyTitle}>⬇ Ganzen Song laden</Text>
                  <Text style={styles.ftBuyPrice}>€1,99 — einmal kaufen, für immer besitzen</Text>
                </View>
              </>
          }
        </TouchableOpacity>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function RingtonesScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [ownedRingtones, setOwnedRingtones] = useState(new Set());
  const [ownedFulltracks, setOwnedFulltracks] = useState(new Set());
  const [playingId, setPlayingId] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const [upsellSong, setUpsellSong] = useState(null);

  useFocusEffect(useCallback(() => {
    loadOwned();
    return () => setPlayingId(null);
  }, []));

  const loadOwned = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      const txIds = (info.nonSubscriptionTransactions ?? []).map(t => t.productIdentifier);
      const active = Object.keys(info.entitlements.active ?? {});
      const all = new Set([...txIds, ...active]);
      setOwnedRingtones(new Set(RINGTONE_IDS.filter(id => all.has(id))));
      setOwnedFulltracks(new Set(FULLTRACK_IDS.filter(id => all.has(id))));
    } catch {}
  };

  const handlePlay = (song) => {
    setPlayingId(prev => prev === song.id ? null : song.id);
  };

  // Klingelton kaufen
  const handleBuyRingtone = async (song) => {
    setBuyingId(`rt_${song.id}`);
    try {
      const products = await Purchases.getProducts([song.ringtoneId]);
      if (!products.length) throw new Error('Produkt nicht gefunden');
      await Purchases.purchaseStoreProduct(products[0]);
      setOwnedRingtones(prev => new Set([...prev, song.ringtoneId]));
      if (!ownedFulltracks.has(song.fulltrackId)) {
        setTimeout(() => setUpsellSong(song), 400);
      } else {
        Alert.alert('✅ Klingelton freigeschaltet!', `"${song.title}" ist jetzt verfügbar.`);
      }
    } catch (e) {
      if (!e.userCancelled) Alert.alert('Fehler', 'Kauf fehlgeschlagen.');
    } finally { setBuyingId(null); }
  };

  // Ganzer Song kaufen
  const handleBuyFulltrack = async (song) => {
    setBuyingId(`ft_${song.id}`);
    setUpsellSong(null);
    try {
      const products = await Purchases.getProducts([song.fulltrackId]);
      if (!products.length) throw new Error('Produkt nicht gefunden');
      await Purchases.purchaseStoreProduct(products[0]);
      setOwnedFulltracks(prev => new Set([...prev, song.fulltrackId]));
      Alert.alert('✅ Song gekauft!', `"${song.title}" gehört dir — für immer!`);
    } catch (e) {
      if (!e.userCancelled) Alert.alert('Fehler', 'Kauf fehlgeschlagen.');
    } finally { setBuyingId(null); }
  };

  // Klingelton setzen
  const handleSetRingtone = async (song) => {
    if (Platform.OS === 'ios') {
      try {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(song.ringtone, {
            mimeType: 'audio/x-m4r', UTI: 'com.apple.m4r-audio',
            dialogTitle: 'Als Klingelton setzen',
          });
        } else Alert.alert('Info', t('ringtones.iosHint'));
      } catch { Alert.alert('Info', t('ringtones.iosHint')); }
    } else {
      Alert.alert('📱 Klingelton setzen', t('ringtones.androidHint'), [{ text: 'OK' }]);
    }
  };

  const handleRestore = async () => {
    try {
      await Purchases.restorePurchases();
      await loadOwned();
      Alert.alert('✅', 'Käufe wiederhergestellt.');
    } catch { Alert.alert('Fehler', 'Wiederherstellung fehlgeschlagen.'); }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#1B3A52', '#0D1F2D']} style={styles.header}>
        <Text style={styles.headerTitle}>🎵 WM 2026 Songs</Text>
        <Text style={styles.headerSub}>Unsere WM 2026 Songs — exklusiv für die App</Text>
        <Text style={styles.headerHint}>Vorschau kostenlos · Klingelton €0,99 · Ganzer Song €1,99</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 32 }]}
        showsVerticalScrollIndicator={false}
      >
        {SONGS.map(song => (
          <SongCard
            key={song.id}
            song={song}
            isPlaying={playingId === song.id}
            onPlay={() => handlePlay(song)}
            ownedRingtone={ownedRingtones.has(song.ringtoneId)}
            ownedFulltrack={ownedFulltracks.has(song.fulltrackId)}
            onBuyRingtone={() => handleBuyRingtone(song)}
            onBuyFulltrack={() => handleBuyFulltrack(song)}
            onSetRingtone={() => handleSetRingtone(song)}
            buyingId={buyingId}
          />
        ))}

        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={styles.restoreText}>{t('ringtones.restore')}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Upsell Modal */}
      <Modal visible={!!upsellSong} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            {upsellSong && (
              <Image source={upsellSong.cover} style={styles.modalCover} resizeMode="cover" />
            )}
            <Text style={styles.modalTitle}>🎵 Du hast den Klingelton!</Text>
            <Text style={styles.modalBody}>
              Hol dir{' '}
              <Text style={{ color: COLORS.gold, fontWeight: '700' }}>
                "{upsellSong?.title}"
              </Text>
              {'\n'}als vollen Song — für nur{' '}
              <Text style={{ color: COLORS.gold, fontWeight: '800' }}>€1,00 mehr!</Text>
            </Text>
            <GoldButton
              title="⬇ Ganzen Song laden — €1,99"
              onPress={() => upsellSong && handleBuyFulltrack(upsellSong)}
              style={{ marginTop: SPACING.lg }}
            />
            <TouchableOpacity style={styles.modalDismiss} onPress={() => setUpsellSong(null)}>
              <Text style={styles.modalDismissText}>Nein danke</Text>
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

  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  headerTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    marginBottom: SPACING.xs,
  },
  headerSub: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.sm,
  },
  headerHint: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
  },

  content: { padding: SPACING.lg, gap: SPACING.xl },

  // Song Card
  songCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.xl,
    borderWidth: 1,
    overflow: 'hidden',
    ...SHADOWS.card,
  },

  // Cover
  coverWrap: {
    width: '100%',
    aspectRatio: 1.6,
    borderBottomWidth: 1.5,
    position: 'relative',
  },
  cover: {
    width: '100%',
    height: '100%',
  },
  marketBadge: {
    position: 'absolute',
    top: SPACING.sm,
    left: SPACING.sm,
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
  },
  marketText: {
    color: '#fff',
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  playOverlay: {
    position: 'absolute',
    inset: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  playCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2.5,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  playingLabel: {
    marginTop: SPACING.xs,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },

  // Song Info
  songInfo: {
    padding: SPACING.lg,
    paddingBottom: SPACING.sm,
  },
  artist: {
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  songTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
  },

  // Klingelton Button
  rtBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
  },
  rtBuyText: {
    color: COLORS.bg,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.bold,
  },
  rtOwnedBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    paddingVertical: SPACING.md,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.04)',
  },
  rtOwnedText: {
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
  },

  // Ganzer Song Button — GROSS
  ftBuyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderRadius: RADIUS.lg,
    backgroundColor: 'rgba(255,255,255,0.08)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
  },
  ftBuyTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
  },
  ftBuyPrice: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
    marginTop: 2,
  },
  ftOwnedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginHorizontal: SPACING.lg,
    marginTop: SPACING.xs,
    marginBottom: SPACING.lg,
    paddingVertical: SPACING.sm,
  },
  ftOwnedText: {
    color: COLORS.green,
    fontSize: FONTS.sizes.md,
    fontWeight: FONTS.weights.semibold,
  },

  restoreBtn: { alignItems: 'center', paddingVertical: SPACING.lg },
  restoreText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },

  // Upsell Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'flex-end',
  },
  modalCard: {
    backgroundColor: '#1A2E3D',
    borderTopLeftRadius: RADIUS.xxl ?? 28,
    borderTopRightRadius: RADIUS.xxl ?? 28,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxxl ?? 48,
    borderWidth: 1,
    borderColor: 'rgba(245,192,51,0.25)',
  },
  modalCover: {
    width: '100%',
    height: 160,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.lg,
  },
  modalTitle: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.black,
    textAlign: 'center',
    marginBottom: SPACING.md,
  },
  modalBody: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    textAlign: 'center',
    lineHeight: 24,
  },
  modalDismiss: { alignItems: 'center', marginTop: SPACING.lg, paddingVertical: SPACING.md },
  modalDismissText: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm },
});
