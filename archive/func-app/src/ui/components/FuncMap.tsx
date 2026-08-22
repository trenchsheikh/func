/**
 * The map — the product's centrepiece.
 *
 * ## What changed in the 2026-08-12 aesthetic reset
 *
 * The base layer was OpenFreeMap's stock **Liberty** style — a light, beige,
 * daytime cartographic map. func's Tier 0 centrepiece looked like a utility
 * map with green dots on it. It now draws `FUNC_MAP_STYLE` (see
 * `../mapStyle.ts`): near-black ground, silver-circuitry roads, silhouette
 * buildings. MapLibre's logo, attribution button, compass and scale bar are
 * all off — dev/vendor chrome does not belong in the user-facing frame.
 *
 * Three things make the map readable at a glance, and they are deliberately
 * carried by three *different* visual channels so they can never collide:
 *
 * | What | Channel |
 * |---|---|
 * | How hot a room is | **Colour temperature** — `heat()`, blue → gold-white |
 * | What kind of place it is | **Silhouette** — hex / square / circle / diamond |
 * | Whether people are there | **Emerald**, and emerald is used for nothing else |
 *
 * Previously all three were the same green circle at varying radius, which is
 * why a dive bar and a 2,000-capacity club were indistinguishable.
 *
 * ## On the visibility gradient
 *
 * Unchanged, and must stay unchanged: the gradient is enforced by what this
 * component is *given*, not by what it chooses to draw. Friends arrive as
 * positions; mutuals arrive as a count and nothing else. There is no code path
 * here that could render a mutual's location, because no mutual location is
 * ever passed in.
 */

