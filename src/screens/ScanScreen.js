import React, { useState, useRef, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Image,
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
import { SystemBars } from 'react-native-edge-to-edge';
import { useTranslation } from 'react-i18next';
import { LinearGradient } from 'expo-linear-gradient';

import { COLORS, GRADIENTS, FONTS, SPACING, RADIUS, SHADOWS } from '../theme';
import { lookupSticker } from '../data/stickerCatalog';
import { lookupAdrenalyn, lookupAdrenalynById, CARD_TYPE_LABELS, CARD_TYPE_COLORS } from '../data/adrenalynCatalog';
import { TEAM_FLAGS } from '../data/stickerTypes';
import {
  addToHave, addToNeed, addDuplicate, setStickerCount, getStickerCount,
  loadCollection, getScanCount, incrementScanCount, FREE_SCAN_LIMIT,
  addToScanHistory, loadScanHistory,
  addAdrenalynCard, setAdrenalynCount, loadAdrenalynCollection,
} from '../services/storage';
import GoldButton from '../components/GoldButton';
import { useEntryAnimation, useGlowPulse } from '../hooks/useAnimations';
import { checkMilestone } from '../services/notifications';

const { width, height } = Dimensions.get('window');
// Sticker-Maß: 50mm × 65mm → Ratio 10:13, kompakt damit Buttons Platz haben
const FRAME_W = width * 0.68;
const FRAME_H = FRAME_W * (65 / 50);

const SCAN_TYPES = [
  { key: 'sticker',   icon: 'album-book' },
  { key: 'adrenalyn', icon: 'barcode-number' },
];

// Karten-Typen die einen Aktivierungscode auf der Rückseite tragen
const FLIP_TYPES = ['GOLDEN_BALLER', 'LIMITED_EDITION', 'DREAM_BOX', 'STANDARD_LE'];

// Activation Codes laufen nach dem 31.08.2026 ab
const CODE_EXPIRY_DATE = new Date('2026-09-01');

/**
 * Erkennt Sonderkarten-Typ anhand des OCR-Texts der Vorderseite.
 * Gibt den Typen zurück wenn ein klares Indiz gefunden wurde, sonst null.
 * HERO-Karten werden NICHT erkannt (keine Rückseite nötig).
 */
function detectSpecialCardType(upperText) {
  if (upperText.includes('GOLDEN BALLER') || upperText.includes('GOLDENBALLER')) {
    return 'GOLDEN_BALLER';
  }
  if (upperText.includes('LIMITED EDITION') || upperText.includes('VOLLGAS LIMITED') || upperText.includes('VOLLGAS')) {
    return 'LIMITED_EDITION';
  }
  if (upperText.includes('DREAM BOX') || upperText.includes('DREAMBOX') || upperText.includes('WORLD CUP MASTER')) {
    return 'DREAM_BOX';
  }
  if (upperText.includes('XXL')) {
    return 'STANDARD_LE';
  }
  return null;
}

const TIP_ICONS = [
  'sunny-outline',
  'scan-outline',
  'crop-outline',
  'refresh-outline',
  'hand-left-outline',
  'ellipsis-horizontal',
];

export default function ScanScreen({ onShowPaywall, isPro }) {
  const { t } = useTranslation();
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef(null);

  const [screen, setScreen] = useState('camera'); // 'camera' | 'manual' | 'result' | 'golden_baller_back' | 'card_type_select'
  const [scanType, setScanType] = useState('sticker'); // 'sticker' | 'adrenalyn'
  const [pendingCard, setPendingCard] = useState(null); // Golden Baller 2-Schritt
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
    // Immersive mode: System-Bars verstecken während Scanner aktiv
    SystemBars.setHidden(true);
    return () => SystemBars.setHidden(false);
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
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.85 });
      const count = await incrementScanCount();
      setScansUsed(count);
      setScanLimitReached(!isPro && count >= FREE_SCAN_LIMIT);

      const uri = photo.uri.startsWith('file://') ? photo.uri : `file://${photo.uri}`;
      const result = await TextRecognition.recognize(uri);
      const rawText = result.text ?? '';
      console.log('[OCR] Text:', rawText);

      // ── Pfad A: Sticker (Rückseite) ──────────────────────────────────────
      if (scanType === 'sticker') {
        const upper = rawText.toUpperCase();
        const rawMatches = upper.match(/\b([A-Z]{2,4})\s?(\d{1,2})\b/g) ?? [];
        const matches = [...new Set(rawMatches.map(m => m.replace(/\s/g, '')))].filter(m => m.length >= 3);
        let foundSticker = null;
        for (const m of matches) {
          const s = lookupSticker(m);
          if (s) { foundSticker = s; break; }
        }
        if (foundSticker) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setResult({ sticker: foundSticker });
          setScreen('result');
        } else {
          setManualInput(matches[0] ?? '');
          setScreen('manual');
        }
        return;
      }

      // ── Pfad B+C: Adrenalyn (Vorderseite) ────────────────────────────────
      if (scanType === 'adrenalyn') {
        // Rückseite — Activation Code scannen (Golden Baller, LE, Dream Box, XXL)
        if (screen === 'golden_baller_back') {
          const codeMatch = rawText.toUpperCase().match(/([A-Z]{2,4}-[A-Z0-9]{2,4}-[A-Z0-9]{2,4})/);
          const activationCode = codeMatch ? codeMatch[1] : null;
          const codeExpired = new Date() >= CODE_EXPIRY_DATE;
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setResult({ card: pendingCard, activationCode, codeExpired });
          setPendingCard(null);
          setScreen('result');
          return;
        }

        // Vorderseite — Kartennummer lesen (#191 oder 191)
        const numMatch = rawText.match(/#?\b(\d{1,3})\b/);
        const num = numMatch ? parseInt(numMatch[1], 10) : null;
        const foundCard = num ? lookupAdrenalyn(num) : null;

        if (foundCard) {
          Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          // Sondertypen mit Nummer (z.B. Golden Baller #1-9) → Rückseite
          if (FLIP_TYPES.includes(foundCard.type)) {
            setPendingCard(foundCard);
            setScreen('golden_baller_back');
          } else {
            setResult({ card: foundCard });
            setScreen('result');
          }
        } else {
          // Keine gültige Nummer → Sonderkarte oder schlechter Scan
          // Prüfe OCR-Text auf Sonderkarten-Indizien (Editions-Schriftzug auf Vorderseite)
          const upper = rawText.toUpperCase();
          const specialType = detectSpecialCardType(upper);
          if (specialType) {
            // Klares Sonderkarten-Indiz: Rückseite scannen
            Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            setPendingCard({ type: specialType });
            setScreen('golden_baller_back');
          } else if (num) {
            // Nummer gefunden, aber nicht in DB → manuelle Eingabe
            setManualInput(String(num));
            setScreen('manual');
          } else {
            // Kein Indiz, keine Nummer → Typ-Wähler als Fallback
            setScreen('card_type_select');
          }
        }
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
    try {
      const raw = (manualInput ?? '').trim();
      if (!raw) return;
      if (scanType === 'adrenalyn') {
        const card = (typeof lookupAdrenalyn === 'function' ? lookupAdrenalyn(raw) : null)
                  ?? (typeof lookupAdrenalynById === 'function' ? lookupAdrenalynById(raw) : null);
        if (!card) {
          setManualError(true);
          setTimeout(() => setManualError(false), 2500);
          return;
        }
        setManualError(false);
        if (FLIP_TYPES.includes(card.type)) {
          setPendingCard(card);
          setScreen('golden_baller_back');
        } else {
          setResult({ card });
          setScreen('result');
        }
      } else {
        const sticker = typeof lookupSticker === 'function' ? lookupSticker(raw.toUpperCase()) : null;
        if (!sticker) {
          setManualError(true);
          setTimeout(() => setManualError(false), 2500);
          return;
        }
        setManualError(false);
        setResult({ sticker });
        setScreen('result');
      }
      setManualInput('');
    } catch (e) {
      console.error('[handleManualConfirm]', e?.message ?? e);
      setManualError(true);
      setTimeout(() => setManualError(false), 2500);
    }
  };

  const handleAddToHave = async () => {
    if (!result) return;
    if (result.card) {
      const cardKey = result.card.id ?? String(result.card.number);
      await addAdrenalynCard(cardKey);
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setScreen('camera');
      setResult(null);
      return;
    }
    const col = collection.have.includes(result.sticker.id)
      ? await addDuplicate(result.sticker.id)
      : await addToHave(result.sticker.id);
    setCollection(col);
    const history = await addToScanHistory(result.sticker);
    setScanHistory(history);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkMilestone(col.have.length).catch(() => {});
    setScreen('camera');
    setResult(null);
  };

  const handleSaveCard = async (count) => {
    if (!result?.card) return;
    const cardKey = result.card.id ?? String(result.card.number);
    await setAdrenalynCount(cardKey, count);
    // Karte zur Scan-History hinzufügen (einheitliches Format)
    const cardHistoryItem = {
      id:       `card_${cardKey}`,
      name:     result.card.name ?? (result.card.id ? result.card.id : `#${result.card.number}`),
      team:     result.card.team ?? '',
      number:   result.card.number,
      itemType: 'card',
      cardType: result.card.type,
    };
    const history = await addToScanHistory(cardHistoryItem);
    setScanHistory(history);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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

  const handleSave = async (count) => {
    if (!result?.sticker) return;
    const col = await setStickerCount(result.sticker.id, count);
    setCollection(col);
    const history = await addToScanHistory(result.sticker);
    setScanHistory(history);
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    checkMilestone(col.have.length).catch(() => {});
    setScreen('camera');
    setResult(null);
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
        card={result.card}
        activationCode={result.activationCode}
        codeExpired={result.codeExpired}
        collection={collection}
        insets={insets}
        onSave={result.card ? handleSaveCard : handleSave}
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
          <Text style={styles.headerTitle}>{t('scanner.manualHeaderTitle')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.manualBody}>
          <Text style={styles.manualHint}>
            {scanType === 'adrenalyn'
              ? t('scanner.manualHintAdrenalyn')
              : t('scanner.manualHintSticker')
            }
          </Text>
          <TextInput
            style={[styles.manualInput, manualError && styles.manualInputError]}
            placeholder={scanType === 'adrenalyn' ? t('scanner.manualPlaceholderAdrenalyn') : t('scanner.manualPlaceholderSticker')}
            placeholderTextColor={COLORS.textMuted}
            keyboardType={scanType === 'adrenalyn' ? 'numeric' : 'default'}
            autoCapitalize={scanType === 'adrenalyn' ? 'none' : 'characters'}
            value={manualInput}
            onChangeText={v => { setManualInput(v); setManualError(false); }}
            maxLength={8}
            autoFocus
          />
          {manualError && (
            <Text style={styles.manualError}>
              {t('scanner.manualNotFound', { id: manualInput })}
            </Text>
          )}
          <GoldButton title={t('common.confirm')} onPress={handleManualConfirm} style={{ marginTop: SPACING.xl }} />
        </View>
      </KeyboardAvoidingView>
    );
  }

  // ---------------------------------------------------------------------------
  // Typ-Wähler Fallback — wenn Scan kein Ergebnis und kein Sonder-Indiz
  // ---------------------------------------------------------------------------

  if (screen === 'card_type_select') {
    const SELECT_OPTIONS = [
      { type: 'GOLDEN_BALLER',   emoji: '⭐', label: t('scanner.goldenBaller') },
      { type: 'LIMITED_EDITION', emoji: '💎', label: 'Limited Edition / VOLLGAS' },
      { type: 'DREAM_BOX',       emoji: '🏆', label: 'Dream Box Master' },
      { type: 'STANDARD_LE',     emoji: '✨', label: 'XXL Limited Edition' },
    ];
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => setScreen('camera')} style={styles.headerBtn}>
            <AppIcon name="arrow-left" variant="white" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scanner.typeSelectTitle')}</Text>
          <View style={{ width: 36 }} />
        </View>

        <View style={styles.typeSelectBody}>
          <Text style={styles.typeSelectHint}>{t('scanner.typeSelectHint')}</Text>

          {SELECT_OPTIONS.map(opt => (
            <TouchableOpacity
              key={opt.type}
              style={styles.typeSelectBtn}
              activeOpacity={0.8}
              onPress={() => {
                setPendingCard({ type: opt.type });
                setScreen('golden_baller_back');
              }}
            >
              <Text style={styles.typeSelectEmoji}>{opt.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.typeSelectLabel}>{opt.label}</Text>
                <Text style={styles.typeSelectSub}>{t('scanner.typeSelectSub')}</Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={COLORS.textMuted} />
            </TouchableOpacity>
          ))}

          <View style={styles.typeSelectDivider} />

          <TouchableOpacity
            style={styles.typeSelectAlt}
            onPress={() => { setScreen('manual'); setScanType('adrenalyn'); }}
          >
            <Ionicons name="keypad-outline" size={20} color={COLORS.gold} />
            <Text style={styles.typeSelectAltText}>{t('scanner.manualLinkText')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.typeSelectAlt, { marginTop: SPACING.sm }]}
            onPress={() => setScreen('camera')}
          >
            <Ionicons name="refresh-outline" size={20} color={COLORS.textMuted} />
            <Text style={[styles.typeSelectAltText, { color: COLORS.textMuted }]}>{t('scanner.retryHint')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Rückseite — Activation Code scannen (alle Flip-Typen)
  // ---------------------------------------------------------------------------

  if (screen === 'golden_baller_back' && pendingCard) {
    const flipEmoji = pendingCard.type === 'GOLDEN_BALLER' ? '⭐'
      : pendingCard.type === 'DREAM_BOX' ? '🏆'
      : pendingCard.type === 'STANDARD_LE' ? '✨'
      : '💎';
    const flipTitle = CARD_TYPE_LABELS[pendingCard.type] ?? 'Limited Edition';
    const flipCardId = pendingCard.id
      ? pendingCard.id
      : pendingCard.number
        ? `#${pendingCard.number}`
        : null;
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => { setScreen('camera'); setPendingCard(null); }} style={styles.headerBtn}>
            <AppIcon name="arrow-left" variant="white" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{flipTitle}</Text>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.goldenBanner}>
          <Text style={styles.goldenBannerStar}>{flipEmoji}</Text>
          <View>
            <Text style={styles.goldenBannerName}>{pendingCard.name ?? flipCardId ?? flipTitle}</Text>
            <Text style={styles.goldenBannerSub}>{t('scanner.flipHint')}</Text>
          </View>
        </View>
        <View style={styles.frameContainer}>
          <TouchableOpacity activeOpacity={1}
            style={{ width: FRAME_W, height: FRAME_H, borderRadius: RADIUS.lg, overflow: 'hidden' }}
            onPress={() => { setAutoFocus('off'); setTimeout(() => setAutoFocus('on'), 100); }}
          >
            <CameraView ref={cameraRef} style={{ width: FRAME_W, height: FRAME_H }}
              facing="back" enableTorch={flashOn} autoFocus={autoFocus} />
          </TouchableOpacity>
          {isScanning && (
            <View style={styles.scanningOverlay}>
              <Text style={styles.scanningText}>{t('scanner.readingCode')}</Text>
            </View>
          )}
          <Animated.View style={[StyleSheet.absoluteFillObject, styles.frameOverlay, glowStyle]}>
            <View style={[styles.corner, styles.cTL]} />
            <View style={[styles.corner, styles.cTR]} />
            <View style={[styles.corner, styles.cBL]} />
            <View style={[styles.corner, styles.cBR]} />
          </Animated.View>
        </View>
        <View style={styles.controls}>
          <TouchableOpacity onPress={() => setFlashOn(f => !f)}
            style={[styles.controlBtn, flashOn && styles.controlBtnActive]}>
            <AppIcon name="flash-zap" variant={flashOn ? 'gold' : 'white'} size={26} />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleCapture} disabled={isScanning} activeOpacity={0.8}>
            <Animated.View style={[styles.shutterBtn, glowStyle]}>
              <AppIcon name="shutter-circle" variant="white" size={70} />
            </Animated.View>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setResult({ card: pendingCard, activationCode: null }); setPendingCard(null); setScreen('result'); }}
            style={styles.controlBtn}>
            <Ionicons name="arrow-forward" size={26} color="#fff" />
          </TouchableOpacity>
        </View>
        <Text style={styles.goldenSkipHint}>{t('scanner.goldenBallerSkip')}</Text>
      </View>
    );
  }

  // ---------------------------------------------------------------------------
  // Main camera screen
  // ---------------------------------------------------------------------------

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerBtn} />
        <Text style={styles.headerTitle}>{t('scanner.titleCamera')}</Text>
        <TouchableOpacity style={styles.headerBtn} onPress={() => setShowTips(true)}>
          <AppIcon name="question-mark-circle" variant="white" size={22} />
        </TouchableOpacity>
      </View>

      {/* Subtitle — kontextabhängig */}
      <Text style={styles.subtitle}>
        {scanType === 'sticker'
          ? t('scanner.subtitleSticker')
          : t('scanner.subtitleAdrenalyn')}
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
            <Text style={styles.scanningText}>{t('scanner.recognizing')}</Text>
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
          {isPro
            ? t('scanner.counterLabelPro')
            : t('scanner.counterLabel', { count: scansUsed, limit: FREE_SCAN_LIMIT })}
        </Text>
        <TouchableOpacity onPress={() => onShowPaywall?.()} style={styles.proBadge}>
          <Text style={styles.proCrown}>👑</Text>
          <Text style={styles.proText}>Pro</Text>
        </TouchableOpacity>
      </View>
      {!isPro && (
        <View style={styles.progressBarBg}>
          <Animated.View style={[styles.progressBarFill, { width: `${scanProgress * 100}%` }]} />
        </View>
      )}

      {/* Typ-Auswahl: Sticker / Adrenalyn-Karte */}
      <View style={styles.modeRow}>
        {SCAN_TYPES.map(scanMode => (
          <TouchableOpacity
            key={scanMode.key}
            style={[styles.modeBtn, scanType === scanMode.key && styles.modeBtnActive]}
            onPress={() => setScanType(scanMode.key)}
          >
            <AppIcon name={scanMode.icon} variant={scanType === scanMode.key ? 'dark' : 'white'} size={16} />
            <Text style={[styles.modeBtnText, scanType === scanMode.key && styles.modeBtnTextActive]}>
              {scanMode.key === 'sticker' ? t('scanner.typeSticker') : t('scanner.typeAdrenalyn')}
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
        <Text style={styles.manualLinkText}>{t('scanner.manualLinkText')}</Text>
      </TouchableOpacity>

      {/* Tips Modal */}
      <TipsModal visible={showTips} onClose={() => setShowTips(false)} />

      {/* Scan History */}
      {scanHistory.length > 0 && (
        <View style={styles.historyArea}>
          <Text style={styles.historyTitle}>{t('scanner.historyTitle')}</Text>
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
                onCountChange={n => {
                  if (item.itemType === 'card') {
                    setAdrenalynCount(String(item.number), n).catch(() => {});
                  } else {
                    handleCountChange(item.id, n);
                  }
                }}
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
  const { t } = useTranslation();
  const isCard = sticker.itemType === 'card';
  const isGoldenBaller = sticker.cardType === 'GOLDEN_BALLER';
  const flag = sticker.team ? (TEAM_FLAGS[sticker.team] ?? '') : (isCard ? '📇' : '🌍');
  const displayId = isCard
    ? (isGoldenBaller ? `⭐ #${sticker.number}` : `#${sticker.number}`)
    : sticker.id;
  const displayName = sticker.type === 'logo' ? t('sticker.teamLogo')
    : sticker.type === 'team_photo' ? t('sticker.teamPhoto')
    : sticker.name;

  return (
    <View style={[styles.chip, isCard && styles.chipCard]}>
      <Text style={[styles.chipId, isCard && { color: isGoldenBaller ? COLORS.gold : COLORS.blue }]}>
        {displayId}
      </Text>
      <Text style={styles.chipName} numberOfLines={1}>{displayName}</Text>
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

function TipsModal({ visible, onClose }) {
  const { t } = useTranslation();
  return (
    <Modal visible={visible} animationType="slide" transparent statusBarTranslucent navigationBarTranslucent onRequestClose={onClose}>
      <View style={tipStyles.overlay}>
        <View style={tipStyles.sheet}>
          {/* Header */}
          <View style={tipStyles.header}>
            <Text style={tipStyles.title}>{t('scanner.tipsTitle')}</Text>
            <TouchableOpacity onPress={onClose} style={tipStyles.closeBtn}>
              <Ionicons name="close" size={22} color={COLORS.textPrimary} />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {TIP_ICONS.map((icon, i) => (
              <View key={i} style={tipStyles.row}>
                <View style={tipStyles.iconWrap}>
                  <Ionicons name={icon} size={22} color={COLORS.gold} />
                </View>
                <View style={tipStyles.textWrap}>
                  <Text style={tipStyles.tipTitle}>{t(`scanner.tips.${i}.title`)}</Text>
                  <Text style={tipStyles.tipText}>{t(`scanner.tips.${i}.text`)}</Text>
                </View>
              </View>
            ))}

            {/* Privacy note */}
            <View style={tipStyles.privacyBox}>
              <Ionicons name="shield-checkmark-outline" size={20} color={COLORS.greenBright} />
              <View style={{ flex: 1, marginLeft: SPACING.sm }}>
                <Text style={tipStyles.privacyTitle}>{t('scanner.privacyTitle')}</Text>
                <Text style={tipStyles.privacyText}>{t('scanner.privacyText')}</Text>
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

function ResultCard({ sticker, card, activationCode, codeExpired, collection, insets, onSave, onAddToHave, onAddToNeed, onShowInAlbum, onDismiss }) {
  // ── Alle Hooks oben (React-Regel) ─────────────────────────────────────────
  const { t } = useTranslation();
  const nav = useNavigation();
  const [count, setCount] = React.useState(sticker ? getStickerCount(collection, sticker.id) : 0);

  const isGoldenBaller = card?.type === 'GOLDEN_BALLER';
  const typeLabel  = card ? (CARD_TYPE_LABELS[card.type] ?? card.type ?? '') : '';
  const accentColor = card ? (CARD_TYPE_COLORS[card.type] ?? COLORS.gold) : COLORS.gold;
  const flag = sticker?.team ? (TEAM_FLAGS[sticker.team] ?? '') : '🌍';

  const statusText = count === 0
    ? t('scanner.statusNotCollected')
    : count === 1
      ? (isGoldenBaller ? t('scanner.statusCollectedRare') : t('scanner.statusCollected'))
      : (isGoldenBaller ? t('scanner.statusDuplicateRare') : t('scanner.statusDuplicate'));
  const statusColor = count === 0 ? '#8CA6B8' : count === 1 ? COLORS.green : COLORS.gold;

  // ── Golden Baller ─────────────────────────────────────────────────────────
  if (isGoldenBaller) {
    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={onDismiss}>
            <AppIcon name="arrow-left" variant="gold" size={20} />
          </TouchableOpacity>
          <View style={styles.gbHeaderCenter}>
            <Ionicons name="star" size={19} color={COLORS.gold} />
            <Text style={styles.gbHeaderText}>{t('scanner.goldenBaller')}</Text>
          </View>
          <Image source={require('../../assets/icon.png')} style={styles.appLogo} />
        </View>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.foundContent}>
          {/* ── Premium Card ── */}
          <View style={styles.gbCard}>
            <View style={styles.gbCardGlow} pointerEvents="none" />

            <LinearGradient colors={['#FFE17A', '#C8941F']} style={styles.gbBadge}>
              <Ionicons name="star" size={13} color="#0D1F2D" />
              <Text style={styles.gbBadgeText}>{t('scanner.goldenBallerBadge')}</Text>
            </LinearGradient>

            <Text style={styles.gbNumber}>#{card.number}</Text>
            <Text style={styles.gbName}>{card.name}</Text>
            <Text style={styles.gbCountry}>{card.team}</Text>

            {/* Ratings — ATT / DEF / SKL / Gesamt aus DB */}
            <View style={styles.gbRatings}>
              {[
                { lbl: 'ATT',                  val: card.ratings?.ATT, total: false },
                { lbl: 'DEF',                  val: card.ratings?.DEF, total: false },
                { lbl: 'SKL',                  val: card.ratings?.SKL, total: false },
                { lbl: t('scanner.ratingTotal'), val: card.total_rating, total: true },
              ].map(r => (
                <View key={r.lbl} style={[styles.gbRating, r.total && styles.gbRatingTotal]}>
                  <Text style={styles.gbRatingLbl}>{r.lbl}</Text>
                  <Text style={[styles.gbRatingVal, r.total && styles.gbRatingValTotal]}>
                    {r.val ?? '—'}
                  </Text>
                </View>
              ))}
            </View>

            {/* Activation Code — per OCR gescannt, nicht aus DB */}
            <View style={[styles.gbCode, (!activationCode || codeExpired) && styles.gbCodeEmpty]}>
              <Ionicons
                name={codeExpired ? 'time-outline' : 'scan-outline'}
                size={18}
                color={codeExpired ? COLORS.red : activationCode ? COLORS.gold : '#5F7787'}
              />
              <Text style={[styles.gbCodeLabel, (!activationCode || codeExpired) && { color: codeExpired ? COLORS.red : '#5F7787' }]}>
                {codeExpired
                  ? t('scanner.codeExpired')
                  : activationCode
                    ? t('scanner.codeScanned')
                    : t('scanner.noCodeScanned')}
              </Text>
              {activationCode && !codeExpired && <Text style={styles.gbCodeValue}>{activationCode}</Text>}
            </View>
          </View>

          {/* ── Counter ── */}
          <View style={styles.foundCounterCard}>
            <Text style={styles.foundCounterQ}>{t('scanner.howMany')}</Text>
            <View style={styles.foundCounterRow}>
              <TouchableOpacity style={styles.foundCBtn} onPress={() => setCount(c => Math.max(0, c - 1))}>
                <Text style={styles.foundCBtnMinus}>−</Text>
              </TouchableOpacity>
              <Text style={styles.foundCNum}>{count}</Text>
              <TouchableOpacity style={[styles.foundCBtn, styles.foundCBtnPlus]} onPress={() => setCount(c => c + 1)}>
                <Text style={styles.foundCBtnPlusText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.foundStatus, { color: statusColor }]}>{statusText}</Text>
          </View>

          {/* ── Speichern — gold gradient CTA ── */}
          <TouchableOpacity onPress={() => onSave(count)} activeOpacity={0.85}>
            <LinearGradient colors={['#FFE17A', '#F5C033', '#C8941F']} style={styles.gbSaveBtn}>
              <Ionicons name="checkmark" size={20} color="#0D1F2D" />
              <Text style={styles.gbSaveBtnText}>{t('common.save')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.foundAlbumLink} onPress={() => nav.navigate('Album')}>
            <Text style={styles.foundAlbumLinkText}>
              {t('scanner.showInAlbum')} <Text style={styles.foundAlbumLinkGrp}>{t('scanner.showInAlbumGolden')}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Reguläre Adrenalyn-Karte ──────────────────────────────────────────────
  if (card) {
    const cardId = card.id ?? `#${card.number}`;
    const teamFlag = card.team ? (TEAM_FLAGS[card.team] ?? '') : '';
    const teamName = card.team ? t('teams.' + card.team, { defaultValue: card.team }) : '';
    const positionKey = card.position; // DEF / MID / FWD / GK
    const positionLabel = positionKey ? t(`scanner.position.${positionKey}`, { defaultValue: positionKey }) : null;
    const hasActivationCode = activationCode != null;
    const needsCode = FLIP_TYPES.includes(card.type);

    return (
      <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
          <TouchableOpacity style={styles.headerBtn} onPress={onDismiss}>
            <AppIcon name="arrow-left" variant="gold" size={20} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('scanner.cardFound')}</Text>
          <Image source={require('../../assets/icon.png')} style={styles.appLogo} />
        </View>
        <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.foundContent} showsVerticalScrollIndicator={false}>

          {/* ── Karten-Infoblock ── */}
          <View style={[styles.gbCard, { borderColor: accentColor + '60' }]}>
            <View style={[styles.gbCardGlow, { backgroundColor: accentColor + '18' }]} pointerEvents="none" />

            {/* Typ-Badge */}
            <View style={[styles.gbBadge, { backgroundColor: accentColor + '25', borderColor: accentColor }]}>
              <Text style={[styles.gbBadgeText, { color: accentColor }]}>{typeLabel}</Text>
            </View>

            {/* ID / Nummer */}
            <Text style={[styles.gbNumber, { color: accentColor }]}>{cardId}</Text>

            {/* Spielername */}
            <Text style={styles.gbName}>{card.name ?? '—'}</Text>

            {/* Team + Flagge */}
            {teamName ? (
              <Text style={styles.gbCountry}>{teamFlag}{teamFlag ? ' ' : ''}{teamName}</Text>
            ) : null}

            {/* Position */}
            {positionLabel ? (
              <View style={styles.cardPositionRow}>
                <Text style={[styles.cardPositionLabel, { color: accentColor }]}>{positionLabel}</Text>
              </View>
            ) : null}

            {/* Ratings (falls vorhanden — z. B. HERO oder zukünftige Karten mit Stats) */}
            {(card.ratings || card.total_rating) ? (
              <View style={styles.gbRatings}>
                {card.ratings?.ATT != null && (
                  <View style={styles.gbRating}>
                    <Text style={styles.gbRatingLbl}>ATT</Text>
                    <Text style={styles.gbRatingVal}>{card.ratings.ATT}</Text>
                  </View>
                )}
                {card.ratings?.DEF != null && (
                  <View style={styles.gbRating}>
                    <Text style={styles.gbRatingLbl}>DEF</Text>
                    <Text style={styles.gbRatingVal}>{card.ratings.DEF}</Text>
                  </View>
                )}
                {card.ratings?.SKL != null && (
                  <View style={styles.gbRating}>
                    <Text style={styles.gbRatingLbl}>SKL</Text>
                    <Text style={styles.gbRatingVal}>{card.ratings.SKL}</Text>
                  </View>
                )}
                {card.total_rating != null && (
                  <View style={[styles.gbRating, styles.gbRatingTotal]}>
                    <Text style={styles.gbRatingLbl}>{t('scanner.ratingTotal')}</Text>
                    <Text style={[styles.gbRatingVal, styles.gbRatingValTotal]}>{card.total_rating}</Text>
                  </View>
                )}
              </View>
            ) : null}

            {/* Aktivierungscode (LE-Typen) */}
            {needsCode && (
              <View style={[styles.gbCode, (!hasActivationCode || codeExpired) && styles.gbCodeEmpty]}>
                <Ionicons
                  name={codeExpired ? 'time-outline' : 'scan-outline'}
                  size={18}
                  color={codeExpired ? COLORS.red : hasActivationCode ? accentColor : '#5F7787'}
                />
                <Text style={[styles.gbCodeLabel, (!hasActivationCode || codeExpired) && { color: codeExpired ? COLORS.red : '#5F7787' }]}>
                  {codeExpired
                    ? t('scanner.codeExpired')
                    : hasActivationCode
                      ? t('scanner.codeScanned')
                      : t('scanner.noCodeScanned')}
                </Text>
                {hasActivationCode && !codeExpired && <Text style={styles.gbCodeValue}>{activationCode}</Text>}
              </View>
            )}
          </View>

          {/* ── Counter ── */}
          <View style={styles.foundCounterCard}>
            <Text style={styles.foundCounterQ}>{t('scanner.howMany')}</Text>
            <View style={styles.foundCounterRow}>
              <TouchableOpacity style={styles.foundCBtn} onPress={() => setCount(c => Math.max(0, c - 1))}>
                <Text style={styles.foundCBtnMinus}>−</Text>
              </TouchableOpacity>
              <Text style={styles.foundCNum}>{count}</Text>
              <TouchableOpacity style={[styles.foundCBtn, styles.foundCBtnPlus]} onPress={() => setCount(c => c + 1)}>
                <Text style={styles.foundCBtnPlusText}>+</Text>
              </TouchableOpacity>
            </View>
            <Text style={[styles.foundStatus, { color: statusColor }]}>{statusText}</Text>
          </View>

          {/* ── Speichern ── */}
          <TouchableOpacity onPress={() => onSave(count)} activeOpacity={0.85}>
            <LinearGradient colors={['#FFE17A', '#F5C033', '#C8941F']} style={styles.gbSaveBtn}>
              <Ionicons name="checkmark" size={20} color="#0D1F2D" />
              <Text style={styles.gbSaveBtnText}>{t('common.save')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity style={styles.foundAlbumLink} onPress={() => nav.navigate('Album')}>
            <Text style={styles.foundAlbumLinkText}>
              {t('scanner.showInAlbum')} <Text style={styles.foundAlbumLinkGrp}>{t('scanner.showInAlbumAdrenalyn')}</Text>
            </Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
            <Text style={styles.dismissText}>{t('common.close')}</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ── Sticker ────────────────────────────────────────────────────────────────
  return (
    <View style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <View style={[styles.header, { paddingTop: insets.top + SPACING.md }]}>
        <TouchableOpacity style={styles.headerBtn} onPress={onDismiss}>
          <AppIcon name="arrow-left" variant="gold" size={20} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('scanner.stickerFound')}</Text>
        <LinearGradient colors={['#FFE17A', '#F5C033']} style={styles.appLogo}>
          <Ionicons name="trophy" size={22} color="#0D1F2D" />
        </LinearGradient>
      </View>
      <ScrollView style={{ flex: 1 }} contentContainerStyle={styles.foundContent} showsVerticalScrollIndicator={false}>
        <View style={styles.foundInfoCard}>
          <Text style={styles.foundId}>{sticker.id}</Text>
          {sticker.foil && <Text style={styles.foundFoil}>✨ FOIL</Text>}
          <Text style={styles.foundPlayer}>
            {sticker.type === 'logo' ? t('sticker.teamLogo') : sticker.type === 'team_photo' ? t('sticker.teamPhoto') : sticker.name}
          </Text>
          <Text style={styles.foundTeam}>{flag} {sticker.team ? t('teams.' + sticker.team) : (sticker.teamName ?? sticker.team ?? '')}{sticker.group ? ' ' + t('scanner.groupLabel', { g: sticker.group }) : ''}</Text>
        </View>
        <View style={styles.foundCounterCard}>
          <Text style={styles.foundCounterQ}>{t('scanner.howMany')}</Text>
          <View style={styles.foundCounterRow}>
            <TouchableOpacity style={styles.foundCBtn} onPress={() => setCount(c => Math.max(0, c - 1))}>
              <Text style={styles.foundCBtnMinus}>−</Text>
            </TouchableOpacity>
            <Text style={styles.foundCNum}>{count}</Text>
            <TouchableOpacity style={[styles.foundCBtn, styles.foundCBtnPlus]} onPress={() => setCount(c => c + 1)}>
              <Text style={styles.foundCBtnPlusText}>+</Text>
            </TouchableOpacity>
          </View>
          <Text style={[styles.foundStatus, { color: statusColor }]}>{statusText}</Text>
        </View>
        <TouchableOpacity style={styles.foundSaveBtn} onPress={() => onSave(count)}>
          <Ionicons name="checkmark" size={20} color="#0D1F2D" />
          <Text style={styles.foundSaveBtnText}>{t('common.save')}</Text>
        </TouchableOpacity>
        {sticker.group && (
          <TouchableOpacity onPress={onShowInAlbum} style={styles.foundAlbumLink}>
            <Ionicons name="book-outline" size={18} color="#8CA6B8" />
            <Text style={styles.foundAlbumLinkText}>
              {t('scanner.showInAlbum')} <Text style={styles.foundAlbumLinkGrp}>{t('scanner.showInAlbumGroup', { group: sticker.group })}</Text>
            </Text>
          </TouchableOpacity>
        )}
        {count !== 1 && (
          <TouchableOpacity
            style={[styles.foundTradeBtn, count === 0 ? styles.foundTradeBtnBlue : styles.foundTradeBtnGold]}
            onPress={() => { count === 0 ? onAddToNeed() : nav.navigate('Trade'); }}
          >
            <Ionicons name={count === 0 ? 'search-outline' : 'swap-horizontal-outline'} size={24}
              color={count === 0 ? COLORS.blue : COLORS.gold} />
            <View style={{ flex: 1 }}>
              <Text style={[styles.foundTradeTitle, { color: count === 0 ? COLORS.blue : COLORS.gold }]}>
                {count === 0 ? t('scanner.addToSearch') : t('scanner.offerTrade')}
              </Text>
              <Text style={styles.foundTradeSub}>
                {count === 0
                  ? t('scanner.addToSearchSub')
                  : t(count - 1 > 1 ? 'scanner.offerTradeSubPlural' : 'scanner.offerTradeSub', { count: count - 1 })}
              </Text>
            </View>
          </TouchableOpacity>
        )}
        <TouchableOpacity onPress={onDismiss} style={styles.dismissBtn}>
          <Text style={styles.dismissText}>{t('common.close')}</Text>
        </TouchableOpacity>
      </ScrollView>
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
  chipCard: { borderColor: 'rgba(79,195,247,0.3)' },
  chipId: { color: COLORS.gold, fontSize: FONTS.sizes.xs, fontWeight: '700' },
  chipName: { color: COLORS.textPrimary, fontSize: FONTS.sizes.xs, maxWidth: 82, textAlign: 'center', marginVertical: 2 },
  chipFlag: { fontSize: 14, marginBottom: 4 },
  chipCount: { flexDirection: 'row', alignItems: 'center', gap: SPACING.xs },
  chipBtn: { backgroundColor: COLORS.surfaceHigh, borderRadius: RADIUS.sm, width: 22, height: 22, alignItems: 'center', justifyContent: 'center' },
  chipBtnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, lineHeight: 20 },
  chipCountVal: { color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: '700', minWidth: 24, textAlign: 'center' },

  // Typ-Wähler Fallback
  typeSelectBody: { flex: 1, padding: SPACING.lg, paddingTop: SPACING.xl },
  typeSelectHint: {
    color: COLORS.textSecondary, fontSize: FONTS.sizes.md, textAlign: 'center',
    marginBottom: SPACING.xl, lineHeight: 22,
  },
  typeSelectBtn: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
    borderRadius: RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.sm,
  },
  typeSelectEmoji: { fontSize: 28 },
  typeSelectLabel: { color: COLORS.textPrimary, fontSize: FONTS.sizes.lg, fontWeight: '700' },
  typeSelectSub: { color: COLORS.textMuted, fontSize: FONTS.sizes.sm, marginTop: 2 },
  typeSelectDivider: { height: 1, backgroundColor: 'rgba(255,255,255,0.08)', marginVertical: SPACING.lg },
  typeSelectAlt: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: SPACING.sm },
  typeSelectAltText: { color: COLORS.gold, fontSize: FONTS.sizes.md, fontWeight: '600' },

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
  needBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    paddingHorizontal: SPACING.lg,
    marginTop: SPACING.sm,
    borderWidth: 1,
    borderColor: 'rgba(255,107,107,0.45)',
  },
  needBtnDone: {
    borderColor: 'rgba(66,215,131,0.45)',
    backgroundColor: 'rgba(66,215,131,0.06)',
  },
  needBtnText: { color: COLORS.red, fontSize: FONTS.sizes.md, fontWeight: '600' },
  needBtnHint: { color: '#8CA6B8', fontSize: FONTS.sizes.xs, marginTop: 2 },
  albumBtn: { flexDirection: 'row', alignItems: 'center', gap: SPACING.sm, backgroundColor: COLORS.surfaceRaised, borderRadius: RADIUS.full, padding: SPACING.md, paddingHorizontal: SPACING.xl, marginTop: SPACING.md, borderWidth: 1, borderColor: COLORS.border },
  albumBtnText: { color: COLORS.textPrimary, fontSize: FONTS.sizes.md, fontWeight: '600', flex: 1 },
  dismissBtn: { alignSelf: 'center', marginTop: SPACING.lg },
  dismissText: { color: COLORS.textMuted, fontSize: FONTS.sizes.md },

  // Golden Baller Banner
  goldenBanner: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.md,
    marginHorizontal: SPACING.lg, marginBottom: SPACING.sm,
    backgroundColor: 'rgba(245,192,51,0.12)',
    borderRadius: RADIUS.md, padding: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(245,192,51,0.35)',
  },
  goldenBannerStar: { fontSize: 28 },
  goldenBannerName: { color: COLORS.gold, fontWeight: '800', fontSize: FONTS.sizes.lg },
  goldenBannerSub:  { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  goldenSkipHint:   { color: COLORS.textMuted, fontSize: FONTS.sizes.xs, textAlign: 'center', marginTop: SPACING.xs },

  // App Logo oben rechts
  appLogo: {
    width: 44, height: 44, borderRadius: 12,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },

  // Sticker gefunden — neues Layout
  foundContent: { padding: 20, paddingBottom: 40 },

  foundInfoCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 20, padding: 20, marginBottom: 14,
  },
  foundId: {
    fontSize: 48, fontWeight: '800', color: COLORS.gold,
    lineHeight: 52, letterSpacing: -1.5,
    textShadowColor: 'rgba(245,192,51,0.25)', textShadowOffset: { width: 0, height: 0 }, textShadowRadius: 20,
  },
  foundFoil: {
    color: COLORS.gold, fontSize: FONTS.sizes.sm, fontWeight: '700',
    marginBottom: 4,
  },
  foundPlayer: { color: '#fff', fontSize: 22, fontWeight: '700', marginTop: 10 },
  foundTeam:   { color: '#8CA6B8', fontSize: 15, marginTop: 5 },

  foundCounterCard: {
    backgroundColor: 'rgba(255,255,255,0.04)',
    borderWidth: 1, borderColor: 'rgba(245,192,51,0.25)',
    borderRadius: 20, padding: 22, marginBottom: 14,
    alignItems: 'center',
  },
  foundCounterQ: { color: '#E4EEF5', fontSize: 18, fontWeight: '600', marginBottom: 18 },
  foundCounterRow: { flexDirection: 'row', alignItems: 'center', gap: 30 },
  foundCBtn: {
    width: 58, height: 58, borderRadius: 29,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)',
    backgroundColor: 'rgba(255,255,255,0.06)',
  },
  foundCBtnMinus: { color: '#fff', fontSize: 30, lineHeight: 34 },
  foundCBtnPlus: {
    borderColor: 'rgba(245,192,51,0.5)',
    backgroundColor: 'rgba(245,192,51,0.12)',
  },
  foundCBtnPlusText: { color: COLORS.gold, fontSize: 30, lineHeight: 34 },
  foundCNum: {
    fontSize: 50, fontWeight: '800', color: COLORS.gold,
    minWidth: 68, textAlign: 'center', lineHeight: 54,
  },
  foundStatus: { marginTop: 16, fontSize: 14, fontWeight: '700', letterSpacing: 0.3 },

  foundSaveBtn: {
    backgroundColor: COLORS.gold, borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 15,
  },
  foundSaveBtnText: { color: '#0D1F2D', fontSize: 17, fontWeight: '700' },

  foundAlbumLink: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 16,
  },
  foundAlbumLinkText: { color: '#8CA6B8', fontSize: 15 },
  foundAlbumLinkGrp:  { color: '#5F7787' },

  foundTradeBtn: {
    borderRadius: 14, padding: 14,
    flexDirection: 'row', alignItems: 'center', gap: 13,
    borderWidth: 1, marginBottom: 16,
  },
  foundTradeBtnBlue: { borderColor: 'rgba(79,195,247,0.5)' },
  foundTradeBtnGold: { borderColor: 'rgba(245,192,51,0.5)' },
  foundTradeTitle: { fontSize: 15, fontWeight: '600' },
  foundTradeSub:   { color: '#8CA6B8', fontSize: 12.5, marginTop: 2, lineHeight: 17 },

  // Golden Baller
  gbHeaderCenter: {
    flex: 1, flexDirection: 'row', alignItems: 'center',
    justifyContent: 'center', gap: 7,
  },
  gbHeaderText: { color: COLORS.gold, fontSize: 19, fontWeight: '700' },

  gbCard: {
    marginBottom: 14, borderRadius: 24, padding: 22,
    backgroundColor: '#0c1c2a',
    borderWidth: 1, borderColor: 'rgba(245,192,51,0.45)',
    overflow: 'hidden',
    shadowColor: COLORS.gold, shadowOpacity: 0.12, shadowRadius: 30, elevation: 10,
  },
  gbCardGlow: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(245,192,51,0.06)',
  },
  gbBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 6,
    borderRadius: 999, alignSelf: 'flex-start', marginBottom: 14,
    borderWidth: 1,
  },
  gbBadgeText: { color: '#0D1F2D', fontSize: 12, fontWeight: '800', letterSpacing: 0.5 },

  // Position-Reihe (reguläre Karten)
  cardPositionRow: {
    marginTop: 10,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.06)',
    borderRadius: 8, paddingHorizontal: 12, paddingVertical: 5,
  },
  cardPositionLabel: { fontSize: 13, fontWeight: '700', letterSpacing: 0.5 },

  gbNumber: {
    fontSize: 64, fontWeight: '800', lineHeight: 60, letterSpacing: -2,
    color: COLORS.gold,
    textShadowColor: 'rgba(245,192,51,0.3)',
    textShadowOffset: { width: 0, height: 2 }, textShadowRadius: 12,
  },
  gbName:    { color: '#fff', fontSize: 26, fontWeight: '800', marginTop: 10, letterSpacing: -0.3 },
  gbCountry: { color: '#FFE17A', fontSize: 15, marginTop: 4, fontWeight: '500' },

  gbRatings: { flexDirection: 'row', gap: 8, marginTop: 18 },
  gbRating: {
    flex: 1, backgroundColor: 'rgba(0,0,0,0.22)',
    borderWidth: 1, borderColor: 'rgba(245,192,51,0.25)',
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 4, alignItems: 'center',
  },
  gbRatingTotal: {
    backgroundColor: 'rgba(245,192,51,0.12)',
    borderColor: 'rgba(245,192,51,0.5)',
  },
  gbRatingLbl: { color: '#8CA6B8', fontSize: 10, textTransform: 'uppercase', letterSpacing: 1, fontWeight: '700' },
  gbRatingVal: { color: COLORS.gold, fontSize: 26, fontWeight: '800', lineHeight: 30, marginTop: 4 },
  gbRatingValTotal: { color: '#FFE17A' },

  gbCode: {
    marginTop: 14, flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderWidth: 1, borderStyle: 'dashed', borderColor: 'rgba(245,192,51,0.4)',
    borderRadius: 12, paddingVertical: 11, paddingHorizontal: 14,
  },
  gbCodeEmpty: { borderColor: 'rgba(255,255,255,0.12)' },
  gbCodeLabel: { color: '#8CA6B8', fontSize: 12 },
  gbCodeValue: { color: '#fff', fontSize: 14, fontWeight: '700', letterSpacing: 1, marginLeft: 'auto' },

  gbSaveBtn: {
    borderRadius: 14, padding: 16,
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, marginBottom: 15,
    shadowColor: COLORS.gold, shadowOpacity: 0.25, shadowRadius: 16, elevation: 8,
  },
  gbSaveBtnText: { color: '#0D1F2D', fontSize: 17, fontWeight: '800' },

  // Activation Code
  codeRow: {
    flexDirection: 'row', alignItems: 'center', gap: SPACING.sm,
    backgroundColor: 'rgba(255,255,255,0.06)', borderRadius: RADIUS.md,
    padding: SPACING.md, marginTop: SPACING.md,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.10)',
  },
  codeLabel: { color: COLORS.textSecondary, fontSize: FONTS.sizes.sm },
  codeValue:  { fontSize: FONTS.sizes.lg, fontWeight: '800', letterSpacing: 2 },
});
