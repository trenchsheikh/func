import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Stop } from 'react-native-svg';
import { colors } from '../theme';

export type DiscoTint = 'silver' | 'green' | 'amber' | 'grey';

const TINTS: Record<DiscoTint, [string, string, string]> = {
  silver: [colors.chromeBright, colors.chromeMid, colors.chromeShadow],
  green: ['#dfffe9', '#8fd6a6', '#3a7a50'],
  amber: ['#ffe9c2', '#e0a84a', '#7a5520'],
  grey: ['#8a8a94', '#5f5f69', '#3a3a42'],
};

/** Small disco ball used as a map pin for premium and business accounts. */
export function DiscoBall({ size = 22, tint = 'silver', ring }: { size?: number; tint?: DiscoTint; ring?: string }) {
  const [a, b, c] = TINTS[tint];
  const R = 10;
  const id = `db-${tint}`;
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Defs>
        <LinearGradient id={id} x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor={a} />
          <Stop offset="0.5" stopColor={b} />
          <Stop offset="1" stopColor={c} />
        </LinearGradient>
        <ClipPath id={`${id}-clip`}>
          <Circle cx={12} cy={12} r={R} />
        </ClipPath>
      </Defs>
      {ring ? <Circle cx={12} cy={12} r={11.3} stroke={ring} strokeWidth={1.4} fill="none" /> : null}
      <Circle cx={12} cy={12} r={R} fill={`url(#${id})`} />
      <G clipPath={`url(#${id}-clip)`} stroke={colors.nearBlack} strokeWidth={0.7} opacity={0.7}>
        {[-6, -2, 2, 6].map((d) => (
          <Line key={`v${d}`} x1={12 + d} y1={2} x2={12 + d} y2={22} />
        ))}
        {[-6, -2, 2, 6].map((d) => (
          <Line key={`h${d}`} x1={2} y1={12 + d} x2={22} y2={12 + d} />
        ))}
      </G>
    </Svg>
  );
}
