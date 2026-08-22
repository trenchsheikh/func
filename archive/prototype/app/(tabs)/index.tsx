import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, Easing, PanResponder, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AvatarStack } from '../../components/AvatarStack';
import { Chip } from '../../components/Chip';
import { FlareReel } from '../../components/FlareReel';
import { NeonButton } from '../../components/NeonButton';
import { Ticker } from '../../components/Ticker';
import { VelmontMap } from '../../components/VelmontMap';
import { WorldMap } from '../../components/WorldMap';
import { eventById } from '../../data/events';
import { groupById } from '../../data/groups';
import { poolInvites } from '../../data/poolInvites';
import { flareTier, storiesForVenue } from '../../data/stories';
import { Venue, WorldCity } from '../../data/types';
import { districtName, MAP_H, MAP_W, PEOPLE_OUT_TONIGHT, venues } from '../../data/velmont';
import { tickerItems, WORLD_OUT_BASE } from '../../data/world';
import { costTotal, formatRange, venueCostRange } from '../../lib/cost';
import { useDemo } from '../../lib/store';
import { colors, radius, spacing } from '../../lib/theme';

const ACTIVITY = { 1: 'Warming up', 2: 'Buzzing', 3: 'On fire' } as const;
const ACTIVITY_TINT = { 1: colors.primary, 2: colors.secondary, 3: colors.accent } as const;
const TREND = { 1: '↗ Warming up', 2: '→ Steady', 3: '↗ Filling fast' } as const;
// Hand-authored per-venue tide lines (Map v3 spec §1.5 row 5) — the honest, hand-seeded
// version of the ghosted forecast; absent for venues with no clear pattern.
const TIDE: Record<string, string> = {
  'v-archive9': 'Peaks around 11pm',
  'v-vault': 'Peaks around midnight',
  'v-skyline': 'Best 6–8pm, golden hour',
  'v-keg': 'Busiest before 11',
};
// Who this venue's crowd skews toward knowing, for the "who" row — a light, honest
// touch rather than a full graph-presence engine (out of prototype scope, spec §6).
const KNOWN_CREW: Record<string, string> = { 'v-archive9': "including Maya's crew" };

const BUDGETS = [15, 30, 50];

// City map renders 1.25× the viewport at zoom 1 so there is always somewhere to pan.
const BASE_OVERSCAN = 1.25;
const ZOOMS = [1, 1.4, 1.9];
const TICKER_H = 34;
const YOUR_CREW = groupById('g-you').memberIds;
const CREW_TOTAL = YOUR_CREW.length;
const MAJORITY = Math.floor(CREW_TOTAL / 2) + 1;

function fitScoreFor(v: Venue, budget: number | null): number {
  const heatWeight = v.level === 3 ? 1 : v.level === 2 ? 0.68 : 0.4;
  const budgetFit = budget ? Math.max(0, 1 - Math.abs(v.avgSpend - budget) / budget) : 0.8;
  const graphBonus = KNOWN_CREW[v.id] ? 0.15 : 0;
  return Math.min(1, heatWeight * 0.6 + budgetFit * 0.3 + graphBonus);
}

function reasonFor(v: Venue, budget: number | null): string {
  const range = v.eventId ? costTotal(eventById(v.eventId).costBreakdown) : venueCostRange(v.avgSpend);
  const bits = [ACTIVITY[v.level].toLowerCase(), formatRange(range.min, range.max)];
  if (budget && Math.abs(v.avgSpend - budget) <= budget * 0.25) bits.push('fits your budget');
  if (KNOWN_CREW[v.id]) bits.push(KNOWN_CREW[v.id]!);
  return bits.join(' · ');
}

