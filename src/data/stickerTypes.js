export const STICKER_TYPE = {
  NORMAL: 'NORMAL',
  FOIL: 'FOIL',
  LOGO: 'LOGO',
  STADIUM: 'STADIUM',
};

export const RARITY = {
  COMMON: 'COMMON',
  RARE: 'RARE',
  FOIL: 'FOIL',
};

// WM 2026 Groups (12 groups, 4 teams each = 48 teams)
export const GROUPS = {
  A: { name: 'Group A', teams: ['USA', 'MEX', 'CAN', 'ARG'] },
  B: { name: 'Group B', teams: ['BRA', 'URU', 'COL', 'ECU'] },
  C: { name: 'Group C', teams: ['ENG', 'FRA', 'NED', 'AUS'] },
  D: { name: 'Group D', teams: ['GER', 'AUT', 'CHE', 'SRB'] },
  E: { name: 'Group E', teams: ['ESP', 'POR', 'MAR', 'TUN'] },
  F: { name: 'Group F', teams: ['BEL', 'DEN', 'POL', 'SEN'] },
  G: { name: 'Group G', teams: ['JPN', 'KOR', 'IRN', 'SAU'] },
  H: { name: 'Group H', teams: ['NGA', 'GHA', 'CMR', 'EGY'] },
  I: { name: 'Group I', teams: ['ITA', 'CRO', 'SVK', 'ALB'] },
  J: { name: 'Group J', teams: ['QAT', 'IRQ', 'JOR', 'UAE'] },
  K: { name: 'Group K', teams: ['CIV', 'MLI', 'SUD', 'TAN'] },
  L: { name: 'Group L', teams: ['NZL', 'PAN', 'HON', 'VEN'] },
};

