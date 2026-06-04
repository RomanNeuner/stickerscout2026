/**
 * StickerScout 2026 — Adrenalyn XL Catalog v2.2
 * 630 Karten: 9 Golden Ballers + 504 Team Cards + 81 Specials
 */
import DB from '../../adrenalyn_db_wc2026.json';

export const ADRENALYN_DB = DB;

// Alle Special Cards als flaches Array
export const SPECIAL_CARDS_FLAT = Object.entries(DB.special_cards ?? {}).flatMap(
  ([section, cards]) => Array.isArray(cards) ? cards.map(c => ({ ...c, section })) : []
);

// Lookup nach Nummer
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

export const TOTAL_ADRENALYN = DB.total_cards ?? 630;

// Lookup nach Nummer (String oder Int)
export function lookupAdrenalyn(input) {
  const num = parseInt(String(input).trim(), 10);
  if (isNaN(num)) return null;
  return ADRENALYN_BY_NUMBER[num] ?? null;
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
};

export const CARD_TYPE_COLORS = {
  GOLDEN_BALLER: '#F5C033',
  FF:            '#4FC3F7',
  IC:            '#FF6B6B',
  TEAM_CREST:    '#42D783',
  BASE:          'rgba(255,255,255,0.4)',
  CONTENDER:     '#A78BFA',
};
