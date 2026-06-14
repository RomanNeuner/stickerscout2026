/**
 * WM 2026 Ergebnisse automatisch in Firebase Remote Config schreiben.
 * Datenquelle: football-data.org (FOOTBALL_API_KEY Secret)
 *
 * Umgebungsvariablen (GitHub Secrets):
 *   FOOTBALL_API_KEY       — API-Key von football-data.org
 *   FIREBASE_SERVICE_ACCOUNT — Firebase Service Account JSON (als String)
 *   FIREBASE_PROJECT_ID    — z.B. "stickerscout2026"
 */

const https = require('https');
const admin = require('firebase-admin');

// ── Team-Code Mapping: football-data.org TLA → App-Codes ────────────────────
const TEAM_MAP = {
  PRY: 'PAR', DRC: 'COD', NIG: 'NGA', CUR: 'CUW',
  RSA: 'RSA', CZE: 'CZE', BIH: 'BIH', SCO: 'SCO',
  CPV: 'CPV', KSA: 'KSA', UZB: 'UZB', JOR: 'JOR',
  ALG: 'ALG', HAI: 'HAI', IRQ: 'IRQ', NZL: 'NZL', IRN: 'IRN',
};

// ── Alle Gruppenspiele (Heimteam, Auswärtsteam → App-ID) ─────────────────────
const MATCHES = [
  { id: 'A1', home: 'MEX', away: 'RSA' }, { id: 'A2', home: 'KOR', away: 'CZE' },
  { id: 'A3', home: 'CZE', away: 'RSA' }, { id: 'A4', home: 'MEX', away: 'KOR' },
  { id: 'A5', home: 'CZE', away: 'MEX' }, { id: 'A6', home: 'RSA', away: 'KOR' },
  { id: 'B1', home: 'CAN', away: 'BIH' }, { id: 'B2', home: 'QAT', away: 'SUI' },
  { id: 'B3', home: 'SUI', away: 'BIH' }, { id: 'B4', home: 'CAN', away: 'QAT' },
  { id: 'B5', home: 'SUI', away: 'CAN' }, { id: 'B6', home: 'BIH', away: 'QAT' },
  { id: 'C1', home: 'BRA', away: 'MAR' }, { id: 'C2', home: 'HAI', away: 'SCO' },
  { id: 'C3', home: 'SCO', away: 'MAR' }, { id: 'C4', home: 'BRA', away: 'HAI' },
  { id: 'C5', home: 'MAR', away: 'HAI' }, { id: 'C6', home: 'SCO', away: 'BRA' },
  { id: 'D1', home: 'USA', away: 'PAR' }, { id: 'D2', home: 'AUS', away: 'TUR' },
  { id: 'D3', home: 'USA', away: 'AUS' }, { id: 'D4', home: 'TUR', away: 'PAR' },
  { id: 'D5', home: 'TUR', away: 'USA' }, { id: 'D6', home: 'PAR', away: 'AUS' },
  { id: 'E1', home: 'GER', away: 'CUW' }, { id: 'E2', home: 'CIV', away: 'ECU' },
  { id: 'E3', home: 'GER', away: 'CIV' }, { id: 'E4', home: 'ECU', away: 'CUW' },
  { id: 'E5', home: 'ECU', away: 'GER' }, { id: 'E6', home: 'CUW', away: 'CIV' },
  { id: 'F1', home: 'NED', away: 'JPN' }, { id: 'F2', home: 'SWE', away: 'TUN' },
  { id: 'F3', home: 'NED', away: 'SWE' }, { id: 'F4', home: 'TUN', away: 'JPN' },
  { id: 'F5', home: 'TUN', away: 'NED' }, { id: 'F6', home: 'JPN', away: 'SWE' },
  { id: 'G1', home: 'BEL', away: 'EGY' }, { id: 'G2', home: 'IRN', away: 'NZL' },
  { id: 'G3', home: 'BEL', away: 'IRN' }, { id: 'G4', home: 'NZL', away: 'EGY' },
  { id: 'G5', home: 'NZL', away: 'BEL' }, { id: 'G6', home: 'EGY', away: 'IRN' },
  { id: 'H1', home: 'ESP', away: 'CPV' }, { id: 'H2', home: 'KSA', away: 'URU' },
  { id: 'H3', home: 'ESP', away: 'KSA' }, { id: 'H4', home: 'URU', away: 'CPV' },
  { id: 'H5', home: 'URU', away: 'ESP' }, { id: 'H6', home: 'CPV', away: 'KSA' },
  { id: 'I1', home: 'FRA', away: 'SEN' }, { id: 'I2', home: 'IRQ', away: 'NOR' },
  { id: 'I3', home: 'FRA', away: 'IRQ' }, { id: 'I4', home: 'NOR', away: 'SEN' },
  { id: 'I5', home: 'NOR', away: 'FRA' }, { id: 'I6', home: 'SEN', away: 'IRQ' },
  { id: 'J1', home: 'ARG', away: 'ALG' }, { id: 'J2', home: 'AUT', away: 'JOR' },
  { id: 'J3', home: 'ARG', away: 'AUT' }, { id: 'J4', home: 'JOR', away: 'ALG' },
  { id: 'J5', home: 'JOR', away: 'ARG' }, { id: 'J6', home: 'ALG', away: 'AUT' },
  { id: 'K1', home: 'POR', away: 'COD' }, { id: 'K2', home: 'UZB', away: 'COL' },
  { id: 'K3', home: 'POR', away: 'UZB' }, { id: 'K4', home: 'COL', away: 'COD' },
  { id: 'K5', home: 'COL', away: 'POR' }, { id: 'K6', home: 'COD', away: 'UZB' },
  { id: 'L1', home: 'ENG', away: 'CRO' }, { id: 'L2', home: 'GHA', away: 'PAN' },
  { id: 'L3', home: 'ENG', away: 'GHA' }, { id: 'L4', home: 'PAN', away: 'CRO' },
  { id: 'L5', home: 'PAN', away: 'ENG' }, { id: 'L6', home: 'CRO', away: 'GHA' },
];

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 300)}`)); }
      });
    }).on('error', reject);
  });
}

function normalizeCode(tla) {
  if (!tla) return null;
  const upper = tla.toUpperCase();
  return TEAM_MAP[upper] ?? upper;
}

async function main() {
  const FOOTBALL_API_KEY = process.env.FOOTBALL_API_KEY;
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  if (!FOOTBALL_API_KEY || !FIREBASE_PROJECT_ID || !serviceAccount) {
    console.error('❌ Fehlende Umgebungsvariablen');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: FIREBASE_PROJECT_ID,
  });

  console.log('📡 Lade WM 2026 Ergebnisse von football-data.org...');
  const { status, body } = await httpsGet(
    'https://api.football-data.org/v4/competitions/WC/matches?status=FINISHED',
    { 'X-Auth-Token': FOOTBALL_API_KEY }
  ).catch(err => { console.error('❌ HTTP-Fehler:', err.message); process.exit(1); });

  if (status !== 200) {
    console.error(`❌ API-Fehler HTTP ${status}:`, JSON.stringify(body).slice(0, 300));
    process.exit(1);
  }
  if (body.errorCode || body.error) {
    console.error('❌ API-Fehler:', body.message ?? JSON.stringify(body).slice(0, 300));
    process.exit(1);
  }

  const apiMatches = body.matches ?? [];
  console.log(`✅ ${apiMatches.length} abgeschlossene Spiele gefunden`);

  if (apiMatches.length === 0) {
    console.log('ℹ️  Noch keine Spiele beendet');
    return;
  }

  // Erste 3 Spiele zur Diagnose ausgeben
  apiMatches.slice(0, 3).forEach(m => {
    console.log(`   Bsp: ${m.homeTeam?.tla} ${m.score?.fullTime?.home}-${m.score?.fullTime?.away} ${m.awayTeam?.tla} [${m.status}]`);
  });

  const results = {};
  let matched = 0;

  for (const apiMatch of apiMatches) {
    const homeCode = normalizeCode(apiMatch.homeTeam?.tla);
    const awayCode = normalizeCode(apiMatch.awayTeam?.tla);
    const score = apiMatch.score?.fullTime;

    if (!homeCode || !awayCode || score?.home == null || score?.away == null) continue;

    const ourMatch = MATCHES.find(m => m.home === homeCode && m.away === awayCode);
    if (ourMatch) {
      results[ourMatch.id] = { h: score.home, a: score.away };
      console.log(`  ✅ ${ourMatch.id}: ${homeCode} ${score.home}–${score.away} ${awayCode}`);
      matched++;
    } else {
      console.log(`  ❓ Kein Match für: ${homeCode} vs ${awayCode}`);
    }
  }

  console.log(`\n📊 ${matched} von ${apiMatches.length} Spielen gematcht`);

  if (matched === 0) {
    console.log('ℹ️  Keine Spiele gematcht — Remote Config wird nicht aktualisiert');
    return;
  }

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
