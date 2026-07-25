import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Circle,
  ClipPath,
  Defs,
  Ellipse,
  G,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import { stories } from '../data/stories';
import {
  GLOBE_CX,
  GLOBE_CY,
  GLOBE_R,
  WORLD_H,
  WORLD_W,
  worldArcs,
  worldCities,
} from '../data/world';
import { WorldCity } from '../data/types';
import { colors } from '../lib/theme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const SPACE = '#07070D';
const NODE_R = { 1: 5, 2: 7, 3: 11 } as const;

interface Props {
  onCityPress: (city: WorldCity) => void;
}

export function WorldMap({ onCityPress }: Props) {
  // One shared pulse for the live city's halo — the globe's heartbeat.
  const pulse = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1800,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const haloR = pulse.interpolate({ inputRange: [0, 1], outputRange: [12, 34] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] });

  const velmont = worldCities.find((c) => c.live)!;

  return (
    <View style={{ flex: 1, backgroundColor: SPACE }}>
      <Svg width="100%" height="100%" viewBox={`0 0 ${WORLD_W} ${WORLD_H}`} preserveAspectRatio="xMidYMid meet">
        <Defs>
          <RadialGradient id="globeGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#161629" stopOpacity="1" />
            <Stop offset="85%" stopColor="#0C0C18" stopOpacity="1" />
            <Stop offset="100%" stopColor={SPACE} stopOpacity="1" />
          </RadialGradient>
          <RadialGradient id="cityGlowLive" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.9" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="cityGlowSoon" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.8" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </RadialGradient>
          <ClipPath id="globeClip">
            <Circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} />
          </ClipPath>
        </Defs>

        <Rect x={0} y={0} width={WORLD_W} height={WORLD_H} fill={SPACE} />

        {/* A few stars */}
        {[
          [30, 80], [340, 60], [60, 560], [330, 520], [200, 40], [20, 300],
          [370, 250], [90, 620], [300, 610], [350, 420],
        ].map(([x, y], i) => (
          <Circle key={i} cx={x} cy={y} r={i % 3 === 0 ? 1.6 : 1} fill="#2A2A44" />
        ))}

        {/* Globe */}
        <Circle cx={GLOBE_CX} cy={GLOBE_CY} r={GLOBE_R} fill="url(#globeGlow)" stroke="#26263E" strokeWidth={1.5} />
        <G clipPath="url(#globeClip)">
          {/* Graticule: meridians + parallels */}
          {[52, 105, 150].map((rx) => (
            <Ellipse key={`m${rx}`} cx={GLOBE_CX} cy={GLOBE_CY} rx={rx} ry={GLOBE_R} stroke="#1D1D32" strokeWidth={1} fill="none" />
          ))}
          {[-100, -52, 0, 52, 100].map((off) => (
            <Ellipse
              key={`p${off}`}
              cx={GLOBE_CX}
              cy={GLOBE_CY + off}
              rx={Math.sqrt(Math.max(GLOBE_R * GLOBE_R - off * off, 0))}
              ry={Math.abs(off) < 10 ? 24 : 16}
              stroke="#1D1D32"
              strokeWidth={1}
              fill="none"
            />
          ))}
        </G>

        {/* Network arcs out of Velmont */}
        {worldArcs.map((a) => {
          const to = worldCities.find((c) => c.id === a.to);
          if (!to) return null;
          return (
            <Path
              key={a.to}
              d={`M ${velmont.x} ${velmont.y} Q ${a.via[0]} ${a.via[1]} ${to.x} ${to.y}`}
              stroke={colors.secondary}
              strokeOpacity={0.28}
              strokeWidth={1.5}
              strokeDasharray="3 5"
              fill="none"
            />
          );
        })}

        {/* Live halo pulse on Velmont */}
        <AnimatedCircle cx={velmont.x} cy={velmont.y} r={haloR} fill="none" stroke={colors.accent} strokeWidth={2} strokeOpacity={haloOpacity} />

        {/* City nodes */}
        {worldCities.map((c) => (
          <G key={c.id} onPress={() => onCityPress(c)}>
            <Circle cx={c.x} cy={c.y} r={22} fill={SPACE} fillOpacity={0.01} />
            <Circle cx={c.x} cy={c.y} r={NODE_R[c.size] * 2.6} fill={c.live ? 'url(#cityGlowLive)' : 'url(#cityGlowSoon)'} opacity={c.live ? 1 : 0.55} />
            <Circle
              cx={c.x}
              cy={c.y}
              r={NODE_R[c.size]}
              fill={c.live ? colors.accent : colors.surfaceHi}
              stroke={c.live ? '#DFFBFF' : colors.primary}
              strokeWidth={c.live ? 2 : 1.2}
            />
            <SvgText
              x={c.x}
              y={c.y - NODE_R[c.size] - 7}
              fill={c.live ? colors.text : '#7A7A99'}
              fontSize={c.live ? 13 : 10.5}
              fontWeight="bold"
              textAnchor="middle"
            >
              {c.name}
            </SvgText>
            <SvgText x={c.x} y={c.y + NODE_R[c.size] + 13} fill={c.live ? colors.accent : '#565678'} fontSize={9} textAnchor="middle">
              {c.live ? `${c.out} out · ${stories.length} flares live` : `${Intl.NumberFormat().format(c.out)} out`}
            </SvgText>
          </G>
        ))}

        <SvgText x={GLOBE_CX} y={GLOBE_CY + GLOBE_R + 34} fill="#3A3A58" fontSize={11} letterSpacing={4} textAnchor="middle" fontWeight="bold">
          FUNC · PLANET EARTH
        </SvgText>
        <SvgText x={GLOBE_CX} y={GLOBE_CY + GLOBE_R + 52} fill="#565678" fontSize={11} textAnchor="middle">
          Tap a city to drop in
        </SvgText>
      </Svg>
    </View>
  );
}
