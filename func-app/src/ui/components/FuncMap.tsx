/**
 * The map.
 *
 * ## On the base layer
 *
 * Standing orders committed to MapLibre with a custom func style; this is that
 * delivered. The base layer is OpenFreeMap's Liberty style — free, no API key,
 * no billing account, global coverage, real 3D building extrusions at street
 * zoom.
 *
 * This component still owns *what func draws on a map* (heat, story rings,
 * friends, mutual counts, spots, after-parties) — that never changed. What
 * changed is who owns positioning and gesture handling: previously this file
 * hand-rolled a Web Mercator projection and a PanResponder to fake panning
 * over a flat grid, because there was no real map underneath. There is now.
 * MapLibre owns the camera (pan, pinch-zoom, inertia — real map behaviour, not
 * an approximation of it), and every func layer is a `Marker` — a real RN view
 * pinned to a real coordinate, repositioned by MapLibre as the camera moves.
 * The manual projection math and the centralised tap hit-testing this used to
 * need are gone; MapLibre's own touch handling replaces both.
 *
 * ## On the layers
 *
 * The visibility gradient is enforced by what this component is *given*, not
 * by what it chooses to draw. Friends arrive as positions; mutuals arrive as a
 * count and nothing else. There is no code path here that could render a
 * mutual's location, because no mutual location is ever passed in.
 */

import {
  Camera,
  Map as MapLibreMap,
  Marker,
  type CameraRef,
  type LngLat,
  type ViewStateChangeEvent,
} from '@maplibre/maplibre-react-native';
import React, { useCallback, useMemo, useRef, useState } from 'react';
import type { NativeSyntheticEvent } from 'react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Svg, { Circle, Defs, RadialGradient, Stop, Text as SvgText } from 'react-native-svg';

import type { Coordinates, Venue, VenueId } from '../../domain';
import type { VenuePresenceView } from '../../domain/visibility';
import { colour } from '../theme';
import { Icon } from './Icon';

// ---------------------------------------------------------------------------
// Base layer
// ---------------------------------------------------------------------------

/**
 * OpenFreeMap's Liberty style. Free, keyless, no billing account.
 *
 * Of OpenFreeMap's five stock styles (liberty, dark, bright, positron,
 * fiord), Liberty is the only one with a real `fill-extrusion` building
 * layer — checked against each style's own JSON, not assumed. The PRD names
 * "native 3D building extrusions" as the specific reason to use OpenFreeMap
 * at all, so that wins over Dark's closer tonal match to func's chrome-on-
 * black identity. This is still a stock style, not "a custom func style" —
 * that is separate, not-yet-started work standing orders call out on its
 * own; hand-tuning Liberty's colours here would blur the two together
 * without the design input that work actually needs.
 */
const OPENFREEMAP_STYLE = 'https://tiles.openfreemap.org/styles/liberty';

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
 * would not.
 */
let lastKnownCamera: { center: LngLat; zoom: number } | null = null;

/**
 * Zoom limits.
 *
 * These were an order of magnitude too small on the first (pre-MapLibre) run —
 * every venue in the city collapsed into one unreadable blob. Carried forward
 * in zoom-level terms: a city's nightlife wants roughly zoom 13, the whole bay
 * bottoms out around 9.5, and individual buildings are legible by 18.
 */
