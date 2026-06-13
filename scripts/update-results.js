/**
 * WM 2026 Ergebnisse automatisch in Firebase Remote Config schreiben.
 * Datenquelle: TheSportsDB.com (kostenlos, kein API-Key erforderlich)
 *
 * Umgebungsvariablen (GitHub Secrets):
 *   FIREBASE_SERVICE_ACCOUNT — Firebase Service Account JSON (als String)
 *   FIREBASE_PROJECT_ID      — z.B. "stickerscout2026"
 */

const https = require('https');
const admin = require('firebase-admin');

// ── Team-Name Mapping: TheSportsDB Name → App-Code ──────────────────────────
const NAME_TO_CODE = {
  'Mexico': 'MEX', 'South Africa': 'RSA', 'South Korea': 'KOR', 'Czech Republic': 'CZE',
  'Czechia': 'CZE', 'Canada': 'CAN', 'Bosnia and Herzegovina': 'BIH', 'Qatar': 'QAT',
  'Switzerland': 'SUI', 'Brazil': 'BRA', 'Morocco': 'MAR', 'Haiti': 'HAI', 'Scotland': 'SCO',
  'United States': 'USA', 'USA': 'USA', 'Paraguay': 'PAR', 'Australia': 'AUS', 'Turkey': 'TUR',
  'Türkiye': 'TUR', 'Germany': 'GER', 'Ecuador': 'ECU', "Ivory Coast": 'CIV',
  "Côte d'Ivoire": 'CIV', 'Curaçao': 'CUW', 'Netherlands': 'NED', 'Japan': 'JPN',
  'Sweden': 'SWE', 'Tunisia': 'TUN', 'Belgium': 'BEL', 'Egypt': 'EGY', 'Iran': 'IRN',
  'New Zealand': 'NZL', 'Spain': 'ESP', 'Uruguay': 'URU', 'Cape Verde': 'CPV',
  'Saudi Arabia': 'KSA', 'France': 'FRA', 'Senegal': 'SEN', 'Norway': 'NOR', 'Iraq': 'IRQ',
  'Argentina': 'ARG', 'Algeria': 'ALG', 'Austria': 'AUT', 'Jordan': 'JOR',
  'Portugal': 'POR', 'Colombia': 'COL', 'Congo': 'COD', 'DR Congo': 'COD',
  'Uzbekistan': 'UZB', 'England': 'ENG', 'Panama': 'PAN', 'Croatia': 'CRO', 'Ghana': 'GHA',
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

function httpsGet(url) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers: { 'User-Agent': 'StickerScout2026/1.0' } }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 200)}`)); }
      });
    }).on('error', reject);
  });
}

function teamToCode(name) {
  if (!name) return null;
  return NAME_TO_CODE[name] ?? null;
}

async function main() {
  const FIREBASE_PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
  const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

  if (!FIREBASE_PROJECT_ID || !serviceAccount) {
    console.error('❌ Fehlende Umgebungsvariablen (FIREBASE_PROJECT_ID, FIREBASE_SERVICE_ACCOUNT)');
    process.exit(1);
  }

  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    projectId: FIREBASE_PROJECT_ID,
  });

  // 1. WM 2026 League-ID auf TheSportsDB suchen
  console.log('📡 Suche FIFA WM 2026 auf TheSportsDB...');
  let leagueId = null;
  try {
    const { status, body } = await httpsGet(
      'https://www.thesportsdb.com/api/v1/json/3/search_all_leagues.php?s=Soccer&c=World'
    );
    if (status === 200 && body.countrys) {
      const wc = body.countrys.find(l =>
        l.strLeague?.toLowerCase().includes('world cup') ||
        l.strLeague?.toLowerCase().includes('fifa')
      );
      if (wc) {
        leagueId = wc.idLeague;
        console.log(`✅ Gefunden: "${wc.strLeague}" (ID: ${leagueId})`);
      }
    }
  } catch (err) {
    console.error('⚠️ League-Suche Fehler:', err.message);
  }

  // Bekannte TheSportsDB League-IDs für FIFA World Cup als Fallback
  const leagueIdCandidates = leagueId ? [leagueId] : ['679925', '4480', '136'];

  let apiEvents = [];
  for (const lid of leagueIdCandidates) {
    console.log(`\n📡 Lade Spiele: TheSportsDB league=${lid}, season=2026...`);
    try {
      const { status, body } = await httpsGet(
        `https://www.thesportsdb.com/api/v1/json/3/eventsseason.php?id=${lid}&s=2026`
      );
      if (status === 200 && body.events && body.events.length > 0) {
        apiEvents = body.events;
        console.log(`✅ ${apiEvents.length} Spiele gefunden (league=${lid})`);
        break;
      } else {
        console.log(`   Keine Daten für league=${lid}`);
      }
    } catch (err) {
      console.error(`   Fehler für league=${lid}:`, err.message);
    }
  }

  if (apiEvents.length === 0) {
    console.log('ℹ️  Keine Spieldaten gefunden — Remote Config wird nicht aktualisiert');
    return;
  }

  // Status-Übersicht (zur Diagnose)
  const statusCounts = {};
  apiEvents.forEach(e => {
    const s = e.strStatus ?? e.strProgress ?? '?';
    statusCounts[s] = (statusCounts[s] ?? 0) + 1;
  });
  console.log('   Status-Verteilung:', JSON.stringify(statusCounts));

  // 2. Abgeschlossene Spiele filtern und mappen
  // TheSportsDB Status: "Match Finished", "FT", "Finished"
  const finished = apiEvents.filter(e => {
    const s = (e.strStatus ?? e.strProgress ?? '').toLowerCase();
    return s.includes('finish') || s === 'ft' || s === 'complete';
  });
  console.log(`\n📊 ${finished.length} abgeschlossene Spiele`);

  // Erste 3 Beispiele ausgeben
  finished.slice(0, 3).forEach(e => {
    console.log(`   Bsp: ${e.strHomeTeam} ${e.intHomeScore}-${e.intAwayScore} ${e.strAwayTeam} [${e.strStatus}]`);
  });

  const results = {};
  let matched = 0;

  for (const event of finished) {
    const homeCode = teamToCode(event.strHomeTeam);
    const awayCode = teamToCode(event.strAwayTeam);
    const homeScore = event.intHomeScore;
    const awayScore = event.intAwayScore;

    if (!homeCode || !awayCode || homeScore == null || awayScore == null) {
      if (!homeCode) console.log(`  ⚠️ Kein Code für Team: "${event.strHomeTeam}"`);
      if (!awayCode) console.log(`  ⚠️ Kein Code für Team: "${event.strAwayTeam}"`);
      continue;
    }

    const ourMatch = MATCHES.find(m => m.home === homeCode && m.away === awayCode);
    if (ourMatch) {
      results[ourMatch.id] = { h: parseInt(homeScore, 10), a: parseInt(awayScore, 10) };
      console.log(`  ✅ ${ourMatch.id}: ${homeCode} ${homeScore}–${awayScore} ${awayCode}`);
      matched++;
    }
  }

  console.log(`\n📊 ${matched} Spiele erfolgreich gematcht`);

  if (matched === 0) {
    console.log('ℹ️  Keine Spiele gematcht — Remote Config wird nicht aktualisiert');
    return;
  }

  // 3. Firebase Remote Config aktualisieren
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
