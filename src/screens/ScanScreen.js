import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, ScrollView, Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as Haptics from 'expo-haptics';
import { useFocusEffect } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { STICKER_BY_NUMBER } from '../data/stickerCatalog';
import { STICKER_TYPE } from '../data/stickerTypes';
import { addToHave, addToNeed, addDuplicate, loadCollection, getScanCount, incrementScanCount, FREE_SCAN_LIMIT } from '../services/storage';
import GoldButton from '../components/GoldButton';
import StickerBadge from '../components/StickerBadge';
import { useEntryAnimation, useGlowPulse } from '../hooks/useAnimations';

export default function ScanScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [mode, setMode] = useState('camera'); // 'camera' | 'manual' | 'result'
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [result, setResult] = useState(null);
  const [collection, setCollection] = useState({ have: [], need: [], duplicates: {} });
  const [scanLimitReached, setScanLimitReached] = useState(false);

  const glowStyle = useGlowPulse({ minOpacity: 0.4, maxOpacity: 1.0, period: 1800 });

  useFocusEffect(
    useCallback(() => {
      loadCollection().then(setCollection);
      getScanCount().then(count => setScanLimitReached(!isPro && count >= FREE_SCAN_LIMIT));
    }, [isPro])
  );

  const handleScan = async () => {
    if (scanLimitReached) { onShowPaywall?.(); return; }
    if (!cameraRef.current || isScanning) return;
    setIsScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    try {
      const photo = await cameraRef.current.takePictureAsync({ base64: true, quality: 0.7 });
      const count = await incrementScanCount();
      setScanLimitReached(!isPro && count >= FREE_SCAN_LIMIT);

      // OCR: scan for digits in the image using a simple heuristic
      // In production: replace with ML Kit Text Recognition via native module
      // For MVP: parse base64 or use a Claude Vision call
      const stickerNumber = await recognizeStickerNumber(photo.base64);

      if (stickerNumber && STICKER_BY_NUMBER[stickerNumber]) {
        setResult({ sticker: STICKER_BY_NUMBER[stickerNumber], confidence: 0.9 });
        setMode('result');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } else {
        setMode('manual');
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      }
    } catch {
      setMode('manual');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualEntry = () => {
    const num = parseInt(manualInput.trim(), 10);
    if (!num || !STICKER_BY_NUMBER[num]) {
      setResult(null);
      return;
    }
    setResult({ sticker: STICKER_BY_NUMBER[num], confidence: 1.0 });
    setMode('result');
    setManualInput('');
  };

  const handleAddToHave = async () => {
    if (!result) return;
    const col = collection.have.includes(result.sticker.id)
      ? await addDuplicate(result.sticker.id)
      : await addToHave(result.sticker.id);
    setCollection(col);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setMode('camera');
    setResult(null);
  };

  const handleAddToNeed = async () => {
    if (!result) return;
    const col = await addToNeed(result.sticker.id);
    setCollection(col);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setMode('camera');
    setResult(null);
  };

  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    return (
      <View style={styles.center}>
        <Text style={styles.permissionText}>Kamera-Zugriff benötigt</Text>
        <GoldButton title="Erlauben" onPress={requestPermission} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera or Manual Entry */}
      {mode !== 'result' && (
        <View style={styles.cameraArea}>
          {mode === 'camera' && (
            <CameraView ref={cameraRef} style={styles.camera} facing="back">
              {/* Scan frame */}
              <View style={styles.frameOverlay}>
                <Animated.View style={[styles.scanFrame, glowStyle]}>
                  <View style={[styles.corner, styles.cornerTL]} />
                  <View style={[styles.corner, styles.cornerTR]} />
                  <View style={[styles.corner, styles.cornerBL]} />
                  <View style={[styles.corner, styles.cornerBR]} />
                  <Text style={styles.frameLabel}>{t('scanner.subtitle')}</Text>
                </Animated.View>
              </View>
            </CameraView>
          )}

          {mode === 'manual' && (
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.manualArea}>
              <Text style={styles.manualTitle}>{t('scanner.manualEntry')}</Text>
              <TextInput
                style={styles.input}
                placeholder={t('scanner.manualPlaceholder')}
                placeholderTextColor={COLORS.textMuted}
                keyboardType="number-pad"
                value={manualInput}
                onChangeText={setManualInput}
                maxLength={4}
                autoFocus
              />
              <GoldButton title={t('scanner.manualConfirm')} onPress={handleManualEntry} />
              <TouchableOpacity onPress={() => setMode('camera')} style={styles.backLink}>
                <Text style={styles.backText}>← Zurück zum Scanner</Text>
              </TouchableOpacity>
            </KeyboardAvoidingView>
          )}
        </View>
      )}

      {/* Result Card */}
      {mode === 'result' && result && (
        <ResultCard
          sticker={result.sticker}
          collection={collection}
          onAddToHave={handleAddToHave}
          onAddToNeed={handleAddToNeed}
          onDismiss={() => { setMode('camera'); setResult(null); }}
        />
      )}

      {/* Bottom Controls */}
      {mode === 'camera' && (
        <View style={styles.controls}>
          {scanLimitReached ? (
            <View style={styles.limitBanner}>
              <Text style={styles.limitText}>{t('scanner.limits.daily')}</Text>
              <TouchableOpacity onPress={onShowPaywall}>
                <Text style={styles.limitUpgrade}>{t('scanner.limits.upgradeHint')}</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <TouchableOpacity onPress={handleScan} style={styles.scanButton} disabled={isScanning}>
              <LinearGradient colors={GRADIENTS.goldButton} style={styles.scanButtonInner}>
                <Text style={styles.scanButtonText}>
                  {isScanning ? t('scanner.scanning') : t('scanner.scan')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}
          <TouchableOpacity onPress={() => setMode('manual')} style={styles.manualLink}>
            <Text style={styles.manualLinkText}>{t('scanner.manualEntry')}</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function ResultCard({ sticker, collection, onAddToHave, onAddToNeed, onDismiss }) {
  const { t } = useTranslation();
  const entry = useEntryAnimation({ delay: 0, distance: 30 });
  const alreadyOwned = collection.have.includes(sticker.id);
  const duplicateCount = collection.duplicates[sticker.id];

  return (
    <Animated.View style={[styles.resultCard, entry]}>
      <LinearGradient colors={GRADIENTS.cardDark} style={styles.resultCardInner}>
        <Text style={styles.resultFound}>{t('scanner.result.found')}</Text>
        <View style={styles.stickerInfo}>
          <Text style={styles.stickerNumber}>#{sticker.number}</Text>
          <StickerBadge type={sticker.type} />
        </View>
        {sticker.playerName && (
          <Text style={styles.playerName}>{sticker.playerName}</Text>
        )}
        <Text style={styles.teamName}>
          {sticker.team} — {sticker.teamNameDE}
        </Text>
        <Text style={styles.groupLabel}>Gruppe {sticker.group}</Text>

        {alreadyOwned && (
          <View style={styles.ownedBadge}>
            <Text style={styles.ownedText}>
              {duplicateCount ? t('album.sticker.duplicate', { count: duplicateCount }) : t('album.sticker.owned')}
            </Text>
          </View>
        )}

        <View style={styles.resultActions}>
          <GoldButton
            title={alreadyOwned ? t('scanner.result.addDuplicate') : t('scanner.result.addToHave')}
            onPress={onAddToHave}
            style={{ flex: 1, marginRight: SPACING.sm }}
          />
          {!alreadyOwned && (
            <TouchableOpacity onPress={onAddToNeed} style={styles.needButton}>
              <Text style={styles.needButtonText}>{t('scanner.result.addToNeed')}</Text>
            </TouchableOpacity>
          )}
        </View>

        <TouchableOpacity onPress={onDismiss} style={styles.dismissButton}>
          <Text style={styles.dismissText}>{t('common.close')}</Text>
        </TouchableOpacity>
      </LinearGradient>
    </Animated.View>
  );
}

// Placeholder OCR — in production replace with ML Kit Text Recognition
async function recognizeStickerNumber(base64) {
  // TODO: integrate expo-modules / ML Kit for real OCR
  // For now returns null to trigger manual fallback
  return null;
}

const CORNER_SIZE = 22;
const CORNER_THICKNESS = 3;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { flex: 1, backgroundColor: COLORS.bg, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  permissionText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, marginBottom: SPACING.lg, textAlign: 'center' },
  cameraArea: { flex: 1 },
  camera: { flex: 1 },
  frameOverlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanFrame: {
    width: 260,
    height: 160,
    borderRadius: RADIUS.md,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingBottom: SPACING.sm,
  },
  corner: { position: 'absolute', width: CORNER_SIZE, height: CORNER_SIZE, borderColor: COLORS.gold },
  cornerTL: { top: 0, left: 0, borderTopWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderTopLeftRadius: 4 },
  cornerTR: { top: 0, right: 0, borderTopWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderTopRightRadius: 4 },
  cornerBL: { bottom: 0, left: 0, borderBottomWidth: CORNER_THICKNESS, borderLeftWidth: CORNER_THICKNESS, borderBottomLeftRadius: 4 },
  cornerBR: { bottom: 0, right: 0, borderBottomWidth: CORNER_THICKNESS, borderRightWidth: CORNER_THICKNESS, borderBottomRightRadius: 4 },
  frameLabel: { color: COLORS.gold, fontSize: FONTS.sizes.sm, opacity: 0.8 },
  manualArea: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, backgroundColor: COLORS.bg },
  manualTitle: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, marginBottom: SPACING.xl },
  input: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: FONTS.weights.bold,
    textAlign: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 200,
    marginBottom: SPACING.xl,
    letterSpacing: 4,
  },
  backLink: { marginTop: SPACING.lg },
  backText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  controls: {
    backgroundColor: COLORS.surface,
    padding: SPACING.xl,
    paddingBottom: SPACING.xxl,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  scanButton: { width: 180, marginBottom: SPACING.md },
  scanButtonInner: {
    paddingVertical: SPACING.lg,
    borderRadius: RADIUS.full,
    alignItems: 'center',
    ...SHADOWS.gold,
  },
  scanButtonText: { color: COLORS.textOnGold, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.bold },
  manualLink: { marginTop: SPACING.sm },
  manualLinkText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md },
  limitBanner: { alignItems: 'center', marginBottom: SPACING.md },
  limitText: { color: COLORS.red, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },
  limitUpgrade: { color: COLORS.gold, fontSize: FONTS.sizes.sm, marginTop: SPACING.xs },
  resultCard: { flex: 1, padding: SPACING.lg },
  resultCardInner: { flex: 1, borderRadius: RADIUS.lg, padding: SPACING.xl, ...SHADOWS.card },
  resultFound: { color: COLORS.greenBright, fontSize: FONTS.sizes.lg, fontWeight: FONTS.weights.semibold, marginBottom: SPACING.md },
  stickerInfo: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  stickerNumber: { color: COLORS.gold, fontSize: FONTS.sizes.xxxl, fontWeight: FONTS.weights.black },
  playerName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: FONTS.weights.bold, marginBottom: SPACING.xs },
  teamName: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg, marginBottom: SPACING.xs },
  groupLabel: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, marginBottom: SPACING.xl },
  ownedBadge: { backgroundColor: COLORS.greenDeep, borderRadius: RADIUS.sm, padding: SPACING.sm, alignSelf: 'flex-start', marginBottom: SPACING.md },
  ownedText: { color: COLORS.greenBright, fontSize: FONTS.sizes.sm, fontWeight: FONTS.weights.semibold },
  resultActions: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.md },
  needButton: {
    backgroundColor: COLORS.surface,
    borderWidth: 1,
    borderColor: COLORS.red,
    borderRadius: RADIUS.full,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
  },
  needButtonText: { color: COLORS.red, fontSize: FONTS.sizes.md, fontWeight: FONTS.weights.semibold },
  dismissButton: { alignSelf: 'center', marginTop: SPACING.sm },
  dismissText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
});
