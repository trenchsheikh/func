import React from 'react';
import Svg, { Circle, ClipPath, Defs, G, Line, LinearGradient, Path, Stop } from 'react-native-svg';
import { colors } from '../theme';

/**
 * func mark: an eye/lens outline with a disco ball at the centre, hung from
 * the eye's inner apex by a short cord and ring. Chrome/mirror-tile treatment
 * at display sizes; below 64px the tile facets alias, so a flat simplified
 * version is drawn instead.
 */
export function Logo({ size = 120, color }: { size?: number; color?: string }) {
  const width = size;
  const height = Math.round(size * 0.6);
  const flat = size < 64;
  // viewBox 100x60; eye apex (top of lens) at y = 12.5, ball centred at (50,31)
  const eye = 'M5 30 Q50 -5 95 30 Q50 65 5 30 Z';

  if (flat) {
    const c = color ?? '#e8e8ee';
    return (
      <Svg width={width} height={height} viewBox="0 0 100 60">
        <Path d={eye} stroke={c} strokeWidth={5} fill="none" strokeLinejoin="round" />
        <Line x1={50} y1={12.5} x2={50} y2={17} stroke={c} strokeWidth={3} />
        <Circle cx={50} cy={31} r={13} fill={c} />
        <Line x1={37} y1={31} x2={63} y2={31} stroke={colors.nearBlack} strokeWidth={2} />
        <Line x1={50} y1={18} x2={50} y2={44} stroke={colors.nearBlack} strokeWidth={2} />
      </Svg>
    );
  }

  const R = 13;
  const cx = 50;
  const cy = 31;
  const grid = [-9, -4.5, 0, 4.5, 9];
  return (
    <Svg width={width} height={height} viewBox="0 0 100 60">
      <Defs>
        <LinearGradient id="chrome" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#ffffff" />
          <Stop offset="0.35" stopColor="#c9c9d2" />
          <Stop offset="0.55" stopColor="#7c7c88" />
          <Stop offset="0.75" stopColor="#e6e6ec" />
          <Stop offset="1" stopColor="#8f8f9b" />
        </LinearGradient>
        <LinearGradient id="ball" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#f4f4f8" />
          <Stop offset="0.5" stopColor="#a8a8b4" />
          <Stop offset="1" stopColor="#5d5d68" />
        </LinearGradient>
        <ClipPath id="ballClip">
          <Circle cx={cx} cy={cy} r={R} />
        </ClipPath>
      </Defs>
      {/* lens */}
      <Path d={eye} stroke="url(#chrome)" strokeWidth={4.5} fill="none" strokeLinejoin="round" />
      {/* cord + ring from the inner apex to the ball */}
      <Line x1={cx} y1={12.5} x2={cx} y2={cy - R - 2.5} stroke="#c9c9d2" strokeWidth={1.4} />
      <Circle cx={cx} cy={cy - R - 1.2} r={1.6} stroke="#e6e6ec" strokeWidth={1} fill="none" />
      {/* ball */}
      <Circle cx={cx} cy={cy} r={R} fill="url(#ball)" />
      <G clipPath="url(#ballClip)" stroke={colors.nearBlack} strokeWidth={0.8} opacity={0.75}>
        {grid.map((d) => (
          <Line key={`v${d}`} x1={cx + d} y1={cy - R} x2={cx + d} y2={cy + R} />
        ))}
        {grid.map((d) => (
          <Line key={`h${d}`} x1={cx - R} y1={cy + d} x2={cx + R} y2={cy + d} />
        ))}
      </G>
      {/* a few lit tiles */}
      <G clipPath="url(#ballClip)" fill="#ffffff" opacity={0.85}>
        <Path d={`M${cx - 4.5} ${cy - 9} h4.5 v4.5 h-4.5 z`} />
        <Path d={`M${cx + 4.5} ${cy} h4.5 v4.5 h-4.5 z`} />
        <Path d={`M${cx - 9} ${cy + 4.5} h4.5 v4.5 h-4.5 z`} />
      </G>
      <Circle cx={cx} cy={cy} r={R} stroke="#ffffff" strokeWidth={0.6} fill="none" opacity={0.5} />
    </Svg>
  );
}
