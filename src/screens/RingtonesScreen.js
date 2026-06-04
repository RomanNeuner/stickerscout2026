/**
 * RingtonesScreen — WM 2026 Klingeltöne
 * 3 Songs à €0,99 (Non-consumable IAP)
 * Vorschau: kostenlos (30 Sek.), Vollversion: per Kauf
 * iOS: .m4r via Share Sheet | Android: MediaStore
 */
import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  Alert, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Purchases from 'react-native-purchases';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { PRODUCT_IDS, RINGTONE_IDS } from '../services/subscription';
import GoldButton from '../components/GoldButton';

// ──────────────────────────────────────────────────────────────────────────────
// Song Definitionen
// Preview: assets/ringtones/songX_preview.mp3 (30 Sek.)
// Full:    assets/ringtones/songX_full.mp3 + songX_full.m4r (iOS)
// ──────────────────────────────────────────────────────────────────────────────
const SONGS = [
  {
    id: 1,
    productId: PRODUCT_IDS.ringtone1,
    emoji: '🏆',
    titleKey: 'ringtones.song1',
    genre: 'Orchestral Anthem',
    duration: '0:45',
    preview: require('../../assets/ringtones/song1_preview.mp3'),
    full: require('../../assets/ringtones/song1_full.mp3'),
    color: '#F5C033',
  },
  {
    id: 2,
    productId: PRODUCT_IDS.ringtone2,
    emoji: '⚽',
    titleKey: 'ringtones.song2',
    genre: 'Epic Stadium',
    duration: '0:38',
    preview: require('../../assets/ringtones/song2_preview.mp3'),
    full: require('../../assets/ringtones/song2_full.mp3'),
    color: '#4FC3F7',
  },
  {
    id: 3,
    productId: PRODUCT_IDS.ringtone3,
    emoji: '🎶',
    titleKey: 'ringtones.song3',
    genre: 'Electronic Beat',
    duration: '0:40',
    preview: require('../../assets/ringtones/song3_preview.mp3'),
    full: require('../../assets/ringtones/song3_full.mp3'),
    color: '#42D783',
  },
];

