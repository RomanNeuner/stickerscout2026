export const COLORS = {
  // Backgrounds
  bg: '#0A1A0F',
  surface: '#111D14',
  surfaceRaised: '#192B1E',
  surfaceHigh: '#223428',
  border: '#2A3D2F',
  borderLight: '#3A5240',

  // WM Gold (primary)
  gold: '#FFD700',
  goldLight: '#FFE44D',
  goldBright: '#FFF080',
  goldDim: '#C8A800',
  goldDark: '#8A7000',
  goldDeep: '#3A2E00',
  goldMuted: '#A88C00',

  // Football Green (secondary)
  green: '#2D6A4F',
  greenLight: '#40916C',
  greenBright: '#52B788',
  greenDim: '#1B4332',
  greenDeep: '#0A2618',

  // Action Red
  red: '#E63946',
  redLight: '#FF6B74',
  redDim: '#B02831',

  // Text hierarchy
  textPrimary: '#FFFFFF',
  textSecondary: '#8AAA90',
  textMuted: '#506A58',
  textOnGold: '#1A1200',

  // Status
  owned: '#52B788',      // green — sticker owned
  missing: '#E63946',    // red — sticker missing
  duplicate: '#FFD700',  // gold — duplicate
  unknown: '#3A5240',    // dark — not yet registered

  // Rarity
  common: '#6B7280',
  rare: '#F97316',
  foil: '#FFD700',

  // Utility
  white: '#FFFFFF',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.7)',
};

export const GRADIENTS = {
  goldButton: ['#8A7000', '#C8A800', '#FFD700', '#FFE44D', '#C8A800', '#8A7000'],
  goldAccent: ['#A88C00', '#FFD700', '#FFF080', '#FFD700', '#A88C00'],
  greenHeader: ['#0A1A0F', '#111D14'],
  cardDark: ['#192B1E', '#111D14'],
  heroGreen: ['#0A2618', '#1B4332', '#2D6A4F'],
  success: ['#1B4332', '#52B788'],
  foil: ['#FFD700', '#FF6B74', '#A78BFA', '#52B788', '#FFD700'],
};

export const FONTS = {
  sizes: {
    xs: 10,
    sm: 12,
    md: 14,
    lg: 16,
    xl: 20,
    xxl: 28,
    xxxl: 40,
    display: 52,
  },
  weights: {
    regular: '400',
    medium: '500',
    semibold: '600',
    bold: '700',
    black: '900',
  },
};

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
  xxxl: 48,
};

export const RADIUS = {
  sm: 8,
  md: 14,
  lg: 20,
  xl: 28,
  full: 9999,
};

export const SHADOWS = {
  gold: {
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  goldGlow: {
    shadowColor: '#FFE44D',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 12,
  },
  green: {
    shadowColor: '#52B788',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
  },
  red: {
    shadowColor: '#E63946',
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
    primary: COLORS.gold,
    background: COLORS.bg,
    card: '#111D14',
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.gold,
  },
};
