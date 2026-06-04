/**
 * StickerScout 2026 — WC 2026 Sticker Catalog v7.0
 * Base: 980 stickers | CC: 12 Coca-Cola | Extra: 20 rare | Total: 1,012
 * ID format: AUT4, CC2, EXTRA5, FWC3, 00
 */

import DB from '../../sticker_db_wc2026.json';

export const STICKER_DB = DB;

// Map full team name → team code (for CC stickers in DB v7.0)
const TEAM_NAME_TO_CODE = {
  'Spain': 'ESP', 'Germany': 'GER', 'France': 'FRA', 'Croatia': 'CRO',
  'Uruguay': 'URU', 'Netherlands': 'NED', 'Canada': 'CAN', 'Mexico': 'MEX',
  'Argentina': 'ARG', 'England': 'ENG', 'USA': 'USA', 'Brazil': 'BRA',
  'Portugal': 'POR', 'Belgium': 'BEL', 'Italy': 'ITA', 'Japan': 'JPN',
};

// Coca-Cola special stickers (CC1–CC12) — normalized with team codes
export const CC_STICKERS = (DB.coca_cola_stickers ?? []).map(s => ({
  ...s,
  teamName: s.team,
  team: TEAM_NAME_TO_CODE[s.team] ?? s.team,
  type: 'coca_cola',
}));

// Extra stickers (EXTRA1–EXTRA20) — 1:100 packs, ultra rare
export const EXTRA_STICKERS = (DB.extra_stickers ?? []).map(s => ({
  ...s,
  team: null,
  teamName: null,
  type: 'extra',
  rarity: 'ultra_rare',
}));

export const TOTAL_STICKERS = 980;
export const TOTAL_CC = 12;
export const TOTAL_EXTRA = 20;
export const TOTAL_ALL = 1012; // 980 + 12 + 20

// Flat lookup map for all stickers
export const STICKER_BY_ID = {};

// Intro stickers
for (const s of DB.intro_stickers) {
  STICKER_BY_ID[s.id] = { ...s, team: null, teamName: null, group: null };
}

// Team stickers
for (const team of DB.teams) {
  for (const s of team.stickers) {
    STICKER_BY_ID[s.id] = { ...s, team: team.code, teamName: team.name, group: team.group };
  }
}

// CC stickers
for (const s of CC_STICKERS) {
  STICKER_BY_ID[s.id] = s;
}

// Extra stickers
for (const s of EXTRA_STICKERS) {
  STICKER_BY_ID[s.id] = s;
}

// Groups map: { A: ['MEX','RSA','KOR','CZE'], ... }
export const GROUPS = DB.groups;

// Teams map
export const TEAMS_MAP = {};
for (const team of DB.teams) {
  TEAMS_MAP[team.code] = team;
}

/**
 * Universal sticker lookup — handles all ID formats:
 * "AUT4", "FWC3", "00", "CC2", "EXTRA5"
 */
export function lookupSticker(scannedCode) {
  if (!scannedCode) return null;
  const code = scannedCode.trim().toUpperCase();

  // Direct lookup first (fastest)
  if (STICKER_BY_ID[code]) return STICKER_BY_ID[code];

  // Coca-Cola
  if (code.startsWith('CC')) {
    return CC_STICKERS.find(s => s.id === code) ?? null;
  }

  // Extra
  if (code.startsWith('EXTRA')) {
    return EXTRA_STICKERS.find(s => s.id === code) ?? null;
  }

  // Intro / Museum
  if (code.startsWith('FWC') || code === '00') {
    return DB.intro_stickers.find(s => s.id === code) ?? null;
  }

  // Team sticker: e.g. GER10 → teamCode=GER, num=10
  const match = code.match(/^([A-Z]+)(\d+)$/);
  if (!match) return null;
  const [, teamCode] = match;
  const team = DB.teams.find(t => t.code === teamCode);
  if (!team) return null;
  const sticker = team.stickers.find(s => s.id === code);
  return sticker ? { ...sticker, team: team.code, teamName: team.name, group: team.group } : null;
}

// Get all stickers for a team
export function getTeamStickers(teamCode) {
  const team = TEAMS_MAP[teamCode];
  if (!team) return [];
  return team.stickers.map(s => ({ ...s, team: team.code, teamName: team.name, group: team.group }));
}

// Get all stickers for a group
export function getGroupStickers(groupLetter) {
  const teamCodes = GROUPS[groupLetter] ?? [];
  return teamCodes.flatMap(code => getTeamStickers(code));
}