const MIN_ZOOM = 9.5; // the whole bay
const MAX_ZOOM = 18; // individual buildings
const DEFAULT_ZOOM = 13; // a city's nightlife, legibly spread
const ZOOM_STEP = 1.4;

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
  // Clamped in case the last recorded zoom came from a pinch gesture, which
  // isn't bounded by MIN_ZOOM/MAX_ZOOM the way the +/- buttons are.
  const initialZoom = Math.max(
    MIN_ZOOM,
    Math.min(MAX_ZOOM, lastKnownCamera?.zoom ?? DEFAULT_ZOOM),
  );
  // Only used to clamp the +/- buttons — MapLibre owns the camera, this is a
  // read-only mirror of it, never fed back in as a prop.
  const [zoomLevel, setZoomLevel] = useState(initialZoom);

  // A stable array reference for the whole component's lifetime. `initialCentre`
  // is genuinely initial — the camera must not snap back to it on some later,
  // unrelated re-render (a friend's presence updating elsewhere, say). Keying
  // the memo on the primitive lat/lon rather than the object reference means
  // this stays stable even though the caller recomputes that object every render.
  //
  // Prefers the last position this process actually saw the user reach, if
  // there is one — see `lastKnownCamera` above.
  const initialLngLat = useMemo(
    () => lastKnownCamera?.center ?? toLngLat(initialCentre),
    [initialCentre.lat, initialCentre.lon],
  );

  const onRegionDidChange = useCallback(
    (event: NativeSyntheticEvent<ViewStateChangeEvent>) => {
      const { center, zoom } = event.nativeEvent;
      lastKnownCamera = { center, zoom };
      setZoomLevel(zoom);
    },
    [],
  );

  const zoomBy = (delta: number) => {
    const next = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, zoomLevel + delta));
    cameraRef.current?.zoomTo(next, { duration: 200 });
  };

  const recentre = () => {
    cameraRef.current?.easeTo({ center: toLngLat(me ?? initialCentre), duration: 400 });
  };

  return (
    <View style={styles.wrap}>
      <MapLibreMap
        mapStyle={OPENFREEMAP_STYLE}
        style={styles.map}
        onRegionDidChange={onRegionDidChange}
      >
        <Camera ref={cameraRef} center={initialLngLat} zoom={initialZoom} />

        {/* Venues — heat, story ring, the dot, and the friend/mutual badges. */}
        {venues.map((v) => (
          <Marker key={`venue-${v.id}`} lngLat={toLngLat(v.at)} anchor="center" style={styles.zVenue}>
            <VenueMarker
              name={v.name}
              heat={heatFor(v.id)}
              stories={storyCountFor(v.id)}
              presence={presenceFor(v.id)}
              onPress={() => onVenuePress(v)}
            />
          </Marker>
        ))}

        {/* Local spots. */}
        {spots.map((s) => (
          <Marker key={`spot-${s.id}`} lngLat={toLngLat(s.at)} anchor="center" style={styles.zAbove}>
            <SpotMarker onPress={() => onSpotPress(s.id)} />
          </Marker>
        ))}

        {/* After-parties. Always visible — there is no mode that hides them. */}
        {afterParties.map((a) => (
          <Marker key={`after-${a.id}`} lngLat={toLngLat(a.at)} anchor="center" style={styles.zAbove}>
            <AfterPartyMarker hostName={a.hostName} going={a.going} onPress={() => onAfterPress(a.id)} />
          </Marker>
        ))}

        {/*
          Friends — exact positions, because the rules already allowed it.
          Non-interactive: a friend marker sitting on top of the venue they
          are at must never swallow the venue's tap. `pointerEvents="none"`
          is the exact mechanism the old SVG version relied on for the same
          reason — found by tapping Monarch on a simulator and getting
          nothing while an empty venue opened fine.
        */}
        {friends.map((f) => (
          <Marker key={`friend-${f.id}`} lngLat={toLngLat(f.at)} anchor="center" style={styles.zFriend}>
            <FriendMarker name={f.name} />
          </Marker>
        ))}

        {/* You. */}
        {me && (
          <Marker lngLat={toLngLat(me)} anchor="center" style={styles.zYou}>
            <YouMarker />
          </Marker>
        )}
      </MapLibreMap>

      <View style={styles.controls}>
        <MapButton onPress={() => zoomBy(ZOOM_STEP)} label="+" testID="map-zoom-in" />
        <MapButton onPress={() => zoomBy(-ZOOM_STEP)} label="−" testID="map-zoom-out" />
        <Pressable style={styles.mapButton} onPress={recentre} testID="map-recentre" accessibilityLabel="Recentre">
          <Icon name="pin" size={18} color={colour.fg} />
        </Pressable>
      </View>
    </View>
  );
}

// ---------------------------------------------------------------------------
// Markers
//
// Each is a small, self-contained view MapLibre positions and repositions —
// no manual projection. Circles/badges live in a fixed-size SVG canvas
// centred on the real coordinate; text labels are plain RN <Text>, absolutely
// positioned outside that canvas rather than drawn inside it, so a long venue
// or host name overflows freely instead of being clipped by the SVG viewBox.
// ---------------------------------------------------------------------------

