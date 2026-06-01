import { STICKER_TYPE, RARITY, TEAMS } from './stickerTypes';

/**
 * Full WM 2026 sticker catalog — 728 stickers total.
 *
 * Structure per team (14 stickers):
 *   - 1 × LOGO sticker      (e.g. "AUT-LOGO")
 *   - 1 × FOIL group shot   (e.g. "AUT-FOIL")
 *   - 12 × NORMAL players   (e.g. "AUT-1" … "AUT-12")
 *
 * Priority teams (AT, DE, CH, ENG, USA) have real player names.
 * All other teams use placeholder names — update via OTA after launch.
 *
 * Global sticker numbers (1–728) are assigned sequentially by team order.
 */

// ---------------------------------------------------------------------------
// Priority teams: real squads
// ---------------------------------------------------------------------------

const AUT_PLAYERS = [
  'Patrick Pentz', 'Heinz Lindner', 'Philipp Köhn',
  'Aleksandar Dragović', 'Stefan Posch', 'Philipp Lienhart',
  'Kevin Danso', 'Maximilian Wöber', 'Phillipp Mwene',
  'David Alaba', 'Florian Grillitsch', 'Konrad Laimer',
  'Marcel Sabitzer', 'Christoph Baumgartner', 'Marko Arnautovic',
  'Michael Gregoritsch', 'Andreas Weimann', 'Patrick Wimmer',
];

const GER_PLAYERS = [
  'Manuel Neuer', 'Marc-André ter Stegen', 'Oliver Baumann',
  'Antonio Rüdiger', 'Jonathan Tah', 'Niklas Süle',
  'David Raum', 'Thilo Kehrer', 'Benjamin Henrichs',
  'Joshua Kimmich', 'Leon Goretzka', 'Ilkay Gündogan',
  'Jamal Musiala', 'Florian Wirtz', 'Kai Havertz',
  'Serge Gnabry', 'Leroy Sané', 'Thomas Müller',
];

const CHE_PLAYERS = [
  'Yann Sommer', 'Gregor Kobel', 'Yvon Mvogo',
  'Fabian Schär', 'Manuel Akanji', 'Nico Elvedi',
  'Ricardo Rodriguez', 'Silvan Widmer', 'Loris Benito',
  'Granit Xhaka', 'Remo Freuler', 'Denis Zakaria',
  'Xherdan Shaqiri', 'Ruben Vargas', 'Djibril Sow',
  'Haris Seferovic', 'Breel Embolo', 'Noah Okafor',
];

const ENG_PLAYERS = [
  'Jordan Pickford', 'Nick Pope', 'Aaron Ramsdale',
  'Reece James', 'Kyle Walker', 'John Stones',
  'Harry Maguire', 'Luke Shaw', 'Ben Chilwell',
  'Declan Rice', 'Jude Bellingham', 'Trent Alexander-Arnold',
  'Phil Foden', 'Bukayo Saka', 'Marcus Rashford',
  'Harry Kane', 'Raheem Sterling', 'Jack Grealish',
];

const USA_PLAYERS = [
  'Matt Turner', 'Zack Steffen', 'Ethan Horvath',
  'Sergino Dest', 'DeAndre Yedlin', 'Miles Robinson',
  'Walker Zimmerman', 'Chris Richards', 'Joe Scally',
  'Tyler Adams', 'Weston McKennie', 'Yunus Musah',
  'Christian Pulisic', 'Timothy Weah', 'Gio Reyna',
  'Ricardo Pepi', 'Josh Sargent', 'Folarin Balogun',
];

// ---------------------------------------------------------------------------
// Catalog builder
// ---------------------------------------------------------------------------

