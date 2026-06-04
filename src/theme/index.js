// StickerScout 2026 — Design System "Stadion-Nacht"
// NCN-NetConsulting GmbH | Version 2.0 | Juni 2026

export const COLORS = {
  // === HINTERGRÜNDE ===
  bg:            '#0D1F2D',   // Stadion-Nacht-Blau (primär)
  surface:       'rgba(255,255,255,0.05)',
  surfaceRaised: 'rgba(255,255,255,0.08)',
  surfaceHigh:   'rgba(255,255,255,0.12)',
  overlay:       'rgba(13,31,45,0.95)',
  input:         'rgba(255,255,255,0.06)',

  // === AKZENTFARBEN ===
  gold:        '#F5C033',   // WM-Trophy-Gold
  goldLight:   '#F9D46A',
  goldBright:  '#FDE68A',
  goldDim:     '#C49A28',
  goldDark:    '#8A6B1A',
  goldDeep:    'rgba(245,192,51,0.15)',
  goldMuted:   '#A07A20',

  blue:        '#4FC3F7',   // Flutlicht-Blau
  blueLight:   '#81D4FA',
  blueDim:     '#0288D1',
  blueTint:    'rgba(79,195,247,0.12)',

  red:         '#FF6B6B',   // Österreich/Danger
  redLight:    '#FF8A80',
  redDim:      '#E53935',
  redTint:     'rgba(220,50,50,0.10)',

  green:       '#42D783',   // Erfolg
  greenLight:  '#6EE7A0',
  greenBright: '#42D783',
  greenDim:    'rgba(66,215,131,0.15)',
  greenDeep:   'rgba(66,215,131,0.08)',

  // === TEXT ===
  textPrimary:   '#FFFFFF',
  textSecondary: 'rgba(255,255,255,0.65)',
  textMuted:     'rgba(255,255,255,0.35)',
  textDisabled:  'rgba(255,255,255,0.20)',
  textOnGold:    '#0D1F2D',

  // === BORDERS ===
  border:      'rgba(255,255,255,0.10)',
  borderLight: 'rgba(255,255,255,0.07)',
  borderGold:  'rgba(245,192,51,0.40)',
  borderBlue:  'rgba(79,195,247,0.35)',
  borderRed:   'rgba(255,107,107,0.50)',

  // === TINTS (Badges, Boxen) ===
  tintGold:  'rgba(245,192,51,0.08)',
  tintBlue:  'rgba(79,195,247,0.12)',
  tintRed:   'rgba(220,50,50,0.10)',
  tintGreen: 'rgba(66,215,131,0.10)',
  tintWhite: 'rgba(255,255,255,0.04)',

  // === STATUS ===
  owned:     '#42D783',
  missing:   '#FF6B6B',
  duplicate: '#F5C033',
  unknown:   'rgba(255,255,255,0.15)',

  // === UTILITY ===
  white:   '#FFFFFF',
  black:   '#000000',
};

export const GRADIENTS = {
  goldButton:  ['#8A6B1A', '#C49A28', '#F5C033', '#F9D46A', '#C49A28', '#8A6B1A'],
  goldAccent:  ['#A07A20', '#F5C033', '#FDE68A', '#F5C033', '#A07A20'],
  greenHeader: ['#0D1F2D', '#0D1F2D'],
  cardDark:    ['rgba(255,255,255,0.06)', 'rgba(255,255,255,0.03)'],
  heroNight:   ['#0A1520', '#0D1F2D', '#122840'],
  success:     ['rgba(66,215,131,0.15)', 'rgba(66,215,131,0.05)'],
  foil:        ['#F5C033', '#FF6B6B', '#A78BFA', '#42D783', '#F5C033'],
  nightCard:   ['#0D2B3E', '#0D1F2D'],
  // Aliases für Rückwärtskompatibilität
  heroGreen:   ['#0A1520', '#0D1F2D', '#122840'],
};

export const FONTS = {
  sizes: {
    xs:      10,
    sm:      12,
    md:      14,
    lg:      16,
    xl:      20,
    xxl:     28,
    xxxl:    40,
    display: 52,
  },
  weights: {
    regular:  '400',
    medium:   '500',
    semibold: '600',
    bold:     '700',
    black:    '900',
  },
};

export const SPACING = {
  xs:   4,
  sm:   8,
  md:   12,
  lg:   16,
  xl:   24,
  xxl:  32,
  xxxl: 48,
};

export const RADIUS = {
  sm:   8,
  md:   14,
  lg:   20,
  xl:   28,
  full: 9999,
};

export const SHADOWS = {
  gold: {
    shadowColor: '#F5C033',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: '#F5C033',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  blue: {
    shadowColor: '#4FC3F7',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  red: {
    shadowColor: '#FF6B6B',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  card: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 6,
  },
};

export const NAV_THEME = {
  dark: true,
  colors: {
    primary:      '#F5C033',
    background:   '#0D1F2D',
    card:         '#0D1F2D',
    text:         '#FFFFFF',
    border:       'rgba(255,255,255,0.10)',
    notification: '#F5C033',
  },
};