export default function MapScreen() {
  const [mode, setMode] = useState<'world' | 'city'>('city');
  const [selected, setSelected] = useState<Venue | null>(null);
  const [lockedCity, setLockedCity] = useState<WorldCity | null>(null);
  const [worldOut, setWorldOut] = useState(WORLD_OUT_BASE);
  const [zoomIdx, setZoomIdx] = useState(0);
  const [viewport, setViewport] = useState({ w: 0, h: 0 });
  const [budget, setBudget] = useState<number | null>(null);
  const [reelOpen, setReelOpen] = useState(false);
  const [showCoach, setShowCoach] = useState(true);
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const demo = useDemo();

  // The planet never sleeps: tick the global counter.
  useEffect(() => {
    const t = setInterval(() => setWorldOut((n) => n + Math.floor(Math.random() * 12) + 2), 2100);
    return () => clearInterval(t);
  }, []);

  // Auto-dismiss the "city coming soon" toast and the one-shot coach line.
  useEffect(() => {
    if (!lockedCity) return;
    const t = setTimeout(() => setLockedCity(null), 2600);
    return () => clearTimeout(t);
  }, [lockedCity]);
  useEffect(() => {
    const t = setTimeout(() => setShowCoach(false), 4500);
    return () => clearTimeout(t);
  }, []);

  // BPM beat dot — "Velmont · 128 BPM" (Map v3 spec §1.9), ~469ms per beat.
  const beat = useRef(new Animated.Value(1)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(beat, { toValue: 1.5, duration: 235, easing: Easing.out(Easing.quad), useNativeDriver: false }),
        Animated.timing(beat, { toValue: 1, duration: 235, easing: Easing.in(Easing.quad), useNativeDriver: false }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [beat]);

  // --- City pan/zoom (top-left anchored translate; no transform-origin maths) ---
  const pan = useRef(new Animated.ValueXY()).current;
  const panBase = useRef({ x: 0, y: 0 });
  const sizeRef = useRef({ mapW: 0, mapH: 0, vw: 0, vh: 0 });

  const mapW = viewport.w * BASE_OVERSCAN * ZOOMS[zoomIdx];
  const mapH = mapW * (MAP_H / MAP_W);
  sizeRef.current = { mapW, mapH, vw: viewport.w, vh: viewport.h };

  const clampOffset = (x: number, y: number) => {
    const { mapW: mw, mapH: mh, vw, vh } = sizeRef.current;
    return {
      x: Math.min(0, Math.max(vw - mw, x)),
      y: Math.min(0, Math.max(vh - mh, y)),
    };
  };

  const setOffset = (x: number, y: number) => {
    const c = clampOffset(x, y);
    panBase.current = c;
    pan.setValue(c);
  };

  const panToVenue = (v: Venue) => {
    const { mapW: mw, mapH: mh } = sizeRef.current;
    const scaleF = mw / MAP_W;
    setOffset(viewport.w / 2 - v.x * scaleF, viewport.h / 2 - v.y * scaleF);
    void mh;
  };

  // The gesture overlay owns ALL city-map input: drag pans, near-zero movement is a
  // tap, resolved by hit-testing venue coordinates. SVG onPress is not used here —
  // gestures that start on SVG elements never reach a parent PanResponder on web.
  const vpOffset = useRef({ x: 0, y: 0 });
  const overlayRef = useRef<View>(null);

  const handleTap = (pageX: number, pageY: number) => {
    const { mapW: mw } = sizeRef.current;
    const scaleF = mw / MAP_W;
    const localX = pageX - vpOffset.current.x;
    const localY = pageY - vpOffset.current.y;
    const svgX = (localX - panBase.current.x) / scaleF;
    const svgY = (localY - panBase.current.y) / scaleF;
    let best: Venue | null = null;
    let bestD = 24; // svg-space tap radius
    for (const v of venues) {
      const d = Math.hypot(v.x - svgX, v.y - svgY);
      if (d < bestD) {
        best = v;
        bestD = d;
      }
    }
    setShowCoach(false);
    if (best) {
      const b = best;
      setSelected((cur) => (cur?.id === b.id ? null : b));
    } else {
      setSelected(null);
    }
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        const c = clampOffset(panBase.current.x + g.dx, panBase.current.y + g.dy);
        pan.setValue(c);
      },
      onPanResponderRelease: (_e, g) => {
        if (Math.abs(g.dx) + Math.abs(g.dy) < 10) {
          handleTap(g.x0, g.y0);
          return;
        }
        const c = clampOffset(panBase.current.x + g.dx, panBase.current.y + g.dy);
        panBase.current = c;
        pan.setValue(c);
      },
    })
  ).current;

  const enterCity = () => {
    setMode('city');
    setZoomIdx(0);
    cityAnim.setValue(0);
    Animated.timing(cityAnim, { toValue: 1, duration: 420, useNativeDriver: false }).start();
  };

  // Centre the map whenever the viewport is known or zoom resets it.
  useEffect(() => {
    if (viewport.w === 0) return;
    setOffset((viewport.w - mapW) / 2, (viewport.h - mapH) / 2);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewport.w, viewport.h, zoomIdx, mode]);

  const changeZoom = (dir: 1 | -1) => {
    setZoomIdx((i) => Math.min(ZOOMS.length - 1, Math.max(0, i + dir)));
  };

  const cityAnim = useRef(new Animated.Value(1)).current;

  const event = selected?.eventId ? eventById(selected.eventId) : null;

  // --- Group Lens: fit score + Top-3 rail (Map v3 spec §1.4) ---
  const fitScores = useMemo(() => {
    const map: Record<string, number> = {};
    venues.forEach((v) => (map[v.id] = fitScoreFor(v, budget)));
    return map;
  }, [budget]);
  const top3 = useMemo(
    () => [...venues].sort((a, b) => fitScores[b.id] - fitScores[a.id]).slice(0, 3),
    [fitScores]
  );

  // --- Call It plan (Map v3 spec §1.6) ---
  const plan = demo.plan;
  const planVoteCount = plan ? Object.values(plan.votes).filter((v) => v === 'in').length : 0;
  const planLocked = planVoteCount >= MAJORITY;
  const selectedVenueStories = selected ? storiesForVenue(selected.id).filter((s) => flareTier(s.minutesAgo) !== 'gone') : [];
  const selectedCostRange = selected
    ? event
      ? costTotal(event.costBreakdown)
      : venueCostRange(selected.avgSpend)
    : { min: 0, max: 0 };
  const poolMatch = selected ? poolInvites.find((p) => groupById(p.groupId).district === selected.district) : undefined;

  return (
    <View style={styles.root} onLayout={(e) => setViewport({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}>
      {mode === 'world' ? (
        <WorldMap onCityPress={(c) => (c.live ? enterCity() : setLockedCity(c))} />
      ) : (
        <Animated.View
          style={{
            flex: 1,
            opacity: cityAnim,
            transform: [{ scale: cityAnim.interpolate({ inputRange: [0, 1], outputRange: [1.06, 1] }) }],
          }}
        >
          <View style={styles.cityViewport}>
            {viewport.w > 0 && (
              <Animated.View
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  transform: [{ translateX: pan.x }, { translateY: pan.y }],
                }}
              >
                <VelmontMap
                  width={mapW}
                  height={mapH}
                  selectedVenueId={selected?.id}
                  onVenuePress={() => {}}
                  fitScores={fitScores}
                  planVenueId={plan?.venueId}
                  planVoteCount={planVoteCount}
                  planTotal={CREW_TOTAL}
                  planLocked={planLocked}
                />
              </Animated.View>
            )}
            {/* Gesture overlay: pans on drag, hit-tests venues on tap */}
            <View
              ref={overlayRef}
              style={StyleSheet.absoluteFill}
              onLayout={() => {
                overlayRef.current?.measureInWindow((x, y) => {
                  vpOffset.current = { x, y };
                });
              }}
              {...panResponder.panHandlers}
            />
          </View>
        </Animated.View>
      )}

      {/* Top overlay: BPM pill + Group Lens */}
      <View style={[styles.topOverlay, { top: insets.top + spacing.sm }]} pointerEvents="box-none">
        <View style={styles.pill} pointerEvents="none">
          {mode === 'city' ? (
            <Animated.View style={[styles.liveDot, { transform: [{ scale: beat }] }]} />
          ) : (
            <View style={styles.liveDot} />
          )}
          <Text style={styles.pillText}>
            {mode === 'world'
              ? `${worldOut.toLocaleString()} people out on Earth 🌍`
              : `Velmont · 128 BPM · ${PEOPLE_OUT_TONIGHT} out`}
          </Text>
        </View>

        {mode === 'city' && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.lensRow} contentContainerStyle={{ gap: 6, paddingHorizontal: spacing.md }}>
            <Pressable style={styles.lensChip} onPress={() => setLockedCity({ id: 'x', name: 'Multiple crews', x: 0, y: 0, size: 1, out: 0, live: false })}>
              <Text style={styles.lensChipText}>You + 3 ▾</Text>
            </Pressable>
            {BUDGETS.map((b) => (
              <Pressable
                key={b}
                style={[styles.lensChip, budget === b && styles.lensChipActive]}
                onPress={() => setBudget((cur) => (cur === b ? null : b))}
              >
                <Text style={[styles.lensChipText, budget === b && styles.lensChipTextActive]}>£{b}</Text>
              </Pressable>
            ))}
          </ScrollView>
        )}

        {mode === 'city' && showCoach && (
          <View style={styles.coach} pointerEvents="none">
            <Text style={styles.coachText}>Glow = busy · £ = the damage · Tap one</Text>
          </View>
        )}
      </View>

      {/* City controls */}
      {mode === 'city' && (
        <>
          <Pressable
            style={[styles.roundBtn, { top: insets.top + spacing.sm, left: spacing.md }]}
            onPress={() => {
              setSelected(null);
              setMode('world');
            }}
          >
            <Ionicons name="earth" size={20} color={colors.accent} />
          </Pressable>
          {selected === null && (
            <View style={[styles.zoomCol, { bottom: TICKER_H + spacing.lg }]}>
              <Pressable style={styles.zoomBtn} onPress={() => changeZoom(1)}>
                <Ionicons name="add" size={22} color={zoomIdx === ZOOMS.length - 1 ? colors.textDim : colors.text} />
              </Pressable>
              <Pressable style={styles.zoomBtn} onPress={() => changeZoom(-1)}>
                <Ionicons name="remove" size={22} color={zoomIdx === 0 ? colors.textDim : colors.text} />
              </Pressable>
            </View>
          )}
        </>
      )}

      {/* Top-3 rail — pinned above the ticker when nothing is selected */}
      {mode === 'city' && !selected && (
        <View style={[styles.rail, { bottom: TICKER_H }]}>
          {top3.map((v, i) => (
            <Pressable
              key={v.id}
              style={styles.railRow}
              onPress={() => {
                panToVenue(v);
                setSelected(v);
                setShowCoach(false);
              }}
            >
              <Text style={styles.railRank}>{i + 1}</Text>
              <Text style={styles.railName}>{v.name}</Text>
              <Text style={styles.railReason} numberOfLines={1}>
                {reasonFor(v, budget)}
              </Text>
            </Pressable>
          ))}
        </View>
      )}

      {/* Decision Card v3 */}
      {mode === 'city' && selected && (
        <View style={[styles.card, { bottom: TICKER_H + spacing.md }]}>
          <View style={styles.cardHeader}>
            <View style={{ flex: 1 }}>
              <Text style={styles.venueName}>
                {selected.emoji} {selected.name}
              </Text>
              <Text style={styles.venueMeta}>{districtName(selected.district)}</Text>
            </View>
            <Pressable onPress={() => setSelected(null)} hitSlop={10}>
              <Ionicons name="close" size={20} color={colors.textDim} />
            </Pressable>
          </View>

          {/* Row 1 — busyness */}
          <View style={styles.statRow}>
            <View style={[styles.dot, { backgroundColor: ACTIVITY_TINT[selected.level] }]} />
            <Text style={[styles.stat, { color: ACTIVITY_TINT[selected.level] }]}>{ACTIVITY[selected.level]}</Text>
            <Text style={styles.statDim}>· {TREND[selected.level]}</Text>
          </View>

          {/* Row 2 — cost meter */}
          <View style={styles.chipRow}>
            <Chip label={`💸 ${formatRange(selectedCostRange.min, selectedCostRange.max)} all-in`} tint={colors.secondary} />
            {budget && (
              <Chip
                label={Math.abs(selected.avgSpend - budget) <= budget * 0.25 ? `✓ fits £${budget}` : `above £${budget}`}
                tint={Math.abs(selected.avgSpend - budget) <= budget * 0.25 ? colors.success : colors.textDim}
              />
            )}
          </View>

          {/* Row 3 — who */}
          <Text style={styles.whoLine}>
            {selected.groupsTonight} {selected.groupsTonight === 1 ? 'group' : 'groups'} in the pool tonight
            {KNOWN_CREW[selected.id] ? ` · ${KNOWN_CREW[selected.id]}` : ''}
          </Text>

          {/* Row 4 — flare reel filmstrip */}
          {selectedVenueStories.length > 0 && (
            <Pressable style={styles.filmstrip} onPress={() => setReelOpen(true)}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
                {selectedVenueStories.map((s) => (
                  <View
                    key={s.id}
                    style={[
                      styles.filmTile,
                      { backgroundColor: s.gradient[0], opacity: flareTier(s.minutesAgo) === 'hot' ? 1 : 0.55 },
                    ]}
                  />
                ))}
              </ScrollView>
              <Text style={styles.filmstripLabel}>
                {selectedVenueStories.length} flare{selectedVenueStories.length === 1 ? '' : 's'} live · tap to watch
              </Text>
            </Pressable>
          )}

          {/* Row 5 — tide */}
          {TIDE[selected.id] && <Text style={styles.tideLine}>🌊 {TIDE[selected.id]}</Text>}

          {event && (
            <Pressable style={styles.eventRow} onPress={() => router.push(`/event/${event.id}`)}>
              <Text style={styles.eventEmoji}>{event.emoji}</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.eventTitle}>{event.title}</Text>
                <Text style={styles.venueMeta}>
                  {event.when} · {event.price}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
            </Pressable>
          )}

          {/* Call It / verdict */}
          {!plan || plan.venueId !== selected.id ? (
            <View style={styles.ctaRow}>
              <NeonButton label="📣 Call It" style={{ flex: 1 }} onPress={() => demo.callIt(selected.id)} />
              {poolMatch && (
                <NeonButton
                  label="👯 Pool us in"
                  variant="outline"
                  style={{ flex: 1 }}
                  onPress={() => router.push(`/group/${poolMatch.groupId}`)}
                />
              )}
            </View>
          ) : (
            <View style={styles.verdictBox}>
              <View style={styles.verdictHeader}>
                <AvatarStack userIds={YOUR_CREW} size={30} max={4} />
                <Text style={styles.verdictText}>
                  {planLocked ? 'Plan locked 🚩' : `${planVoteCount}/${CREW_TOTAL} in`}
                </Text>
              </View>
              {planLocked ? (
                <Text style={styles.verdictSub}>Your crew is flying the flag at {selected.name} tonight.</Text>
              ) : (
                <Text style={styles.verdictSub}>Waiting on the crew to weigh in…</Text>
              )}
            </View>
          )}
        </View>
      )}

      {/* "Coming soon" toast for locked cities */}
      {mode === 'world' && lockedCity && lockedCity.id !== 'x' && (
        <View style={[styles.card, styles.toast, { bottom: TICKER_H + spacing.md }]}>
          <Text style={styles.toastText}>🚀 {lockedCity.name} lands in 2027 — Velmont is live tonight</Text>
        </View>
      )}
      {lockedCity?.id === 'x' && (
        <View style={[styles.card, styles.toast, { bottom: TICKER_H + spacing.md }]}>
          <Text style={styles.toastText}>Multiple crews are coming soon — for now, it's You + 3</Text>
        </View>
      )}

      <Ticker items={tickerItems} />

      {reelOpen && selected && (
        <FlareReel
          stories={selectedVenueStories}
          venueName={selected.name}
          costLabel={formatRange(selectedCostRange.min, selectedCostRange.max)}
          onClose={() => setReelOpen(false)}
          onCallIt={() => {
            setReelOpen(false);
            demo.callIt(selected.id);
          }}
          onPoolUsIn={poolMatch ? () => {
            setReelOpen(false);
            router.push(`/group/${poolMatch.groupId}`);
          } : undefined}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  cityViewport: { flex: 1, overflow: 'hidden' },
  topOverlay: { position: 'absolute', left: 0, right: 0, alignItems: 'center', gap: spacing.sm, zIndex: 5 },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(19,19,28,0.92)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.accent },
  pillText: { color: colors.text, fontWeight: '700', fontSize: 13 },
  lensRow: { maxWidth: '100%' },
  lensChip: {
    backgroundColor: 'rgba(19,19,28,0.92)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  lensChipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
  lensChipText: { color: colors.textDim, fontSize: 12, fontWeight: '700' },
  lensChipTextActive: { color: '#FFFFFF' },
  coach: {
    backgroundColor: 'rgba(19,19,28,0.85)',
    borderRadius: radius.pill,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  coachText: { color: colors.accent, fontSize: 11, fontWeight: '600' },
  roundBtn: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19,19,28,0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 6,
  },
  zoomCol: {
    position: 'absolute',
    right: spacing.md,
    gap: spacing.sm,
    zIndex: 6,
  },
  zoomBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(19,19,28,0.92)',
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rail: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: 'rgba(19,19,28,0.92)',
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.sm,
    gap: 2,
    zIndex: 5,
  },
  railRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 4, paddingHorizontal: 6 },
  railRank: { color: colors.accent, fontWeight: '900', fontSize: 13, width: 14 },
  railName: { color: colors.text, fontWeight: '800', fontSize: 13 },
  railReason: { color: colors.textDim, fontSize: 12, flex: 1 },
  card: {
    position: 'absolute',
    left: spacing.md,
    right: spacing.md,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    zIndex: 5,
  },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start' },
  venueName: { color: colors.text, fontSize: 18, fontWeight: '800' },
  venueMeta: { color: colors.textDim, fontSize: 12, marginTop: 2 },
  statRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  stat: { fontWeight: '800', fontSize: 13 },
  statDim: { color: colors.textDim, fontSize: 13 },
  chipRow: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  whoLine: { color: colors.textDim, fontSize: 12 },
  filmstrip: { gap: 4 },
  filmTile: { width: 40, height: 56, borderRadius: 8 },
  filmstripLabel: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  tideLine: { color: colors.textDim, fontSize: 12, fontStyle: 'italic' },
  eventRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.md,
    padding: spacing.sm + 2,
  },
  eventEmoji: { fontSize: 22 },
  eventTitle: { color: colors.text, fontWeight: '700', fontSize: 14 },
  ctaRow: { flexDirection: 'row', gap: spacing.sm },
  verdictBox: { backgroundColor: colors.surfaceHi, borderRadius: radius.md, padding: spacing.sm + 2, gap: 6 },
  verdictHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  verdictText: { color: colors.accent, fontWeight: '800', fontSize: 14 },
  verdictSub: { color: colors.textDim, fontSize: 12 },
  toast: { alignItems: 'center' },
  toastText: { color: colors.text, fontWeight: '700', fontSize: 14, textAlign: 'center' },
});
