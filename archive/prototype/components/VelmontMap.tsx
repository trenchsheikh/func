import React, { useEffect, useRef } from 'react';
import { Animated, Easing, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  Ellipse,
  G,
  Line,
  Path,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import {
  coastStroke,
  districts,
  heatPoints,
  MAP_H,
  MAP_W,
  seaPath,
  streets,
  venues,
} from '../data/velmont';
import { flareTier, storiesForVenue } from '../data/stories';
import { Venue } from '../data/types';
import { colors } from '../lib/theme';

const LAND = '#0E0E17';
const HEAT_RADIUS = { 1: 16, 2: 24, 3: 32 } as const;
const HEAT_FILL = { 1: 'url(#heatPurple)', 2: 'url(#heatPink)', 3: 'url(#heatCyan)' } as const;
const RING_R = 13;
const RING_CIRC = 2 * Math.PI * RING_R;
const MAX_RING_SLOTS = 8;

const AnimatedCircle = Animated.createAnimatedComponent(Circle);
const AnimatedPath = Animated.createAnimatedComponent(Path);

interface Props {
  selectedVenueId?: string;
  onVenuePress: (venue: Venue) => void;
  width?: number;
  height?: number;
  // Group Lens fit score per venue, 0..1 (Map v3 spec §1.4) — drives Beacon core-glow
  // size, so the venue that's best FOR YOUR CREW is visibly the biggest on the map.
  fitScores?: Record<string, number>;
  // The active "Call It" plan, if any (Map v3 spec §1.6) — renders the crew flag.
  planVenueId?: string;
  planVoteCount?: number;
  planTotal?: number;
  planLocked?: boolean;
}

export function VelmontMap({
  selectedVenueId,
  onVenuePress,
  width,
  height,
  fitScores,
  planVenueId,
  planVoteCount = 0,
  planTotal = 1,
  planLocked = false,
}: Props) {
  // Heartbeat pulse — reused for the burn ring shimmer and the flag-lock burst.
  const pulse = useRef(new Animated.Value(0)).current;
  const burst = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(pulse, {
        toValue: 1,
        duration: 1600,
        easing: Easing.out(Easing.quad),
        useNativeDriver: false,
      })
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  useEffect(() => {
    if (!planLocked) return;
    burst.setValue(0);
    Animated.timing(burst, { toValue: 1, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, [planLocked, burst]);

  const haloR = pulse.interpolate({ inputRange: [0, 1], outputRange: [9, 26] });
  const haloOpacity = pulse.interpolate({ inputRange: [0, 1], outputRange: [0.55, 0] });
  const burstR = burst.interpolate({ inputRange: [0, 1], outputRange: [4, 34] });
  const burstOpacity = burst.interpolate({ inputRange: [0, 1], outputRange: [0.8, 0] });

  return (
    <View style={width ? { width, height, backgroundColor: LAND } : { flex: 1, backgroundColor: LAND }}>
      <Svg
        width={width ?? '100%'}
        height={height ?? '100%'}
        viewBox={`0 0 ${MAP_W} ${MAP_H}`}
        preserveAspectRatio="xMidYMid meet"
      >
        <Defs>
          {/* Heat tiers: purple → pink → cyan as intensity rises (spec §Screens.Map) */}
          <RadialGradient id="heatPurple" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.primary} stopOpacity="0.45" />
            <Stop offset="100%" stopColor={colors.primary} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="heatPink" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.secondary} stopOpacity="0.5" />
            <Stop offset="100%" stopColor={colors.secondary} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="heatCyan" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.55" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </RadialGradient>
          {/* Beacon core glow — fit-scored, Map v3 spec §1.3 */}
          <RadialGradient id="beaconGlow" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colors.accent} stopOpacity="0.65" />
            <Stop offset="60%" stopColor={colors.accent} stopOpacity="0.22" />
            <Stop offset="100%" stopColor={colors.accent} stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={MAP_W} height={MAP_H} fill={LAND} />

        {/* District washes */}
        {districts.map((d) => (
          <Ellipse key={d.id} cx={d.cx} cy={d.cy} rx={d.rx} ry={d.ry} fill="#15151F" />
        ))}

        {/* Streets */}
        {streets.map((s, i) => (
          <Path key={i} d={s} stroke="#1E1E2C" strokeWidth={3} fill="none" strokeLinecap="round" />
        ))}

        {/* Sea */}
        <Path d={seaPath} fill={colors.sea} />
        <Path d={coastStroke} stroke="#1B2A44" strokeWidth={2} fill="none" />
        <SvgText
          x={290}
          y={565}
          fill="#233551"
          fontSize={13}
          fontStyle="italic"
          letterSpacing={3}
          textAnchor="middle"
        >
          VELMONT SOUND
        </SvgText>

        {/* Heat: low tier first so hot cores layer on top */}
        {([1, 2, 3] as const).map((tier) => (
          <G key={tier}>
            {heatPoints
              .filter((p) => p.w === tier)
              .map((p, i) => (
                <Circle key={i} cx={p.x} cy={p.y} r={HEAT_RADIUS[tier]} fill={HEAT_FILL[tier]} />
              ))}
          </G>
        ))}

        {/* District labels above the heat */}
        {districts.map((d) => (
          <SvgText
            key={`label-${d.id}`}
            x={d.cx}
            y={d.cy - d.ry - 6}
            fill="#6E6E8C"
            fontSize={11}
            fontWeight="bold"
            letterSpacing={1.5}
            textAnchor="middle"
          >
            {d.name.toUpperCase()}
          </SvgText>
        ))}

        {/* Live pulse on the hottest venues */}
        {venues
          .filter((v) => v.level === 3)
          .map((v) => (
            <AnimatedCircle
              key={`pulse-${v.id}`}
              cx={v.x}
              cy={v.y}
              r={haloR}
              fill="none"
              stroke={colors.accent}
              strokeWidth={2}
              strokeOpacity={haloOpacity}
            />
          ))}

        {/* Beacons: core glow (fit score) + burn ring (fresh flares) + pin + crew badge */}
        {venues.map((v) => {
          const selected = v.id === selectedVenueId;
          const fit = fitScores?.[v.id] ?? 0.35;
          const glowR = 15 + fit * 26;

          const fresh = storiesForVenue(v.id).map((s) => flareTier(s.minutesAgo));
          const hotCount = Math.min(fresh.filter((t) => t === 'hot').length, MAX_RING_SLOTS);
          const emberCount = Math.min(fresh.filter((t) => t === 'ember').length, MAX_RING_SLOTS);
          const hotDash = (hotCount / MAX_RING_SLOTS) * RING_CIRC;
          const emberDash = (emberCount / MAX_RING_SLOTS) * RING_CIRC;

          return (
            <G key={v.id}>
              {/* fit-scored core glow */}
              {fitScores && <Circle cx={v.x} cy={v.y} r={glowR} fill="url(#beaconGlow)" />}

              {/* burn ring — ember (outer, dimmer) then hot (inner, bright) */}
              {emberCount > 0 && (
                <Circle
                  cx={v.x}
                  cy={v.y}
                  r={RING_R + 3}
                  fill="none"
                  stroke={colors.secondary}
                  strokeOpacity={0.55}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray={`${emberDash} ${RING_CIRC}`}
                  transform={`rotate(-90 ${v.x} ${v.y})`}
                />
              )}
              {hotCount > 0 && (
                <Circle
                  cx={v.x}
                  cy={v.y}
                  r={RING_R}
                  fill="none"
                  stroke={colors.accent}
                  strokeWidth={2.5}
                  strokeLinecap="round"
                  strokeDasharray={`${hotDash} ${RING_CIRC}`}
                  transform={`rotate(-90 ${v.x} ${v.y})`}
                />
              )}

              {/* hit area + pin core */}
              <Circle cx={v.x} cy={v.y} r={18} fill={LAND} fillOpacity={0.01} onPress={() => onVenuePress(v)} />
              <Circle
                cx={v.x}
                cy={v.y}
                r={selected ? 8 : 5.5}
                fill={colors.surface}
                stroke={selected ? colors.accent : colors.secondary}
                strokeWidth={2}
                onPress={() => onVenuePress(v)}
              />
              <Circle cx={v.x} cy={v.y} r={selected ? 3 : 2} fill={selected ? colors.accent : colors.secondary} />

              {/* crew badge */}
              {v.groupsTonight >= 2 && (
                <G>
                  <Circle cx={v.x + 13} cy={v.y - 13} r={7} fill={colors.surfaceHi} stroke={colors.border} strokeWidth={1} />
                  <SvgText x={v.x + 13} y={v.y - 10} fontSize={8} fontWeight="bold" fill={colors.text} textAnchor="middle">
                    {v.groupsTonight}
                  </SvgText>
                </G>
              )}
            </G>
          );
        })}

        {/* Plan flag — Call It verdict (Map v3 spec §1.6) */}
        {planVenueId &&
          (() => {
            const v = venues.find((x) => x.id === planVenueId);
            if (!v) return null;
            const frac = Math.min(1, planVoteCount / Math.max(1, planTotal));
            const poleTop = v.y - 34;
            const pennantColor = planLocked ? colors.accent : colors.secondary;
            return (
              <G key="plan-flag">
                <Line x1={v.x} y1={v.y - 8} x2={v.x} y2={poleTop} stroke={colors.textDim} strokeWidth={2} />
                <Path
                  d={`M ${v.x} ${poleTop} L ${v.x + 22} ${poleTop + 5 + (1 - frac) * 8} L ${v.x} ${poleTop + 10 + (1 - frac) * 8} Z`}
                  fill={pennantColor}
                  opacity={0.55 + frac * 0.45}
                />
                {planLocked && (
                  <AnimatedCircle cx={v.x} cy={poleTop} r={burstR} fill="none" stroke={colors.accent} strokeWidth={2} strokeOpacity={burstOpacity} />
                )}
              </G>
            );
          })()}
      </Svg>
    </View>
  );
}
