// src/services/pricing.js
// Preislogik: Early Bird, AT-Sonderpreis, Countdown

import * as Localization from 'expo-localization';

const EARLY_BIRD_END     = new Date('2026-06-15T23:59:59');
const WM_END             = new Date('2026-07-19T23:59:59');

// Numerische Werte für dynamische Berechnung
const PRICE_STANDARD_NUM  = 3.99;
const PRICE_EARLY_NUM     = 2.99;
const PRICE_EARLY_AT_NUM  = 1.99;

// Formatierte Strings
const PRICE_EARLY     = '€2,99';
const PRICE_EARLY_AT  = '€1,99';
const PRICE_STANDARD  = '€3,99';

export function isEarlyBird() {
  return new Date() < EARLY_BIRD_END;
}

export function getEarlyBirdDays() {
  const ms = EARLY_BIRD_END - new Date();
  return Math.max(0, Math.ceil(ms / 86_400_000));
}

export function isAustria() {
  try {
    const region = Localization.getLocales()?.[0]?.regionCode;
    return region === 'AT';
  } catch {
    return false;
  }
}

export function getWMPassPrice() {
  if (!isEarlyBird()) return PRICE_STANDARD;
  return isAustria() ? PRICE_EARLY_AT : PRICE_EARLY;
}

export function getStandardPrice() {
  return PRICE_STANDARD;
}

// Dynamisch berechnete Ersparnis in Prozent
export function getSavingsPercent() {
  if (!isEarlyBird()) return null;
  const currentNum = isAustria() ? PRICE_EARLY_AT_NUM : PRICE_EARLY_NUM;
  return Math.round((1 - currentNum / PRICE_STANDARD_NUM) * 100);
}

export function getSavingsLabel() {
  const pct = getSavingsPercent();
  if (!pct) return null;
  return `${pct}% sparen`;
}

export function getPlanLabel() {
  return isAustria() ? '🇦🇹 ÖSTERREICH PREIS' : '★ BESTES PAKET';
}
