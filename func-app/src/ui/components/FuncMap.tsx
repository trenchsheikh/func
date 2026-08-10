/**
 * The map.
 *
 * ## On the base layer
 *
 * Standing orders commit to MapLibre with a custom func style. MapLibre for
 * React Native is a native module: it needs a development build, not Expo Go.
 * Rather than block every other screen behind a native toolchain, the map is
 * split in two — this component owns *what func draws on a map* (heat, story
 * rings, friends, mutual counts, spots, after-parties), and the base layer
 * behind it is a swappable detail.
 *
 * What is here now is a vector-drawn base: a projection, a camera, and the
 * func layers on top. Swapping in MapLibre means replacing the backdrop and
 * feeding the camera from its region, not rewriting any of the layer logic
 * below — the projection is already Web Mercator, which is what tiles use.
 *
 * ## On the layers
 *
 * The visibility gradient is enforced by what this component is *given*, not
 * by what it chooses to draw. Friends arrive as positions; mutuals arrive as a
 * count and nothing else. There is no code path here that could render a
 * mutual's location, because no mutual location is ever passed in.
 */

import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, Pressable, StyleSheet, View } from 'react-native';
import Svg, {
  Circle,
  Defs,
  G,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import type { Coordinates, Venue, VenueId } from '../../domain';
import type { VenuePresenceView } from '../../domain/visibility';
import { colour } from '../theme';
import { Icon } from './Icon';

// ---------------------------------------------------------------------------
// Projection — Web Mercator, so the maths already matches a real tile source
// ---------------------------------------------------------------------------

const mercX = (lon: number): number => (lon + 180) / 360;
const mercY = (lat: number): number => {
  const s = Math.sin((lat * Math.PI) / 180);
  return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI);
};

export interface Camera {
  /** Centre of the view. */
  readonly centre: Coordinates;
  /** World pixels across the viewport. Higher = closer in. */
  readonly scale: number;
}

/**
 * Zoom limits, in world pixels across the whole globe.
 *
 * These were an order of magnitude too small on the first run — every venue in
 * the city collapsed into one unreadable blob, which is not something reading
 * the code would have shown. A city's venue cluster spans roughly 0.06° of
 * longitude, so filling ~330pt of a phone screen needs about two million:
 * 330 ÷ (0.06 ÷ 360).
 */
const MIN_SCALE = 200_000; // the whole bay
const MAX_SCALE = 40_000_000; // individual buildings
const DEFAULT_SCALE = 2_000_000; // a city's nightlife, legibly spread

/** How close a tap has to land to count as hitting a marker, in points. */
const TAP_RADIUS = 34;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface MapFriend {
  readonly id: string;
  readonly name: string;
  readonly at: Coordinates;
}

export interface MapSpot {
  readonly id: string;
  readonly name: string;
  readonly at: Coordinates;
}

export interface MapAfterParty {
  readonly id: string;
  readonly hostName: string;
  readonly at: Coordinates;
  readonly going: number;
}

export interface FuncMapProps {
  readonly venues: readonly Venue[];
  readonly heatFor: (id: VenueId) => number;
  readonly storyCountFor: (id: VenueId) => number;
  readonly presenceFor: (id: VenueId) => VenuePresenceView | undefined;
  readonly friends: readonly MapFriend[];
  readonly spots: readonly MapSpot[];
  readonly afterParties: readonly MapAfterParty[];
  readonly me: Coordinates | null;
  readonly initialCentre: Coordinates;
  readonly onVenuePress: (venue: Venue) => void;
  readonly onSpotPress: (spotId: string) => void;
  readonly onAfterPress: (afterId: string) => void;
}

