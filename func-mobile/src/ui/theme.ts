import type { LiveStatus, PriceTier, VenueCategory } from '@/domain/types';

export const colors = {
  bg: '#16161a',
  surface: '#1f1f25',
  surfaceRaised: '#26262e',
  border: '#2e2e37',
  text: '#f2f2f5',
  muted: '#8d8d99',
  faint: '#55555f',
  accent: '#e8e8ee',
  danger: '#ef4444',
  chrome: '#c9c9d2',

  // Category colours — locked. Green is reserved for DTF live status only.
  restaurant: '#e5484d',
  bar: '#9b6cf6',
  club: '#b4b4c0',
  cafe: '#f2c94c',
  daytime: '#4c8df6',

  // Live status
  dtf: '#22c55e',
  casual: '#f59e0b',
  off: '#6b6b76',
} as const;

export function categoryColor(c: VenueCategory): string {
  switch (c) {
    case 'restaurant':
      return colors.restaurant;
    case 'bar':
      return colors.bar;
    case 'club':
      return colors.club;
    case 'cafe':
      return colors.cafe;
    case 'daytime':
      return colors.daytime;
    case 'shop':
      return colors.muted; // never drawn on the map
  }
}

export function categoryLabel(c: VenueCategory): string {
  switch (c) {
    case 'restaurant':
      return 'Restaurant';
    case 'bar':
      return 'Bar';
    case 'club':
      return 'Club';
    case 'cafe':
      return 'Café';
    case 'daytime':
      return 'Daytime';
    case 'shop':
      return 'Shop';
  }
}

export function statusColor(s: LiveStatus): string {
  return s === 'dtf' ? colors.dtf : s === 'casual' ? colors.casual : colors.off;
}

export function statusLabel(s: LiveStatus): string {
  return s === 'dtf' ? 'DTF' : s === 'casual' ? 'Casual' : 'Off';
}

/** Soft price signal only — one to four symbols. Never a sort or filter. */
export function priceSymbols(tier: PriceTier, symbol = '$'): string {
  return symbol.repeat(tier);
}

export const radius = { sm: 8, md: 12, lg: 18, pill: 999 } as const;
export const space = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 } as const;

export const font = {
  title: { fontSize: 26, fontWeight: '700' as const, color: colors.text, letterSpacing: -0.5 },
  h2: { fontSize: 18, fontWeight: '600' as const, color: colors.text },
  body: { fontSize: 15, color: colors.text },
  small: { fontSize: 13, color: colors.muted },
  tiny: { fontSize: 11, color: colors.muted, letterSpacing: 0.4, textTransform: 'uppercase' as const },
};
