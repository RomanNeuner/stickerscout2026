import Purchases, { LOG_LEVEL } from 'react-native-purchases';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const RC_IOS_KEY     = process.env.EXPO_PUBLIC_RC_IOS_KEY     ?? '';
const RC_ANDROID_KEY = process.env.EXPO_PUBLIC_RC_ANDROID_KEY ?? '';

const KEYS = {
  IS_PRO: '@stickerscout_is_pro',
  PRO_TS: '@stickerscout_pro_ts',
};

const PRO_CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

// v3.1 Produkt-IDs (WM Pass Modell, kein Abo)
export const PRODUCT_IDS = {
  wmPass:    'at.ncn.stickerscout2026.wmpass',
  scan50:    'at.ncn.stickerscout2026.scan50',
  trade7d:   'at.ncn.stickerscout2026.trade7d',
  report:    'at.ncn.stickerscout2026.report',
  // Monetarisierung v2.0 — WM Ringtones
  ringtone1: 'at.ncn.stickerscout2026.ringtone.song1',
  ringtone2: 'at.ncn.stickerscout2026.ringtone.song2',
  ringtone3: 'at.ncn.stickerscout2026.ringtone.song3',
};

export const RINGTONE_IDS = [
  'at.ncn.stickerscout2026.ringtone.song1',
  'at.ncn.stickerscout2026.ringtone.song2',
  'at.ncn.stickerscout2026.ringtone.song3',
];

export async function initRevenueCat() {
  try {
    Purchases.setLogLevel(LOG_LEVEL.ERROR);
    const apiKey = Platform.OS === 'ios' ? RC_IOS_KEY : RC_ANDROID_KEY;
    if (apiKey) await Purchases.configure({ apiKey });
  } catch {
    // RevenueCat nicht verfügbar — gecachter Status wird verwendet
  }
}

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

export async function purchasePlan(productId) {
  try {
    const offerings = await Purchases.getOfferings();
    const pkg = offerings.current?.availablePackages.find(
      p => p.product.identifier === productId
    );
    if (!pkg) throw new Error(`Produkt nicht gefunden: ${productId}`);
    const { customerInfo } = await Purchases.purchasePackage(pkg);
    const isPro = Object.keys(customerInfo.entitlements.active).length > 0;
    await setLocalProStatus(isPro);
    return { success: true, isPro };
  } catch (e) {
    if (e.userCancelled) return { success: false, cancelled: true };
    throw e;
  }
}

export async function restorePurchases() {
  const info  = await Purchases.restorePurchases();
  const isPro = Object.keys(info.entitlements.active).length > 0;
  await setLocalProStatus(isPro);
  return { isPro };
}
