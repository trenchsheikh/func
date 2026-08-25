import React from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

type P = { size?: number; color?: string };

export function LockIcon({ size = 20, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M7 10V7a5 5 0 0 1 10 0v3" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
      <Rect x={5} y={10} width={14} height={10} rx={2} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={15} r={1} fill={color} />
    </Svg>
  );
}

export function DiscoBallIcon({ size = 20, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={8.5} stroke={color} strokeWidth={1.8} fill="none" />
      <Path d="M4.7 9.5h14.6M4.7 14.5h14.6M9.5 4.7v14.6M14.5 4.7v14.6" stroke={color} strokeWidth={1.1} opacity={0.8} />
    </Svg>
  );
}

export type InviteCoverVariant = 'discoball' | 'city' | 'mic' | 'cocktail' | 'sunrise' | 'headphones' | 'spark' | 'pizza';

/** Small, monochrome event glyphs for cover art; deliberately not emoji glyphs. */
export function InviteCoverIcon({ variant, size = 30, color = '#fff' }: P & { variant: InviteCoverVariant }) {
  const common = { stroke: color, strokeWidth: 1.8, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };
  switch (variant) {
    case 'discoball':
      return <DiscoBallIcon size={size} color={color} />;
    case 'city':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 20V9l5 2V6l5 2v-4l6 3v13z" {...common} /><Path d="M8 14h1M12 15h1M17 12h1M17 16h1" {...common} /></Svg>;
    case 'mic':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Rect x={9} y={3} width={6} height={11} rx={3} {...common} /><Path d="M6 11a6 6 0 0 0 12 0M12 17v4M9 21h6" {...common} /></Svg>;
    case 'cocktail':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M5 5h14l-7 7v7M9 21h6M12 12l-4-7M15 3l3-2" {...common} /></Svg>;
    case 'sunrise':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M3 18h18M6 15a6 6 0 0 1 12 0M12 3v3M5.6 6.6l2.1 2.1M18.4 6.6l-2.1 2.1" {...common} /></Svg>;
    case 'headphones':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 14v-2a8 8 0 0 1 16 0v2M4 14h3v5H5a1 1 0 0 1-1-1zM20 14h-3v5h2a1 1 0 0 0 1-1z" {...common} /></Svg>;
    case 'spark':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="m12 2 1.8 7.2L21 11l-7.2 1.8L12 20l-1.8-7.2L3 11l7.2-1.8z" {...common} /></Svg>;
    case 'pizza':
      return <Svg width={size} height={size} viewBox="0 0 24 24"><Path d="M4 5c6-3 12-3 16 0l-8 15z" {...common} /><Circle cx={10} cy={10} r={1} fill={color} /><Circle cx={13} cy={14} r={1} fill={color} /></Svg>;
  }
}

export function PlusIcon({ size = 24, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M12 5v14M5 12h14" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChatIcon({ size = 24, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H9l-5 4z" stroke={color} strokeWidth={2} strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function InboxIcon({ size = 24, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M4 13l2.5-7h11L20 13v6H4z" stroke={color} strokeWidth={2} strokeLinejoin="round" fill="none" />
      <Path d="M4 13h5a3 3 0 0 0 6 0h5" stroke={color} strokeWidth={2} strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function PersonIcon({ size = 24, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={8} r={4} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M4 20a8 8 0 0 1 16 0" stroke={color} strokeWidth={2} strokeLinecap="round" fill="none" />
    </Svg>
  );
}

export function SearchIcon({ size = 20, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={11} cy={11} r={6} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M16 16l4 4" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function CloseIcon({ size = 20, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M6 6l12 12M18 6L6 18" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}

export function ChevronIcon({ size = 18, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M9 6l6 6-6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function BackIcon({ size = 22, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path d="M15 6l-6 6 6 6" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" fill="none" />
    </Svg>
  );
}

export function LocateIcon({ size = 20, color = '#fff' }: P) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={2} fill="none" />
      <Circle cx={12} cy={12} r={8} stroke={color} strokeWidth={2} fill="none" />
      <Path d="M12 2v3M12 19v3M2 12h3M19 12h3" stroke={color} strokeWidth={2} strokeLinecap="round" />
    </Svg>
  );
}
