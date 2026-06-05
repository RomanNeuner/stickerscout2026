/**
 * RingtonesScreen — nach HTML-Vorlage "Claude_RingtonePage"
 *
 * Songs:
 *   song1 — United Voices  "One World, One Game"   🌍 Gold
 *   song2 — Leo Falk       "Wir halten zusammen"   🇩🇪 Blau
 *   song3 — Da Austro-Bua  "Unaufhoitboa"          🇦🇹 Rot
 *
 * Gesichter auf den Covers sichtbar:
 *   Covers sind Portrait → Cover-Höhe 300dp, Bild leicht nach oben verschoben
 */
import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, ActivityIndicator, Image, Animated,
} from 'react-native';
import { Ionicons, MaterialCommunityIcons, Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { useAudioPlayer } from 'expo-audio';
import * as Sharing from 'expo-sharing';
import Purchases from 'react-native-purchases';

import { COLORS, FONTS, SPACING, RADIUS } from '../theme';
import { RINGTONE_IDS, FULLTRACK_IDS } from '../services/subscription';
import { IAP_PRODUCTS } from '../config/iap';
import { OFFERINGS, PACKAGES } from '../config/revenueCat';
import { purchasePackageFromOffering, purchaseProductDirect } from '../services/subscription';

// ──────────────────────────────────────────────────────────────────────────────
// Song-Definitionen
// faceOffset: wie viele Pixel das Bild nach oben verschoben wird
// damit Gesichter im Frame sichtbar bleiben
// ──────────────────────────────────────────────────────────────────────────────
const SONGS = [
  {
    id: 1,
    artist: 'United Voices',
    title: 'One World, One Game',
    subtitle: 'International Football Anthem',
    market: '🌍',
    marketLabel: 'International',
    theme: 'gold',
    accentColor: '#F5C033',
    accentColorLight: '#FFE17A',
    borderColor: 'rgba(245,192,51,0.38)',
    glowColor: 'rgba(245,192,51,0.14)',
    faceOffset: -30,        // Gesichter in oberer Mitte → leicht nach oben
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG1,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG1,
    ringtonePackage: PACKAGES.RINGTONE_SONG1,
    fulltrackPackage: PACKAGES.FULLTRACK_SONG1,
    cover:    require('../../assets/ringtones/covers/song1_cover.png'),
    preview:  require('../../assets/ringtones/song1_preview.mp3'),
    ringtone: require('../../assets/ringtones/song1_ringtone.mp3'),
    fulltrack: require('../../assets/ringtones/song1_full.mp3'),
  },
  {
    id: 2,
    artist: 'Leo Falk',
    title: 'Wir halten zusammen',
    subtitle: 'Deutschland Fan-Song',
    market: '🇩🇪',
    marketLabel: 'Deutschland',
    theme: 'blue',
    accentColor: '#4FC3F7',
    accentColorLight: '#7FD4FF',
    borderColor: 'rgba(79,195,247,0.30)',
    glowColor: 'rgba(79,195,247,0.10)',
    faceOffset: -60,        // Ganzkörper-Bild → stärker nach oben für Gesicht
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG2,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG2,
    ringtonePackage: PACKAGES.RINGTONE_SONG2,
    fulltrackPackage: PACKAGES.FULLTRACK_SONG2,
    cover:    require('../../assets/ringtones/covers/song2_cover.png'),
    preview:  require('../../assets/ringtones/song2_preview.mp3'),
    ringtone: require('../../assets/ringtones/song2_ringtone.mp3'),
    fulltrack: require('../../assets/ringtones/song2_full.mp3'),
  },
  {
    id: 3,
    artist: 'Da Austro-Bua',
    title: 'Unaufhoitboa',
    subtitle: "Aus'm Herz, für Österreich!",
    market: '🇦🇹',
    marketLabel: 'Österreich',
    theme: 'red',
    accentColor: '#FF6B6B',
    accentColorLight: '#FF9A9A',
    borderColor: 'rgba(255,107,107,0.35)',
    glowColor: 'rgba(255,107,107,0.12)',
    faceOffset: -40,        // Arm hochgestreckt → etwas nach oben
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG3,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG3,
    ringtonePackage: PACKAGES.RINGTONE_SONG3,
    fulltrackPackage: PACKAGES.FULLTRACK_SONG3,
    cover:    require('../../assets/ringtones/covers/song3_cover.png'),
    preview:  require('../../assets/ringtones/song3_preview.mp3'),
    ringtone: require('../../assets/ringtones/song3_ringtone.mp3'),
    fulltrack: require('../../assets/ringtones/song3_full.mp3'),
  },
];

// Waveform-Höhen (zufällig aber schön)
const WAVE1 = [10,18,28,14,24,33,20,27,13,30,18,26,15,21,32,12,25,16,28,19];
const WAVE2 = [12,22,16,30,18,26,14,32,20,24,15,28,17,23,31,13,25,19,27,21];
const WAVE3 = [14,26,18,32,15,28,20,30,13,24,17,29,16,22,31,12,27,19,25,21];
const WAVES = [WAVE1, WAVE2, WAVE3];

// ──────────────────────────────────────────────────────────────────────────────
// Song Card (eigene Komponente für stabile useAudioPlayer Hooks)
// ──────────────────────────────────────────────────────────────────────────────
function SongCard({ song, isPlaying, onPlay, ownedRingtone, ownedFulltrack,
                    onBuyRingtone, onBuyFulltrack, onSetRingtone, isBuying }) {

  const player = useAudioPlayer(song.preview);
  const isFeatured = song.theme === 'gold';

  useEffect(() => {
    try {
      if (isPlaying) player.play();
      else player.pause();
    } catch {}
  }, [isPlaying]);

  useEffect(() => () => { try { player.pause(); } catch {} }, []);

  return (
    <View style={[
      s.card,
      { borderColor: song.borderColor },
      isFeatured && { shadowColor: song.accentColor, shadowOpacity: 0.3, shadowRadius: 22, elevation: 12 },
    ]}>
      {/* ── Cover ── */}
      <View style={s.coverWrap}>
        {/* Bild nach oben verschoben für Gesicht */}
        <Image
          source={song.cover}
          style={[s.coverImg, { transform: [{ translateY: song.faceOffset }] }]}
          resizeMode="cover"
        />
        {/* Vignette unten */}
        <LinearGradient
          colors={['rgba(13,31,45,0.05)', 'transparent', 'rgba(10,26,40,0.82)']}
          locations={[0, 0.38, 1]}
          style={StyleSheet.absoluteFill}
          pointerEvents="none"
        />

        {/* Country Pill oben links */}
        <View style={[s.countryPill,
          song.theme === 'blue' && { backgroundColor: '#1B6E9C' },
          song.theme === 'red'  && { backgroundColor: '#B43838' },
          song.theme === 'gold' && {},
        ]}>
          {song.theme === 'gold'
            ? <LinearGradient colors={['#FFE17A','#C8941F']} style={s.countryPillGrad}>
                <Text style={[s.countryText, { color: '#0D1F2D' }]}>{song.market} {song.marketLabel}</Text>
              </LinearGradient>
            : <Text style={[s.countryText, { color: '#fff' }]}>{song.market} {song.marketLabel}</Text>
          }
        </View>

        {/* Play Button zentriert */}
        <TouchableOpacity style={[s.playBtn, { borderColor: song.accentColor }]} onPress={onPlay}>
          <Ionicons
            name={isPlaying ? 'pause' : 'play'}
            size={34}
            color={song.accentColor}
            style={isPlaying ? {} : { marginLeft: 4 }}
          />
        </TouchableOpacity>

        {/* Preview Chip unten links */}
        <View style={s.previewChip}>
          <View style={s.previewDot} />
          <Text style={s.previewChipText}>Vorschau kostenlos</Text>
        </View>
      </View>

      {/* ── Song Content ── */}
      <View style={s.songContent}>
        <Text style={[s.songArtist, { color: song.accentColor }]}>{song.artist.toUpperCase()}</Text>
        <Text style={s.songTitle}>{song.title}</Text>
        <Text style={s.songSub}>{song.subtitle}</Text>

        {/* Waveform */}
        <View style={s.waveRow}>
          <Text style={s.waveTime}>{isPlaying ? '●' : '0:00'}</Text>
          <View style={s.waveform}>
            {WAVES[song.id - 1].map((h, i) => (
              <View
                key={i}
                style={[
                  s.wavebar,
                  { height: h },
                  isPlaying && i < 10 && {
                    backgroundColor: song.accentColor,
                    shadowColor: song.accentColor,
                    shadowOpacity: 0.5,
                    shadowRadius: 3,
                  },
                ]}
              />
            ))}
          </View>
          <Text style={s.waveTime}>0:30</Text>
        </View>

        {/* Purchase Grid — 2 Spalten */}
        <View style={s.purchaseGrid}>
          {/* Klingelton */}
          {ownedRingtone ? (
            <TouchableOpacity style={[s.purchaseCardRt, { borderColor: song.accentColor + '90' }]}
              onPress={onSetRingtone}>
              <View style={s.purchaseIcon}>
                <Ionicons name="notifications" size={20} color="#0D1F2D" />
              </View>
              <Text style={s.purchaseCardRtLabel}>✓ Als Klingelton setzen</Text>
              <Text style={s.purchaseCardRtSub}>Bereits gekauft</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity
              style={s.purchaseCardRt}
              onPress={onBuyRingtone}
              disabled={isBuying === `rt_${song.id}`}
            >
              {isBuying === `rt_${song.id}`
                ? <ActivityIndicator color="#0D1F2D" />
                : <>
                    <View style={s.purchaseIcon}>
                      <Ionicons name="notifications-outline" size={20} color="#0D1F2D" />
                    </View>
                    <Text style={s.purchaseCardRtLabel}>Klingelton kaufen</Text>
                    <Text style={s.purchasePrice}>€0,99</Text>
                  </>
              }
            </TouchableOpacity>
          )}

          {/* Ganzer Song */}
          {ownedFulltrack ? (
            <View style={s.purchaseCardSong}>
              <View style={[s.purchaseIconDark, { borderColor: song.accentColor + '40' }]}>
                <Ionicons name="checkmark" size={20} color={song.accentColor} />
              </View>
              <Text style={s.purchaseCardSongLabel}>In deiner Bibliothek</Text>
              <Text style={[s.purchaseCardSongSub, { color: COLORS.green }]}>Ganzer Song</Text>
            </View>
          ) : (
            <TouchableOpacity
              style={s.purchaseCardSong}
              onPress={onBuyFulltrack}
              disabled={isBuying === `ft_${song.id}`}
            >
              {isBuying === `ft_${song.id}`
                ? <ActivityIndicator color={song.accentColor} />
                : <>
                    <View style={[s.purchaseIconDark, { borderColor: song.accentColor + '40' }]}>
                      <Ionicons name="musical-note" size={20} color={song.accentColor} />
                    </View>
                    <Text style={s.purchaseCardSongLabel}>Ganzen Song kaufen</Text>
                    <Text style={[s.purchasePriceDark, { color: song.accentColor }]}>€1,99</Text>
                  </>
              }
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
export default function RingtonesScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [ownedRingtones, setOwnedRingtones] = useState(new Set());
  const [ownedFulltracks, setOwnedFulltracks] = useState(new Set());
  const [playingId, setPlayingId]   = useState(null);
  const [isBuying, setIsBuying]     = useState(null);

  useFocusEffect(useCallback(() => {
    loadOwned();
    return () => setPlayingId(null);
  }, []));

  const loadOwned = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      const txIds  = (info.nonSubscriptionTransactions ?? []).map(t => t.productIdentifier);
      const active = Object.keys(info.entitlements.active ?? {});
      const all    = new Set([...txIds, ...active]);
      setOwnedRingtones(new Set(RINGTONE_IDS.filter(id => all.has(id))));
      setOwnedFulltracks(new Set(FULLTRACK_IDS.filter(id => all.has(id))));
    } catch {}
  };

  const handlePlay = (song) =>
    setPlayingId(prev => prev === song.id ? null : song.id);

  const handleBuyRingtone = async (song) => {
    setIsBuying(`rt_${song.id}`);
    try {
      const res = await purchasePackageFromOffering(OFFERINGS.RINGTONES, song.ringtonePackage)
        .catch(() => purchaseProductDirect(song.ringtoneId));
      if (res?.success) {
        setOwnedRingtones(prev => new Set([...prev, song.ringtoneId]));
        Alert.alert('✅ Klingelton freigeschaltet!', `"${song.title}" ist jetzt verfügbar.`);
      }
    } catch (e) {
      if (!e?.userCancelled) Alert.alert('Fehler', 'Kauf fehlgeschlagen.');
    } finally { setIsBuying(null); }
  };

  const handleBuyFulltrack = async (song) => {
    setIsBuying(`ft_${song.id}`);
    try {
      const res = await purchasePackageFromOffering(OFFERINGS.RINGTONES, song.fulltrackPackage)
        .catch(() => purchaseProductDirect(song.fulltrackId));
      if (res?.success) {
        setOwnedFulltracks(prev => new Set([...prev, song.fulltrackId]));
        Alert.alert('✅ Song gekauft!', `"${song.title}" — für immer deins!`);
      }
    } catch (e) {
      if (!e?.userCancelled) Alert.alert('Fehler', 'Kauf fehlgeschlagen.');
    } finally { setIsBuying(null); }
  };

  const handleSetRingtone = async (song) => {
    if (Platform.OS === 'ios') {
      try {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(song.ringtone, {
            mimeType: 'audio/x-m4r',
            UTI: 'com.apple.m4r-audio',
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
    <View style={[s.root, { paddingTop: insets.top }]}>
      <ScrollView
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 16 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <View style={s.globeIcon}>
            <MaterialCommunityIcons name="earth" size={24} color="#0D1F2D" />
          </View>
          <View style={s.headerCenter}>
            <Text style={s.h1}>WM 2026 Superhits</Text>
          </View>
          <View style={{ width: 46 }} />
        </View>
        <Text style={s.subtitle}>Exklusive WM 2026 Songs – nur in StickerScout</Text>

        {/* ── Song Cards ── */}
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
            isBuying={isBuying}
          />
        ))}

        {/* ── Trust Badges ── */}
        <View style={s.benefits}>
          {[
            { icon: 'shield-check-outline', label: 'Sicherer Kauf',  sub: 'SSL-verschlüsselt' },
            { icon: 'infinity',             label: 'Für immer',      sub: 'einmal kaufen' },
            { icon: 'devices',              label: 'Alle Geräte',    sub: 'überall nutzbar' },
            { icon: 'headphones',           label: 'Support',        sub: 'wir helfen' },
          ].map((b, i) => (
            <View key={i} style={[s.benefit, i < 3 && s.benefitBorder]}>
              <MaterialCommunityIcons name={b.icon} size={22} color="#F5C033" />
              <Text style={s.benefitLabel}>{b.label}</Text>
              <Text style={s.benefitSub}>{b.sub}</Text>
            </View>
          ))}
        </View>

        {/* ── Restore ── */}
        <TouchableOpacity style={s.restoreBtn} onPress={handleRestore}>
          <Text style={s.restoreText}>{t('ringtones.restore')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const COVER_H = 300;

const s = StyleSheet.create({
  root:    { flex: 1, backgroundColor: '#0D1F2D' },
  content: { padding: 16, gap: 0 },

  // Header
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginBottom: 4, gap: 10 },
  globeIcon: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: '#F5C033',
    shadowColor: '#F5C033', shadowOpacity: 0.4, shadowRadius: 16, elevation: 8,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  h1: {
    fontSize: 26, fontWeight: '800', letterSpacing: -0.5, textAlign: 'center',
    color: '#F5C033',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.65)',
    fontSize: 14, textAlign: 'center',
    marginBottom: 20, lineHeight: 20,
  },

  // Song Card
  card: {
    marginBottom: 22, borderRadius: 28, overflow: 'hidden',
    backgroundColor: '#15324A',
    borderWidth: 1,
    shadowColor: '#000', shadowOpacity: 0.45, shadowRadius: 20, elevation: 10,
  },

  // Cover
  coverWrap: { height: COVER_H, overflow: 'hidden', position: 'relative', backgroundColor: '#0b1722' },
  coverImg: {
    width: '100%',
    height: COVER_H + 120, // extra height für offset
    position: 'absolute', top: 0,
  },

  countryPill: {
    position: 'absolute', left: 14, top: 14,
    borderRadius: 999, overflow: 'hidden',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 5,
  },
  countryPillGrad: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 7 },
  countryText: { fontWeight: '700', fontSize: 13, paddingHorizontal: 12, paddingVertical: 7 },

  playBtn: {
    position: 'absolute',
    top: '50%', left: '50%',
    width: 80, height: 80, borderRadius: 40,
    marginTop: -40, marginLeft: -40,
    borderWidth: 2.5,
    backgroundColor: 'rgba(13,31,45,0.55)',
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#F5C033', shadowOpacity: 0.35, shadowRadius: 18, elevation: 8,
  },

  previewChip: {
    position: 'absolute', left: 14, bottom: 14,
    flexDirection: 'row', alignItems: 'center', gap: 7,
    backgroundColor: 'rgba(13,31,45,0.6)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.16)',
    paddingHorizontal: 12, paddingVertical: 7,
    borderRadius: 999,
  },
  previewDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#42D783',
    shadowColor: '#42D783', shadowOpacity: 0.8, shadowRadius: 6 },
  previewChipText: { color: 'rgba(255,255,255,0.92)', fontSize: 12, fontWeight: '600' },

  // Song content
  songContent: { padding: 18 },
  songArtist: { fontSize: 11, letterSpacing: 1.2, fontWeight: '800', marginBottom: 5 },
  songTitle: { color: '#fff', fontSize: 25, fontWeight: '800', letterSpacing: -0.4, marginBottom: 4 },
  songSub: { color: 'rgba(255,255,255,0.52)', fontSize: 13, marginBottom: 14 },

  // Waveform
  waveRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 16 },
  waveTime: { color: 'rgba(255,255,255,0.55)', fontSize: 11, minWidth: 28 },
  waveform: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 3, height: 36, overflow: 'hidden' },
  wavebar: { width: 3, borderRadius: 999, backgroundColor: 'rgba(255,255,255,0.15)' },

  // Purchase Grid
  purchaseGrid: { flexDirection: 'row', gap: 12 },

  // Klingelton Card — gold
  purchaseCardRt: {
    flex: 1, minHeight: 110,
    borderRadius: 20, padding: 14,
    backgroundColor: '#F5C033',
    justifyContent: 'space-between',
    shadowColor: '#F5C033', shadowOpacity: 0.2, shadowRadius: 12, elevation: 5,
  },
  purchaseIcon: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.14)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  purchaseCardRtLabel: { color: '#0D1F2D', fontWeight: '800', fontSize: 13, lineHeight: 17 },
  purchaseCardRtSub: { color: '#0D1F2D', fontSize: 11, opacity: 0.7 },
  purchasePrice: { color: '#0D1F2D', fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  // Ganzer Song Card — dark
  purchaseCardSong: {
    flex: 1, minHeight: 110,
    borderRadius: 20, padding: 14,
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.14)',
    justifyContent: 'space-between',
  },
  purchaseIconDark: {
    width: 40, height: 40, borderRadius: 20,
    borderWidth: 1,
    backgroundColor: 'rgba(255,255,255,0.06)',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 6,
  },
  purchaseCardSongLabel: { color: '#fff', fontWeight: '800', fontSize: 13, lineHeight: 17 },
  purchaseCardSongSub: { fontSize: 13, fontWeight: '700' },
  purchasePriceDark: { fontSize: 24, fontWeight: '800', letterSpacing: -0.5 },

  // Benefits
  benefits: {
    flexDirection: 'row', marginTop: 4, marginBottom: 16,
    borderRadius: 22, borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
    backgroundColor: 'rgba(255,255,255,0.035)', overflow: 'hidden',
  },
  benefit: {
    flex: 1, paddingVertical: 14, paddingHorizontal: 6,
    alignItems: 'center', gap: 5,
  },
  benefitBorder: { borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.07)' },
  benefitLabel: { color: '#fff', fontSize: 10, fontWeight: '700', textAlign: 'center' },
  benefitSub:   { color: 'rgba(255,255,255,0.48)', fontSize: 9, textAlign: 'center', lineHeight: 13 },

  restoreBtn: { alignItems: 'center', paddingVertical: 12 },
  restoreText: { color: 'rgba(255,255,255,0.4)', fontSize: 12 },
});