const VENUE_SIZE = 160;
const VENUE_C = VENUE_SIZE / 2;

function VenueMarker({
  name,
  heat,
  stories,
  presence,
  onPress,
}: {
  name: string;
  heat: number;
  stories: number;
  presence: VenuePresenceView | undefined;
  onPress: () => void;
}) {
  const r = 10 + heat * 8;
  const friendCount = presence?.friends.length ?? 0;
  const mutualCount = presence?.mutualCount ?? 0;

  return (
    <Pressable onPress={onPress} hitSlop={12} testID={`venue-marker-${name}`}>
      <View style={{ width: VENUE_SIZE, height: VENUE_SIZE }}>
        <Svg width={VENUE_SIZE} height={VENUE_SIZE}>
          <Defs>
            <RadialGradient id="heat" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={colour.em} stopOpacity="0.62" />
              <Stop offset="45%" stopColor={colour.em} stopOpacity="0.2" />
              <Stop offset="100%" stopColor={colour.em} stopOpacity="0" />
            </RadialGradient>
          </Defs>

          {/* Heat — glow only. Never a number, never a word. */}
          <Circle cx={VENUE_C} cy={VENUE_C} r={34 + heat * 30} fill="url(#heat)" opacity={0.25 + heat * 0.6} />

          {stories > 0 && (
            <Circle
              cx={VENUE_C}
              cy={VENUE_C}
              r={r + 6}
              stroke={colour.emHi}
              strokeWidth={2.4}
              fill="none"
              strokeOpacity={0.85}
            />
          )}
          <Circle cx={VENUE_C} cy={VENUE_C} r={r} fill={colour.ink2} opacity={0.92} />
          <Circle
            cx={VENUE_C}
            cy={VENUE_C}
            r={r}
            stroke={colour.em}
            strokeWidth={1.6 + heat * 2.2}
            strokeOpacity={0.4 + heat * 0.6}
            fill="none"
          />
          <Circle cx={VENUE_C} cy={VENUE_C} r={2.6 + heat * 2.4} fill={colour.emHi} opacity={0.55 + heat * 0.45} />

          {/*
            Two separate badges, deliberately. A friend is named elsewhere
            and counted here; a mutual is only ever counted. Merging them
            into one number is exactly what the prototype did.
          */}
          {friendCount > 0 && (
            <>
              <Circle
                cx={VENUE_C + r + 6}
                cy={VENUE_C - r - 2}
                r={8}
                fill={colour.ink2}
                stroke={colour.emHi}
                strokeWidth={1.4}
              />
              <SvgText
                x={VENUE_C + r + 6}
                y={VENUE_C - r + 1.5}
                textAnchor="middle"
                fill={colour.emHi}
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
                cx={VENUE_C - r - 6}
                cy={VENUE_C - r - 2}
                r={7.5}
                fill={colour.ink2}
                stroke={colour.fg3}
                strokeWidth={1.2}
              />
              <SvgText
                x={VENUE_C - r - 6}
                y={VENUE_C - r + 1.5}
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

        <Text style={[styles.venueLabel, { top: VENUE_C + r + 6 }]} numberOfLines={1}>
          {name}
        </Text>
      </View>
    </Pressable>
  );
}

const SPOT_SIZE = 40;
const SPOT_C = SPOT_SIZE / 2;

function SpotMarker({ onPress }: { onPress: () => void }) {
  return (
    <Pressable onPress={onPress} hitSlop={16} testID="spot-marker">
      <Svg width={SPOT_SIZE} height={SPOT_SIZE}>
        <Circle cx={SPOT_C} cy={SPOT_C} r={11} fill="transparent" />
        <Circle cx={SPOT_C} cy={SPOT_C} r={8} stroke={colour.gold} strokeWidth={2} strokeDasharray="3 3" fill="none" />
        <Circle cx={SPOT_C} cy={SPOT_C} r={2.6} fill={colour.gold} />
      </Svg>
    </Pressable>
  );
}

const AFTER_SIZE = 120;
const AFTER_C = AFTER_SIZE / 2;

function AfterPartyMarker({
  hostName,
  going,
  onPress,
}: {
  hostName: string;
  going: number;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={12} testID={`after-marker-${hostName}`}>
      <View style={{ width: AFTER_SIZE, height: AFTER_SIZE }}>
        <Svg width={AFTER_SIZE} height={AFTER_SIZE}>
          <Circle cx={AFTER_C} cy={AFTER_C} r={24} fill={colour.disco} opacity={0.14} />
          <Circle cx={AFTER_C} cy={AFTER_C} r={13} fill={colour.ink2} />
          <Circle cx={AFTER_C} cy={AFTER_C} r={13} stroke={colour.disco} strokeWidth={2.2} fill="none" />
          <SvgText x={AFTER_C} y={AFTER_C + 4} textAnchor="middle" fill={colour.disco} fontSize={11} fontWeight="700">
            {String(going)}
          </SvgText>
        </Svg>
        <Text style={[styles.afterLabel, { top: AFTER_C + 16 }]} numberOfLines={1}>
          {`${hostName}’s`}
        </Text>
      </View>
    </Pressable>
  );
}

const FRIEND_SIZE = 60;
const FRIEND_C = FRIEND_SIZE / 2;

function FriendMarker({ name }: { name: string }) {
  return (
    <View style={{ width: FRIEND_SIZE, height: FRIEND_SIZE }} pointerEvents="none">
      <Svg width={FRIEND_SIZE} height={FRIEND_SIZE}>
        <Circle cx={FRIEND_C} cy={FRIEND_C} r={13} fill={colour.em} opacity={0.2} />
        <Circle cx={FRIEND_C} cy={FRIEND_C} r={7} fill={colour.em} />
        <Circle cx={FRIEND_C} cy={FRIEND_C} r={7} stroke={colour.ink} strokeWidth={1.6} fill="none" />
      </Svg>
      <Text style={[styles.friendLabel, { top: FRIEND_C - 30 }]} numberOfLines={1}>
        {name}
      </Text>
    </View>
  );
}

const YOU_SIZE = 60;
const YOU_C = YOU_SIZE / 2;

function YouMarker() {
  return (
    <View style={{ width: YOU_SIZE, height: YOU_SIZE }} pointerEvents="none">
      <Svg width={YOU_SIZE} height={YOU_SIZE}>
        <Defs>
          <RadialGradient id="you" cx="50%" cy="50%" r="50%">
            <Stop offset="0%" stopColor="#ffffff" stopOpacity="0.85" />
            <Stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </RadialGradient>
        </Defs>
        <Circle cx={YOU_C} cy={YOU_C} r={26} fill="url(#you)" opacity={0.5} />
        <Circle cx={YOU_C} cy={YOU_C} r={7} fill="#ffffff" />
        <Circle cx={YOU_C} cy={YOU_C} r={7} stroke={colour.ink} strokeWidth={2} fill="none" />
      </Svg>
    </View>
  );
}

function MapButton({ onPress, label, testID }: { onPress: () => void; label: string; testID: string }) {
  return (
    <Pressable style={styles.mapButton} onPress={onPress} testID={testID} accessibilityRole="button" accessibilityLabel={label}>
      <Text style={styles.mapButtonLabel}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colour.ink },
  map: { flex: 1 },
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
  mapButtonLabel: { color: colour.fg, fontSize: 16, fontWeight: '700' },
  venueLabel: {
    position: 'absolute',
    left: -60,
    width: VENUE_SIZE + 120,
    textAlign: 'center',
    color: colour.fg,
    fontSize: 11.5,
    fontWeight: '700',
  },
  afterLabel: {
    position: 'absolute',
    left: -40,
    width: AFTER_SIZE + 80,
    textAlign: 'center',
    color: '#E4D0FF',
    fontSize: 11,
    fontWeight: '700',
  },
  friendLabel: {
    position: 'absolute',
    left: -40,
    width: FRIEND_SIZE + 80,
    textAlign: 'center',
    color: colour.emHi,
    fontSize: 10.5,
    fontWeight: '700',
  },
  // Style ordering, not depth: MapLibre respects zIndex within its overlay
  // stack, so a spot or after-party sitting on the same spot as a venue
  // still wins the tap — the same priority a hand-scored hit-test used to
  // enforce. Friends and "you" render decorative, always on top.
  zVenue: { zIndex: 1 },
  zAbove: { zIndex: 2 },
  zFriend: { zIndex: 3 },
  zYou: { zIndex: 4 },
});
