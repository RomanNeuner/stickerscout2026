import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

import { IAP_PRODUCTS } from '../config/iap';
import { OFFERINGS, PACKAGES } from '../config/revenueCat';

const RC_IOS_KEY     = process.env.EXPO_PUBLIC_RC_IOS_KEY     ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

const KEYS = {
  IS_PRO: '@stickerscout_is_pro',
  PRO_TS: '@stickerscout_pro_ts',
};

const PRO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// ── Produkt-IDs ──────────────────────────────────────────────────────────────
export const PRODUCT_IDS = {
  wmPass:     IAP_PRODUCTS.WM_PASS,
  scan50:     IAP_PRODUCTS.SCAN_BOOST,
  trade7d:    IAP_PRODUCTS.TRADE_SLOTS,
  report:     IAP_PRODUCTS.REPORT_PDF,
  ringtone1:  IAP_PRODUCTS.RINGTONE_SONG1,
  ringtone2:  IAP_PRODUCTS.RINGTONE_SONG2,
  ringtone3:  IAP_PRODUCTS.RINGTONE_SONG3,
  fulltrack1: IAP_PRODUCTS.FULLTRACK_SONG1,
  fulltrack2: IAP_PRODUCTS.FULLTRACK_SONG2,
  fulltrack3: IAP_PRODUCTS.FULLTRACK_SONG3,
};

export const RINGTONE_IDS = [
  IAP_PRODUCTS.RINGTONE_SONG1,
  IAP_PRODUCTS.RINGTONE_SONG2,
  IAP_PRODUCTS.RINGTONE_SONG3,
];

export const FULLTRACK_IDS = [
  IAP_PRODUCTS.FULLTRACK_SONG1,
  IAP_PRODUCTS.FULLTRACK_SONG2,
  IAP_PRODUCTS.FULLTRACK_SONG3,
];

// ── Init ─────────────────────────────────────────────────────────────────────
export async function initRevenueCat() {
  try {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    if (apiKey) await Purchases.configure({ apiKey });
  } catch {
    // RevenueCat nicht verfügbar — gecachter Status wird verwendet
  }
}

// ── Pro-Status Cache ──────────────────────────────────────────────────────────
async function setLocalProStatus(isPro) {
  await AsyncStorage.setItem(KEYS.IS_PRO, isPro ? 'true' : 'false');
  await AsyncStorage.setItem(KEYS.PRO_TS, String(Date.now()));
}

async function getCachedProStatus() {
  const val = await AsyncStorage.getItem(KEYS.IS_PRO);
  const ts  = await AsyncStorage.getItem(KEYS.PRO_TS);
  if (val === null) return null;
  if (ts && Date.now() - parseInt(ts, 10) > PRO_CACHE_TTL) return null;
  return val === 'true';
}

export async function getSubscriptionStatus() {
  const cached = await getCachedProStatus();
  if (cached !== null) return { isPro: cached, source: 'cache' };
  try {
    const info  = await Purchases.getCustomerInfo();
    const isPro = Object.keys(info.entitlements.active).length > 0;
    await setLocalProStatus(isPro);
    return { isPro, source: 'revenuecat' };
  } catch {
    return { isPro: false, source: 'error' };
  }
}

// ── Kauf via Offering + Package ───────────────────────────────────────────────
/**
 * Kauft ein Paket aus einem Offering.
 * @param {string} offeringId  - z.B. OFFERINGS.DEFAULT
 * @param {string} packageId   - z.B. PACKAGES.WM_PASS
 */
export async function purchasePackageFromOffering(offeringId, packageId) {
  try {
    const offerings = await Purchases.getOfferings();
    const offering  = offerings.all[offeringId] ?? offerings.current;
    if (!offering) throw new Error(`Offering nicht gefunden: ${offeringId}`);

    const pkg = offering.availablePackages.find(p => p.identifier === packageId);
    if (!pkg) throw new Error(`Package nicht gefunden: ${packageId} in ${offeringId}`);

    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = Object.keys(customerInfo.entitlements.active).length > 0;
    await setLocalProStatus(isPro);
    return { success: true, isPro, customerInfo };
  } catch (e) {
    if (e.userCancelled) return { success: false, cancelled: true };
    throw e;
  }
}

/**
 * Direkt-Kauf via Produkt-ID (Fallback wenn Offering nicht konfiguriert)
 */
export async function purchaseProductDirect(productId) {
  try {
    const products = await Purchases.getProducts([productId]);
    if (!products.length) throw new Error(`Produkt nicht gefunden: ${productId}`);
    const { customerInfo } = await Purchases.purchaseStoreProduct(products[0]);
    const isPro = Object.keys(customerInfo.entitlements.active).length > 0;
    if (isPro) await setLocalProStatus(true);
    return { success: true, isPro, customerInfo };
  } catch (e) {
    if (e.userCancelled) return { success: false, cancelled: true };
    throw e;
  }
}

/**
 * Universeller Kauf: versucht Offering, fällt auf Direkt-Kauf zurück
 */
export async function purchasePlan(productId, offeringId = OFFERINGS.DEFAULT, packageId = null) {
  try {
    // Versuche Offering-Kauf
    if (packageId) {
      return await purchasePackageFromOffering(offeringId, packageId);
    }
    // Fallback: direkt per Produkt-ID
    return await purchaseProductDirect(productId);
  } catch (e) {
    if (e.userCancelled) return { success: false, cancelled: true };
    // Wenn Offering nicht verfügbar → Direkt-Kauf
    return await purchaseProductDirect(productId);
  }
}

// ── Offerings laden ───────────────────────────────────────────────────────────
export async function getOffering(offeringId = OFFERINGS.DEFAULT) {
  try {
    const offerings = await Purchases.getOfferings();
    return offerings.all[offeringId] ?? offerings.current ?? null;
  } catch {
    return null;
  }
}

// ── Restore ───────────────────────────────────────────────────────────────────
export async function restorePurchases() {
  const info  = await Purchases.restorePurchases();
  const isPro = Object.keys(info.entitlements.active).length > 0;
  await setLocalProStatus(isPro);
  return { isPro };
}

// Re-export für einfachen Zugriff
export { OFFERINGS, PACKAGES };
