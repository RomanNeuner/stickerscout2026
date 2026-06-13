// Lazy require — @react-native-firebase v24 crasht bei statischem Import
// (getApp() wird vor der nativen Bridge aufgerufen)
let _remoteConfig = null;

function getRC() {
  if (!_remoteConfig) {
    try {
      const mod = require('@react-native-firebase/remote-config').default;
      _remoteConfig = mod();
    } catch {}
  }
  return _remoteConfig;
}

const DEFAULTS = {
  match_results: '{}',
};

const FETCH_INTERVAL = typeof __DEV__ !== 'undefined' && __DEV__ ? 0 : 300;

export async function initRemoteConfig() {
  try {
    const rc = getRC();
    if (!rc) return;
    await rc.setConfigSettings({ minimumFetchIntervalMillis: FETCH_INTERVAL * 1000 });
    await rc.setDefaults(DEFAULTS);
    await rc.fetchAndActivate();
  } catch {
    // Remote Config nicht kritisch — App läuft ohne Ergebnisse weiter
  }
}

export function getMatchResults() {
  try {
    const rc = getRC();
    if (!rc) return {};
    const raw = rc.getValue('match_results').asString();
    return JSON.parse(raw) ?? {};
  } catch {
    return {};
  }
}
