/**
 * StickerScout 2026 — Push & Local Notifications Service
 * expo-notifications ~56.0.15
 *
 * Use Cases:
 *  1. Trade-Match       — sofortige Benachrichtigung (lokal, simuliert)
 *  2. AUT Spiele        — Erinnerung 9:00 CEST am Spieltag
 *  3. Early Bird        — 1 Tag vor Ablauf (14. Juni, 9:00 CEST)
 *  4. Sammelmeilensteine — 25 / 50 / 75 / 90 %
 *  5. Scan-Reset        — tägliche Freiscans verfügbar (optional)
 */

import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ──────────────────────────────────────────────────────────────────────────────
// Storage Keys
// ──────────────────────────────────────────────────────────────────────────────
const KEYS = {
  PUSH_ENABLED:       '@stickerscout_push_enabled',
  GAME_REMINDERS_SET: '@stickerscout_game_reminders_set',
  EARLY_BIRD_SET:     '@stickerscout_early_bird_set',
  SCAN_RESET_SET:     '@stickerscout_scan_reset_set',
  MILESTONE_SENT:     '@stickerscout_milestone_sent', // JSON array of sent %
};

// ──────────────────────────────────────────────────────────────────────────────
// Foreground Handler — Notification auch bei offener App anzeigen
// ──────────────────────────────────────────────────────────────────────────────
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

