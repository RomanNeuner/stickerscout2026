/**
 * WM 2026 schedule — static data for MVP.
 * 48 teams, 12 groups, 104 matches total.
 * Dates: June 11 – July 19, 2026.
 *
 * Group stage: 48 matches (each team plays 3 games)
 * Round of 32: 16 matches
 * Round of 16: 8 matches
 * Quarterfinals: 4 matches
 * Semifinals: 2 matches
 * Third place: 1 match
 * Final: 1 match
 * Total: 80 matches (WC 2026 expanded format)
 */

export const STAGE = {
  GROUP: 'GROUP',
  R32: 'R32',
  R16: 'R16',
  QF: 'QF',
  SF: 'SF',
  THIRD: 'THIRD',
  FINAL: 'FINAL',
};

// Group stage matches (selection of key matches for MVP — full list via update)
export const GROUP_MATCHES = [
  // Group A
  { id: 'A1', stage: STAGE.GROUP, group: 'A', home: 'MEX', away: 'ARG', date: '2026-06-11', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'A2', stage: STAGE.GROUP, group: 'A', home: 'USA', away: 'CAN', date: '2026-06-12', time: '18:00', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'A3', stage: STAGE.GROUP, group: 'A', home: 'ARG', away: 'CAN', date: '2026-06-16', time: '21:00', venue: 'AT&T Stadium, Dallas' },
  { id: 'A4', stage: STAGE.GROUP, group: 'A', home: 'USA', away: 'MEX', date: '2026-06-16', time: '18:00', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'A5', stage: STAGE.GROUP, group: 'A', home: 'CAN', away: 'MEX', date: '2026-06-21', time: '21:00', venue: 'BC Place, Vancouver' },
  { id: 'A6', stage: STAGE.GROUP, group: 'A', home: 'ARG', away: 'USA', date: '2026-06-21', time: '21:00', venue: 'MetLife Stadium, New York' },
  // Group B
  { id: 'B1', stage: STAGE.GROUP, group: 'B', home: 'BRA', away: 'URU', date: '2026-06-12', time: '21:00', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 'B2', stage: STAGE.GROUP, group: 'B', home: 'COL', away: 'ECU', date: '2026-06-13', time: '18:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'B3', stage: STAGE.GROUP, group: 'B', home: 'BRA', away: 'ECU', date: '2026-06-17', time: '21:00', venue: 'Hard Rock Stadium, Miami' },
  { id: 'B4', stage: STAGE.GROUP, group: 'B', home: 'URU', away: 'COL', date: '2026-06-17', time: '18:00', venue: 'NRG Stadium, Houston' },
  { id: 'B5', stage: STAGE.GROUP, group: 'B', home: 'ECU', away: 'URU', date: '2026-06-22', time: '21:00', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 'B6', stage: STAGE.GROUP, group: 'B', home: 'COL', away: 'BRA', date: '2026-06-22', time: '21:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
  // Group C
  { id: 'C1', stage: STAGE.GROUP, group: 'C', home: 'ENG', away: 'FRA', date: '2026-06-13', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'C2', stage: STAGE.GROUP, group: 'C', home: 'NED', away: 'AUS', date: '2026-06-14', time: '18:00', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'C3', stage: STAGE.GROUP, group: 'C', home: 'ENG', away: 'AUS', date: '2026-06-18', time: '21:00', venue: 'AT&T Stadium, Dallas' },
  { id: 'C4', stage: STAGE.GROUP, group: 'C', home: 'FRA', away: 'NED', date: '2026-06-18', time: '18:00', venue: 'Hard Rock Stadium, Miami' },
  { id: 'C5', stage: STAGE.GROUP, group: 'C', home: 'AUS', away: 'FRA', date: '2026-06-23', time: '21:00', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 'C6', stage: STAGE.GROUP, group: 'C', home: 'NED', away: 'ENG', date: '2026-06-23', time: '21:00', venue: 'MetLife Stadium, New York' },
  // Group D (DACH group — priority!)
  { id: 'D1', stage: STAGE.GROUP, group: 'D', home: 'GER', away: 'AUT', date: '2026-06-14', time: '21:00', venue: 'AT&T Stadium, Dallas' },
  { id: 'D2', stage: STAGE.GROUP, group: 'D', home: 'CHE', away: 'SRB', date: '2026-06-15', time: '18:00', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'D3', stage: STAGE.GROUP, group: 'D', home: 'GER', away: 'SRB', date: '2026-06-19', time: '21:00', venue: 'NRG Stadium, Houston' },
  { id: 'D4', stage: STAGE.GROUP, group: 'D', home: 'AUT', away: 'CHE', date: '2026-06-19', time: '18:00', venue: 'BC Place, Vancouver' },
  { id: 'D5', stage: STAGE.GROUP, group: 'D', home: 'SRB', away: 'AUT', date: '2026-06-24', time: '21:00', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 'D6', stage: STAGE.GROUP, group: 'D', home: 'CHE', away: 'GER', date: '2026-06-24', time: '21:00', venue: 'MetLife Stadium, New York' },
  // Group E
  { id: 'E1', stage: STAGE.GROUP, group: 'E', home: 'ESP', away: 'MAR', date: '2026-06-15', time: '21:00', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'E2', stage: STAGE.GROUP, group: 'E', home: 'POR', away: 'TUN', date: '2026-06-16', time: '15:00', venue: 'Hard Rock Stadium, Miami' },
  { id: 'E3', stage: STAGE.GROUP, group: 'E', home: 'ESP', away: 'TUN', date: '2026-06-20', time: '21:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'E4', stage: STAGE.GROUP, group: 'E', home: 'MAR', away: 'POR', date: '2026-06-20', time: '18:00', venue: 'AT&T Stadium, Dallas' },
  { id: 'E5', stage: STAGE.GROUP, group: 'E', home: 'TUN', away: 'MAR', date: '2026-06-25', time: '21:00', venue: 'NRG Stadium, Houston' },
  { id: 'E6', stage: STAGE.GROUP, group: 'E', home: 'POR', away: 'ESP', date: '2026-06-25', time: '21:00', venue: 'SoFi Stadium, Los Angeles' },
  // Groups F–L: abbreviated for MVP
  { id: 'F1', stage: STAGE.GROUP, group: 'F', home: 'BEL', away: 'DEN', date: '2026-06-16', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'G1', stage: STAGE.GROUP, group: 'G', home: 'JPN', away: 'KOR', date: '2026-06-17', time: '21:00', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'H1', stage: STAGE.GROUP, group: 'H', home: 'NGA', away: 'GHA', date: '2026-06-18', time: '21:00', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'I1', stage: STAGE.GROUP, group: 'I', home: 'ITA', away: 'CRO', date: '2026-06-19', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'J1', stage: STAGE.GROUP, group: 'J', home: 'QAT', away: 'IRQ', date: '2026-06-20', time: '15:00', venue: 'Hard Rock Stadium, Miami' },
  { id: 'K1', stage: STAGE.GROUP, group: 'K', home: 'CIV', away: 'MLI', date: '2026-06-21', time: '15:00', venue: 'Levi\'s Stadium, San Francisco' },
  { id: 'L1', stage: STAGE.GROUP, group: 'L', home: 'NZL', away: 'PAN', date: '2026-06-22', time: '15:00', venue: 'BC Place, Vancouver' },
];

// Knockout stage (TBD teams — shown as placeholders)
export const KNOCKOUT_MATCHES = [
  { id: 'R32-1', stage: STAGE.R32, home: '1A', away: '2B', date: '2026-07-01', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'R32-2', stage: STAGE.R32, home: '1B', away: '2A', date: '2026-07-01', time: '18:00', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'R32-3', stage: STAGE.R32, home: '1C', away: '2D', date: '2026-07-02', time: '21:00', venue: 'AT&T Stadium, Dallas' },
  { id: 'R32-4', stage: STAGE.R32, home: '1D', away: '2C', date: '2026-07-02', time: '18:00', venue: 'Hard Rock Stadium, Miami' },
  { id: 'R16-1', stage: STAGE.R16, home: 'W R32-1', away: 'W R32-2', date: '2026-07-05', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'R16-2', stage: STAGE.R16, home: 'W R32-3', away: 'W R32-4', date: '2026-07-06', time: '18:00', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'QF-1', stage: STAGE.QF, home: 'W R16-1', away: 'W R16-2', date: '2026-07-10', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'SF-1', stage: STAGE.SF, home: 'W QF-1', away: 'W QF-2', date: '2026-07-14', time: '21:00', venue: 'MetLife Stadium, New York' },
  { id: 'THIRD', stage: STAGE.THIRD, home: 'L SF-1', away: 'L SF-2', date: '2026-07-18', time: '18:00', venue: 'Hard Rock Stadium, Miami' },
  { id: 'FINAL', stage: STAGE.FINAL, home: 'W SF-1', away: 'W SF-2', date: '2026-07-19', time: '21:00', venue: 'MetLife Stadium, New York' },
];

export const ALL_MATCHES = [...GROUP_MATCHES, ...KNOCKOUT_MATCHES];