import {
  Camera,
  Map as MapLibreMap,
  Marker,
  type CameraRef,
  type LngLat,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import Svg, {
  Circle,
  Defs,
  Path,
  Polygon,
  RadialGradient,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';

import type { Coordinates, Venue, VenueId } from '../../domain';
import type { VenuePresenceView } from '../../domain/visibility';
import { isColdOpenPlaying, onArrival } from '../coldOpen';
import { FUNC_MAP_STYLE } from '../mapStyle';
import { glowStops } from '../colour';
import { BLANK_CANVAS, colour, heat as heatColour, motionScale, shapeForKind, timing, type MarkerShape } from '../theme';
import { Icon } from './Icon';

const toLngLat = (at: Coordinates): LngLat => [at.lon, at.lat];

/**
 * The last camera position this process has seen, outside React state.
 *
 * MapLibre's native view can be torn down and recreated by the navigator —
 * pushing the venue sheet and coming back, say — independently of whether
 * this component's own React instance unmounts. Without something outside
 * that lifecycle to remember the last position, the camera silently resets
 * to `initialCentre` whenever that happens, even though nothing on screen
 * looked like a reset. A module-level variable survives it; component state
 * would not. (Bug found and fixed 2026-08-11, commit `f1dcfda` — do not
 * regress it.)
 */
let lastKnownCamera: { center: LngLat; zoom: number } | null = null;

/**
 * Whether this process has already flown the arrival shot.
 *
 * The cold open ends by diving from Earth into the launch city; the map
 * finishes that move itself rather than cutting to a static view, which is
 * what stops the sequence feeling like a splash screen handing over. It must
 * happen exactly once per launch, not every time the map screen remounts —
 * hence a module-level flag, for the same lifecycle reason as `lastKnownCamera`.
 */
let hasFlownIntro = false;

const MIN_ZOOM = 9.5; // the whole bay
const MAX_ZOOM = 18; // individual buildings
const DEFAULT_ZOOM = 13; // a city's nightlife, legibly spread
const ZOOM_STEP = 1.4;

/** Where the arrival shot starts: high enough to read as "from orbit". */
const INTRO_ZOOM = 3.4;
const INTRO_DURATION = 2200;
/**
 * If the film's signal never lands (it was skipped, torn down, or crashed),
 * fly in anyway. Being stranded at orbit zoom with no gesture back to the city
 * is a far worse failure than an unsynchronised arrival.
 */
const INTRO_FAILSAFE = 6000;

/**
 * The assemble.
 *
 * `ENTRANCE_TOTAL` is the window the whole stagger occupies; `ENTRANCE_ITEM` is
 * how long any single marker takes. They overlap heavily on purpose — the city
 * should look like it is resolving as one movement, not like items being dealt
 * out one at a time.
 */
// Blank canvas: the assemble collapses to effectively simultaneous — markers
// just appear, which is "instant" per the reset brief — without touching the
// stagger math itself (`delayFor` below still runs the same way).
const ENTRANCE_TOTAL = BLANK_CANVAS ? 1 : 1500;
const ENTRANCE_ITEM = BLANK_CANVAS ? 1 : 620;

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
  const cameraRef = useRef<CameraRef>(null);
  // Only open at orbit zoom if a film is actually on screen to justify it.
  // Decided once on first render and held, so a re-render mid-flight cannot
  // change the camera out from under the animation.
  const wantsIntro = useRef(!hasFlownIntro && isColdOpenPlaying()).current;

  const initialZoom = wantsIntro
    ? INTRO_ZOOM
    : Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, lastKnownCamera?.zoom ?? DEFAULT_ZOOM));

  // Only used to clamp the +/- buttons — MapLibre owns the camera, this is a
  // read-only mirror of it, never fed back in as a prop.
  const [zoomLevel, setZoomLevel] = useState(wantsIntro ? DEFAULT_ZOOM : initialZoom);

  /**
   * The shared breath. One clock on the UI thread drives every marker; each
   * takes its own phase offset from it, so the map moves like a crowd rather
   * than a metronome. Doing this per-marker with its own timing would put N
   * animations on the bridge for no visual gain.
   */
  const breath = useSharedValue(0);
  useEffect(() => {
    breath.value = withRepeat(
      withTiming(1, { duration: timing.breath, easing: Easing.inOut(Easing.sin) }),
      -1,
      true,
    );
  }, [breath]);

  /**
   * Label density, by zoom.
   *
   * At city zoom the map was labelling all sixteen venues at once, so func's
   * own names collided with each other and with the base map's street names —
   * "Monarch" sitting on top of "1015 Folsom" sitting on top of "Léo's".
   * Cartography solves this with density tiers, and here the tier can carry
   * *meaning* rather than being arbitrary: zoomed out, only the places that are
   * actually live get named — hot, or somewhere a friend is, or somewhere a
   * story was just posted. Zoom in and everything names itself.
   *
   * Nothing is hidden by this. Every marker still draws at every zoom, which
   * is what Tier 0's "the map shows everything" requires; it is the *name* that
   * waits until there is room for it.
   */
  const labelDensity: 'all' | 'live' = zoomLevel >= 14 ? 'all' : 'live';

  /** The assemble clock. Runs once, linearly; each marker slices its own window out of it. */
  const entrance = useSharedValue(0);
  useEffect(() => {
    entrance.value = withTiming(1, { duration: ENTRANCE_TOTAL, easing: Easing.linear });
  }, [entrance]);

  /**
   * Per-marker stagger delay, by distance from the camera centre.
   *
   * Longitude is scaled by cos(latitude) so the metric is roughly isotropic on
   * the ground rather than in degrees — without that, at San Francisco's
   * latitude an east–west offset counts about 27% more than it should and the
   * assemble visibly fans out sideways.
   *
   * Normalised against the furthest marker so the spread fills the window
   * regardless of how tight or wide the current filter set is.
   */
  const delayFor = useMemo(() => {
    const cosLat = Math.cos((initialCentre.lat * Math.PI) / 180);
    const d = (at: Coordinates): number => {
      const dy = at.lat - initialCentre.lat;
      const dx = (at.lon - initialCentre.lon) * cosLat;
      return Math.sqrt(dx * dx + dy * dy);
    };

    const all: { key: string; dist: number }[] = [
      ...venues.map((v) => ({ key: `v${v.id as string}`, dist: d(v.at) })),
      ...spots.map((s) => ({ key: `s${s.id}`, dist: d(s.at) })),
      ...afterParties.map((a) => ({ key: `a${a.id}`, dist: d(a.at) })),
    ];

    const max = all.reduce((m, x) => (x.dist > m ? x.dist : m), 0) || 1;
    const spread = ENTRANCE_TOTAL - ENTRANCE_ITEM;
    const table = new Map<string, number>();
    // Square-rooted so the far edges do not all pile up at the end — an even
    // radial spread in area terms rather than in radius.
    for (const x of all) table.set(x.key, Math.sqrt(x.dist / max) * spread);
    return table;
  }, [venues, spots, afterParties, initialCentre.lat, initialCentre.lon]);

  // A stable array reference for the whole component's lifetime.
  // `initialCentre` is genuinely initial — the camera must not snap back to it
  // on some later, unrelated re-render (a friend's presence updating, say).
  // Keying the memo on the primitive lat/lon rather than the object reference
  // keeps it stable even though the caller rebuilds that object every render.
  const initialLngLat = useMemo(
    () => (wantsIntro ? toLngLat(initialCentre) : lastKnownCamera?.center ?? toLngLat(initialCentre)),
    [initialCentre.lat, initialCentre.lon, wantsIntro],
  );

  /**
   * The arrival shot — the last beat of the cold open, performed by the real
   * camera rather than faked in the overlay.
   *
   * Waits for two things: the style to be up (so it never flies over blank
   * tiles) *and* the film to reach its dive. A hard fallback fires it anyway if
   * the signal never arrives, because the failure mode otherwise is the map
   * stranded at orbit zoom with no way back.
   */
  const flyIn = useCallback(() => {
    if (hasFlownIntro) return;
    hasFlownIntro = true;
    cameraRef.current?.flyTo({
      center: toLngLat(initialCentre),
      zoom: DEFAULT_ZOOM,
      duration: INTRO_DURATION,
    });
  }, [initialCentre.lat, initialCentre.lon]);

  const onStyleLoaded = useCallback(() => {
    if (hasFlownIntro) return;
    if (!wantsIntro) {
      hasFlownIntro = true;
      return;
    }
    const stop = onArrival(flyIn);
    const failsafe = setTimeout(flyIn, INTRO_FAILSAFE);
    unsubscribe.current = () => {
      stop();
      clearTimeout(failsafe);
    };
  }, [flyIn, wantsIntro]);

  const unsubscribe = useRef<(() => void) | null>(null);
  useEffect(() => () => unsubscribe.current?.(), []);

  const onRegionDidChange = useCallback((event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
    const { center, zoom } = event.nativeEvent;
    lastKnownCamera = { center, zoom };
    setZoomLevel(zoom);
  }, []);

  const zoomBy = (delta: number) => {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
    cameraRef.current?.zoomTo(next, { duration: 220 });
  };

  const recentre = () => {
    cameraRef.current?.easeTo({ center: toLngLat(me ?? initialCentre), duration: 420 });
  };

  return (
    <View style={styles.wrap}>
      <MapLibreMap
        mapStyle={FUNC_MAP_STYLE as never}
        style={styles.map}
        onRegionDidChange={onRegionDidChange}
        onDidFinishLoadingStyle={onStyleLoaded}
        // Vendor ornaments off — this is a product surface, not a map demo.
        logo={false}
        attribution={false}
        compass={false}
        scaleBar={false}
        // Top-lit, low intensity: buildings should read as silhouette and mass,
        // never as lit surfaces competing with the heat glows.
        light={{ anchor: 'viewport', position: [1.4, 210, 32], color: '#ffffff', intensity: 0.22 }}
      >
        <Camera ref={cameraRef} center={initialLngLat} zoom={initialZoom} />

        {/* Venues — heat, silhouette, story ring, and the friend/mutual badges. */}
        {venues.map((v, i) => (
          <Marker key={`venue-${v.id}`} lngLat={toLngLat(v.at)} anchor="center" style={styles.zVenue}>
            <VenueMarker
              id={v.id as string}
              name={v.name}
              shape={shapeForKind(v.kind)}
              heat={heatFor(v.id)}
              stories={storyCountFor(v.id)}
              presence={presenceFor(v.id)}
              breath={breath}
              phase={(i % 7) / 7}
              entrance={entrance}
              delay={delayFor.get(`v${v.id as string}`) ?? 0}
              labelled={labelDensity}
              onPress={() => onVenuePress(v)}
            />
          </Marker>
        ))}

        {/* Local spots — outdoor, beaches, the places that are not venues. */}
        {spots.map((s, i) => (
          <Marker key={`spot-${s.id}`} lngLat={toLngLat(s.at)} anchor="center" style={styles.zAbove}>
            <SpotMarker
              name={s.name}
              breath={breath}
              phase={(i % 5) / 5}
              entrance={entrance}
              delay={delayFor.get(`s${s.id}`) ?? 0}
              onPress={() => onSpotPress(s.id)}
            />
          </Marker>
        ))}

        {/* After-parties. Always visible — there is no mode that hides them. */}
        {afterParties.map((a, i) => (
          <Marker key={`after-${a.id}`} lngLat={toLngLat(a.at)} anchor="center" style={styles.zAbove}>
            <AfterPartyMarker
              id={a.id}
              hostName={a.hostName}
              breath={breath}
              phase={(i % 3) / 3}
              entrance={entrance}
              delay={delayFor.get(`a${a.id}`) ?? 0}
              onPress={() => onAfterPress(a.id)}
            />
          </Marker>
        ))}

        {/*
          Friends — exact positions, because the rules already allowed it.
          Non-interactive: a friend marker sitting on top of the venue they
          are at must never swallow the venue's tap. `pointerEvents="none"`
          is the exact mechanism this has always relied on — found by tapping
          Monarch on a simulator and getting nothing while an empty venue
          opened fine.
        */}
        {friends.map((f, i) => (
          <Marker key={`friend-${f.id}`} lngLat={toLngLat(f.at)} anchor="center" style={styles.zFriend}>
            <FriendMarker name={f.name} breath={breath} phase={(i % 4) / 4} entrance={entrance} />
          </Marker>
        ))}

        {/* You. */}
        {me && (
          <Marker lngLat={toLngLat(me)} anchor="center" style={styles.zYou}>
            <YouMarker breath={breath} />
          </Marker>
        )}
      </MapLibreMap>

      <View style={styles.controls}>
        <MapButton onPress={() => zoomBy(ZOOM_STEP)} label="+" testID="map-zoom-in" />
        <MapButton onPress={() => zoomBy(-ZOOM_STEP)} label="−" testID="map-zoom-out" />
        <Pressable style={styles.mapButton} onPress={recentre} testID="map-recentre" accessibilityLabel="Recentre">
          <Icon name="pin" size={17} color={colour.fg2} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Silhouettes
//
// Shape is what tells you what a place *is*. Colour is fully committed to
// temperature and presence, so it cannot also carry kind — which is exactly
// why the previous all-green-circles map was unreadable.
// ---------------------------------------------------------------------------

function Silhouette({
  shape,
  cx,
  cy,
  r,
  fill,
  stroke,
  strokeWidth,
}: {
  shape: MarkerShape;
  cx: number;
  cy: number;
  r: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}): React.JSX.Element {
  const common = { fill, stroke, strokeWidth };

  if (shape === 'circle') {
    return <Circle cx={cx} cy={cy} r={r} {...common} />;
  }
  if (shape === 'square') {
    return (
      <Rect x={cx - r} y={cy - r} width={r * 2} height={r * 2} rx={r * 0.36} ry={r * 0.36} {...common} />
    );
  }
  if (shape === 'diamond') {
    return <Polygon points={`${cx},${cy - r} ${cx + r},${cy} ${cx},${cy + r} ${cx - r},${cy}`} {...common} />;
  }
  if (shape === 'capsule') {
    const w = r * 1.5;
    return <Rect x={cx - w} y={cy - r * 0.72} width={w * 2} height={r * 1.44} rx={r * 0.72} ry={r * 0.72} {...common} />;
  }
  // hex — a faceted monolith. Flat-top so it reads as built, not as a pin.
  const pts = Array.from({ length: 6 }, (_, i) => {
    const a = (Math.PI / 3) * i + Math.PI / 6;
    return `${(cx + r * Math.cos(a)).toFixed(2)},${(cy + r * Math.sin(a)).toFixed(2)}`;
  }).join(' ');
  return <Polygon points={pts} {...common} />;
}

// ---------------------------------------------------------------------------
// Markers
// ---------------------------------------------------------------------------

const VENUE_SIZE = 150;
const VENUE_C = VENUE_SIZE / 2;

type Breath = SharedValue<number>;

/**
 * Back-out easing — overshoot and settle, from a plain linear clock.
 *
 *     f(p) = 1 + c₃(p−1)³ + c₁(p−1)²,  c₁ = 1.70158, c₃ = c₁ + 1
 *
 * Used instead of one spring per marker: the entrance is driven by a *single*
 * shared clock (see `entrance` below), so the overshoot has to come from the
 * curve rather than from N independent physics integrators. Same read, one
 * animation instead of forty.
 */
const C1 = 1.70158;
const C3 = C1 + 1;
const backOut = (p: number): number => {
  'worklet';
  const q = p - 1;
  return 1 + C3 * q * q * q + C1 * q * q;
};

const clamp01 = (n: number): number => {
  'worklet';
  return n < 0 ? 0 : n > 1 ? 1 : n;
};

/**
 * A marker's arrival.
 *
 * Staggered *by distance from the camera centre*, so when the cold open's dive
 * lands the city assembles outward from the point you flew into rather than
 * appearing all at once — arrival order carries the geography.
 *
 * Applied to the marker's outer container, so the silhouette, its glow and its
 * label all arrive as one object.
 */
function useEntranceStyle(entrance: SharedValue<number>, delay: number) {
  return useAnimatedStyle(() => {
    const p = clamp01((entrance.value * ENTRANCE_TOTAL - delay) / ENTRANCE_ITEM);
    const e = backOut(p);
    return {
      opacity: clamp01(p * 1.6),
      transform: [{ scale: 0.45 + e * 0.55 }],
    };
  });
}

/**
 * A marker's breath — a small scale swell, phase-shifted per marker.
 *
 * Kept as a *separate* style on an inner view rather than folded into the
 * entrance: they both drive `scale`, and two animated styles writing the same
 * channel means the last one silently wins. Nesting them multiplies instead.
 */
function useBreathStyle(breath: Breath, phase: number, amount: number) {
  return useAnimatedStyle(() => {
    const t = (breath.value + phase) % 1;
    // Triangle → smooth, without needing a second timing curve.
    const swell = t < 0.5 ? t * 2 : (1 - t) * 2;
    return { transform: [{ scale: 1 + swell * amount }] };
  });
}

function VenueMarker({
  id,
  name,
  shape,
  heat,
  stories,
  presence,
  breath,
  phase,
  entrance,
  delay,
  labelled,
  onPress,
}: {
  id: string;
  name: string;
  shape: MarkerShape;
  heat: number;
  stories: number;
  presence: VenuePresenceView | undefined;
  breath: Breath;
  phase: number;
  entrance: SharedValue<number>;
  delay: number;
  labelled: 'all' | 'live';
  onPress: () => void;
}) {
  const enterStyle = useEntranceStyle(entrance, delay);
  // Hotter places breathe harder. A dead venue is almost still. (`motionScale`
  // zeroes this ambient pulse entirely in blank-canvas mode.)
  const glowStyle = useBreathStyle(breath, phase, (0.05 + heat * 0.12) * motionScale);

  const core = 9 + heat * 5;
  const bloom = 26 + heat * 40;
  const hot = heatColour(heat);
  const friendCount = presence?.friends.length ?? 0;
  const mutualCount = presence?.mutualCount ?? 0;

  // Gradient ids must be unique per marker. The previous build reused a single
  // id="heat" across every marker — invisible while they were all the same
  // green, but a real collision now that each marker has its own temperature.
  const gid = `h-${id}`;
  // Ten stops sampled from the airlight kernel. Memoised on heat alone: this
  // runs a kernel plus two transfer-function conversions per stop, and the
  // marker re-renders on every presence change.
  const glow = useMemo(() => glowStops(heat, 10), [heat]);

  return (
    <Pressable onPress={onPress} hitSlop={14} testID={`venue-marker-${name}`}>
      <Animated.View style={[{ width: VENUE_SIZE, height: VENUE_SIZE }, enterStyle]}>
        {/* The bloom breathes; the silhouette stays put, so the place feels
            solid and the crowd around it feels alive. */}
        <Animated.View style={[StyleSheet.absoluteFill, glowStyle]}>
          <Svg width={VENUE_SIZE} height={VENUE_SIZE}>
            <Defs>
              {/* Airlight falloff, baked in linear light — see `glowStops`. */}
              <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
                {glow.map((s) => (
                  <Stop
                    key={s.offset}
                    offset={s.offset}
                    stopColor={s.color}
                    stopOpacity={s.opacity * (0.45 + heat * 0.55)}
                  />
                ))}
              </RadialGradient>
            </Defs>
            {/* Heat — glow only. Never a number, never a word (Tier 0). */}
            <Circle cx={VENUE_C} cy={VENUE_C} r={bloom} fill={`url(#${gid})`} />
          </Svg>
        </Animated.View>

        <Svg width={VENUE_SIZE} height={VENUE_SIZE} style={StyleSheet.absoluteFill}>
          {/* A live story ring. Emerald, because a story is a person. */}
          {stories > 0 && (
            <Circle
              cx={VENUE_C}
              cy={VENUE_C}
              r={core + 7}
              stroke={colour.lifeHi}
              strokeWidth={2}
              fill="none"
              strokeOpacity={0.9}
            />
          )}

          {/* The place itself: near-black body, temperature-lit rim. */}
          <Silhouette
            shape={shape}
            cx={VENUE_C}
            cy={VENUE_C}
            r={core}
            fill="#050507"
            stroke={hot}
            strokeWidth={1.6 + heat * 1.8}
          />
          {/* The ember at the centre — the only fully saturated pixel. */}
          <Circle cx={VENUE_C} cy={VENUE_C} r={1.8 + heat * 2.6} fill={hot} opacity={0.6 + heat * 0.4} />

          {/*
            Two separate badges, deliberately. A friend is named elsewhere and
            counted here; a mutual is only ever counted. Merging them into one
            number is exactly what the old prototype did.
          */}
          {friendCount > 0 && (
            <>
              <Circle
                cx={VENUE_C + core + 8}
                cy={VENUE_C - core - 4}
                r={8}
                fill="#050507"
                stroke={colour.lifeHi}
                strokeWidth={1.5}
              />
              <SvgText
                x={VENUE_C + core + 8}
                y={VENUE_C - core - 0.6}
                textAnchor="middle"
                fill={colour.lifeHi}
                fontSize={9.5}
                fontWeight="700"
              >
                {String(friendCount)}
              </SvgText>
            </>
          )}
          {mutualCount > 0 && (
            <>
              <Circle
                cx={VENUE_C - core - 8}
                cy={VENUE_C - core - 4}
                r={7.5}
                fill="#050507"
                stroke={colour.fg3}
                strokeWidth={1.2}
              />
              <SvgText
                x={VENUE_C - core - 8}
                y={VENUE_C - core - 0.8}
                textAnchor="middle"
                fill={colour.fg2}
                fontSize={9}
                fontWeight="700"
              >
                {String(mutualCount)}
              </SvgText>
            </>
          )}
        </Svg>

        {/* Labels are plain RN <Text> outside the SVG canvas, so a long venue
            name overflows freely instead of being clipped by the viewBox. */}
        {(labelled === 'all' || heat >= 0.55 || friendCount > 0 || stories > 0) && (
          <Text style={[styles.venueLabel, { top: VENUE_C + core + 8 }]} numberOfLines={1}>
            {name}
          </Text>
        )}
      </Animated.View>
    </Pressable>
  );
}

const SPOT_SIZE = 76;
const SPOT_C = SPOT_SIZE / 2;

function SpotMarker({
  name,
  breath,
  phase,
  entrance,
  delay,
  onPress,
}: {
  name: string;
  breath: Breath;
  phase: number;
  entrance: SharedValue<number>;
  delay: number;
  onPress: () => void;
}) {
  const enterStyle = useEntranceStyle(entrance, delay);
  const style = useBreathStyle(breath, phase, 0.06 * motionScale);
  return (
    <Pressable onPress={onPress} hitSlop={18} testID="spot-marker">
      <Animated.View style={[{ width: SPOT_SIZE, height: SPOT_SIZE }, enterStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, style]}>
          <Svg width={SPOT_SIZE} height={SPOT_SIZE}>
            {/* A landmark, not a venue: open diamond, gold, no heat. */}
            <Silhouette
              shape="diamond"
              cx={SPOT_C}
              cy={SPOT_C}
              r={8}
              fill="#050507"
              stroke={colour.gold}
              strokeWidth={1.8}
            />
            <Circle cx={SPOT_C} cy={SPOT_C} r={2} fill={colour.gold} opacity={0.85} />
          </Svg>
        </Animated.View>
        <Text style={[styles.spotLabel, { top: SPOT_C + 12 }]} numberOfLines={1}>
          {name}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const AFTER_SIZE = 130;
const AFTER_C = AFTER_SIZE / 2;

/**
 * An after-party.
 *
 * Deliberately *not* a headcount badge — the previous build drew a lilac disc
 * with "27" in it, which reads as an unread-message count. An after-party is
 * supposed to feel like something you are not yet inside: a chrome capsule
 * with a violet bloom leaking out of it, no number, no name of a place,
 * because there is no place until the host accepts you.
 */
function AfterPartyMarker({
  id,
  hostName,
  breath,
  phase,
  entrance,
  delay,
  onPress,
}: {
  id: string;
  hostName: string;
  breath: Breath;
  phase: number;
  entrance: SharedValue<number>;
  delay: number;
  onPress: () => void;
}) {
  // Breathes harder than anything else on the map. Afters are the hottest
  // thing in the product and should look restless.
  const enterStyle = useEntranceStyle(entrance, delay);
  const style = useBreathStyle(breath, phase, 0.16 * motionScale);
  const gid = `a-${id}`;

  return (
    <Pressable onPress={onPress} hitSlop={14} testID={`after-marker-${hostName}`}>
      <Animated.View style={[{ width: AFTER_SIZE, height: AFTER_SIZE }, enterStyle]}>
        <Animated.View style={[StyleSheet.absoluteFill, style]}>
          <Svg width={AFTER_SIZE} height={AFTER_SIZE}>
            <Defs>
              <RadialGradient id={gid} cx="50%" cy="50%" r="50%">
                <Stop offset="0%" stopColor={colour.after} stopOpacity="0.5" />
                <Stop offset="55%" stopColor={colour.after} stopOpacity="0.16" />
                <Stop offset="100%" stopColor={colour.after} stopOpacity="0" />
              </RadialGradient>
            </Defs>
            <Circle cx={AFTER_C} cy={AFTER_C} r={40} fill={`url(#${gid})`} />
          </Svg>
        </Animated.View>

        <Svg width={AFTER_SIZE} height={AFTER_SIZE} style={StyleSheet.absoluteFill}>
          <Silhouette
            shape="capsule"
            cx={AFTER_C}
            cy={AFTER_C}
            r={11}
            fill="#060509"
            stroke={colour.afterHi}
            strokeWidth={1.7}
          />
          {/* Three ticks, like a shuttered door seen from outside. */}
          <Path
            d={`M${AFTER_C - 5} ${AFTER_C - 3.4}v6.8M${AFTER_C} ${AFTER_C - 3.4}v6.8M${AFTER_C + 5} ${AFTER_C - 3.4}v6.8`}
            stroke={colour.after}
            strokeWidth={1.6}
            strokeLinecap="round"
          />
        </Svg>

        <Text style={[styles.afterLabel, { top: AFTER_C + 14 }]} numberOfLines={1}>
          {`${hostName}’s`}
        </Text>
      </Animated.View>
    </Pressable>
  );
}

const FRIEND_SIZE = 64;
const FRIEND_C = FRIEND_SIZE / 2;

function FriendMarker({
  name,
  breath,
  phase,
  entrance,
}: {
  name: string;
  breath: Breath;
  phase: number;
  entrance: SharedValue<number>;
}) {
  // Friends land last and together — people arriving, not geography resolving.
  const enterStyle = useEntranceStyle(entrance, ENTRANCE_TOTAL - ENTRANCE_ITEM);
  const style = useBreathStyle(breath, phase, 0.1 * motionScale);
  return (
    <Animated.View style={[{ width: FRIEND_SIZE, height: FRIEND_SIZE }, enterStyle]} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Svg width={FRIEND_SIZE} height={FRIEND_SIZE}>
          <Circle cx={FRIEND_C} cy={FRIEND_C} r={14} fill={colour.life} opacity={0.16} />
        </Svg>
      </Animated.View>
      <Svg width={FRIEND_SIZE} height={FRIEND_SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={FRIEND_C} cy={FRIEND_C} r={6.5} fill={colour.life} />
        <Circle cx={FRIEND_C} cy={FRIEND_C} r={6.5} stroke="#000000" strokeWidth={1.8} fill="none" />
      </Svg>
      <Text style={[styles.friendLabel, { top: FRIEND_C - 28 }]} numberOfLines={1}>
        {name}
      </Text>
    </Animated.View>
  );
}

const YOU_SIZE = 64;
const YOU_C = YOU_SIZE / 2;

function YouMarker({ breath }: { breath: Breath }) {
  const style = useBreathStyle(breath, 0, 0.14 * motionScale);
  return (
    <View style={{ width: YOU_SIZE, height: YOU_SIZE }} pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, style]}>
        <Svg width={YOU_SIZE} height={YOU_SIZE}>
          <Defs>
            <RadialGradient id="you-glow" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.7" />
              <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={YOU_C} cy={YOU_C} r={26} fill="url(#you-glow)" />
        </Svg>
      </Animated.View>
      <Svg width={YOU_SIZE} height={YOU_SIZE} style={StyleSheet.absoluteFill}>
        <Circle cx={YOU_C} cy={YOU_C} r={6.5} fill="#FFFFFF" />
        <Circle cx={YOU_C} cy={YOU_C} r={6.5} stroke="#000000" strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
}

function MapButton({ onPress, label, testID }: { onPress: () => void; label: string; testID: string }) {
  return (
    <Pressable
      style={({ pressed }) => [styles.mapButton, pressed && styles.mapButtonPressed]}
      onPress={onPress}
      testID={testID}
      accessibilityRole="button"
      accessibilityLabel={label}
    >
      <Text style={styles.mapButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colour.void },
  map: { flex: 1 },
  controls: { position: 'absolute', right: 12, bottom: 130, gap: 8 },
  mapButton: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(10,10,12,0.82)',
    borderWidth: 1,
    borderColor: colour.hairline,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mapButtonPressed: { backgroundColor: 'rgba(28,28,33,0.95)', borderColor: colour.hairlineHi },
  mapButtonLabel: { color: colour.fg2, fontSize: 16, fontWeight: '700' },
  venueLabel: {
    position: 'absolute',
    left: -55,
    width: VENUE_SIZE + 110,
    textAlign: 'center',
    color: colour.fg,
    fontSize: 11.5,
    fontWeight: '700',
    letterSpacing: 0.2,
    // A dark rim so a name stays legible over a hot bloom or a lit building.
    textShadowColor: '#000000',
    textShadowRadius: 6,
  },
  spotLabel: {
    position: 'absolute',
    left: -40,
    width: SPOT_SIZE + 80,
    textAlign: 'center',
    color: colour.gold,
    fontSize: 10,
    fontWeight: '700',
    textShadowColor: '#000000',
    textShadowRadius: 5,
  },
  afterLabel: {
    position: 'absolute',
    left: -40,
    width: AFTER_SIZE + 80,
    textAlign: 'center',
    color: colour.afterHi,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    textShadowColor: '#000000',
    textShadowRadius: 6,
  },
  friendLabel: {
    position: 'absolute',
    left: -40,
    width: FRIEND_SIZE + 80,
    textAlign: 'center',
    color: colour.lifeHi,
    fontSize: 10.5,
    fontWeight: '700',
    textShadowColor: '#000000',
    textShadowRadius: 5,
  },
  // Style ordering, not depth: MapLibre respects zIndex within its overlay
  // stack, so a spot or after-party sitting on the same coordinate as a venue
  // still wins the tap. Friends and "you" render decorative, always on top.
  zVenue: { zIndex: 1 },
  zAbove: { zIndex: 2 },
  zFriend: { zIndex: 3 },
  zYou: { zIndex: 4 },
});