function buildTeamStickers(teamCode, players, startNumber) {
  const team = TEAMS[teamCode];
  const stickers = [];
  let num = startNumber;

  // Logo sticker
  stickers.push({
    id: `${teamCode}-LOGO`,
    number: num++,
    playerName: null,
    team: teamCode,
    teamNameDE: team.nameDE,
    teamNameEN: team.name,
    group: team.group,
    type: STICKER_TYPE.LOGO,
    rarity: RARITY.COMMON,
    imageUrl: null,
  });

  // Foil sticker
  stickers.push({
    id: `${teamCode}-FOIL`,
    number: num++,
    playerName: `${team.name} — Team`,
    team: teamCode,
    teamNameDE: team.nameDE,
    teamNameEN: team.name,
    group: team.group,
    type: STICKER_TYPE.FOIL,
    rarity: RARITY.FOIL,
    imageUrl: null,
  });

  // 12 player stickers
  for (let i = 0; i < 12; i++) {
    const playerName = players[i] ?? `${team.name} Player ${i + 1}`;
    stickers.push({
      id: `${teamCode}-${i + 1}`,
      number: num++,
      playerName,
      team: teamCode,
      teamNameDE: team.nameDE,
      teamNameEN: team.name,
      group: team.group,
      type: STICKER_TYPE.NORMAL,
      rarity: RARITY.COMMON,
      imageUrl: null,
    });
  }

  return stickers;
}

// Team order (matches group order from GROUPS)
const TEAM_ORDER = [
  // Group A
  'USA', 'MEX', 'CAN', 'ARG',
  // Group B
  'BRA', 'URU', 'COL', 'ECU',
  // Group C
  'ENG', 'FRA', 'NED', 'AUS',
  // Group D
  'GER', 'AUT', 'CHE', 'SRB',
  // Group E
  'ESP', 'POR', 'MAR', 'TUN',
  // Group F
  'BEL', 'DEN', 'POL', 'SEN',
  // Group G
  'JPN', 'KOR', 'IRN', 'SAU',
  // Group H
  'NGA', 'GHA', 'CMR', 'EGY',
  // Group I
  'ITA', 'CRO', 'SVK', 'ALB',
  // Group J
  'QAT', 'IRQ', 'JOR', 'UAE',
  // Group K
  'CIV', 'MLI', 'SUD', 'TAN',
  // Group L
  'NZL', 'PAN', 'HON', 'VEN',
];

