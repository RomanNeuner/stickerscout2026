import remoteConfigModule from '@react-native-firebase/remote-config';

const remoteConfig = remoteConfigModule();

// Default: leeres Ergebnis-Objekt
const DEFAULTS = {
  match_results: '{}',
};

// Minimales Fetch-Intervall (Sekunden): Im Dev 0, in Prod 300 (5 Min)
const FETCH_INTERVAL = __DEV__ ? 0 : 300;

export async function initRemoteConfig() {
  try {
    await remoteConfig.setConfigSettings({ minimumFetchIntervalMillis: FETCH_INTERVAL * 1000 });
    await remoteConfig.setDefaults(DEFAULTS);
    await remoteConfig.fetchAndActivate();
  } catch {
    // Remote Config nicht kritisch — App läuft ohne Ergebnisse weiter
  }
}

/**
 * Gibt Spielergebnisse zurück.
 * Format: { [matchId]: { h: number, a: number } }
 * Beispiel: { "D1": { h: 2, a: 0 }, "A1": { h: 1, a: 1 } }
 */
export function getMatchResults() {
  try {
    const raw = remoteConfig.getValue('match_results').asString();
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}
