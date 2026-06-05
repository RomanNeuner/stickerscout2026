/**
 * StickerScout 2026 — Firebase Service
 * Analytics, Crashlytics, Remote Config
 */
import analytics from '@react-native-firebase/analytics';
import crashlytics from '@react-native-firebase/crashlytics';
import remoteConfig from '@react-native-firebase/remote-config';

// ──────────────────────────────────────────────────────────────────────────────
// Remote Config Defaults
// ──────────────────────────────────────────────────────────────────────────────
const RC_DEFAULTS = {
  early_bird_end:    '2026-06-15T23:59:59',
  wm_pass_price:     '2.99',
  wm_pass_price_at:  '1.99',
  show_ringtones:    true,
  scan_daily_limit:  10,
};

// ──────────────────────────────────────────────────────────────────────────────
// INIT — beim App-Start aufrufen
// ──────────────────────────────────────────────────────────────────────────────
export async function initFirebase() {
  try {
    // Remote Config
    await remoteConfig().setDefaults(RC_DEFAULTS);
    await remoteConfig().setConfigSettings({
      minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000, // 1h in Produktion
    });
    await remoteConfig().fetchAndActivate();

    // Crashlytics
    await crashlytics().setCrashlyticsCollectionEnabled(!__DEV__);

    console.log('[Firebase] initialisiert');
  } catch (e) {
    console.warn('[Firebase] Init fehlgeschlagen:', e.message);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// ANALYTICS — Screen Tracking
// ──────────────────────────────────────────────────────────────────────────────
export async function logScreen(screenName) {
  try {
    await analytics().logScreenView({
      screen_name: screenName,
      screen_class: screenName,
    });
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// ANALYTICS — Events
// ──────────────────────────────────────────────────────────────────────────────
export async function logEvent(name, params = {}) {
  try {
    await analytics().logEvent(name, params);
  } catch {}
}

// Standard-Events für StickerScout
export const FirebaseEvents = {
  // Scan
  SCAN_SUCCESS:       (stickerType) => logEvent('scan_success', { sticker_type: stickerType }),
  SCAN_LIMIT_REACHED: ()            => logEvent('scan_limit_reached'),

  // Paywall
  PAYWALL_SHOWN:      (trigger)     => logEvent('paywall_shown', { trigger }),
  PURCHASE_STARTED:   (product)     => logEvent('purchase_started', { product_id: product }),
  PURCHASE_SUCCESS:   (product)     => logEvent('purchase_success', { product_id: product }),
  PURCHASE_CANCELLED: (product)     => logEvent('purchase_cancelled', { product_id: product }),

  // Ringtones
  RINGTONE_PREVIEW:   (songId)      => logEvent('ringtone_preview', { song_id: songId }),
  RINGTONE_PURCHASE:  (songId)      => logEvent('ringtone_purchase', { song_id: songId }),
  FULLTRACK_PURCHASE: (songId)      => logEvent('fulltrack_purchase', { song_id: songId }),

  // Trade
  TRADE_OFFER_CREATED: ()           => logEvent('trade_offer_created'),
  TRADE_MATCH_FOUND:  ()            => logEvent('trade_match_found'),

  // Album
  MILESTONE_25:       ()            => logEvent('collection_milestone', { percent: 25 }),
  MILESTONE_50:       ()            => logEvent('collection_milestone', { percent: 50 }),
  MILESTONE_75:       ()            => logEvent('collection_milestone', { percent: 75 }),
  MILESTONE_100:      ()            => logEvent('collection_milestone', { percent: 100 }),
};

// ──────────────────────────────────────────────────────────────────────────────
// CRASHLYTICS — User + Fehler
// ──────────────────────────────────────────────────────────────────────────────
export async function setCrashlyticsUser(userId) {
  try {
    await crashlytics().setUserId(userId);
  } catch {}
}

export async function logError(error, context = '') {
  try {
    if (context) await crashlytics().log(context);
    await crashlytics().recordError(error);
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// REMOTE CONFIG — Werte abrufen
// ──────────────────────────────────────────────────────────────────────────────
export function getRemoteString(key) {
  try {
    return remoteConfig().getString(key);
  } catch {
    return String(RC_DEFAULTS[key] ?? '');
  }
}

export function getRemoteBool(key) {
  try {
    return remoteConfig().getBoolean(key);
  } catch {
    return Boolean(RC_DEFAULTS[key]);
  }
}

export function getRemoteNumber(key) {
  try {
    return remoteConfig().getNumber(key);
  } catch {
    return Number(RC_DEFAULTS[key] ?? 0);
  }
}