// Team metadata: flag emoji, full name, sticker count
export const TEAMS = {
  // Group A
  USA: { flag: '🇺🇸', name: 'United States', nameDE: 'USA', group: 'A', stickerCount: 14 },
  MEX: { flag: '🇲🇽', name: 'Mexico', nameDE: 'Mexiko', group: 'A', stickerCount: 14 },
  CAN: { flag: '🇨🇦', name: 'Canada', nameDE: 'Kanada', group: 'A', stickerCount: 14 },
  ARG: { flag: '🇦🇷', name: 'Argentina', nameDE: 'Argentinien', group: 'A', stickerCount: 14 },
  // Group B
  BRA: { flag: '🇧🇷', name: 'Brazil', nameDE: 'Brasilien', group: 'B', stickerCount: 14 },
  URU: { flag: '🇺🇾', name: 'Uruguay', nameDE: 'Uruguay', group: 'B', stickerCount: 14 },
  COL: { flag: '🇨🇴', name: 'Colombia', nameDE: 'Kolumbien', group: 'B', stickerCount: 14 },
  ECU: { flag: '🇪🇨', name: 'Ecuador', nameDE: 'Ecuador', group: 'B', stickerCount: 14 },
  // Group C
  ENG: { flag: '🏴󠁧󠁢󠁥󠁮󠁧󠁿', name: 'England', nameDE: 'England', group: 'C', stickerCount: 14 },
  FRA: { flag: '🇫🇷', name: 'France', nameDE: 'Frankreich', group: 'C', stickerCount: 14 },
  NED: { flag: '🇳🇱', name: 'Netherlands', nameDE: 'Niederlande', group: 'C', stickerCount: 14 },
  AUS: { flag: '🇦🇺', name: 'Australia', nameDE: 'Australien', group: 'C', stickerCount: 14 },
  // Group D
  GER: { flag: '🇩🇪', name: 'Germany', nameDE: 'Deutschland', group: 'D', stickerCount: 14 },
  AUT: { flag: '🇦🇹', name: 'Austria', nameDE: 'Österreich', group: 'D', stickerCount: 14 },
  CHE: { flag: '🇨🇭', name: 'Switzerland', nameDE: 'Schweiz', group: 'D', stickerCount: 14 },
  SRB: { flag: '🇷🇸', name: 'Serbia', nameDE: 'Serbien', group: 'D', stickerCount: 14 },
  // Group E
  ESP: { flag: '🇪🇸', name: 'Spain', nameDE: 'Spanien', group: 'E', stickerCount: 14 },
  POR: { flag: '🇵🇹', name: 'Portugal', nameDE: 'Portugal', group: 'E', stickerCount: 14 },
  MAR: { flag: '🇲🇦', name: 'Morocco', nameDE: 'Marokko', group: 'E', stickerCount: 14 },
  TUN: { flag: '🇹🇳', name: 'Tunisia', nameDE: 'Tunesien', group: 'E', stickerCount: 14 },
  // Group F
  BEL: { flag: '🇧🇪', name: 'Belgium', nameDE: 'Belgien', group: 'F', stickerCount: 14 },
  DEN: { flag: '🇩🇰', name: 'Denmark', nameDE: 'Dänemark', group: 'F', stickerCount: 14 },
  POL: { flag: '🇵🇱', name: 'Poland', nameDE: 'Polen', group: 'F', stickerCount: 14 },
  SEN: { flag: '🇸🇳', name: 'Senegal', nameDE: 'Senegal', group: 'F', stickerCount: 14 },
  // Group G
  JPN: { flag: '🇯🇵', name: 'Japan', nameDE: 'Japan', group: 'G', stickerCount: 14 },
  KOR: { flag: '🇰🇷', name: 'South Korea', nameDE: 'Südkorea', group: 'G', stickerCount: 14 },
  IRN: { flag: '🇮🇷', name: 'Iran', nameDE: 'Iran', group: 'G', stickerCount: 14 },
  SAU: { flag: '🇸🇦', name: 'Saudi Arabia', nameDE: 'Saudi-Arabien', group: 'G', stickerCount: 14 },
  // Group H
  NGA: { flag: '🇳🇬', name: 'Nigeria', nameDE: 'Nigeria', group: 'H', stickerCount: 14 },
  GHA: { flag: '🇬🇭', name: 'Ghana', nameDE: 'Ghana', group: 'H', stickerCount: 14 },
  CMR: { flag: '🇨🇲', name: 'Cameroon', nameDE: 'Kamerun', group: 'H', stickerCount: 14 },
  EGY: { flag: '🇪🇬', name: 'Egypt', nameDE: 'Ägypten', group: 'H', stickerCount: 14 },
  // Group I
  ITA: { flag: '🇮🇹', name: 'Italy', nameDE: 'Italien', group: 'I', stickerCount: 14 },
  CRO: { flag: '🇭🇷', name: 'Croatia', nameDE: 'Kroatien', group: 'I', stickerCount: 14 },
  SVK: { flag: '🇸🇰', name: 'Slovakia', nameDE: 'Slowakei', group: 'I', stickerCount: 14 },
  ALB: { flag: '🇦🇱', name: 'Albania', nameDE: 'Albanien', group: 'I', stickerCount: 14 },
  // Group J
  QAT: { flag: '🇶🇦', name: 'Qatar', nameDE: 'Katar', group: 'J', stickerCount: 14 },
  IRQ: { flag: '🇮🇶', name: 'Iraq', nameDE: 'Irak', group: 'J', stickerCount: 14 },
  JOR: { flag: '🇯🇴', name: 'Jordan', nameDE: 'Jordanien', group: 'J', stickerCount: 14 },
  UAE: { flag: '🇦🇪', name: 'UAE', nameDE: 'VAE', group: 'J', stickerCount: 14 },
  // Group K
  CIV: { flag: '🇨🇮', name: 'Ivory Coast', nameDE: 'Elfenbeinküste', group: 'K', stickerCount: 14 },
  MLI: { flag: '🇲🇱', name: 'Mali', nameDE: 'Mali', group: 'K', stickerCount: 14 },
  SUD: { flag: '🇸🇩', name: 'Sudan', nameDE: 'Sudan', group: 'K', stickerCount: 14 },
  TAN: { flag: '🇹🇿', name: 'Tanzania', nameDE: 'Tansania', group: 'K', stickerCount: 14 },
  // Group L
  NZL: { flag: '🇳🇿', name: 'New Zealand', nameDE: 'Neuseeland', group: 'L', stickerCount: 14 },
  PAN: { flag: '🇵🇦', name: 'Panama', nameDE: 'Panama', group: 'L', stickerCount: 14 },
  HON: { flag: '🇭🇳', name: 'Honduras', nameDE: 'Honduras', group: 'L', stickerCount: 14 },
  VEN: { flag: '🇻🇪', name: 'Venezuela', nameDE: 'Venezuela', group: 'L', stickerCount: 14 },
};
