/**
 * WM 2026 Spielplan — korrekte Gruppen laut FIFA-Auslosung (5. Dez. 2025)
 * 48 Teams, 12 Gruppen, 72 Gruppenspiele + KO-Runde
 * Gruppenphase: 11. Juni – 27. Juni 2026
 * Uhrzeiten in MESZ (UTC+2)
 */

export const STAGE = {
  GROUP: 'GROUP',
  R32:   'R32',
  R16:   'R16',
  QF:    'QF',
  SF:    'SF',
  THIRD: 'THIRD',
  FINAL: 'FINAL',
};

export const GROUP_MATCHES = [

  // ── Gruppe A: MEX · KOR · RSA · CZE ─────────────────────────────────────
  { id: 'A1', stage: STAGE.GROUP, group: 'A', home: 'MEX', away: 'RSA', date: '2026-06-11', time: '22:00 MESZ', venue: 'Estadio Azteca, Mexico City' },
  { id: 'A2', stage: STAGE.GROUP, group: 'A', home: 'KOR', away: 'CZE', date: '2026-06-12', time: '04:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'A3', stage: STAGE.GROUP, group: 'A', home: 'MEX', away: 'CZE', date: '2026-06-17', time: '22:00 MESZ', venue: 'Estadio Akron, Guadalajara' },
  { id: 'A4', stage: STAGE.GROUP, group: 'A', home: 'RSA', away: 'KOR', date: '2026-06-18', time: '01:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'A5', stage: STAGE.GROUP, group: 'A', home: 'MEX', away: 'KOR', date: '2026-06-24', time: '01:00 MESZ', venue: 'Estadio Azteca, Mexico City' },
  { id: 'A6', stage: STAGE.GROUP, group: 'A', home: 'RSA', away: 'CZE', date: '2026-06-24', time: '01:00 MESZ', venue: 'NRG Stadium, Houston' },

  // ── Gruppe B: CAN · BIH · QAT · SUI ─────────────────────────────────────
  { id: 'B1', stage: STAGE.GROUP, group: 'B', home: 'CAN', away: 'BIH', date: '2026-06-12', time: '22:00 MESZ', venue: 'BMO Field, Toronto' },
  { id: 'B2', stage: STAGE.GROUP, group: 'B', home: 'QAT', away: 'SUI', date: '2026-06-13', time: '01:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'B3', stage: STAGE.GROUP, group: 'B', home: 'CAN', away: 'SUI', date: '2026-06-18', time: '22:00 MESZ', venue: 'BC Place, Vancouver' },
  { id: 'B4', stage: STAGE.GROUP, group: 'B', home: 'BIH', away: 'QAT', date: '2026-06-19', time: '01:00 MESZ', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'B5', stage: STAGE.GROUP, group: 'B', home: 'CAN', away: 'QAT', date: '2026-06-24', time: '22:00 MESZ', venue: 'BMO Field, Toronto' },
  { id: 'B6', stage: STAGE.GROUP, group: 'B', home: 'SUI', away: 'BIH', date: '2026-06-24', time: '22:00 MESZ', venue: 'Gillette Stadium, Boston' },

  // ── Gruppe C: BRA · MAR · HAI · SCO ─────────────────────────────────────
  { id: 'C1', stage: STAGE.GROUP, group: 'C', home: 'BRA', away: 'MAR', date: '2026-06-13', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'C2', stage: STAGE.GROUP, group: 'C', home: 'HAI', away: 'SCO', date: '2026-06-14', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'C3', stage: STAGE.GROUP, group: 'C', home: 'BRA', away: 'SCO', date: '2026-06-19', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'C4', stage: STAGE.GROUP, group: 'C', home: 'MAR', away: 'HAI', date: '2026-06-20', time: '01:00 MESZ', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'C5', stage: STAGE.GROUP, group: 'C', home: 'BRA', away: 'HAI', date: '2026-06-25', time: '22:00 MESZ', venue: 'NRG Stadium, Houston' },
  { id: 'C6', stage: STAGE.GROUP, group: 'C', home: 'SCO', away: 'MAR', date: '2026-06-25', time: '22:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },

  // ── Gruppe D: USA · PAR · AUS · TUR ─────────────────────────────────────
  { id: 'D1', stage: STAGE.GROUP, group: 'D', home: 'USA', away: 'PAR', date: '2026-06-12', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'D2', stage: STAGE.GROUP, group: 'D', home: 'AUS', away: 'TUR', date: '2026-06-13', time: '04:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'D3', stage: STAGE.GROUP, group: 'D', home: 'USA', away: 'AUS', date: '2026-06-18', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'D4', stage: STAGE.GROUP, group: 'D', home: 'PAR', away: 'TUR', date: '2026-06-19', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'D5', stage: STAGE.GROUP, group: 'D', home: 'USA', away: 'TUR', date: '2026-06-25', time: '01:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'D6', stage: STAGE.GROUP, group: 'D', home: 'PAR', away: 'AUS', date: '2026-06-25', time: '01:00 MESZ', venue: 'Allegiant Stadium, Las Vegas' },

  // ── Gruppe E: GER · CUW · CIV · ECU ─────────────────────────────────────
  { id: 'E1', stage: STAGE.GROUP, group: 'E', home: 'GER', away: 'CUW', date: '2026-06-14', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'E2', stage: STAGE.GROUP, group: 'E', home: 'CIV', away: 'ECU', date: '2026-06-15', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'E3', stage: STAGE.GROUP, group: 'E', home: 'GER', away: 'CIV', date: '2026-06-20', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'E4', stage: STAGE.GROUP, group: 'E', home: 'ECU', away: 'CUW', date: '2026-06-21', time: '01:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'E5', stage: STAGE.GROUP, group: 'E', home: 'GER', away: 'ECU', date: '2026-06-25', time: '22:00 MESZ', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'E6', stage: STAGE.GROUP, group: 'E', home: 'CUW', away: 'CIV', date: '2026-06-25', time: '22:00 MESZ', venue: 'NRG Stadium, Houston' },

  // ── Gruppe F: NED · JPN · SWE · TUN ─────────────────────────────────────
  { id: 'F1', stage: STAGE.GROUP, group: 'F', home: 'NED', away: 'JPN', date: '2026-06-14', time: '19:00 MESZ', venue: 'BC Place, Vancouver' },
  { id: 'F2', stage: STAGE.GROUP, group: 'F', home: 'SWE', away: 'TUN', date: '2026-06-15', time: '22:00 MESZ', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'F3', stage: STAGE.GROUP, group: 'F', home: 'NED', away: 'SWE', date: '2026-06-20', time: '19:00 MESZ', venue: 'BMO Field, Toronto' },
  { id: 'F4', stage: STAGE.GROUP, group: 'F', home: 'JPN', away: 'TUN', date: '2026-06-21', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'F5', stage: STAGE.GROUP, group: 'F', home: 'NED', away: 'TUN', date: '2026-06-26', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'F6', stage: STAGE.GROUP, group: 'F', home: 'JPN', away: 'SWE', date: '2026-06-26', time: '01:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },

  // ── Gruppe G: BEL · EGY · IRN · NZL ─────────────────────────────────────
  { id: 'G1', stage: STAGE.GROUP, group: 'G', home: 'BEL', away: 'EGY', date: '2026-06-15', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'G2', stage: STAGE.GROUP, group: 'G', home: 'IRN', away: 'NZL', date: '2026-06-16', time: '01:00 MESZ', venue: 'BMO Field, Toronto' },
  { id: 'G3', stage: STAGE.GROUP, group: 'G', home: 'BEL', away: 'IRN', date: '2026-06-21', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'G4', stage: STAGE.GROUP, group: 'G', home: 'EGY', away: 'NZL', date: '2026-06-22', time: '01:00 MESZ', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'G5', stage: STAGE.GROUP, group: 'G', home: 'BEL', away: 'NZL', date: '2026-06-26', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'G6', stage: STAGE.GROUP, group: 'G', home: 'EGY', away: 'IRN', date: '2026-06-26', time: '22:00 MESZ', venue: 'NRG Stadium, Houston' },

  // ── Gruppe H: ESP · CPV · KSA · URU ─────────────────────────────────────
  { id: 'H1', stage: STAGE.GROUP, group: 'H', home: 'ESP', away: 'URU', date: '2026-06-15', time: '22:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'H2', stage: STAGE.GROUP, group: 'H', home: 'CPV', away: 'KSA', date: '2026-06-16', time: '22:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'H3', stage: STAGE.GROUP, group: 'H', home: 'ESP', away: 'CPV', date: '2026-06-21', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'H4', stage: STAGE.GROUP, group: 'H', home: 'KSA', away: 'URU', date: '2026-06-22', time: '01:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'H5', stage: STAGE.GROUP, group: 'H', home: 'ESP', away: 'KSA', date: '2026-06-26', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'H6', stage: STAGE.GROUP, group: 'H', home: 'CPV', away: 'URU', date: '2026-06-26', time: '22:00 MESZ', venue: 'Arrowhead Stadium, Kansas City' },

  // ── Gruppe I: FRA · SEN · IRQ · NOR ─────────────────────────────────────
  { id: 'I1', stage: STAGE.GROUP, group: 'I', home: 'FRA', away: 'SEN', date: '2026-06-16', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'I2', stage: STAGE.GROUP, group: 'I', home: 'NOR', away: 'IRQ', date: '2026-06-17', time: '01:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'I3', stage: STAGE.GROUP, group: 'I', home: 'FRA', away: 'NOR', date: '2026-06-22', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'I4', stage: STAGE.GROUP, group: 'I', home: 'SEN', away: 'IRQ', date: '2026-06-23', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'I5', stage: STAGE.GROUP, group: 'I', home: 'FRA', away: 'IRQ', date: '2026-06-26', time: '01:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'I6', stage: STAGE.GROUP, group: 'I', home: 'NOR', away: 'SEN', date: '2026-06-26', time: '01:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },

  // ── Gruppe J: ARG · ALG · AUT · JOR ── DACH-Fokus! ──────────────────────
  { id: 'J1', stage: STAGE.GROUP, group: 'J', home: 'ARG', away: 'ALG', date: '2026-06-17', time: '03:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'J2', stage: STAGE.GROUP, group: 'J', home: 'AUT', away: 'JOR', date: '2026-06-17', time: '06:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'J3', stage: STAGE.GROUP, group: 'J', home: 'ARG', away: 'AUT', date: '2026-06-22', time: '19:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'J4', stage: STAGE.GROUP, group: 'J', home: 'JOR', away: 'ALG', date: '2026-06-23', time: '03:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'J5', stage: STAGE.GROUP, group: 'J', home: 'ALG', away: 'AUT', date: '2026-06-28', time: '04:00 MESZ', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'J6', stage: STAGE.GROUP, group: 'J', home: 'JOR', away: 'ARG', date: '2026-06-28', time: '04:00 MESZ', venue: 'AT&T Stadium, Dallas' },

  // ── Gruppe K: POR · COD · UZB · COL ─────────────────────────────────────
  { id: 'K1', stage: STAGE.GROUP, group: 'K', home: 'POR', away: 'COL', date: '2026-06-17', time: '22:00 MESZ', venue: 'NRG Stadium, Houston' },
  { id: 'K2', stage: STAGE.GROUP, group: 'K', home: 'COD', away: 'UZB', date: '2026-06-18', time: '01:00 MESZ', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'K3', stage: STAGE.GROUP, group: 'K', home: 'POR', away: 'UZB', date: '2026-06-23', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'K4', stage: STAGE.GROUP, group: 'K', home: 'COL', away: 'COD', date: '2026-06-24', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'K5', stage: STAGE.GROUP, group: 'K', home: 'POR', away: 'COD', date: '2026-06-27', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'K6', stage: STAGE.GROUP, group: 'K', home: 'UZB', away: 'COL', date: '2026-06-27', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },

  // ── Gruppe L: ENG · CRO · GHA · PAN ─────────────────────────────────────
  { id: 'L1', stage: STAGE.GROUP, group: 'L', home: 'ENG', away: 'PAN', date: '2026-06-17', time: '22:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'L2', stage: STAGE.GROUP, group: 'L', home: 'CRO', away: 'GHA', date: '2026-06-18', time: '22:00 MESZ', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'L3', stage: STAGE.GROUP, group: 'L', home: 'ENG', away: 'GHA', date: '2026-06-23', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'L4', stage: STAGE.GROUP, group: 'L', home: 'PAN', away: 'CRO', date: '2026-06-24', time: '01:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'L5', stage: STAGE.GROUP, group: 'L', home: 'ENG', away: 'CRO', date: '2026-06-27', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'L6', stage: STAGE.GROUP, group: 'L', home: 'GHA', away: 'PAN', date: '2026-06-27', time: '22:00 MESZ', venue: 'NRG Stadium, Houston' },
];

// KO-Runde (Teams werden nach Gruppenphase eingetragen)
export const KNOCKOUT_MATCHES = [
  { id: 'R32-1',  stage: STAGE.R32,   home: '1A', away: '2B', date: '2026-07-01', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'R32-2',  stage: STAGE.R32,   home: '1B', away: '2A', date: '2026-07-01', time: '01:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'R32-3',  stage: STAGE.R32,   home: '1C', away: '2D', date: '2026-07-02', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'R32-4',  stage: STAGE.R32,   home: '1D', away: '2C', date: '2026-07-02', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'R32-5',  stage: STAGE.R32,   home: '1E', away: '2F', date: '2026-07-03', time: '22:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'R32-6',  stage: STAGE.R32,   home: '1F', away: '2E', date: '2026-07-03', time: '01:00 MESZ', venue: 'Arrowhead Stadium, Kansas City' },
  { id: 'R32-7',  stage: STAGE.R32,   home: '1G', away: '2H', date: '2026-07-04', time: '22:00 MESZ', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'R32-8',  stage: STAGE.R32,   home: '1H', away: '2G', date: '2026-07-04', time: '01:00 MESZ', venue: 'NRG Stadium, Houston' },
  { id: 'R32-9',  stage: STAGE.R32,   home: '1I', away: '2J', date: '2026-07-05', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'R32-10', stage: STAGE.R32,   home: '1J', away: '2I', date: '2026-07-05', time: '01:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'R32-11', stage: STAGE.R32,   home: '1K', away: '2L', date: '2026-07-06', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'R32-12', stage: STAGE.R32,   home: '1L', away: '2K', date: '2026-07-06', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'R32-13', stage: STAGE.R32,   home: '3. Pl. A/B/C/D', away: '3. Pl. E/F/G/H', date: '2026-07-07', time: '22:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'R32-14', stage: STAGE.R32,   home: '3. Pl. I/J/K/L', away: '3. Pl. best', date: '2026-07-07', time: '01:00 MESZ', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'R32-15', stage: STAGE.R32,   home: '3. Pl. best', away: '3. Pl. best', date: '2026-07-08', time: '22:00 MESZ', venue: 'BC Place, Vancouver' },
  { id: 'R32-16', stage: STAGE.R32,   home: '3. Pl. best', away: '3. Pl. best', date: '2026-07-08', time: '01:00 MESZ', venue: 'BMO Field, Toronto' },
  { id: 'R16-1',  stage: STAGE.R16,   home: 'Sieger R32-1', away: 'Sieger R32-2', date: '2026-07-10', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'R16-2',  stage: STAGE.R16,   home: 'Sieger R32-3', away: 'Sieger R32-4', date: '2026-07-11', time: '01:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'R16-3',  stage: STAGE.R16,   home: 'Sieger R32-5', away: 'Sieger R32-6', date: '2026-07-11', time: '22:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'R16-4',  stage: STAGE.R16,   home: 'Sieger R32-7', away: 'Sieger R32-8', date: '2026-07-12', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'R16-5',  stage: STAGE.R16,   home: 'Sieger R32-9', away: 'Sieger R32-10', date: '2026-07-12', time: '22:00 MESZ', venue: 'Levi\'s Stadium, Santa Clara' },
  { id: 'R16-6',  stage: STAGE.R16,   home: 'Sieger R32-11', away: 'Sieger R32-12', date: '2026-07-13', time: '01:00 MESZ', venue: 'NRG Stadium, Houston' },
  { id: 'R16-7',  stage: STAGE.R16,   home: 'Sieger R32-13', away: 'Sieger R32-14', date: '2026-07-13', time: '22:00 MESZ', venue: 'Mercedes-Benz Stadium, Atlanta' },
  { id: 'R16-8',  stage: STAGE.R16,   home: 'Sieger R32-15', away: 'Sieger R32-16', date: '2026-07-14', time: '01:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'QF-1',   stage: STAGE.QF,    home: 'Sieger R16-1', away: 'Sieger R16-2', date: '2026-07-07', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'QF-2',   stage: STAGE.QF,    home: 'Sieger R16-3', away: 'Sieger R16-4', date: '2026-07-08', time: '01:00 MESZ', venue: 'SoFi Stadium, Los Angeles' },
  { id: 'QF-3',   stage: STAGE.QF,    home: 'Sieger R16-5', away: 'Sieger R16-6', date: '2026-07-09', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'QF-4',   stage: STAGE.QF,    home: 'Sieger R16-7', away: 'Sieger R16-8', date: '2026-07-10', time: '01:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'SF-1',   stage: STAGE.SF,    home: 'Sieger QF-1', away: 'Sieger QF-2', date: '2026-07-14', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
  { id: 'SF-2',   stage: STAGE.SF,    home: 'Sieger QF-3', away: 'Sieger QF-4', date: '2026-07-15', time: '22:00 MESZ', venue: 'AT&T Stadium, Dallas' },
  { id: 'THIRD',  stage: STAGE.THIRD, home: 'Verlierer SF-1', away: 'Verlierer SF-2', date: '2026-07-18', time: '22:00 MESZ', venue: 'Hard Rock Stadium, Miami' },
  { id: 'FINAL',  stage: STAGE.FINAL, home: 'Sieger SF-1', away: 'Sieger SF-2', date: '2026-07-19', time: '22:00 MESZ', venue: 'MetLife Stadium, New York' },
];
