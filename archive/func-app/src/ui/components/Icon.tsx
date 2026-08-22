/**
 * The icon set.
 *
 * Tier 0: no emoji as iconography, ever. Every glyph in the app comes from
 * here, so there is one place to check that rule and one place to restyle when
 * the real identity pass lands.
 */

import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { colour } from '../theme';

export type IconName =
  | 'eye'
  | 'cards'
  | 'plans'
  | 'inbox'
  | 'me'
  | 'search'
  | 'sliders'
  | 'close'
  | 'check'
  | 'verified'
  | 'pin'
  | 'people'
  | 'camera'
  | 'star'
  | 'back'
  | 'globe'
  | 'token'
  | 'lock';

export interface IconProps {
  readonly name: IconName;
  readonly size?: number;
  readonly color?: string;
  readonly strokeWidth?: number;
}

export function Icon({
  name,
  size = 22,
  color = colour.fg,
  strokeWidth = 1.9,
}: IconProps): React.JSX.Element {
  const stroke = { stroke: color, strokeWidth, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const, fill: 'none' };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === 'eye' && (
        <>
          <Path d="M1.8 12S5.6 5.2 12 5.2 22.2 12 22.2 12 18.4 18.8 12 18.8 1.8 12 1.8 12Z" {...stroke} />
          <Circle cx="12" cy="12" r="3.1" {...stroke} />
        </>
      )}
      {name === 'cards' && (
        <>
          <Rect x="3" y="6" width="12" height="15" rx="2.6" {...stroke} />
          <Path d="M8.5 3.4h8A2.6 2.6 0 0 1 19 6v11" {...stroke} />
        </>
      )}
      {name === 'plans' && (
        <>
          <Rect x="3.2" y="5" width="17.6" height="16" rx="3" {...stroke} />
          <Path d="M3.2 10h17.6M8 3v4M16 3v4" {...stroke} />
        </>
      )}
      {name === 'inbox' && (
        <>
          <Path d="M3 7.5 12 13l9-5.5" {...stroke} />
          <Rect x="3" y="5" width="18" height="14" rx="2.8" {...stroke} />
        </>
      )}
      {name === 'me' && (
        <>
          <Circle cx="12" cy="8.2" r="3.7" {...stroke} />
          <Path d="M4.6 20.2a7.6 7.6 0 0 1 14.8 0" {...stroke} />
        </>
      )}
      {name === 'search' && (
        <>
          <Circle cx="11" cy="11" r="6.4" {...stroke} />
          <Path d="m16 16 4.4 4.4" {...stroke} />
        </>
      )}
      {name === 'sliders' && (
        <>
          <Path d="M4 8h10M18 8h2M4 16h4M12 16h8" {...stroke} />
          <Circle cx="16" cy="8" r="2.2" {...stroke} />
          <Circle cx="10" cy="16" r="2.2" {...stroke} />
        </>
      )}
      {name === 'close' && <Path d="m6 6 12 12M18 6 6 18" {...stroke} strokeWidth={2.2} />}
      {name === 'check' && <Path d="m4.5 12.5 5 5 10-11" {...stroke} strokeWidth={2.6} />}
      {name === 'verified' && (
        <>
          <Path
            d="m12 1.8 2.6 2.1 3.3-.4 1.2 3.1 2.9 1.7-1.2 3.1 1.2 3.1-2.9 1.7-1.2 3.1-3.3-.4L12 22.2l-2.6-2.1-3.3.4-1.2-3.1L2 15.7l1.2-3.1L2 9.5l2.9-1.7 1.2-3.1 3.3.4Z"
            fill={color}
          />
          <Path d="m8.4 12.3 2.5 2.5 4.7-5" stroke={colour.ink} strokeWidth={2} fill="none" strokeLinecap="round" strokeLinejoin="round" />
        </>
      )}
      {name === 'pin' && (
        <>
          <Path d="M12 21.5s7-6.1 7-11.2a7 7 0 1 0-14 0c0 5.1 7 11.2 7 11.2Z" {...stroke} />
          <Circle cx="12" cy="10" r="2.6" {...stroke} />
        </>
      )}
      {name === 'people' && (
        <>
          <Circle cx="9" cy="8.4" r="3.4" {...stroke} />
          <Path d="M2.8 19.6a6.4 6.4 0 0 1 12.4 0" {...stroke} />
          <Path d="M16.2 5.4a3.4 3.4 0 0 1 0 6.5M17.6 19.6a6.5 6.5 0 0 0-1.6-4.2" {...stroke} />
        </>
      )}
      {name === 'camera' && (
        <>
          <Path d="M3 8.6h3.2l1.6-2.4h8.4l1.6 2.4H21v10.2H3Z" {...stroke} />
          <Circle cx="12" cy="13.4" r="3.5" {...stroke} />
        </>
      )}
      {name === 'star' && (
        <Path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9Z" fill={color} />
      )}
      {name === 'back' && <Path d="M14.5 5 8 12l6.5 7" {...stroke} strokeWidth={2.2} />}
      {name === 'globe' && (
        <>
          <Circle cx="12" cy="12" r="9" {...stroke} strokeWidth={1.8} />
          <Path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18" {...stroke} strokeWidth={1.8} />
        </>
      )}
      {name === 'token' && (
        <>
          <Circle cx="12" cy="12" r="8.6" {...stroke} strokeWidth={1.8} />
          <Circle cx="12" cy="12" r="4.4" {...stroke} strokeWidth={1.8} />
          <Path d="M12 3.4v3.9M12 16.7v3.9M20.6 12h-3.9M7.3 12H3.4" {...stroke} strokeWidth={1.8} />
        </>
      )}
      {name === 'lock' && (
        <>
          <Rect x="4.5" y="10.5" width="15" height="10" rx="2.6" {...stroke} />
          <Path d="M8 10.5V7.8a4 4 0 0 1 8 0v2.7" {...stroke} />
        </>
      )}
    </Svg>
  );
}
