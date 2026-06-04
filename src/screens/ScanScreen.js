import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  KeyboardAvoidingView, Platform, Animated, Dimensions, FlatList, Modal, ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AppIcon from '../components/AppIcon';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CameraView, useCameraPermissions, FlashMode } from 'expo-camera';
import TextRecognition from '@react-native-ml-kit/text-recognition';
import * as ImagePicker from 'expo-image-picker';
import * as Haptics from 'expo-haptics';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { lookupSticker } from '../data/stickerCatalog';
import { TEAM_FLAGS } from '../data/stickerTypes';
import {
  addToHave, addToNeed, addDuplicate, setStickerCount, getStickerCount,
  loadCollection, getScanCount, incrementScanCount, FREE_SCAN_LIMIT,
  addToScanHistory, loadScanHistory,
} from '../services/storage';
import GoldButton from '../components/GoldButton';
import { useEntryAnimation, useGlowPulse } from '../hooks/useAnimations';
import { checkMilestone } from '../services/notifications';

const { width, height } = Dimensions.get('window');
// Sticker-Maß: 50mm × 65mm → Ratio 10:13, kompakt damit Buttons Platz haben
const FRAME_W = width * 0.68;
const FRAME_H = FRAME_W * (65 / 50);

const SCAN_SIDES = [
  { key: 'front', label: 'Vorderseite', icon: 'camera' },
  { key: 'back',  label: 'Rückseite',   icon: 'gallery-image' },
];

