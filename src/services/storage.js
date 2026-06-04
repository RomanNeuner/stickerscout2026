import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYS = {
  COLLECTION:         '@stickerscout_collection',
  ADRENALYN_COLL:     '@stickerscout_adrenalyn',
  TRADE_OFFERS:       '@stickerscout_offers',
  PROFILE:            '@stickerscout_profile',
  ONBOARDED:          '@stickerscout_onboarded',
  SCAN_COUNT:         '@stickerscout_scan_count',
  SCAN_DATE:          '@stickerscout_scan_date',
  SCAN_HISTORY:       '@stickerscout_scan_history',
};

const HISTORY_MAX = 30;

export const FREE_SCAN_LIMIT = 10; // v3.1: 10/Tag Free, Unlimited mit WM Pass
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

// Set exact count for a sticker (count=1 means owned once, count=2 means 1 duplicate, etc.)
export async function setStickerCount(stickerId, count) {
  const col = await loadCollection();
  if (count <= 0) {
    col.have = col.have.filter(id => id !== stickerId);
    delete col.duplicates[stickerId];
  } else {
    if (!col.have.includes(stickerId)) col.have.push(stickerId);
    col.need = col.need.filter(id => id !== stickerId);
    if (count > 1) col.duplicates[stickerId] = count - 1;
    else delete col.duplicates[stickerId];
  }
  await saveCollection(col);
  return col;
}

// Get total count for a sticker (1 = owned, 2+ = duplicates)
export function getStickerCount(collection, stickerId) {
  if (!collection.have.includes(stickerId)) return 0;
  return 1 + (collection.duplicates[stickerId] ?? 0);
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
// Scan History
// ---------------------------------------------------------------------------

export async function loadScanHistory() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.SCAN_HISTORY);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export async function addToScanHistory(sticker) {
  const history = await loadScanHistory();
  // Remove duplicate entry if same sticker already in history
  const filtered = history.filter(s => s.id !== sticker.id);
  const updated = [{ ...sticker, scannedAt: new Date().toISOString() }, ...filtered].slice(0, HISTORY_MAX);
  await AsyncStorage.setItem(KEYS.SCAN_HISTORY, JSON.stringify(updated));
  return updated;
}

export async function clearScanHistory() {
  await AsyncStorage.removeItem(KEYS.SCAN_HISTORY);
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

export async function resetScanCount() {
  await AsyncStorage.setItem(KEYS.SCAN_COUNT, '0');
  await AsyncStorage.setItem(KEYS.SCAN_DATE, new Date().toDateString());
}

// ---------------------------------------------------------------------------
// Adrenalyn XL Collection: { have: number[], duplicates: { [number]: count } }
// ---------------------------------------------------------------------------

export async function loadAdrenalynCollection() {
  try {
    const raw = await AsyncStorage.getItem(KEYS.ADRENALYN_COLL);
    if (!raw) return { have: [], duplicates: {} };
    return JSON.parse(raw);
  } catch { return { have: [], duplicates: {} }; }
}

export async function saveAdrenalynCollection(col) {
  await AsyncStorage.setItem(KEYS.ADRENALYN_COLL, JSON.stringify(col));
}

export async function addAdrenalynCard(cardNumber) {
  const col = await loadAdrenalynCollection();
  if (col.have.includes(cardNumber)) {
    col.duplicates[cardNumber] = (col.duplicates[cardNumber] ?? 1) + 1;
  } else {
    col.have.push(cardNumber);
    col.duplicates[cardNumber] = 1;
  }
  await saveAdrenalynCollection(col);
  return col;
}

export async function setAdrenalynCount(cardNumber, count) {
  const col = await loadAdrenalynCollection();
  if (count <= 0) {
    col.have = col.have.filter(n => n !== cardNumber);
    delete col.duplicates[cardNumber];
  } else {
    if (!col.have.includes(cardNumber)) col.have.push(cardNumber);
    col.duplicates[cardNumber] = count;
  }
  await saveAdrenalynCollection(col);
  return col;
}

export function getAdrenalynCount(col, cardNumber) {
  return col.duplicates?.[cardNumber] ?? 0;
}