export function FuncMap({
  venues,
  heatFor,
  storyCountFor,
  presenceFor,
  friends,
  spots,
  afterParties,
  me,
  initialCentre,
  onVenuePress,
  onSpotPress,
  onAfterPress,
}: FuncMapProps): React.JSX.Element {
  const [size, setSize] = useState({ width: 390, height: 700 });
  const [camera, setCamera] = useState<Camera>({ centre: initialCentre, scale: DEFAULT_SCALE });
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  const project = useMemo(() => {
    const cx = mercX(camera.centre.lon) * camera.scale;
    const cy = mercY(camera.centre.lat) * camera.scale;
    return (at: Coordinates) => ({
      x: mercX(at.lon) * camera.scale - cx + size.width / 2,
      y: mercY(at.lat) * camera.scale - cy + size.height / 2,
    });
  }, [camera, size]);

  /**
   * Touch handling.
   *
   * Taps are hit-tested here against projected positions rather than through
   * per-shape `onPress`. Two reasons, the first found on a simulator: a friend
   * marker sits directly on top of the venue they are at and swallowed the tap,
   * so Monarch was unopenable while an empty venue opened fine. The second is
   * that a 10pt circle is a poor tap target on a phone — nearest-within-radius
   * is far more forgiving, and it lets a label count as part of its marker.
   */
  const hitTargets = useRef<{ x: number; y: number; run: () => void; priority: number }[]>([]);

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 3 || Math.abs(g.dy) > 3,
      onPanResponderMove: (_e, g) => {
        const current = cameraRef.current;
        // Convert a pixel drag back into degrees at the current scale.
        const dLon = (-g.dx / current.scale) * 360;
        const worldY = mercY(current.centre.lat) - g.dy / current.scale;
        const lat = mercYToLat(worldY);
        setCamera({ centre: { lat, lon: current.centre.lon + dLon }, scale: current.scale });
      },
      onPanResponderRelease: (e, g) => {
        // A drag is not a tap.
        if (Math.abs(g.dx) > 8 || Math.abs(g.dy) > 8) return;
        const { locationX, locationY } = e.nativeEvent;

        let best: { run: () => void; score: number } | null = null;
        for (const target of hitTargets.current) {
          const distance = Math.hypot(target.x - locationX, target.y - locationY);
          if (distance > TAP_RADIUS) continue;
          // Priority breaks ties so a small marker on top of a big heat pool
          // still wins, rather than whichever happened to be nearer.
          const score = distance - target.priority * 12;
          if (!best || score < best.score) best = { run: target.run, score };
        }
        best?.run();
      },
    }),
  ).current;

  // Rebuilt every render, because the camera moves. Cheap: a projection per
  // marker. Priority 2 beats priority 1 when both are within the tap radius.
  hitTargets.current = [
    ...afterParties.map((a) => ({ ...project(a.at), priority: 2, run: () => onAfterPress(a.id) })),
    ...spots.map((s) => ({ ...project(s.at), priority: 2, run: () => onSpotPress(s.id) })),
    ...venues.map((v) => ({ ...project(v.at), priority: 1, run: () => onVenuePress(v) })),
  ];

  const zoom = (factor: number) =>
    setCamera((c) => ({
      centre: c.centre,
      scale: Math.max(MIN_SCALE, Math.min(MAX_SCALE, c.scale * factor)),
    }));

  const recentre = () => setCamera((c) => ({ centre: me ?? initialCentre, scale: c.scale }));

  return (
    <View
      style={styles.wrap}
      onLayout={(e) => setSize({ width: e.nativeEvent.layout.width, height: e.nativeEvent.layout.height })}
      {...pan.panHandlers}
    >
      <Svg width={size.width} height={size.height}>
        <Defs>
          <RadialGradient id="heat" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor={colour.em} stopOpacity="0.62" />
            <Stop offset="45%" stopColor={colour.em} stopOpacity="0.2" />
            <Stop offset="100%" stopColor={colour.em} stopOpacity="0" />
          </RadialGradient>
          <RadialGradient id="you" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>

        <Rect x={0} y={0} width={size.width} height={size.height} fill={colour.ink} />
        <Grid width={size.width} height={size.height} />

        {/* Heat — glow only. Never a number, never a word. */}
        {venues.map((v) => {
          const p = project(v.at);
          const heat = heatFor(v.id);
          return (
            <Circle
              key={`heat-${v.id}`}
              cx={p.x}
              cy={p.y}
              r={34 + heat * 30}
              fill="url(#heat)"
              opacity={0.25 + heat * 0.6}
            />
          );
        })}

        {/* Local spots */}
        {spots.map((s) => {
          const p = project(s.at);
          return (
            <G key={`spot-${s.id}`} pointerEvents="none">
              <Circle cx={p.x} cy={p.y} r={11} fill="transparent" />
              <Circle cx={p.x} cy={p.y} r={8} stroke={colour.gold} strokeWidth={2} strokeDasharray="3 3" fill="none" />
              <Circle cx={p.x} cy={p.y} r={2.6} fill={colour.gold} />
            </G>
          );
        })}

        {/* After-parties. Always visible — there is no mode that hides them. */}
        {afterParties.map((a) => {
          const p = project(a.at);
          return (
            <G key={`after-${a.id}`} pointerEvents="none">
              <Circle cx={p.x} cy={p.y} r={24} fill={colour.disco} opacity={0.14} />
              <Circle cx={p.x} cy={p.y} r={13} fill={colour.ink2} />
              <Circle cx={p.x} cy={p.y} r={13} stroke={colour.disco} strokeWidth={2.2} fill="none" />
              <SvgText x={p.x} y={p.y + 4} textAnchor="middle" fill={colour.disco} fontSize={11} fontWeight="700">
                {String(a.going)}
              </SvgText>
              <SvgText x={p.x} y={p.y + 30} textAnchor="middle" fill="#E4D0FF" fontSize={11} fontWeight="700">
                {`${a.hostName}’s`}
              </SvgText>
            </G>
          );
        })}

        {/* Venues */}
        {venues.map((v) => {
          const p = project(v.at);
          const heat = heatFor(v.id);
          const r = 10 + heat * 8;
          const presence = presenceFor(v.id);
          const friendCount = presence?.friends.length ?? 0;
          const mutualCount = presence?.mutualCount ?? 0;
          const stories = storyCountFor(v.id);

          return (
            <G key={`venue-${v.id}`} pointerEvents="none">
              {stories > 0 && (
                <Circle cx={p.x} cy={p.y} r={r + 6} stroke={colour.emHi} strokeWidth={2.4} fill="none" strokeOpacity={0.85} />
              )}
              <Circle cx={p.x} cy={p.y} r={r} fill={colour.ink2} opacity={0.92} />
              <Circle
                cx={p.x}
                cy={p.y}
                r={r}
                stroke={colour.em}
                strokeWidth={1.6 + heat * 2.2}
                strokeOpacity={0.4 + heat * 0.6}
                fill="none"
              />
              <Circle cx={p.x} cy={p.y} r={2.6 + heat * 2.4} fill={colour.emHi} opacity={0.55 + heat * 0.45} />

              {/*
                Two separate badges, deliberately. A friend is named elsewhere
                and counted here; a mutual is only ever counted. Merging them
                into one number is exactly what the prototype did.
              */}
              {friendCount > 0 && (
                <>
                  <Circle cx={p.x + r + 6} cy={p.y - r - 2} r={8} fill={colour.ink2} stroke={colour.emHi} strokeWidth={1.4} />
                  <SvgText x={p.x + r + 6} y={p.y - r + 1.5} textAnchor="middle" fill={colour.emHi} fontSize={9.5} fontWeight="700">
                    {String(friendCount)}
                  </SvgText>
                </>
              )}
              {mutualCount > 0 && (
                <>
                  <Circle cx={p.x - r - 6} cy={p.y - r - 2} r={7.5} fill={colour.ink2} stroke={colour.fg3} strokeWidth={1.2} />
                  <SvgText x={p.x - r - 6} y={p.y - r + 1.5} textAnchor="middle" fill={colour.fg2} fontSize={9} fontWeight="700">
                    {String(mutualCount)}
                  </SvgText>
                </>
              )}

              <SvgText x={p.x} y={p.y + r + 15} textAnchor="middle" fill={colour.fg} fontSize={11.5} fontWeight="700">
                {v.name}
              </SvgText>
            </G>
          );
        })}

        {/*
          Friends — exact positions, because the rules already allowed it.

          `pointerEvents="none"` matters: a friend marker sits directly on top
          of the venue they are at, and without this it swallows the tap. Found
          by tapping Monarch on a simulator and getting nothing while a venue
          with nobody on it opened fine.
        */}
        {friends.map((f) => {
          const p = project(f.at);
          return (
            <G key={`friend-${f.id}`} pointerEvents="none">
              <Circle cx={p.x} cy={p.y} r={13} fill={colour.em} opacity={0.2} />
              <Circle cx={p.x} cy={p.y} r={7} fill={colour.em} />
              <Circle cx={p.x} cy={p.y} r={7} stroke={colour.ink} strokeWidth={1.6} fill="none" />
              <SvgText x={p.x} y={p.y - 13} textAnchor="middle" fill={colour.emHi} fontSize={10.5} fontWeight="700">
                {f.name}
              </SvgText>
            </G>
          );
        })}

        {/* You */}
        {me && (
          <G>
            <Circle cx={project(me).x} cy={project(me).y} r={26} fill="url(#you)" opacity={0.5} />
            <Circle cx={project(me).x} cy={project(me).y} r={7} fill="#ffffff" />
            <Circle cx={project(me).x} cy={project(me).y} r={7} stroke={colour.ink} strokeWidth={2} fill="none" />
          </G>
        )}
      </Svg>

      <View style={styles.controls}>
        <MapButton onPress={() => zoom(1.6)} label="+" testID="map-zoom-in" />
        <MapButton onPress={() => zoom(1 / 1.6)} label="−" testID="map-zoom-out" />
        <Pressable style={styles.mapButton} onPress={recentre} testID="map-recentre" accessibilityLabel="Recentre">
          <Icon name="pin" size={18} color={colour.fg} />
        </Pressable>
      </View>
    </View>
  );
}

