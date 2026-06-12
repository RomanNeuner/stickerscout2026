// src/config/revenueCat.js
export const OFFERINGS = {
  DEFAULT:      'default',
  EARLY_BIRD:   'default_earlybird',   // eigenes Produkt wmpass_earlybird
  SCAN_UPSELL:  'scan_upsell',
  TRADE_UPSELL: 'trade_upsell',
  REPORT:       'report',
  RINGTONES:    'ringtones',
};

export const PACKAGES = {
  WM_PASS:            'WM_Pass',       // gleicher Package-ID in BEIDEN Offerings
  WM_PASS_EARLY_BIRD: 'WM_Pass',       // identisch — Offering entscheidet das Produkt
  SCAN_BOOST:     'scan_boost_50',
  TRADE_SLOTS:    'trade_slots_7d',
  REPORT_PDF:     'report_pdf',
  RINGTONE_SONG1: 'ringtone_song1',
  RINGTONE_SONG2: 'ringtone_song2',
  RINGTONE_SONG3: 'ringtone_song3',
  FULLTRACK_SONG1:'fulltrack_song1',
  FULLTRACK_SONG2:'fulltrack_song2',
  FULLTRACK_SONG3:'fulltrack_song3',
};