// Player rosters (priority teams have real names, others use [])
const PLAYER_ROSTERS = {
  USA: USA_PLAYERS,
  ENG: ENG_PLAYERS,
  GER: GER_PLAYERS,
  AUT: AUT_PLAYERS,
  CHE: CHE_PLAYERS,
  // All other teams: placeholders
  MEX: ['Guillermo Ochoa', 'Raúl Jiménez', 'Hirving Lozano', 'Edson Álvarez'],
  CAN: ['Alphonso Davies', 'Jonathan David', 'Tajon Buchanan', 'Cyle Larin'],
  ARG: ['Lionel Messi', 'Lautaro Martínez', 'Rodrigo De Paul', 'Julián Álvarez'],
  BRA: ['Alisson', 'Vinicius Jr.', 'Neymar', 'Rodrygo'],
  URU: ['Luis Suárez', 'Darwin Núñez', 'Federico Valverde', 'Rodrigo Bentancur'],
  COL: ['James Rodríguez', 'Luis Díaz', 'Falcao', 'Cuadrado'],
  ECU: ['Enner Valencia', 'Moisés Caicedo', 'Ángel Mena'],
  FRA: ['Kylian Mbappé', 'Antoine Griezmann', 'Karim Benzema', 'N\'Golo Kanté'],
  NED: ['Virgil van Dijk', 'Memphis Depay', 'Frenkie de Jong', 'Cody Gakpo'],
  AUS: ['Mathew Ryan', 'Mathew Leckie', 'Aaron Mooy'],
  SRB: ['Aleksandar Mitrović', 'Sergej Milinković-Savić', 'Dušan Vlahović'],
  ESP: ['Gavi', 'Pedri', 'Álvaro Morata', 'Ferran Torres'],
  POR: ['Cristiano Ronaldo', 'Bruno Fernandes', 'Bernardo Silva', 'João Félix'],
  MAR: ['Achraf Hakimi', 'Hakim Ziyech', 'Youssef En-Nesyri'],
  TUN: ['Youssef Msakni', 'Wahbi Khazri'],
  BEL: ['Kevin De Bruyne', 'Romelu Lukaku', 'Thibaut Courtois', 'Eden Hazard'],
  DEN: ['Christian Eriksen', 'Pierre-Emile Højbjerg', 'Kasper Schmeichel'],
  POL: ['Robert Lewandowski', 'Piotr Zieliński', 'Wojciech Szczęsny'],
  SEN: ['Sadio Mané', 'Kalidou Koulibaly', 'Édouard Mendy'],
  JPN: ['Takumi Minamino', 'Kaoru Mitoma', 'Maya Yoshida'],
  KOR: ['Son Heung-min', 'Hwang Hee-chan', 'Kim Min-jae'],
  IRN: ['Mehdi Taremi', 'Alireza Jahanbakhsh', 'Sardar Azmoun'],
  SAU: ['Salem Al-Dawsari', 'Mohammed Al-Deayea'],
  NGA: ['Victor Osimhen', 'Wilfred Ndidi', 'Kelechi Iheanacho'],
  GHA: ['Andre Ayew', 'Jordan Ayew', 'Thomas Partey'],
  CMR: ['Vincent Aboubakar', 'André Onana', 'Eric Maxim Choupo-Moting'],
  EGY: ['Mohamed Salah', 'Mohamed Elneny', 'Essam El-Hadary'],
  ITA: ['Gianluigi Donnarumma', 'Federico Chiesa', 'Marco Verratti', 'Ciro Immobile'],
  CRO: ['Luka Modrić', 'Ivan Perišić', 'Mateo Kovačić', 'Dejan Lovren'],
  SVK: ['Marek Hamšík', 'Milan Škriniar', 'Ondrej Duda'],
  ALB: ['Armando Broja', 'Kristjan Asllani'],
  QAT: ['Akram Afif', 'Hassan Al-Haydos', 'Almoez Ali'],
  IRQ: ['Mohanad Ali', 'Amjad Attwan'],
  JOR: ['Yazan Al-Naimat', 'Baha' Faisal'],
  UAE: ['Caio Canedo', 'Khalil Al-Hammadi'],
  CIV: ['Sébastien Haller', 'Wilfried Zaha', 'Franck Kessié'],
  MLI: ['Moussa Diaby', 'Adama Traoré', 'Hamari Traoré'],
  SUD: ['Issam Merghani'],
  TAN: ['Mbwana Samatta', 'Simon Msuva'],
  NZL: ['Chris Wood', 'Liberato Cacace'],
  PAN: ['Rolando Blackburn', 'Édgar Bárcenas'],
  HON: ['Alberth Elis', 'Romell Quioto'],
  VEN: ['Rómulo Otero', 'Salomón Rondón', 'Tomás Rincón'],
};

// Build the full catalog
let globalNumber = 1;
export const STICKER_CATALOG = [];

for (const teamCode of TEAM_ORDER) {
  const players = PLAYER_ROSTERS[teamCode] ?? [];
  const teamStickers = buildTeamStickers(teamCode, players, globalNumber);
  STICKER_CATALOG.push(...teamStickers);
  globalNumber += teamStickers.length;
}

// Quick lookup maps
export const STICKER_BY_ID = {};
export const STICKER_BY_NUMBER = {};

for (const s of STICKER_CATALOG) {
  STICKER_BY_ID[s.id] = s;
  STICKER_BY_NUMBER[s.number] = s;
}

// Returns all stickers for a given team code
export function getTeamStickers(teamCode) {
  return STICKER_CATALOG.filter(s => s.team === teamCode);
}

// Returns stickers for an entire group
export function getGroupStickers(groupLetter) {
  return STICKER_CATALOG.filter(s => s.group === groupLetter);
}

export const TOTAL_STICKERS = STICKER_CATALOG.length;
