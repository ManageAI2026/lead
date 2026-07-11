/**
 * Design tokens extracted from the approved prototypes. The web app exposes
 * these as CSS custom properties (see apps/web/app/globals.css) so both the
 * marketing site and the dashboard render from one system.
 */

export const COLORS = {
  bg: '#ffffff',
  surf: '#F5F6F8',
  surfHover: '#EDF0F4',
  border: '#E2E6EC',
  borderLight: '#EEF0F4',
  text: '#1E293B',
  text2: '#475569',
  text3: '#7A8B9A',
  navy: '#1E3348',
  accent: '#4A8FD6',
  accentMid: '#6BAAE0',
  accentDark: '#2D6AAF',
  accentLight: '#EBF3FC',
  green: '#16A34A',
  greenLight: '#E8F8EE',
  amber: '#D97706',
  amberLight: '#FEF8E8',
  red: '#DC2626',
  redLight: '#FEF2F2',
  purple: '#7C5CFC',
  purpleLight: '#F0EDFF',
} as const;

export const FONTS = {
  sans: "'Montserrat', system-ui, -apple-system, sans-serif",
  mono: "'JetBrains Mono', ui-monospace, Menlo, monospace",
} as const;

/** Email-status → label + colors. */
export const EMAIL_STATUS_META: Record<
  string,
  { label: string; color: string; bg: string }
> = {
  deliverable: { label: 'Deliverable', color: COLORS.green, bg: COLORS.greenLight },
  risky: { label: 'Risky', color: COLORS.amber, bg: COLORS.amberLight },
  guess: { label: 'Guess', color: COLORS.red, bg: COLORS.redLight },
  unknown: { label: 'Unknown', color: COLORS.text3, bg: COLORS.surf },
};

/** Tier → colors. */
export const TIER_META: Record<string, { color: string; bg: string }> = {
  A: { color: COLORS.green, bg: COLORS.greenLight },
  B: { color: COLORS.accent, bg: COLORS.accentLight },
  C: { color: COLORS.text3, bg: COLORS.surf },
};