// ──────────────────────────────────────────────────────────────────────────────
// Android Channels — je Kategorie eigener Channel
// ──────────────────────────────────────────────────────────────────────────────
export async function setupAndroidChannels() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('trade', {
    name: 'Tauschbörse',
    description: 'Benachrichtigungen wenn jemand tauschen möchte',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    lightColor: '#4FC3F7',
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('games', {
    name: 'Spielerinnerungen',
    description: 'Erinnerungen für Österreich-Spiele bei der WM 2026',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 400, 200, 400],
    lightColor: '#42D783',
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('general', {
    name: 'Allgemein',
    description: 'Meilensteine, Angebote und App-Neuigkeiten',
    importance: Notifications.AndroidImportance.DEFAULT,
    lightColor: '#F5C033',
    sound: 'default',
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// Permission anfordern
// ──────────────────────────────────────────────────────────────────────────────
export async function requestNotificationPermission() {
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync({
    ios: {
      allowAlert: true,
      allowBadge: false,
      allowSound: true,
    },
  });
  return status === 'granted';
}

export async function getPermissionStatus() {
  const { status } = await Notifications.getPermissionsAsync();
  return status; // 'granted' | 'denied' | 'undetermined'
}

// ──────────────────────────────────────────────────────────────────────────────
// Einstellungen
// ──────────────────────────────────────────────────────────────────────────────
export async function getPushEnabled() {
  try {
    const val = await AsyncStorage.getItem(KEYS.PUSH_ENABLED);
    return val !== 'false'; // Standard: aktiviert
  } catch {
    return true;
  }
}

export async function setPushEnabled(enabled) {
  await AsyncStorage.setItem(KEYS.PUSH_ENABLED, enabled ? 'true' : 'false');
  if (!enabled) {
    // Alle geplanten Notifications abbrechen
    await Notifications.cancelAllScheduledNotificationsAsync();
    await AsyncStorage.multiRemove([
      KEYS.GAME_REMINDERS_SET,
      KEYS.EARLY_BIRD_SET,
      KEYS.SCAN_RESET_SET,
    ]);
  }
}

// ──────────────────────────────────────────────────────────────────────────────
// Helper: Datum für Notification (CEST = UTC+2)
// Inputs: Jahr, Monat (1-basiert), Tag, Stunde CEST, Minute CEST
// ──────────────────────────────────────────────────────────────────────────────
function cestDate(year, month, day, hourCEST, minuteCEST = 0) {
  // CEST = UTC+2 → UTC = CEST - 2h
  return new Date(Date.UTC(year, month - 1, day, hourCEST - 2, minuteCEST, 0));
}

// ──────────────────────────────────────────────────────────────────────────────
// 1) TAUSCH-MATCH — sofort senden
// ──────────────────────────────────────────────────────────────────────────────
export async function notifyTradeMatch(partnerName = 'Jemand', item = 'einen Sticker') {
  const enabled = await getPushEnabled();
  if (!enabled) return;
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🔄 Tausch-Match!',
      body: `${partnerName} möchte ${item} mit dir tauschen.`,
      data: { type: 'trade_match' },
      ...(Platform.OS === 'android' && { channelId: 'trade' }),
    },
    trigger: null, // sofort
  });
}

// ──────────────────────────────────────────────────────────────────────────────
// 2) ÖSTERREICH SPIELERINNERUNGEN
//    Anstoß-Zeiten (Venue-Zeit USA) → österr. Zuseher schauen nachts
//    → Erinnerung am Spieltag um 9:00 CEST (morgens, damit man sich vorbereitet)
//    → + Erinnerung 30 Min vor Anstoß CEST
// ──────────────────────────────────────────────────────────────────────────────

// AUT-Spielzeiten umgerechnet auf CEST (UTC+2):
// GER vs AUT  — Dallas (CT = UTC-5):  21:00 CT = 04:00 CEST 15.06.
// AUT vs CHE  — Vancouver (PT=UTC-7): 18:00 PT = 03:00 CEST 20.06.
// SRB vs AUT  — San Fran (PT=UTC-7): 21:00 PT = 06:00 CEST 25.06.
const AUT_GAMES = [
  {
    id:       'aut_ger',
    opponent: 'Deutschland',
    emoji:    '🇩🇪',
    venue:    'Dallas',
    gameDay:  { year: 2026, month: 6, day: 14 },       // Spieltag in DE/AT
    kickoff:  { year: 2026, month: 6, day: 15, h: 4 }, // 04:00 CEST (nachts)
  },
  {
    id:       'aut_che',
    opponent: 'Schweiz',
    emoji:    '🇨🇭',
    venue:    'Vancouver',
    gameDay:  { year: 2026, month: 6, day: 19 },
    kickoff:  { year: 2026, month: 6, day: 20, h: 3 }, // 03:00 CEST
  },
  {
    id:       'aut_srb',
    opponent: 'Serbien',
    emoji:    '🇷🇸',
    venue:    'San Francisco',
    gameDay:  { year: 2026, month: 6, day: 24 },
    kickoff:  { year: 2026, month: 6, day: 25, h: 6 }, // 06:00 CEST
  },
];

export async function scheduleGameReminders() {
  const enabled = await getPushEnabled();
  if (!enabled) return;
  const done = await AsyncStorage.getItem(KEYS.GAME_REMINDERS_SET);
  if (done === 'true') return; // nicht mehrfach anlegen

  const now = Date.now();

  for (const game of AUT_GAMES) {
    // A) 9:00 CEST am Spieltag — Tages-Erinnerung
    const morningTime = cestDate(
      game.gameDay.year, game.gameDay.month, game.gameDay.day, 9, 0
    );
    if (morningTime.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${game.id}_morning`,
        content: {
          title: `⚽ Österreich spielt heute Nacht!`,
          body: `AUT vs ${game.opponent} ${game.emoji} — Anstoß in ${game.venue}. Vergiss nicht, deinen Alarm zu stellen!`,
          data: { type: 'game_reminder', gameId: game.id },
          ...(Platform.OS === 'android' && { channelId: 'games' }),
        },
        trigger: { type: 'date', date: morningTime },
      });
    }

    // B) 30 Min vor Anstoß (CEST)
    const kickoffTime = cestDate(
      game.kickoff.year, game.kickoff.month, game.kickoff.day, game.kickoff.h, 0
    );
    const reminderTime = new Date(kickoffTime.getTime() - 30 * 60 * 1000);
    if (reminderTime.getTime() > now) {
      await Notifications.scheduleNotificationAsync({
        identifier: `${game.id}_kickoff`,
        content: {
          title: `🟥⬜🟥 Anstoß in 30 Minuten!`,
          body: `Österreich ${game.emoji} ${game.opponent} — Jetzt einschalten!`,
          data: { type: 'game_kickoff', gameId: game.id },
          ...(Platform.OS === 'android' && { channelId: 'games' }),
        },
        trigger: { type: 'date', date: reminderTime },
      });
    }
  }

  await AsyncStorage.setItem(KEYS.GAME_REMINDERS_SET, 'true');
}

// ──────────────────────────────────────────────────────────────────────────────
// 3) EARLY BIRD — 1 Tag vor Ablauf (14. Juni 2026, 9:00 CEST)
// ──────────────────────────────────────────────────────────────────────────────
export async function scheduleEarlyBirdReminder() {
  const enabled = await getPushEnabled();
  if (!enabled) return;
  const done = await AsyncStorage.getItem(KEYS.EARLY_BIRD_SET);
  if (done === 'true') return;

  const reminderTime = cestDate(2026, 6, 14, 9, 0); // 14.06. 9:00 CEST
  if (reminderTime.getTime() <= Date.now()) {
    await AsyncStorage.setItem(KEYS.EARLY_BIRD_SET, 'true');
    return; // Termin bereits vorbei
  }

  await Notifications.scheduleNotificationAsync({
    identifier: 'early_bird_countdown',
    content: {
      title: '⏰ Nur noch 1 Tag: WM Pass €1,99!',
      body: 'Der Early Bird Preis läuft morgen um Mitternacht ab. Jetzt sichern!',
      data: { type: 'early_bird' },
      ...(Platform.OS === 'android' && { channelId: 'general' }),
    },
    trigger: { type: 'date', date: reminderTime },
  });
  await AsyncStorage.setItem(KEYS.EARLY_BIRD_SET, 'true');
}

// ──────────────────────────────────────────────────────────────────────────────
// 4) SAMMELMEILENSTEINE — 25 / 50 / 75 / 90 %
// Aufruf: checkMilestone(ownedCount, totalCount = 980)
// ──────────────────────────────────────────────────────────────────────────────
const MILESTONES = [
  {
    pct: 25,
    title: '🎉 Viertel geschafft!',
    body: 'Du hast 25% deiner Sticker gesammelt — weiter so!',
  },
  {
    pct: 50,
    title: '🏅 Halbzeit im Album!',
    body: 'Schon 50% gesammelt. Du bist auf dem besten Weg zur Vervollständigung!',
  },
  {
    pct: 75,
    title: '🔥 Fast da — 75%!',
    body: 'Nur noch 25% fehlen! Die letzten Sticker sind zum Greifen nah.',
  },
  {
    pct: 90,
    title: '⭐ 90% — Endspurt!',
    body: 'Unglaublich! Fast vollständig. Die letzten Sticker jetzt nachbestellen?',
  },
];

export async function checkMilestone(owned, total = 980) {
  const enabled = await getPushEnabled();
  if (!enabled || total === 0) return;

  const pct = (owned / total) * 100;
  const sentRaw = await AsyncStorage.getItem(KEYS.MILESTONE_SENT);
  const sent = sentRaw ? JSON.parse(sentRaw) : [];

  for (const milestone of MILESTONES) {
    if (pct >= milestone.pct && !sent.includes(milestone.pct)) {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: milestone.title,
          body: milestone.body,
          data: { type: 'milestone', pct: milestone.pct },
          ...(Platform.OS === 'android' && { channelId: 'general' }),
        },
        trigger: null, // sofort
      });
      sent.push(milestone.pct);
    }
  }
  await AsyncStorage.setItem(KEYS.MILESTONE_SENT, JSON.stringify(sent));
}

// ──────────────────────────────────────────────────────────────────────────────
// 5) TÄGLICHER SCAN-RESET — täglich um 8:00 CEST
// ──────────────────────────────────────────────────────────────────────────────
export async function scheduleDailyScanReset() {
  const enabled = await getPushEnabled();
  if (!enabled) return;
  const done = await AsyncStorage.getItem(KEYS.SCAN_RESET_SET);
  if (done === 'true') return;

  // Tägliche Wiederholung (jeden Tag 8:00 Uhr Gerätezeit)
  await Notifications.scheduleNotificationAsync({
    identifier: 'daily_scan_reset',
    content: {
      title: '📷 Deine Scans sind wieder verfügbar!',
      body: '10 kostenlose Scans warten auf dich. Welchen Sticker findest du heute?',
      data: { type: 'scan_reset' },
      ...(Platform.OS === 'android' && { channelId: 'general' }),
    },
    trigger: {
      type: 'daily',
      hour: 8,
      minute: 0,
    },
  });
  await AsyncStorage.setItem(KEYS.SCAN_RESET_SET, 'true');
}

// ──────────────────────────────────────────────────────────────────────────────
// INIT — beim App-Start aufrufen
// ──────────────────────────────────────────────────────────────────────────────
export async function initNotifications() {
  await setupAndroidChannels();
  const granted = await requestNotificationPermission();
  if (!granted) return false;

  // Geplante Notifications anlegen (idempotent)
  await Promise.allSettled([
    scheduleGameReminders(),
    scheduleEarlyBirdReminder(),
    scheduleDailyScanReset(),
  ]);
  return true;
}

// ──────────────────────────────────────────────────────────────────────────────
// Alle geplanten Notifications auflisten (Debug)
// ──────────────────────────────────────────────────────────────────────────────
export async function getScheduledNotifications() {
  return await Notifications.getAllScheduledNotificationsAsync();
}

// Alle abbrechen (z.B. bei Deinstallation / Reset)
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
  await AsyncStorage.multiRemove([
    KEYS.GAME_REMINDERS_SET,
    KEYS.EARLY_BIRD_SET,
    KEYS.SCAN_RESET_SET,
    KEYS.PUSH_ENABLED,
    KEYS.MILESTONE_SENT,
  ]);
}
