/**
 * WM 2026 Ergebnisse automatisch in Firebase Remote Config schreiben.
 * Datenquelle: football-data.org API (kostenloser Tier)
 *
 * Umgebungsvariablen (GitHub Secrets):
 *   FOOTBALL_API_KEY       — API-Key von football-data.org
 *   FIREBASE_SERVICE_ACCOUNT — Firebase Service Account JSON (als String)
 *   FIREBASE_PROJECT_ID    — z.B. "stickerscout2026"
 */

const https = require('https');
const admin = require('firebase-admin');

// ── Team-Code Mapping: football-data.org → App-Codes ────────────────────────
// Abweichungen zwischen football-data.org TLA und FIFA-Codes abfangen
const TEAM_MAP = {
  PRY: 'PAR', // Paraguay
  DRC: 'COD', // DR Kongo
  CRC: 'CRC',
  NIG: 'NGA',
  CUR: 'CUW', // Curaçao
  RSA: 'RSA',
  CZE: 'CZE',
  BIH: 'BIH',
  SCO: 'SCO',
  CPV: 'CPV',
  KSA: 'KSA',
  UZB: 'UZB',
  JOR: 'JOR',
  ALG: 'ALG',
  HAI: 'HAI',
  IRQ: 'IRQ',
  NZL: 'NZL',
  IRN: 'IRN',
};

// ── Alle Gruppenspiele (Heimteam, Auswärtsteam → App-ID) ─────────────────────
const MATCHES = [
  { id: 'A1', home: 'MEX', away: 'RSA' }, { id: 'A2', home: 'KOR', away: 'CZE' },
  { id: 'A3', home: 'MEX', away: 'CZE' }, { id: 'A4', home: 'RSA', away: 'KOR' },
  { id: 'A5', home: 'MEX', away: 'KOR' }, { id: 'A6', home: 'RSA', away: 'CZE' },
  { id: 'B1', home: 'CAN', away: 'BIH' }, { id: 'B2', home: 'QAT', away: 'SUI' },
  { id: 'B3', home: 'CAN', away: 'SUI' }, { id: 'B4', home: 'BIH', away: 'QAT' },
  { id: 'B5', home: 'CAN', away: 'QAT' }, { id: 'B6', home: 'SUI', away: 'BIH' },
  { id: 'C1', home: 'BRA', away: 'MAR' }, { id: 'C2', home: 'HAI', away: 'SCO' },
  { id: 'C3', home: 'BRA', away: 'SCO' }, { id: 'C4', home: 'MAR', away: 'HAI' },
  { id: 'C5', home: 'BRA', away: 'HAI' }, { id: 'C6', home: 'SCO', away: 'MAR' },
  { id: 'D1', home: 'USA', away: 'PAR' }, { id: 'D2', home: 'AUS', away: 'TUR' },
  { id: 'D3', home: 'USA', away: 'AUS' }, { id: 'D4', home: 'PAR', away: 'TUR' },
  { id: 'D5', home: 'USA', away: 'TUR' }, { id: 'D6', home: 'PAR', away: 'AUS' },
  { id: 'E1', home: 'GER', away: 'ECU' }, { id: 'E2', home: 'CIV', away: 'CUW' },
  { id: 'E3', home: 'GER', away: 'CIV' }, { id: 'E4', home: 'ECU', away: 'CUW' },
  { id: 'E5', home: 'GER', away: 'CUW' }, { id: 'E6', home: 'ECU', away: 'CIV' },
  { id: 'F1', home: 'NED', away: 'JPN' }, { id: 'F2', home: 'SWE', away: 'TUN' },
  { id: 'F3', home: 'NED', away: 'SWE' }, { id: 'F4', home: 'JPN', away: 'TUN' },
  { id: 'F5', home: 'NED', away: 'TUN' }, { id: 'F6', home: 'JPN', away: 'SWE' },
  { id: 'G1', home: 'BEL', away: 'EGY' }, { id: 'G2', home: 'IRN', away: 'NZL' },
  { id: 'G3', home: 'BEL', away: 'IRN' }, { id: 'G4', home: 'EGY', away: 'NZL' },
  { id: 'G5', home: 'BEL', away: 'NZL' }, { id: 'G6', home: 'EGY', away: 'IRN' },
  { id: 'H1', home: 'ESP', away: 'URU' }, { id: 'H2', home: 'CPV', away: 'KSA' },
  { id: 'H3', home: 'ESP', away: 'CPV' }, { id: 'H4', home: 'KSA', away: 'URU' },
  { id: 'H5', home: 'ESP', away: 'KSA' }, { id: 'H6', home: 'CPV', away: 'URU' },
  { id: 'I1', home: 'FRA', away: 'SEN' }, { id: 'I2', home: 'NOR', away: 'IRQ' },
  { id: 'I3', home: 'FRA', away: 'NOR' }, { id: 'I4', home: 'SEN', away: 'IRQ' },
  { id: 'I5', home: 'FRA', away: 'IRQ' }, { id: 'I6', home: 'NOR', away: 'SEN' },
  { id: 'J1', home: 'ARG', away: 'ALG' }, { id: 'J2', home: 'AUT', away: 'JOR' },
  { id: 'J3', home: 'ARG', away: 'AUT' }, { id: 'J4', home: 'JOR', away: 'ALG' },
  { id: 'J5', home: 'ALG', away: 'AUT' }, { id: 'J6', home: 'JOR', away: 'ARG' },
  { id: 'K1', home: 'POR', away: 'COL' }, { id: 'K2', home: 'COD', away: 'UZB' },
  { id: 'K3', home: 'POR', away: 'UZB' }, { id: 'K4', home: 'COL', away: 'COD' },
  { id: 'K5', home: 'POR', away: 'COD' }, { id: 'K6', home: 'UZB', away: 'COL' },
  { id: 'L1', home: 'ENG', away: 'PAN' }, { id: 'L2', home: 'CRO', away: 'GHA' },
  { id: 'L3', home: 'ENG', away: 'GHA' }, { id: 'L4', home: 'PAN', away: 'CRO' },
  { id: 'L5', home: 'ENG', away: 'CRO' }, { id: 'L6', home: 'GHA', away: 'PAN' },
];

