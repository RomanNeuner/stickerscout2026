/**
 * WM 2026 Ergebnisse automatisch in Firebase Remote Config schreiben.
 * Datenquelle: api-football.com via RapidAPI (kostenlos, 100 Req/Tag)
 *
 * Umgebungsvariablen (GitHub Secrets):
 *   RAPIDAPI_KEY           — API-Key von rapidapi.com (api-football plan)
 *   FIREBASE_SERVICE_ACCOUNT — Firebase Service Account JSON (als String)
 *   FIREBASE_PROJECT_ID    — z.B. "stickerscout2026"
 *
 * FIFA WM 2026: league=1, season=2026 auf api-football.com
 */

const https = require('https');
const admin = require('firebase-admin');

// ── Team-Code Mapping: api-football.com shortName → App-Codes ───────────────
// Nur Abweichungen von den FIFA 3-Letter-Codes
const TEAM_MAP = {
  // api-football kann andere Codes liefern als FIFA
  'DRC':  'COD', // DR Kongo
  'CRC':  'CRC',
  'RSA':  'RSA',
  'PAR':  'PAR',
  'CUW':  'CUW',
  'NGA':  'NGA',
  'CPV':  'CPV',
  'KSA':  'KSA',
  'UZB':  'UZB',
  'JOR':  'JOR',
  'ALG':  'ALG',
  'HAI':  'HAI',
  'IRQ':  'IRQ',
  'NZL':  'NZL',
  'IRN':  'IRN',
  'GER':  'GER',
  'AUT':  'AUT',
  'ARG':  'ARG',
  // Häufige 3-Letter-Abweichungen
  'PRY':  'PAR',
  'COD':  'COD',
  'NIG':  'NGA',
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
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

// ── Normalisiert Team-Code (3-Letter) ────────────────────────────────────────
function normalizeCode(code) {
  if (!code) return null;
  const upper = code.toUpperCase();
  return TEAM_MAP[upper] ?? upper;
}

// ── Hauptfunktion ────────────────────────────────────────────────────────────
async function main() {
  const RAPIDAPI_KEY = process.env.RAPIDAPI_KEY;
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  if (!RAPIDAPI_KEY || !FIREBASE_PROJECT_ID || !serviceAccount) {
    console.error('❌ Fehlende Umgebungsvariablen (RAPIDAPI_KEY, FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT)');
    process.exit(1);
  }

  // 1. Firebase Admin initialisieren
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: FIREBASE_PROJECT_ID,
  });

  // 2. Alle WM 2026 Spiele laden (kein Status-Filter) und selbst filtern
  // Zuerst: Welche League-IDs gibt es für "World Cup 2026"?
  console.log('📡 Suche FIFA WM 2026 League-ID auf api-football.com...');
  const HEADERS = {
    'x-rapidapi-host': 'v3.football.api-sports.io',
    'x-rapidapi-key': RAPIDAPI_KEY,
  };

  let leagueId = null;
  try {
    const { status, body } = await httpsGet(
      'https://v3.football.api-sports.io/leagues?type=cup&search=world+cup',
      HEADERS
    );
    if (status !== 200) {
      console.error('❌ League-Suche fehlgeschlagen:', status, JSON.stringify(body).slice(0, 300));
    } else {
      const wc = (body.response ?? []).filter(l =>
        l.league?.name?.toLowerCase().includes('world cup') &&
        l.seasons?.some(s => s.year === 2026)
      );
      console.log('🔍 Gefundene WC-Leagues:', wc.map(l => `ID=${l.league.id} "${l.league.name}"`).join(', ') || '(keine)');
      if (wc.length > 0) leagueId = wc[0].league.id;
    }
  } catch (err) {
    console.error('⚠️ League-Suche Fehler:', err.message);
  }

  // Fallback auf bekannte IDs wenn Suche scheitert
  if (!leagueId) {
    leagueId = 1; // Standard World Cup ID auf api-football
    console.log(`⚠️ Verwende Fallback League-ID: ${leagueId}`);
  }

  console.log(`\n📡 Lade Spiele: league=${leagueId}, season=2026...`);
  let apiFixtures;
  try {
    const { status, body } = await httpsGet(
      `https://v3.football.api-sports.io/fixtures?league=${leagueId}&season=2026`,
      HEADERS
    );
    if (status !== 200 || (body.errors && Object.keys(body.errors).length > 0)) {
      console.error('❌ API-Fehler:', status, JSON.stringify(body.errors ?? body).slice(0, 300));
      process.exit(1);
    }
    const all = body.response ?? [];
    console.log(`📋 Gesamt ${all.length} Spiele für league=${leagueId}/2026`);

    // Alle vorhandenen Status ausgeben (zur Diagnose)
    const statusCounts = {};
    all.forEach(f => {
      const s = f.fixture?.status?.short ?? '?';
      statusCounts[s] = (statusCounts[s] ?? 0) + 1;
    });
    console.log('   Status-Verteilung:', JSON.stringify(statusCounts));

    // Nur abgeschlossene Spiele (FT = Full Time, AET = After Extra Time, PEN = Penalties)
    apiFixtures = all.filter(f => ['FT', 'AET', 'PEN'].includes(f.fixture?.status?.short));
    console.log(`✅ ${apiFixtures.length} abgeschlossene Spiele (FT/AET/PEN)`);

    // Erste 3 Spiele zur Diagnose ausgeben
    apiFixtures.slice(0, 3).forEach(f => {
      console.log(`   Bsp: ${f.teams?.home?.code}(${f.teams?.home?.name}) ${f.goals?.home}-${f.goals?.away} ${f.teams?.away?.code}(${f.teams?.away?.name}) [${f.fixture?.status?.short}]`);
    });
  } catch (err) {
    console.error('❌ API-Fehler:', err.message);
    process.exit(1);
  }

  if (apiFixtures.length === 0) {
    console.log('ℹ️  Keine abgeschlossenen Spiele — Remote Config wird nicht aktualisiert');
    return;
  }

  // 3. API-Ergebnisse auf App-IDs mappen
  const results = {};
  let matched = 0;

  for (const fixture of apiFixtures) {
    const homeCode = normalizeCode(fixture.teams?.home?.code ?? fixture.teams?.home?.name?.slice(0, 3));
    const awayCode = normalizeCode(fixture.teams?.away?.code ?? fixture.teams?.away?.name?.slice(0, 3));
    const goals = fixture.goals;

    if (!homeCode || !awayCode || goals?.home == null || goals?.away == null) {
      console.log(`  ⚠️ Kein Code/Score für: ${fixture.teams?.home?.name} vs ${fixture.teams?.away?.name}`);
      continue;
    }

    const ourMatch = MATCHES.find(m => m.home === homeCode && m.away === awayCode);
    if (ourMatch) {
      results[ourMatch.id] = { h: goals.home, a: goals.away };
      console.log(`  ✅ ${ourMatch.id}: ${homeCode} ${goals.home}–${goals.away} ${awayCode}`);
      matched++;
    } else {
      console.log(`  ❓ Kein Match für: ${homeCode} vs ${awayCode}`);
    }
  }

  console.log(`\n📊 ${matched} von ${apiFixtures.length} Spielen gematcht`);

  if (matched === 0) {
    console.log('ℹ️  Keine Spiele gematcht — Remote Config wird nicht aktualisiert');
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
