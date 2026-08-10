/**
 * Theme tokens.
 *
 * Layer 5 — the chrome/liquid-metal identity and the six-beat opening
 * animation — is explicitly out of scope for this phase. This is a restrained
 * placeholder that follows the two identity rules already settled in standing
 * orders, so the real design pass can be dropped on top without rebuilding
 * anything underneath:
 *
 *   - **Emerald signals life only** — heat, presence, a live story. Everything
 *     else is chrome, glass or white. If everything is coloured, nothing means
 *     anything.
 *   - **No emoji as iconography, ever.**
 */

export const colour = {
  ink: '#04070A',
  ink2: '#080D12',
  surface: '#0E141A',
  surface2: '#161E26',
  hairline: 'rgba(255,255,255,0.09)',

  fg: '#E6F1F7',
  fg2: '#A8B8C4',
  fg3: '#7A8B98',
  fg4: '#48565F',

  /** Life. Presence, heat, a live story. Nothing decorative. */
  em: '#12E08A',
  emHi: '#46FFB4',
  emDim: 'rgba(18,224,138,0.16)',

  /** Amber — out, but not sharing. */
  amber: '#F5C542',
  /** Premium. */
  disco: '#C8A2FF',
  gold: '#F5C542',
  danger: '#FF6B7D',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 18,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 30, fontWeight: '800', letterSpacing: -0.4 },
  h1: { fontSize: 22, fontWeight: '800', letterSpacing: -0.2 },
  h2: { fontSize: 17, fontWeight: '700' },
  body: { fontSize: 14.5, fontWeight: '400' },
  small: { fontSize: 12.5, fontWeight: '400' },
  /** Condensed uppercase label, per the identity notes. */
  label: { fontSize: 10.5, fontWeight: '700', letterSpacing: 1.2 },
} as const;

/** Presence → colour. The only place the traffic light is given a value. */
export function presenceColour(kind: 'dtf' | 'casual' | 'off'): string {
  if (kind === 'dtf') return colour.em;
  if (kind === 'casual') return colour.amber;
  return colour.fg4;
}