// ──────────────────────────────────────────────────────────────────────────────
export default function RingtonesScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  const [ownedIds, setOwnedIds] = useState(new Set());
  const [playingId, setPlayingId] = useState(null);
  const [loadingId, setLoadingId] = useState(null);
  const [buyingId, setBuyingId] = useState(null);
  const soundRef = useRef(null);

  // Audio-Modus setzen beim Mounten
  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: false,
    }).catch(() => {});
    return () => { stopSound(); };
  }, []);

  useFocusEffect(useCallback(() => {
    loadOwnedRingtones();
    return () => { stopSound(); };
  }, []));

  const loadOwnedRingtones = async () => {
    try {
      const info = await Purchases.getCustomerInfo();
      const owned = new Set();
      for (const id of RINGTONE_IDS) {
        if (info.entitlements.active[id] || info.nonSubscriptionTransactions?.some(t => t.productIdentifier === id)) {
          owned.add(id);
        }
      }
      setOwnedIds(owned);
    } catch {
      // RevenueCat nicht verfügbar
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Audio
  // ──────────────────────────────────────────────────────────────────────────
  const stopSound = async () => {
    if (soundRef.current) {
      try {
        await soundRef.current.stopAsync();
        await soundRef.current.unloadAsync();
      } catch { /* ignore */ }
      soundRef.current = null;
    }
    setPlayingId(null);
  };

  const handlePlayPreview = async (song) => {
    if (playingId === song.id) {
      await stopSound();
      return;
    }
    await stopSound();
    setLoadingId(song.id);
    try {
      const { sound } = await Audio.Sound.createAsync(
        song.preview,
        { shouldPlay: true, volume: 1.0 }
      );
      soundRef.current = sound;
      setPlayingId(song.id);
      sound.setOnPlaybackStatusUpdate(status => {
        if (status.didJustFinish) {
          setPlayingId(null);
          soundRef.current = null;
        }
      });
    } catch {
      Alert.alert('Fehler', 'Vorschau konnte nicht geladen werden.');
    } finally {
      setLoadingId(null);
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Kauf
  // ──────────────────────────────────────────────────────────────────────────
  const handleBuy = async (song) => {
    setBuyingId(song.id);
    try {
      const { customerInfo } = await Purchases.purchaseStoreProduct(
        await getProduct(song.productId)
      );
      const owned = new Set(ownedIds);
      owned.add(song.productId);
      setOwnedIds(owned);
      Alert.alert('✅ Gekauft!', `${t(song.titleKey)} wurde freigeschaltet.`);
    } catch (e) {
      if (!e.userCancelled) {
        Alert.alert('Fehler', 'Kauf fehlgeschlagen. Bitte versuche es erneut.');
      }
    } finally {
      setBuyingId(null);
    }
  };

  const getProduct = async (productId) => {
    const offerings = await Purchases.getOfferings();
    const products = await Purchases.getProducts([productId]);
    return products[0];
  };

  const handleRestore = async () => {
    try {
      await Purchases.restorePurchases();
      await loadOwnedRingtones();
      Alert.alert('✅ Wiederhergestellt', 'Deine Käufe wurden wiederhergestellt.');
    } catch {
      Alert.alert('Fehler', 'Wiederherstellung fehlgeschlagen.');
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Klingelton setzen
  // ──────────────────────────────────────────────────────────────────────────
  const handleSetRingtone = async (song) => {
    if (Platform.OS === 'ios') {
      // iOS: .mp3 teilen (echte .m4r Dateien werden später eingebunden)
      try {
        const canShare = await Sharing.isAvailableAsync();
        if (canShare) {
          await Sharing.shareAsync(song.full, {
            mimeType: 'audio/mpeg',
            dialogTitle: 'Als Klingelton setzen',
          });
        } else {
          Alert.alert('Info', t('ringtones.iosHint'));
        }
      } catch {
        Alert.alert('Info', t('ringtones.iosHint'));
      }
    } else {
      // Android: MediaStore (vereinfacht — Nutzer-Hinweis)
      Alert.alert(
        '📱 Klingelton setzen',
        t('ringtones.androidHint'),
        [{ text: 'OK' }]
      );
    }
  };

  // ──────────────────────────────────────────────────────────────────────────
  // Render
  // ──────────────────────────────────────────────────────────────────────────
  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <LinearGradient colors={['#1A3A52', COLORS.bg]} style={styles.header}>
        <Text style={styles.title}>{t('ringtones.title')}</Text>
        <Text style={styles.subtitle}>{t('ringtones.subtitle')}</Text>
        <Text style={styles.previewNote}>🎵 {t('ringtones.previewNote')}</Text>
      </LinearGradient>

      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + SPACING.xl }]}
        showsVerticalScrollIndicator={false}
      >
        {SONGS.map(song => {
          const owned = ownedIds.has(song.productId);
          const isPlaying = playingId === song.id;
          const isLoading = loadingId === song.id;
          const isBuying = buyingId === song.id;

          return (
            <View key={song.id} style={styles.songCard}>
              {/* Song Info */}
              <View style={[styles.songIconBox, { borderColor: song.color + '50', backgroundColor: song.color + '15' }]}>
                <Text style={styles.songEmoji}>{song.emoji}</Text>
              </View>
              <View style={styles.songInfo}>
                <Text style={styles.songTitle}>{t(song.titleKey)}</Text>
                <Text style={styles.songMeta}>{song.genre} · {song.duration}</Text>
              </View>

              {/* Owned Badge */}
              {owned && (
                <View style={styles.ownedBadge}>
                  <Text style={styles.ownedText}>{t('ringtones.owned')}</Text>
                </View>
              )}

              {/* Action Buttons */}
              <View style={styles.actions}>
                {/* Preview Button */}
                <TouchableOpacity
                  style={[styles.previewBtn, isPlaying && styles.previewBtnActive]}
                  onPress={() => handlePlayPreview(song)}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color={COLORS.gold} />
                  ) : (
                    <Ionicons
                      name={isPlaying ? 'stop-circle' : 'play-circle'}
                      size={22}
                      color={isPlaying ? COLORS.blue : COLORS.gold}
                    />
                  )}
                  <Text style={[styles.previewBtnText, isPlaying && { color: COLORS.blue }]}>
                    {isPlaying ? t('ringtones.stop') : t('ringtones.preview')}
                  </Text>
                </TouchableOpacity>

                {/* Buy or Set Ringtone */}
                {owned ? (
                  <TouchableOpacity
                    style={styles.setBtn}
                    onPress={() => handleSetRingtone(song)}
                  >
                    <Ionicons name="phone-portrait-outline" size={18} color={COLORS.green} />
                    <Text style={styles.setBtnText}>{t('ringtones.setRingtone')}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity
                    style={styles.buyBtn}
                    onPress={() => handleBuy(song)}
                    disabled={isBuying}
                  >
                    {isBuying ? (
                      <ActivityIndicator size="small" color={COLORS.bg} />
                    ) : (
                      <>
                        <Ionicons name="cart-outline" size={16} color={COLORS.bg} />
                        <Text style={styles.buyBtnText}>{t('ringtones.buy')}</Text>
                      </>
                    )}
                  </TouchableOpacity>
                )}
              </View>
            </View>
          );
        })}

        {/* Restore */}
        <TouchableOpacity style={styles.restoreBtn} onPress={handleRestore}>
          <Text style={styles.restoreText}>{t('ringtones.restore')}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

// ──────────────────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  header: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.lg,
    paddingBottom: SPACING.xxl,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.black,
    marginBottom: SPACING.xs,
  },
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    marginBottom: SPACING.sm,
  },
  previewNote: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
  },
  content: {
    padding: SPACING.xl,
    gap: SPACING.lg,
  },
  songCard: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    borderWidth: 0.5,
    borderColor: COLORS.border,
    ...SHADOWS.card,
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: SPACING.md,
  },
  songIconBox: {
    width: 52,
    height: 52,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  songEmoji: {
    fontSize: 26,
  },
  songInfo: {
    flex: 1,
    minWidth: 100,
  },
  songTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    marginBottom: 2,
  },
  songMeta: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
  ownedBadge: {
    backgroundColor: 'rgba(66,215,131,0.15)',
    borderWidth: 0.5,
    borderColor: 'rgba(66,215,131,0.4)',
    borderRadius: RADIUS.full,
    paddingHorizontal: SPACING.md,
    paddingVertical: 4,
  },
  ownedText: {
    color: COLORS.green,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
  },
  actions: {
    flexDirection: 'row',
    width: '100%',
    gap: SPACING.sm,
    marginTop: SPACING.xs,
  },
  previewBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(245,192,51,0.35)',
    backgroundColor: 'rgba(245,192,51,0.08)',
  },
  previewBtnActive: {
    borderColor: 'rgba(79,195,247,0.4)',
    backgroundColor: 'rgba(79,195,247,0.10)',
  },
  previewBtnText: {
    color: COLORS.gold,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
  },
  setBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: 'rgba(66,215,131,0.4)',
    backgroundColor: 'rgba(66,215,131,0.10)',
  },
  setBtnText: {
    color: COLORS.green,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.semibold,
  },
  buyBtn: {
    flex: 1.2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.sm,
    borderRadius: RADIUS.md,
    backgroundColor: COLORS.gold,
  },
  buyBtnText: {
    color: COLORS.bg,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
  },
  restoreBtn: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
    marginTop: SPACING.md,
  },
  restoreText: {
    color: COLORS.textMuted,
    fontSize: FONTS.sizes.sm,
  },
});
