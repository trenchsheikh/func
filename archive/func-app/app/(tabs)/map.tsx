/**
 * The map — the product's centrepiece.
 *
 * Note what is absent: any mode. There is no Afters toggle, no clock-triggered
 * banner, no version of this screen that behaves differently at 3am. After-
 * parties are on the map because they are happening, not because a setting was
 * found and switched on.
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { storiesAtVenue, type Venue } from '../../src/domain';
import { heatFor } from '../../src/data/schema';
import { SAN_FRANCISCO } from '../../src/data/seed/san-francisco';
import { Icon } from '../../src/ui/components/Icon';
import { FuncMap } from '../../src/ui/components/FuncMap';
import { Label, Small } from '../../src/ui/components/kit';
import { useApp } from '../../src/ui/state/AppProvider';
import {
  myPresence,
  presenceByVenue,
  visibleFriends,
} from '../../src/ui/state/selectors';
import { colour, presenceColour, radius, space } from '../../src/ui/theme';

const KINDS = ['dinner', 'bar', 'club'] as const;

export default function MapScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [query, setQuery] = useState('');
  const [kinds, setKinds] = useState<Set<string>>(new Set());

  const presence = myPresence(app);
  const byVenue = useMemo(() => presenceByVenue(app), [app]);
  const friends = useMemo(() => visibleFriends(app), [app]);

  const venues = useMemo(() => {
    const q = query.trim().toLowerCase();
    return app.places.allVenues().filter((v) => {
      if (kinds.size && !kinds.has(v.kind)) return false;
      if (!q) return true;
      const district = v.districtId ? app.places.districtById(v.districtId as string)?.name ?? '' : '';
      return v.name.toLowerCase().includes(q) || district.toLowerCase().includes(q);
    });
  }, [app.places, kinds, query]);

  const spots = useMemo(
    () => app.state.spots.map((s) => ({ id: s.id as string, name: s.name, at: s.at })),
    [app.state.spots],
  );

  const afters = useMemo(
    () =>
      app.state.afterParties.map((a) => ({
        id: a.id as string,
        hostName: app.state.profiles[a.hostId as string]?.name ?? 'Someone',
        // No coordinates until you are accepted — an after-party is placed at
        // the centre of its stated area, never at its address.
        at: areaAnchor(a.area),
        going: a.baseGoing,
      })),
    [app.state.afterParties, app.state.profiles],
  );

  const myFix = app.meId ? app.fixes[app.meId as string]?.at ?? null : null;

  const toggleKind = (kind: string) =>
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });

  return (
    <View style={styles.wrap}>
      <FuncMap
        venues={venues}
        heatFor={(id) => heatFor(app.state, id, 0.3)}
        storyCountFor={(id) => storiesAtVenue(app.state.stories, id, app.clock.now()).length}
        presenceFor={(id) => byVenue.get(id as string)}
        friends={friends.map((f) => ({ id: f.id as string, name: f.name, at: f.at }))}
        spots={spots}
        afterParties={afters}
        me={myFix}
        initialCentre={myFix ?? SAN_FRANCISCO.centre}
        onVenuePress={(venue: Venue) => router.push(`/venue/${venue.id}`)}
        onSpotPress={(id) => router.push(`/venue/spot-${id}`)}
        onAfterPress={(id) => router.push(`/after/${id}`)}
      />

      <View style={[styles.top, { paddingTop: insets.top + space.sm }]}>
        <View style={styles.searchRow}>
          <Icon name="search" size={18} color={colour.fg3} />
          <TextInput
            style={styles.search}
            placeholder="Search"
            placeholderTextColor={colour.fg4}
            value={query}
            onChangeText={setQuery}
            testID="map-search"
          />
        </View>

        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          <Pressable
            style={[styles.presenceChip, { borderColor: presenceColour(presence.kind) }]}
            onPress={() => router.push('/settings')}
            testID="presence-chip"
          >
            <View style={[styles.dot, { backgroundColor: presenceColour(presence.kind) }]} />
            <Small tone="default">
              {presence.kind === 'dtf' ? 'DTF' : presence.kind === 'casual' ? 'Casual' : 'Not out'}
            </Small>
          </Pressable>

          {KINDS.map((kind) => (
            <Pressable
              key={kind}
              onPress={() => toggleKind(kind)}
              style={[styles.chip, kinds.has(kind) && styles.chipOn]}
              testID={`filter-${kind}`}
            >
              <Small tone={kinds.has(kind) ? 'life' : 'dim'}>
                {kind === 'dinner' ? 'Dinner' : kind === 'bar' ? 'Bars' : 'Clubs'}
              </Small>
            </Pressable>
          ))}
        </ScrollView>
      </View>

      {presence.kind === 'off' && (
        <Pressable
          style={[styles.banner, { bottom: insets.bottom + 96 }]}
          onPress={() => router.push('/settings')}
          testID="presence-banner"
        >
          <Label tone="default">Your friends cannot see you</Label>
          <Small tone="dim">Turn DTF on when you are out</Small>
        </Pressable>
      )}
    </View>
  );
}

/**
 * Where to draw an after-party you have not been accepted to.
 *
 * The address reveal is a Tier 0-adjacent safety mechanic, so the map is not
 * allowed a precise position either — it anchors to the neighbourhood. These
 * are district centroids, deliberately coarse.
 */
function areaAnchor(area: string): { lat: number; lon: number } {
  const anchors: Record<string, { lat: number; lon: number }> = {
    'Potrero Hill': { lat: 37.7605, lon: -122.4013 },
    Mission: { lat: 37.7599, lon: -122.4148 },
    SoMa: { lat: 37.7785, lon: -122.4056 },
  };
  return anchors[area] ?? SAN_FRANCISCO.centre;
}

const styles = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: colour.ink },
  top: { position: 'absolute', left: 0, right: 0, top: 0, paddingHorizontal: space.md, gap: space.sm },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.sm,
    backgroundColor: 'rgba(14,20,26,0.92)',
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colour.hairline,
    paddingHorizontal: space.md,
    height: 44,
  },
  search: { flex: 1, color: colour.fg, fontSize: 15 },
  chips: { gap: space.sm, paddingRight: space.md },
  chip: {
    height: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colour.hairline,
    backgroundColor: 'rgba(14,20,26,0.92)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipOn: { borderColor: colour.em, backgroundColor: colour.emDim },
  presenceChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 34,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
    borderWidth: 1,
    backgroundColor: 'rgba(14,20,26,0.92)',
  },
  dot: { width: 8, height: 8, borderRadius: 4 },
  banner: {
    position: 'absolute',
    alignSelf: 'center',
    backgroundColor: 'rgba(14,20,26,0.96)',
    borderWidth: 1,
    borderColor: colour.hairline,
    borderRadius: radius.md,
    paddingVertical: space.sm,
    paddingHorizontal: space.lg,
    alignItems: 'center',
    gap: 2,
  },
});