function MapButton({ onPress, label, testID }: { onPress: () => void; label: string; testID: string }) {
  return (
    <Pressable style={styles.mapButton} onPress={onPress} testID={testID} accessibilityRole="button" accessibilityLabel={label}>
      <SvgLabel label={label} />
    </Pressable>
  );
}

function SvgLabel({ label }: { label: string }) {
  return (
    <Svg width={18} height={18} viewBox="0 0 18 18">
      <SvgText x={9} y={13} textAnchor="middle" fill={colour.fg} fontSize={16} fontWeight="700">
        {label}
      </SvgText>
    </Svg>
  );
}

/** A faint grid, so panning and zooming read as movement. */
function Grid({ width, height }: { width: number; height: number }) {
  const lines: React.JSX.Element[] = [];
  const step = 64;
  for (let x = 0; x < width; x += step) {
    lines.push(<Rect key={`gx${x}`} x={x} y={0} width={1} height={height} fill={colour.hairline} />);
  }
  for (let y = 0; y < height; y += step) {
    lines.push(<Rect key={`gy${y}`} x={0} y={y} width={width} height={1} fill={colour.hairline} />);
  }
  return <>{lines}</>;
}

function mercYToLat(y: number): number {
  const n = Math.PI - 2 * Math.PI * y;
  return (180 / Math.PI) * Math.atan(0.5 * (Math.exp(n) - Math.exp(-n)));
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colour.ink },
  controls: { position: 'absolute', right: 12, bottom: 140, gap: 8 },
  mapButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(14,20,26,0.9)',
    borderWidth: 1,
    borderColor: colour.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