export default function ScanScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [screen, setScreen] = useState('camera'); // 'camera' | 'manual' | 'result'
  const [scanMode, setScanMode] = useState('front');
  const [flashOn, setFlashOn] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [manualInput, setManualInput] = useState('');
  const [manualError, setManualError] = useState(false);
  const [result, setResult] = useState(null);
  const [collection, setCollection] = useState({ have: [], need: [], duplicates: {} });
  const [scansUsed, setScansUsed] = useState(0);
  const [scanLimitReached, setScanLimitReached] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);

  const [showTips, setShowTips] = useState(false);
  const [autoFocus, setAutoFocus] = useState('on');
  const glowStyle = useGlowPulse({ minOpacity: 0.5, maxOpacity: 1.0, period: 1600 });

  useFocusEffect(useCallback(() => {
    loadCollection().then(setCollection);
    loadScanHistory().then(setScanHistory);
    getScanCount().then(count => {
      setScansUsed(count);
      setScanLimitReached(!isPro && count >= FREE_SCAN_LIMIT);
    });
  }, [isPro]));

  // ---------------------------------------------------------------------------
  // Scan actions
  // ---------------------------------------------------------------------------

  const handleCapture = async () => {
    if (scanLimitReached) { onShowPaywall?.(); return; }
    if (!cameraRef.current || isScanning) return;
    setIsScanning(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    try {
      // Foto aufnehmen (kein skipProcessing — ML Kit braucht verarbeitetes JPEG)
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });

      // Scan-Limit erhöhen
      const count = await incrementScanCount();
      setScansUsed(count);
      setScanLimitReached(!isPro && count >= FREE_SCAN_LIMIT);

      // OCR — URI muss file:// Prefix haben auf Android
      const uri = photo.uri.startsWith('file://') ? photo.uri : `file://${photo.uri}`;
      const result = await TextRecognition.recognize(uri);
      const rawText = result.text ?? '';

      console.log('[OCR] Erkannter Text:', rawText); // Diagnose

      // Sticker-Code: 2-4 Buchstaben + optionales Leerzeichen + 1-2 Zahlen
      // ML Kit liest oft "ALG 8" statt "ALG8" → Leerzeichen entfernen
      const upper = rawText.toUpperCase();
      const rawMatches = upper.match(/\b([A-Z]{2,4})\s?(\d{1,2})\b/g) ?? [];
      const matches = [...new Set(rawMatches.map(m => m.replace(/\s/g, '')))].filter(m => m.length >= 3);

      let foundSticker = null;
      for (const match of matches) {
        const s = lookupSticker(match);
        if (s) { foundSticker = s; break; }
      }

      if (foundSticker) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        setResult({ sticker: foundSticker });
        setScreen('result');
      } else {
        // Kein Treffer → manuelle Eingabe, besten OCR-Treffer vorausfüllen
        const suggestion = matches.find(m => m.length >= 3) ?? '';
        setManualInput(suggestion);
        setScreen('manual');
      }
    } catch (e) {
      console.error('[OCR] Fehler:', e.message);
      setScreen('manual');
    } finally {
      setIsScanning(false);
    }
  };

  const handleGallery = async () => {
    const res = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
    if (!res.canceled) setScreen('manual');
  };

  const handleManualConfirm = () => {
    const code = manualInput.trim().toUpperCase();
    const sticker = lookupSticker(code);
    if (!sticker) {
      setManualError(true);
      setTimeout(() => setManualError(false), 2500);
      return;
    }
    setManualError(false);
    setResult({ sticker });
    setScreen('result');
    setManualInput('');
  };

  const handleAddToHave = async () => {
    if (!result) return;
    const col = collection.have.includes(result.sticker.id)
      ? await addDuplicate(result.sticker.id)
      : await addToHave(result.sticker.id);
    setCollection(col);
    const history = await addToScanHistory(result.sticker);
    setScanHistory(history);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    // Meilenstein prüfen (25/50/75/90%)
    checkMilestone(col.have.length).catch(() => {});
    setScreen('camera');
    setResult(null);
  };

  const handleAddToNeed = async () => {
    if (!result) return;
    const col = await addToNeed(result.sticker.id);
    setCollection(col);
    await addToScanHistory(result.sticker);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setScreen('camera');
    setResult(null);
  };

  const handleCountChange = async (stickerId, newCount) => {
    const col = await setStickerCount(stickerId, newCount);
    setCollection(col);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  };

  const handleShowInAlbum = () => {
    if (!result) return;
    setScreen('camera');
    setResult(null);
    navigation.navigate('Album', {
      highlightStickerId: result.sticker.id,
      highlightGroup: result.sticker.group,
    });
  };

  // ---------------------------------------------------------------------------
  // Permission
  // ---------------------------------------------------------------------------

  // Auto-request permission on first render — skips intermediate screen
  if (!permission) return <View style={styles.container} />;
  if (!permission.granted) {
    requestPermission();
    return <View style={styles.container} />;
  }

  const scansLeft = Math.max(0, FREE_SCAN_LIMIT - scansUsed);
  const scanProgress = isPro ? 1 : Math.min(scansUsed / FREE_SCAN_LIMIT, 1);

  // ---------------------------------------------------------------------------
  // Result screen
  // ---------------------------------------------------------------------------

  if (screen === 'result' && result) {
    return (
      <ResultCard
        sticker={result.sticker}
        collection={collection}
        insets={insets}
        onAddToHave={handleAddToHave}
        onAddToNeed={handleAddToNeed}
        onShowInAlbum={handleShowInAlbum}
        onDismiss={() => { setScreen('camera'); setResult(null); }}
      />
    );
  }

  // ---------------------------------------------------------------------------
  // Manual entry screen
  // ---------------------------------------------------------------------------

  if (screen === 'manual') {
    return (
      <KeyboardAvoidingView
        style={[styles.container, { paddingTop: insets.top }]}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('camera')} style={styles.headerBtn}>
            <AppIcon name="arrow-left" variant="white" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nummer eingeben</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.manualBody}>
          <Text style={styles.manualHint}>
            Gib die Sticker-ID ein:{'\n'}z.B. <Text style={styles.manualExample}>GER10</Text> · <Text style={styles.manualExample}>AUT4</Text> · <Text style={styles.manualExample}>CC2</Text>
          </Text>
          <TextInput
            style={[styles.manualInput, manualError && styles.manualInputError]}
            placeholder="z.B. GER10 oder AUT4"
            placeholderTextColor={COLORS.textMuted}
            keyboardType="default"
            autoCapitalize="characters"
            value={manualInput}
            onChangeText={v => { setManualInput(v); setManualError(false); }}
            maxLength={8}
            autoFocus
          />
          {manualError && (
            <Text style={styles.manualError}>
              ❌ „{manualInput.toUpperCase()}" nicht gefunden
            </Text>
          )}
          <GoldButton title="Bestätigen" onPress={handleManualConfirm} style={{ marginTop: SPACING.xl }} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ---------------------------------------------------------------------------
  // Main camera screen
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerBtn}>
          <AppIcon name="arrow-left" variant="white" size={22} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sticker scannen</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowTips(true)}>
          <AppIcon name="question-mark-circle" variant="white" size={22} />
        </TouchableOpacity>
      </View>

      {/* Subtitle */}
      <Text style={styles.subtitle}>
        Sticker-ID auf der Rückseite scannen oder tippen
      </Text>

      {/* Camera + Frame */}
      <View style={styles.frameContainer}>
        <TouchableOpacity
          activeOpacity={1}
          style={{ width: FRAME_W, height: FRAME_H, borderRadius: RADIUS.lg, overflow: 'hidden' }}
          onPress={() => {
            // Tap-to-Focus: autoFocus kurz aus → an → Kamera stellt neu scharf
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            setAutoFocus('off');
            setTimeout(() => setAutoFocus('on'), 100);
          }}
        >
          <CameraView
            ref={cameraRef}
            style={{ width: FRAME_W, height: FRAME_H }}
            facing="back"
            enableTorch={flashOn}
            autoFocus={autoFocus}
          />
        </TouchableOpacity>
        {/* OCR Scanning Overlay */}
        {isScanning && (
          <View style={styles.scanningOverlay}>
            <Text style={styles.scanningText}>⚡ Wird erkannt…</Text>
          </View>
        )}

        {/* Gold glow corners */}
        <Animated.View style={[StyleSheet.absoluteFillObject, styles.frameOverlay, glowStyle]}>
          <View style={[styles.corner, styles.cTL]} />
          <View style={[styles.corner, styles.cTR]} />
          <View style={[styles.corner, styles.cBL]} />
          <View style={[styles.corner, styles.cBR]} />
        </Animated.View>
      </View>

      {/* Scan counter */}
      <View style={styles.counterRow}>
        <Text style={styles.counterLabel}>
          Scans heute: {isPro ? '∞' : `${scansUsed} / ${FREE_SCAN_LIMIT}`}
        </Text>
        <TouchableOpacity onPress={isPro ? undefined : onShowPaywall} style={styles.proBadge}>
          <Text style={styles.proCrown}>👑</Text>
          <Text style={styles.proText}>Pro</Text>
        </TouchableOpacity>
      </View>
      {!isPro && (
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${scanProgress * 100}%` }]} />
        </View>
      )}

      {/* Vorder-/Rückseite Umschalter */}
      <View style={styles.modeRow}>
        {SCAN_SIDES.map(m => (
          <TouchableOpacity
            key={m.key}
            style={[styles.modeBtn, scanMode === m.key && styles.modeBtnActive]}
            onPress={() => setScanMode(m.key)}
          >
            <AppIcon name={m.icon} variant={scanMode === m.key ? 'dark' : 'white'} size={16} />
            <Text style={[styles.modeBtnText, scanMode === m.key && styles.modeBtnTextActive]}>
              {m.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Camera controls */}
      <View style={styles.controls}>
        {/* Flash */}
        <TouchableOpacity
          onPress={() => setFlashOn(f => !f)}
          style={[styles.controlBtn, flashOn && styles.controlBtnActive]}
        >
          <AppIcon name="flash-zap" variant={flashOn ? 'gold' : 'white'} size={26} />
        </TouchableOpacity>

        {/* Shutter — Gold Glow */}
        <TouchableOpacity
          onPress={scanLimitReached ? onShowPaywall : handleCapture}
          disabled={isScanning}
          activeOpacity={0.8}
        >
          <Animated.View style={[styles.shutterBtn, glowStyle]}>
            <AppIcon name="shutter-circle" variant="white" size={70} />
          </Animated.View>
        </TouchableOpacity>

        {/* Gallery */}
        <TouchableOpacity onPress={handleGallery} style={styles.controlBtn}>
          <AppIcon name="gallery-image" variant="white" size={26} />
        </TouchableOpacity>
      </View>

      {/* Manuelle Eingabe — immer sichtbar */}
      <TouchableOpacity onPress={() => setScreen('manual')} style={styles.manualLink}>
        <AppIcon name="barcode-number" variant="gold" size={16} />
        <Text style={styles.manualLinkText}>Nummer manuell eingeben</Text>
      </TouchableOpacity>

      {/* Tips Modal */}
      <TipsModal visible={showTips} onClose={() => setShowTips(false)} />

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <View style={styles.historyArea}>
          <Text style={styles.historyTitle}>🕐 Zuletzt gescannt</Text>
          <FlatList
            data={scanHistory.slice(0, 10)}
            keyExtractor={s => s.id + (s.scannedAt ?? '')}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ paddingHorizontal: SPACING.md }}
            renderItem={({ item }) => (
              <HistoryChip
                sticker={item}
                count={getStickerCount(collection, item.id)}
                onCountChange={n => handleCountChange(item.id, n)}
              />
            )}
          />
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// HistoryChip
// ---------------------------------------------------------------------------

function HistoryChip({ sticker, count, onCountChange }) {
  const flag = sticker.team ? (TEAM_FLAGS[sticker.team] ?? '') : '🌍';
  return (
    <View style={styles.chip}>
      <Text style={styles.chipId}>{sticker.id}</Text>
      <Text style={styles.chipName} numberOfLines={1}>{sticker.name}</Text>
      <Text style={styles.chipFlag}>{flag}</Text>
      <View style={styles.chipCount}>
        <TouchableOpacity onPress={() => onCountChange(Math.max(0, count - 1))} style={styles.chipBtn}>
          <Text style={styles.chipBtnText}>−</Text>
        </TouchableOpacity>
        <Text style={styles.chipCountVal}>{count}×</Text>
        <TouchableOpacity onPress={() => onCountChange(count + 1)} style={styles.chipBtn}>
          <Text style={styles.chipBtnText}>+</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// TipsModal
// ---------------------------------------------------------------------------

const TIPS = [
  { icon: 'sunny-outline',        title: 'Gutes Licht',           text: 'Nutze helles, indirektes Licht und vermeide Schatten.' },
  { icon: 'scan-outline',         title: 'Gerade ausrichten',     text: 'Sticker möglichst parallel zur Kamera halten.' },
  { icon: 'crop-outline',         title: 'Ränder sichtbar',       text: 'Alle Kanten und Ecken sollten im Bild sein.' },
  { icon: 'refresh-outline',      title: 'Rückseite hilft',       text: 'Die Rückseite verbessert die Erkennung und Bewertung.' },
  { icon: 'hand-left-outline',    title: 'Oberfläche sauber',     text: 'Entferne Schutzhüllen oder Fingerabdrücke.' },
  { icon: 'ellipsis-horizontal',  title: 'Mehr Details = besser', text: 'Je mehr Infos, desto genauer die Preiseinschätzung.' },
];

function TipsModal({ visible, onClose }) {
  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={tipStyles.overlay}>
        <View style={tipStyles.sheet}>
          {/* Header */}
          <View style={tipStyles.header}>
            <Text style={tipStyles.title}>Tipps für bessere Ergebnisse</Text>
            <TouchableOpacity onPress={onClose} style={tipStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {TIPS.map((tip, i) => (
              <View key={i} style={tipStyles.row}>
                <View style={tipStyles.iconWrap}>
                  <Ionicons name={tip.icon} size={22} color={COLORS.gold} />
                </View>
                <View style={tipStyles.textWrap}>
                  <Text style={tipStyles.tipTitle}>{tip.title}</Text>
                  <Text style={tipStyles.tipText}>{tip.text}</Text>
                </View>
              </View>
            ))}

            {/* Privacy note */}
            <View style={tipStyles.privacyBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.greenBright} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={tipStyles.privacyTitle}>Deine Daten bleiben sicher</Text>
                <Text style={tipStyles.privacyText}>Alle Scans werden nur für die Erkennung verwendet und nicht öffentlich geteilt.</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const tipStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#152535',
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    padding: SPACING.xl,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: SPACING.xl,
  },
  title: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xl,
    fontWeight: FONTS.weights.bold,
  },
  closeBtn: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: 'rgba(255,215,0,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  textWrap: { flex: 1 },
  tipTitle: {
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.lg,
    fontWeight: FONTS.weights.bold,
    marginBottom: 4,
  },
  tipText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.md,
    lineHeight: 22,
  },
  privacyBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(82,183,136,0.1)',
    borderRadius: RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.sm,
    marginBottom: SPACING.xl,
    borderWidth: 1,
    borderColor: 'rgba(82,183,136,0.25)',
  },
  privacyTitle: {
    color: COLORS.greenBright,
    fontSize: FONTS.sizes.sm,
    fontWeight: FONTS.weights.bold,
    marginBottom: 2,
  },
  privacyText: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    lineHeight: 18,
  },
});

// ---------------------------------------------------------------------------
// ResultCard
// ---------------------------------------------------------------------------

function ResultCard({ sticker, collection, insets, onAddToHave, onAddToNeed, onShowInAlbum, onDismiss }) {
  const { t } = useTranslation();
  const entry = useEntryAnimation({ delay: 0, distance: 24 });
  const alreadyOwned = collection.have.includes(sticker.id);
  const [count, setCount] = React.useState(getStickerCount(collection, sticker.id));
  const flag = sticker.team ? (TEAM_FLAGS[sticker.team] ?? '') : '🌍';

  const handleCountChange = async (n) => {
    const newCount = Math.max(0, n);
    await setStickerCount(sticker.id, newCount);
    setCount(newCount);
  };

  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={onDismiss}>
          <AppIcon name="arrow-left" variant="gold" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Sticker gefunden</Text>
        <TouchableOpacity style={styles.headerBtn}>
          <Text style={{ fontSize: 22 }}>⭐</Text>
        </TouchableOpacity>
      </View>

      <Animated.ScrollView style={{ flex: 1 }} contentContainerStyle={{ padding: SPACING.lg }} {...entry}>
        <LinearGradient
          colors={['#0D2B3E', '#0D1F2D']}
          style={styles.resultCard}
        >
          {/* Badge oben rechts */}
          <View style={styles.resultBadge}>
            <Text style={styles.resultBadgeText}>STICKERSCOUT{'\n'}2026</Text>
          </View>

          {/* Sticker ID groß */}
          <Text style={styles.resultId}>{sticker.id}</Text>
          {sticker.foil && <Text style={styles.foilBadge}>✨ FOIL</Text>}

          {/* Spielername */}
          <Text style={styles.resultName}>{sticker.name}</Text>
          <Text style={styles.resultTeam}>{flag} {sticker.teamName ?? sticker.team ?? ''}</Text>
          {sticker.group && <Text style={styles.resultGroup}>Gruppe {sticker.group}</Text>}

          {/* Besitz-Counter */}
          <View style={styles.countRow}>
            <Text style={styles.countLabel}>Im Besitz:</Text>
            <TouchableOpacity onPress={() => handleCountChange(count - 1)} style={styles.countBtn}>
              <Text style={styles.countBtnMinus}>−</Text>
            </TouchableOpacity>
            <Text style={styles.countVal}>{count}×</Text>
            <TouchableOpacity onPress={() => handleCountChange(count + 1)} style={[styles.countBtn, styles.countBtnPlus]}>
              <Text style={styles.countBtnPlusText}>+</Text>
            </TouchableOpacity>
          </View>
        </LinearGradient>

        {/* Aktions-Buttons */}
        <GoldButton
          title={alreadyOwned ? '+ Doppelten hinzufügen' : '+ Zu meiner Sammlung'}
          onPress={onAddToHave}
          style={{ marginTop: SPACING.lg }}
        />

        {sticker.group && (
          <TouchableOpacity onPress={onShowInAlbum} style={styles.albumBtn}>
            <AppIcon name="album-book" variant="white" size={20} />
            <Text style={styles.albumBtnText}>Im Album anzeigen → Gruppe {sticker.group}</Text>
          </TouchableOpacity>
        )}

        {!alreadyOwned && (
          <TouchableOpacity onPress={onAddToNeed} style={styles.needBtn}>
            <Text style={styles.needBtnText}>🔍 Zur Suche hinzufügen</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>{t('common.close')}</Text>
        </TouchableOpacity>
      </Animated.ScrollView>
    </View>
  );
}

// Placeholder OCR
async function recognizeStickerNumber(base64) { return null; }

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const CORNER = 32;
const THICK = 4;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  center: { alignItems: 'center', justifyContent: 'center' },
  permText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, marginBottom: SPACING.xl, textAlign: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xs,
  },
  headerBtn: {
    width: 36, height: 36, borderRadius: 18,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  headerBtnText: { color: COLORS.gold, fontSize: FONTS.sizes.lg, fontWeight: '600' },
  headerTitle: { color: COLORS.gold, fontSize: FONTS.sizes.xl, fontWeight: '800' },

  // Subtitle
  subtitle: {
    color: COLORS.textSecondary,
    fontSize: FONTS.sizes.sm,
    textAlign: 'center',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xs,
  },

  // Frame
  frameContainer: {
    alignSelf: 'center',
    width: FRAME_W,
    height: FRAME_H,
    borderRadius: RADIUS.lg,
    marginBottom: SPACING.xs,
  },
  scanningOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(13,31,45,0.75)',
    alignItems: 'center', justifyContent: 'center',
    borderRadius: RADIUS.lg, zIndex: 10,
  },
  scanningText: {
    color: COLORS.gold, fontSize: FONTS.sizes.lg, fontWeight: '700',
  },
  frameOverlay: {
    position: 'absolute',
    top: 0, left: 0,
    width: FRAME_W, height: FRAME_H,
    borderRadius: RADIUS.lg,
  },
  corner: {
    position: 'absolute',
    width: CORNER,
    height: CORNER,
    borderColor: COLORS.gold,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 8,
    elevation: 8,
  },
  cTL: { top: 0, left: 0, borderTopWidth: THICK, borderLeftWidth: THICK, borderTopLeftRadius: RADIUS.md },
  cTR: { top: 0, right: 0, borderTopWidth: THICK, borderRightWidth: THICK, borderTopRightRadius: RADIUS.md },
  cBL: { bottom: 0, left: 0, borderBottomWidth: THICK, borderLeftWidth: THICK, borderBottomLeftRadius: RADIUS.md },
  cBR: { bottom: 0, right: 0, borderBottomWidth: THICK, borderRightWidth: THICK, borderBottomRightRadius: RADIUS.md },

  // Counter
  counterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl,
    marginBottom: SPACING.xs,
  },
  counterLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md },
  proBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,215,0,0.15)',
    borderRadius: RADIUS.sm,
    paddingHorizontal: SPACING.sm,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: COLORS.gold,
  },
  proCrown: { fontSize: 12 },
  proText: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: '700' },

  progressBarBg: {
    height: 5,
    backgroundColor: 'rgba(255,255,255,0.12)',
    marginHorizontal: SPACING.xl,
    borderRadius: RADIUS.full,
    marginBottom: SPACING.sm,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.gold,
    borderRadius: RADIUS.full,
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },

  // Scan modes
  modeRow: {
    flexDirection: 'row',
    paddingHorizontal: SPACING.lg,
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  modeBtn: {
    flex: 1,
    paddingVertical: SPACING.xs,
    borderRadius: RADIUS.md,
    backgroundColor: 'rgba(255,255,255,0.07)',
    alignItems: 'center',
  },
  modeBtnActive: { backgroundColor: COLORS.gold },
  modeBtnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600' },
  modeBtnTextActive: { color: COLORS.textOnGold, fontSize: FONTS.sizes.md, fontWeight: '700' },

  // Controls
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xxl,
    marginBottom: SPACING.sm,
  },
  controlBtn: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.1)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,215,0,0.25)', borderWidth: 1, borderColor: COLORS.gold },
  controlIcon: { fontSize: 20 },
  shutterBtn: {
    width: 88, height: 88, borderRadius: 44,
    alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'transparent',
    shadowColor: COLORS.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9,
    shadowRadius: 20,
    elevation: 14,
  },

  // CTA
  ctaArea: { paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  galleryLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm },
  galleryLinkText: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, fontWeight: '500' },
  manualLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm, paddingVertical: SPACING.sm, marginBottom: SPACING.xs },
  manualLinkText: { color: COLORS.gold, fontSize: FONTS.sizes.md, fontWeight: '600' },

  // History
  historyArea: { borderTopWidth: 1, borderTopColor: COLORS.border, paddingTop: SPACING.sm },
  historyTitle: { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, paddingHorizontal: SPACING.lg, marginBottom: SPACING.sm },
  chip: {
    backgroundColor: COLORS.surfaceRaised,
    borderRadius: RADIUS.md,
    padding: SPACING.sm,
    marginRight: SPACING.sm,
    minWidth: 90,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipId: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  chipName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xs, maxWidth: 82, textAlign: 'center', marginVertical: 2 },
  chipFlag: { fontSize: 14, marginBottom: 4 },
  chipCount: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  chipBtn: { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  chipBtnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, lineHeight: 20 },
  chipCountVal: { color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: '700', minWidth: 24, textAlign: 'center' },

  // Manual
  manualBody: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: SPACING.xl },
  manualHint: { color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textAlign: 'center', marginBottom: SPACING.xl, lineHeight: 24 },
  manualExample: { color: COLORS.gold, fontWeight: '700' },
  manualInput: {
    backgroundColor: COLORS.surface,
    color: COLORS.textPrimary,
    fontSize: FONTS.sizes.xxl,
    fontWeight: '700',
    textAlign: 'center',
    padding: SPACING.lg,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    width: 220,
    letterSpacing: 4,
  },
  manualInputError: { borderColor: COLORS.red, borderWidth: 2 },
  manualError: { color: COLORS.red, fontSize: FONTS.sizes.sm, marginTop: SPACING.sm },

  // Result
  resultScroll: { flex: 1, padding: SPACING.lg },
  resultCard: { borderRadius: RADIUS.xl, padding: SPACING.xl, marginBottom: SPACING.lg, position: 'relative', overflow: 'hidden' },
  resultBadge: {
    position: 'absolute', top: SPACING.lg, right: SPACING.lg,
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: 'rgba(45,106,79,0.4)',
    borderWidth: 1, borderColor: 'rgba(255,215,0,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  resultBadgeText: { color: 'rgba(255,215,0,0.4)', fontSize: 8, fontWeight: '900', textAlign: 'center', letterSpacing: 0.5 },
  resultIdRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.md, marginBottom: SPACING.sm },
  resultId: { color: COLORS.gold, fontSize: 56, fontWeight: '900', letterSpacing: -1, textShadowColor: 'rgba(255,215,0,0.4)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20 },
  foilBadge: { backgroundColor: COLORS.goldDeep, borderRadius: RADIUS.sm, paddingHorizontal: SPACING.sm, paddingVertical: 2, color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  resultName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xl, fontWeight: '800', marginBottom: SPACING.xs },
  resultTeam: { color: COLORS.textSecondary, fontSize: FONTS.sizes.lg, marginBottom: SPACING.xs },
  resultGroup: { color: COLORS.textMuted, fontSize: FONTS.sizes.md, marginBottom: SPACING.xl },
  countRow: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.md, padding: SPACING.sm, marginBottom: SPACING.md },
  countLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm, flex: 1 },
  countBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.sm, width: 32, height: 32, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: COLORS.border },
  countBtnMinus: { color: COLORS.red, fontSize: FONTS.sizes.lg, fontWeight: '700', lineHeight: 28 },
  countBtnPlus: { backgroundColor: COLORS.blueTint, borderColor: COLORS.borderBlue },
  countBtnPlusText: { color: COLORS.greenBright, fontSize: FONTS.sizes.lg, fontWeight: '700', lineHeight: 28 },
  countVal: { color: COLORS.gold, fontSize: FONTS.sizes.xl, fontWeight: '900', minWidth: 40, textAlign: 'center' },
  needBtn: { backgroundColor: COLORS.surface, borderRadius: RADIUS.full, padding: SPACING.md, alignItems: 'center', marginTop: SPACING.sm, borderWidth: 1, borderColor: COLORS.red },
  needBtnText: { color: COLORS.red, fontSize: FONTS.sizes.md, fontWeight: '600' },
  albumBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.full, padding: SPACING.md, paddingHorizontal: SPACING.xl, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  albumBtnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600', flex: 1 },
  dismissBtn: { alignSelf: 'center', marginTop: SPACING.lg },
  dismissText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },
});
