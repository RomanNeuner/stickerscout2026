// src/config/iap.js
// IAP Product IDs — Apple App Store + Google Play
// Alle IDs identisch auf beiden Plattformen ✅

export const IAP_PRODUCTS = {

  // ── CORE ──────────────────────────────────────
  WM_PASS: 'at.ncn.stickerscout2026.wmpass',
  SCAN_BOOST: 'at.ncn.stickerscout2026.scan50',
  TRADE_SLOTS: 'at.ncn.stickerscout2026.trade7d',
  REPORT_PDF: 'at.ncn.stickerscout2026.report',

  // ── RINGTONES ─────────────────────────────────
  RINGTONE_SONG1: 'at.ncn.stickerscout2026.ringtone.song1',
  RINGTONE_SONG2: 'at.ncn.stickerscout2026.ringtone.song2',
  RINGTONE_SONG3: 'at.ncn.stickerscout2026.ringtone.song3',

  // ── FULL TRACKS ───────────────────────────────
  FULLTRACK_SONG1: 'at.ncn.stickerscout2026.ringtone.song1.full',
  FULLTRACK_SONG2: 'at.ncn.stickerscout2026.ringtone.song2.full',
  FULLTRACK_SONG3: 'at.ncn.stickerscout2026.ringtone.song3.full',
};

// Song-Mapping für Ringtones Screen
export const SONGS = {
  song1: {
    id: 'song1',
    artist: 'United Voices',
    title: 'One World, One Game',
    market: 'INT',
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG1,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG1,
    cover: require('../../assets/ringtones/covers/song1_cover.png'),
    preview: require('../../assets/ringtones/song1_preview.mp3'),
    ringtone: require('../../assets/ringtones/song1_ringtone.mp3'),
    ringtoneIOS: require('../../assets/ringtones/song1_ringtone.m4r'),
    fulltrack: require('../../assets/ringtones/song1_full.mp3'),
  },
  song2: {
    id: 'song2',
    artist: 'Leo Falk',
    title: 'Wir halten zusammen',
    market: 'DE',
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG2,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG2,
    cover: require('../../assets/ringtones/covers/song2_cover.png'),
    preview: require('../../assets/ringtones/song2_preview.mp3'),
    ringtone: require('../../assets/ringtones/song2_ringtone.mp3'),
    ringtoneIOS: require('../../assets/ringtones/song2_ringtone.m4r'),
    fulltrack: require('../../assets/ringtones/song2_full.mp3'),
  },
  song3: {
    id: 'song3',
    artist: 'Da Austro-Bua',
    title: 'Unaufhoitboa',
    market: 'AT',
    ringtoneId: IAP_PRODUCTS.RINGTONE_SONG3,
    fulltrackId: IAP_PRODUCTS.FULLTRACK_SONG3,
    cover: require('../../assets/ringtones/covers/song3_cover.png'),
    preview: require('../../assets/ringtones/song3_preview.mp3'),
    ringtone: require('../../assets/ringtones/song3_ringtone.mp3'),
    ringtoneIOS: require('../../assets/ringtones/song3_ringtone.m4r'),
    fulltrack: require('../../assets/ringtones/song3_full.mp3'),
  },
};

// Preise (Early Bird bis 15. Juni, danach Standard)
export const PRICES = {
  WM_PASS_EARLY_BIRD: '€2,99',
  WM_PASS_EARLY_BIRD_AT: '€1,99',
  WM_PASS_STANDARD: '€3,99',
  EARLY_BIRD_END: new Date('2026-06-15T23:59:59'),
  MICRO_IAP: '€0,99',
  RINGTONE: '€0,99',
  FULLTRACK: '€1,99',
};
