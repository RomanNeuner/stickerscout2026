import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  COLLECTION: '@stickerswap_collection',
  TRADE_OFFERS: '@stickerswap_offers',
  PROFILE: '@stickerswap_profile',
  ONBOARDED: '@stickerswap_onboarded',
  SCAN_COUNT: '@stickerswap_scan_count',
  SCAN_DATE: '@stickerswap_scan_date',
};

export const FREE_SCAN_LIMIT = 10;
export const FREE_OFFER_LIMIT = 5;

// ---------------------------------------------------------------------------
// Collection: { have: Set<id>, need: Set<id>, duplicates: { [id]: number } }
// Stored as JSON-serializable object
// ---------------------------------------------------------------------------

export async function loadCollection() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.COLLECTION);
    if (!raw) return { have: [], need: [], duplicates: {} };
    const parsed = JSON.parse(raw);
    return {
      have: parsed.have ?? [],
      need: parsed.need ?? [],
      duplicates: parsed.duplicates ?? {},
    };
  } catch {
    return { have: [], need: [], duplicates: {} };
  }
}

export async function saveCollection(collection) {
  await AsyncStorage.setItem(KEYS.COLLECTION, JSON.stringify(collection));
}

export async function addToHave(stickerId) {
  const col = await loadCollection();
  if (!col.have.includes(stickerId)) col.have.push(stickerId);
  col.need = col.need.filter(id => id !== stickerId);
  await saveCollection(col);
  return col;
}

export async function addToNeed(stickerId) {
  const col = await loadCollection();
  if (!col.need.includes(stickerId)) col.need.push(stickerId);
  await saveCollection(col);
  return col;
}

export async function addDuplicate(stickerId) {
  const col = await loadCollection();
  if (!col.have.includes(stickerId)) col.have.push(stickerId);
  col.duplicates[stickerId] = (col.duplicates[stickerId] ?? 1) + 1;
  await saveCollection(col);
  return col;
}

export async function removeFromCollection(stickerId) {
  const col = await loadCollection();
  col.have = col.have.filter(id => id !== stickerId);
  col.need = col.need.filter(id => id !== stickerId);
  delete col.duplicates[stickerId];
  await saveCollection(col);
  return col;
}

// ---------------------------------------------------------------------------
// Trade offers
// ---------------------------------------------------------------------------

export async function loadOffers() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.TRADE_OFFERS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function saveOffer(offer) {
  const offers = await loadOffers();
  offers.push({ ...offer, id: Date.now().toString(), createdAt: new Date().toISOString() });
  await AsyncStorage.setItem(KEYS.TRADE_OFFERS, JSON.stringify(offers));
  return offers;
}

export async function deleteOffer(offerId) {
  const offers = await loadOffers();
  const updated = offers.filter(o => o.id !== offerId);
  await AsyncStorage.setItem(KEYS.TRADE_OFFERS, JSON.stringify(updated));
  return updated;
}

// ---------------------------------------------------------------------------
// Profile
// ---------------------------------------------------------------------------

const DEFAULT_PROFILE = {
  displayName: '',
  matchRadius: 10,
  language: null, // null = device default
  notificationsEnabled: true,
};

export async function loadProfile() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.PROFILE);
    return raw ? { ...DEFAULT_PROFILE, ...JSON.parse(raw) } : { ...DEFAULT_PROFILE };
  } catch {
    return { ...DEFAULT_PROFILE };
  }
}

export async function saveProfile(updates) {
  const profile = await loadProfile();
  const merged = { ...profile, ...updates };
  await AsyncStorage.setItem(KEYS.PROFILE, JSON.stringify(merged));
  return merged;
}

// ---------------------------------------------------------------------------
// Onboarding flag
// ---------------------------------------------------------------------------

export async function isOnboarded() {
  const val = await AsyncStorage.getItem(KEYS.ONBOARDED);
  return val === 'true';
}

export async function setOnboarded() {
  await AsyncStorage.setItem(KEYS.ONBOARDED, 'true');
}

// ---------------------------------------------------------------------------
// Daily scan limit (resets at midnight)
// ---------------------------------------------------------------------------

export async function getScanCount() {
  const today = new Date().toDateString();
  const savedDate = await AsyncStorage.getItem(KEYS.SCAN_DATE);
  if (savedDate !== today) {
    await AsyncStorage.setItem(KEYS.SCAN_DATE, today);
    await AsyncStorage.setItem(KEYS.SCAN_COUNT, '0');
    return 0;
  }
  const count = await AsyncStorage.getItem(KEYS.SCAN_COUNT);
  return parseInt(count ?? '0', 10);
}

export async function incrementScanCount() {
  const count = await getScanCount();
  const next = count + 1;
  await AsyncStorage.setItem(KEYS.SCAN_COUNT, String(next));
  return next;
}
