/**
 * WM 2026 Spielplan automatisch von football-data.org generieren.
 * Schreibt src/data/schedule.js neu — einmalig ausführen!
 *
 * Ausführen: node generate-schedule.js
 * (im scripts/-Ordner, FOOTBALL_API_KEY als Env-Variable oder direkt unten eintragen)
 */

const https = require('https');
const fs    = require('fs');
const path  = require('path');

const API_KEY = process.env.FOOTBALL_API_KEY ?? '';

// TLA-Abweichungen football-data.org → App-Codes
const TEAM_MAP = {
  PRY: 'PAR', // Paraguay
  DRC: 'COD', // DR Kongo
  CUR: 'CUW', // Curaçao
  URY: 'URU', // Uruguay
  NIG: 'NGA', // Nigeria (falls vorhanden)
  KSA: 'KSA',
  RSA: 'RSA',
  CZE: 'CZE',
  BIH: 'BIH',
  SCO: 'SCO',
  CPV: 'CPV',
  UZB: 'UZB',
  JOR: 'JOR',
  ALG: 'ALG',
  HAI: 'HAI',
  IRQ: 'IRQ',
  NZL: 'NZL',
  IRN: 'IRN',
  CIV: 'CIV',
};

function mapTeam(tla) {
  return tla ? (TEAM_MAP[tla] ?? tla) : 'TBD';
}

function httpsGet(url, headers) {
  return new Promise((resolve, reject) => {
    https.get(url, { headers }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error(`JSON parse error: ${data.slice(0, 300)}`)); }
      });
    }).on('error', reject);
  });
}

// UTC-Datum → MESZ-Datum + Uhrzeit
function toMESZ(utcDateStr) {
  const d = new Date(utcDateStr);
  const meszMs  = d.getTime() + 2 * 60 * 60 * 1000;
  const meszDate = new Date(meszMs);
  const h = String(meszDate.getUTCHours()).padStart(2, '0');
  const m = String(meszDate.getUTCMinutes()).padStart(2, '0');
  const date = meszDate.toISOString().slice(0, 10);
  return { date, time: `${h}:${m} MESZ` };
}

const STAGE_MAP = {
  GROUP_STAGE:    'GROUP',
  ROUND_OF_32:    'R32',
  ROUND_OF_16:    'R16',
  LAST_32:        'R32',
  LAST_16:        'R16',
  QUARTER_FINALS: 'QF',
  SEMI_FINALS:    'SF',
  THIRD_PLACE:    'THIRD',
  FINAL:          'FINAL',
};

const GROUP_ORDER = ['A','B','C','D','E','F','G','H','I','J','K','L'];

async function main() {
  if (!API_KEY) {
    console.error('❌ FOOTBALL_API_KEY fehlt');
    process.exit(1);
  }

  console.log('📡 Lade WM 2026 Spielplan von football-data.org...');
  const data = await httpsGet(
    'https://api.football-data.org/v4/competitions/WC/matches',
    { 'X-Auth-Token': API_KEY }
  );

  const matches = data.matches ?? [];
  console.log(`✅ ${matches.length} Spiele geladen`);

  // Gruppenspiele sortiert nach Gruppe und Datum
  const groupMatches = matches.filter(m => m.stage === 'GROUP_STAGE');
  const koMatches    = matches.filter(m => m.stage !== 'GROUP_STAGE')
                              .sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));

  const byGroup = {};
  for (const m of groupMatches) {
    const grp = (m.group ?? '').replace('GROUP_', '');
    if (!byGroup[grp]) byGroup[grp] = [];
    byGroup[grp].push(m);
  }
  for (const grp of Object.keys(byGroup)) {
    byGroup[grp].sort((a, b) => new Date(a.utcDate) - new Date(b.utcDate));
  }

  // ── Datei zusammenbauen ───────────────────────────────────────────────────
  let out = `/**
 * WM 2026 Spielplan — automatisch generiert von football-data.org
 * Generiert: ${new Date().toISOString().slice(0, 10)}
 * NICHT manuell bearbeiten — stattdessen generate-schedule.js neu ausführen.
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

export const GROUP_MATCHES = [\n`;

  for (const grp of GROUP_ORDER) {
    const gm = byGroup[grp] ?? [];
    if (!gm.length) {
      console.warn(`⚠️  Keine Spiele für Gruppe ${grp}`);
      continue;
    }
    const teams = [...new Set(gm.flatMap(m => [mapTeam(m.homeTeam?.tla), mapTeam(m.awayTeam?.tla)]))];
    out += `\n  // ── Gruppe ${grp}: ${teams.join(' · ')} ─────────────────────────────────────\n`;
    gm.forEach((m, i) => {
      const { date, time } = toMESZ(m.utcDate);
      const home  = mapTeam(m.homeTeam?.tla);
      const away  = mapTeam(m.awayTeam?.tla);
      const venue = m.venue ?? 'TBD';
      const id    = `${grp}${i + 1}`;
      out += `  { id: '${id}', stage: STAGE.GROUP, group: '${grp}', home: '${home}', away: '${away}', date: '${date}', time: '${time}', venue: '${venue}' },\n`;
    });
  }

  out += `];\n\n// KO-Runde (Teams werden nach Gruppenphase eingetragen)\nexport const KNOCKOUT_MATCHES = [\n`;

  const stageCounters = {};
  for (const m of koMatches) {
    const stage = STAGE_MAP[m.stage] ?? m.stage;
    stageCounters[stage] = (stageCounters[stage] ?? 0) + 1;
    const id = (stage === 'THIRD' || stage === 'FINAL')
      ? stage
      : `${stage}-${stageCounters[stage]}`;
    const { date, time } = toMESZ(m.utcDate);
    const home  = m.homeTeam?.tla ? mapTeam(m.homeTeam.tla) : `TBD`;
    const away  = m.awayTeam?.tla ? mapTeam(m.awayTeam.tla) : `TBD`;
    const venue = m.venue ?? 'TBD';
    out += `  { id: '${id}', stage: STAGE.${stage}, home: '${home}', away: '${away}', date: '${date}', time: '${time}', venue: '${venue}' },\n`;
  }

  out += `];\n`;

  const outPath = path.resolve(__dirname, '../src/data/schedule.js');
  fs.writeFileSync(outPath, out, 'utf8');
  console.log(`✅ schedule.js geschrieben → ${outPath}`);
  console.log(`   ${groupMatches.length} Gruppenspiele, ${koMatches.length} KO-Spiele`);
}

main().catch(err => {
  console.error('❌ Fehler:', err.message);
  process.exit(1);
});
