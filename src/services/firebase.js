/**
 * StickerScout 2026 — Firebase Service
 * Analytics, Crashlytics, Remote Config
 *
 * HINWEIS: @react-native-firebase v24 ruft getApp() beim statischen Import auf,
 * bevor die native Bridge bereit ist → lazy require() als Fix.
 */

// ──────────────────────────────────────────────────────────────────────────────
// Remote Config Defaults (Fallback)
// ──────────────────────────────────────────────────────────────────────────────
const RC_DEFAULTS = {
  early_bird_end:    '2026-06-15T23:59:59',
  wm_pass_price:     '2.99',
  wm_pass_price_at:  '1.99',
  show_ringtones:    true,
  scan_daily_limit:  10,
};

// Lazy require — Module werden erst beim ersten Aufruf geladen, nicht beim Bundle-Load
let _analytics = null;
let _crashlytics = null;
let _remoteConfig = null;

function getAnalytics() {
  if (!_analytics) { try { _analytics = require('@react-native-firebase/analytics').default; } catch {} }
  return _analytics;
}
function getCrashlytics() {
  if (!_crashlytics) { try { _crashlytics = require('@react-native-firebase/crashlytics').default; } catch {} }
  return _crashlytics;
}
function getRemoteConfig() {
  if (!_remoteConfig) { try { _remoteConfig = require('@react-native-firebase/remote-config').default; } catch {} }
  return _remoteConfig;
}

// ──────────────────────────────────────────────────────────────────────────────
// INIT — beim App-Start aufrufen
// ──────────────────────────────────────────────────────────────────────────────
export async function initFirebase() {
  try {
    const rc = getRemoteConfig();
    if (rc) {
      await rc().setDefaults(RC_DEFAULTS);
      await rc().setConfigSettings({
        minimumFetchIntervalMillis: __DEV__ ? 0 : 3600000,
      });
      await rc().fetchAndActivate();
    }

    const cl = getCrashlytics();
    if (cl) {
      await cl().setCrashlyticsCollectionEnabled(!__DEV__);
    }

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
    const a = getAnalytics();
    if (a) await a().logScreenView({ screen_name: screenName, screen_class: screenName });
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// ANALYTICS — Events
// ──────────────────────────────────────────────────────────────────────────────
export async function logEvent(name, params = {}) {
  try {
    const a = getAnalytics();
    if (a) await a().logEvent(name, params);
  } catch {}
}

/**
 * RevenueCat v10 liefert auf Android price manchmal als Micros (z.B. 1990000 statt 1.99).
 * Guard: Werte ≥ 1000 werden als Micros behandelt und durch 1_000_000 geteilt.
 * Kein reales App-Store-Produkt kostet ≥ €1000, daher ist die Schwelle sicher.
 */
function toDecimalPrice(price) {
  const n = Number(price);
  return n >= 1000 ? n / 1_000_000 : n;
}

/**
 * GA4 `purchase`-Event — nur bei echtem Neukauf aufrufen, NIEMALS im Restore-Pfad.
 *
 * @param {object} product     RevenueCat StoreProduct
 *                             (.price Number, .currencyCode String, .identifier, .title)
 * @param {object} [transaction] RevenueCat Transaction (.transactionIdentifier)
 */
export async function logPurchaseEvent(product, transaction) {
  try {
    const a = getAnalytics();
    if (!a) return;
    const decimalPrice = toDecimalPrice(product.price);
    await a().logEvent('purchase', {
      currency:       product.currencyCode,                       // immer dynamisch, nie hardcoden
      value:          decimalPrice,                               // decimal (z.B. 1.99), nie Micros
      transaction_id: transaction?.transactionIdentifier
                      ?? `${product.identifier}_${Date.now()}`,   // Fallback
      items: [{
        item_id:   product.identifier,
        item_name: product.title ?? product.identifier,
        price:     decimalPrice,
        quantity:  1,
      }],
    });
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
    const cl = getCrashlytics();
    if (cl) await cl().setUserId(userId);
  } catch {}
}

export async function logError(error, context = '') {
  try {
    const cl = getCrashlytics();
    if (cl) {
      if (context) await cl().log(context);
      await cl().recordError(error);
    }
  } catch {}
}

// ──────────────────────────────────────────────────────────────────────────────
// REMOTE CONFIG — Werte abrufen
// ──────────────────────────────────────────────────────────────────────────────
export function getRemoteString(key) {
  try {
    const rc = getRemoteConfig();
    return rc ? rc().getString(key) : String(RC_DEFAULTS[key] ?? '');
  } catch {
    return String(RC_DEFAULTS[key] ?? '');
  }
}

export function getRemoteBool(key) {
  try {
    const rc = getRemoteConfig();
    return rc ? rc().getBoolean(key) : Boolean(RC_DEFAULTS[key]);
  } catch {
    return Boolean(RC_DEFAULTS[key]);
  }
}

export function getRemoteNumber(key) {
  try {
    const rc = getRemoteConfig();
    return rc ? rc().getNumber(key) : Number(RC_DEFAULTS[key] ?? 0);
  } catch {
    return Number(RC_DEFAULTS[key] ?? 0);
  }
}