// ── Helper: HTTPS GET als Promise ────────────────────────────────────────────
function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

// ── Hauptfunktion ────────────────────────────────────────────────────────────
async function main() {
  const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  if (!FOOTBALL_API_KEY || !FIREBASE_PROJECT_ID || !serviceAccount) {
    console.error('❌ Fehlende Umgebungsvariablen');
    process.exit(1);
  }

  // 1. Firebase Admin initialisieren
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: FIREBASE_PROJECT_ID,
  });

  // 2. Abgeschlossene WM 2026 Spiele von football-data.org holen
  console.log('📡 Lade Ergebnisse von football-data.org...');
  let apiMatches;
  try {
    const data = await httpsGet(
      'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
      { 'X-Auth-Token': FOOTBALL_API_KEY }
    );
    apiMatches = data.matches ?? [];
    console.log(`✅ ${apiMatches.length} abgeschlossene Spiele gefunden`);
  } catch (err) {
    console.error('❌ API-Fehler:', err.message);
    process.exit(1);
  }

  // 3. API-Ergebnisse auf App-IDs mappen
  const results = {};
  let matched = 0;

  for (const apiMatch of apiMatches) {
    const homeCode = TEAM_MAP[apiMatch.homeTeam?.tla] ?? apiMatch.homeTeam?.tla;
    const awayCode = TEAM_MAP[apiMatch.awayTeam?.tla] ?? apiMatch.awayTeam?.tla;
    const score = apiMatch.score?.fullTime;

    if (!homeCode || !awayCode || score?.home == null || score?.away == null) continue;

    const ourMatch = MATCHES.find(m => m.home === homeCode && m.away === awayCode);
    if (ourMatch) {
      results[ourMatch.id] = { h: score.home, a: score.away };
      console.log(`  ${ourMatch.id}: ${homeCode} ${score.home}–${score.away} ${awayCode}`);
      matched++;
    }
  }

  console.log(`\n📊 ${matched} Spiele gematcht`);

  if (matched === 0) {
    console.log('ℹ️  Keine Ergebnisse — Remote Config wird nicht aktualisiert');
    return;
  }

  // 4. Firebase Remote Config aktualisieren
  console.log('\n🔥 Aktualisiere Firebase Remote Config...');
  try {
    const rc = admin.remoteConfig();
    const template = await rc.getTemplate();

    template.parameters['match_results'] = {
      defaultValue: { value: JSON.stringify(results) },
      description: `WM 2026 Ergebnisse — zuletzt aktualisiert: ${new Date().toISOString()}`,
    };

    await rc.publishTemplate(template);
    console.log('✅ Remote Config aktualisiert!');
    console.log('   Wert:', JSON.stringify(results));
  } catch (err) {
    console.error('❌ Remote Config Fehler:', err.message);
    process.exit(1);
  }
}

main().catch(err => {
  console.error('❌ Unerwarteter Fehler:', err);
  process.exit(1);
});
