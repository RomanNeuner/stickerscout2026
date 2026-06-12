/**
 * StickerScout 2026 — Adrenalyn XL Catalog v2.4
 * 680 Album-Karten: 9 Golden Ballers + 504 Team Cards + 81 Specials
 *                 + 48 HERO Upgrade Cards (U01–U48) + 2 VOLLGAS LIMITED (LE1–LE2)
 * Update-Set: 50 Karten total, €15, läuft ab 31.08.2026
 *
 * SEPARATE Chase-Kategorien (NICHT in 680):
 *   Dream Box: 24 Legenden (DB01–DB24) — FIFA World Cup Master
 *   Standard LEs: ~116 global; 26 Namen gesichert (Mix 1, Mix 2 partial, DE-exklusiv)
 *
 * Korrektur: Gonçalo Ramos = U33 (Upgrade/HERO), NICHT Limited Edition
 */
import DB from '../../adrenalyn_db_wc2026.json';

export const ADRENALYN_DB = DB;

// Alle Special Cards als flaches Array
export const SPECIAL_CARDS_FLAT = Object.entries(DB.special_cards ?? {}).flatMap(
  ([section, cards]) => Array.isArray(cards) ? cards.map(c => ({ ...c, section })) : []
);

// Update-Set: 48 HERO Upgrade Cards (U01–U48)
export const HERO_CARDS = (DB.update_set?.upgrade_cards ?? []).map(c => ({
  ...c,
  type: 'HERO',
  section: 'hero_cards',
}));

// Update-Set: 2 Limited Editions (LE1–LE2, VOLLGAS LIMITED)
export const LIMITED_EDITION_CARDS = (DB.update_set?.limited_editions ?? []).map(c => ({
  ...c,
  section: 'limited_edition',
}));

// Lookup nach Nummer (Basis-Set 1–630)
export const ADRENALYN_BY_NUMBER = {};
for (const card of DB.golden_ballers ?? []) {
  ADRENALYN_BY_NUMBER[card.number] = { ...card, section: 'golden_ballers' };
}
for (const card of DB.team_cards ?? []) {
  ADRENALYN_BY_NUMBER[card.number] = { ...card, section: 'team_cards' };
}
for (const card of SPECIAL_CARDS_FLAT) {
  if (card.number) ADRENALYN_BY_NUMBER[card.number] = card;
}

// Dream Box — 24 Legenden (DB01–DB24), NICHT in 680
export const DREAM_BOX_CARDS = (DB.dream_box ?? []).map(c => ({
  ...c,
  section: 'dream_box',
}));

// Standard LEs — offene Liste, ~116 global, 26 gesichert, NICHT in 680
export const STANDARD_LE_CARDS = (DB.standard_le?.cards ?? []).map(c => ({
  ...c,
  section: 'standard_le',
}));
export const STANDARD_LE_ESTIMATED_TOTAL = DB.standard_le?.estimated_total ?? 116;
export const STANDARD_LE_CONFIRMED = DB.standard_le?.confirmed_count ?? 0;

// Lookup nach ID (U01–U48, LE1–LE2, DB01–DB24, LE-MIX-*)
export const ADRENALYN_BY_ID = {};
for (const card of HERO_CARDS) {
  ADRENALYN_BY_ID[card.id] = card;
}
for (const card of LIMITED_EDITION_CARDS) {
  ADRENALYN_BY_ID[card.id] = card;
}
for (const card of DREAM_BOX_CARDS) {
  ADRENALYN_BY_ID[card.id] = card;
}
for (const card of STANDARD_LE_CARDS) {
  ADRENALYN_BY_ID[card.id] = card;
}

// 630 Basis + 48 HERO + 2 Limited Edition = 680
export const TOTAL_ADRENALYN = 680;

// Lookup nach Nummer (String oder Int, Basis-Set)
export function lookupAdrenalyn(input) {
  const num = parseInt(String(input).trim(), 10);
  if (isNaN(num)) return null;
  return ADRENALYN_BY_NUMBER[num] ?? null;
}

// Lookup nach ID (U01–U48, LE1–LE2)
export function lookupAdrenalynById(id) {
  return ADRENALYN_BY_ID[String(id).trim().toUpperCase()] ?? null;
}

// Karten nach Typ filtern
export function getAdrenalynByType(type) {
  return Object.values(ADRENALYN_BY_NUMBER).filter(c => c.type === type);
}

// Typ-Labels
export const CARD_TYPE_LABELS = {
  GOLDEN_BALLER:    '⭐ Golden Baller',
  FF:               'Fan Favourite',
  TEAM_CREST:       'Team Crest',
  IC:               'Icon',
  BASE:             'Base',
  CONTENDER_MATCH:  'Contender Match',
  CONTENDER:        'Contender',
  HERO:             '🦸 HERO Upgrade',
  LIMITED_EDITION:  '💎 VOLLGAS LIMITED',
  DREAM_BOX:        '🏆 Dream Box Master',
  STANDARD_LE:      '✨ Limited Edition',
};

export const CARD_TYPE_COLORS = {
  GOLDEN_BALLER:   '#F5C033',
  FF:              '#4FC3F7',
  IC:              '#FF6B6B',
  TEAM_CREST:      '#42D783',
  BASE:            '#8CA6B8',
  CONTENDER:       '#A78BFA',
  HERO:            '#FF8C42',
  LIMITED_EDITION: '#E040FB',
  DREAM_BOX:       '#FFD700',
  STANDARD_LE:     '#C084FC',
};
