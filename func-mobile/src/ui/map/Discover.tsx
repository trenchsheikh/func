import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useView } from '@/data/DataContext';
import type { InviteCardView } from '@/data/views';
import { distanceKm, formatDistanceKm } from '@/domain/geo';
import type { LatLng, Venue, VenueCategory } from '@/domain/types';
import { viewerLocation } from '@/ui/viewerGeo';
import { BackIcon } from '../components/Icons';
import { InviteCard } from '../components/InviteBits';
import { Body, Eyebrow, GlassCard, Pill, Row, Small } from '../components/Primitives';
import { categoryColor, categoryLabel, colors, priceSymbols, radius, space } from '../theme';
import { browseSections, type Item } from './browse';

type Props = {
  onClose: () => void;
  onPickInvite: (inv: InviteCardView) => void;
  onPickVenue: (v: Venue) => void;
  onPickArea: (center: LatLng) => void;
};

const CATEGORY_WORDS: Record<string, VenueCategory> = {
  restaurant: 'restaurant', restaurants: 'restaurant', food: 'restaurant', dinner: 'restaurant', eat: 'restaurant',
  bar: 'bar', bars: 'bar', drinks: 'bar', cocktails: 'bar',
  club: 'club', clubs: 'club', dance: 'club', techno: 'club', house: 'club',
  cafe: 'cafe', café: 'cafe', coffee: 'cafe', cafes: 'cafe',
  daytime: 'daytime', park: 'daytime', beach: 'daytime', museum: 'daytime', day: 'daytime',
};

/**
 * Discovery / browse: a Partiful-style list of nearby Pool invites by default,
 * plus free-text search across areas, categories, venues and invites.
 */
export function Discover({ onClose, onPickInvite, onPickVenue, onPickArea }: Props) {
  const view = useView();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const items = useMemo<Item[]>(() => {
    const query = q.trim().toLowerCase();
    const invites = [...view.invites].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const mapVenues = view.venues.filter((v) => v.category !== 'shop');

    if (!query) {
      // Own location only — never another user's presence.
      return browseSections(invites, mapVenues, viewerLocation(view), new Date());
    }

    const out: Item[] = [];
    // areas
    const areas = new Map<string, Venue[]>();
    for (const v of mapVenues) areas.set(v.area, [...(areas.get(v.area) ?? []), v]);
    const areaHits = [...areas.entries()].filter(([a]) => a.toLowerCase().includes(query));
    if (areaHits.length) {
      out.push({ type: 'header', key: 'h-areas', label: 'Areas' });
      for (const [area, vs] of areaHits) {
        const center = {
          lat: vs.reduce((s, v) => s + v.location.lat, 0) / vs.length,
          lng: vs.reduce((s, v) => s + v.location.lng, 0) / vs.length,
        };
        out.push({ type: 'area', key: `a-${area}`, area, center, count: vs.length });
      }
    }
    // category word → venues of that category; otherwise name/area match
    const cat = CATEGORY_WORDS[query];
    const venueHits = mapVenues.filter((v) =>
      cat ? v.category === cat : v.name.toLowerCase().includes(query) || categoryLabel(v.category).toLowerCase().includes(query),
    );
    if (venueHits.length) {
      out.push({ type: 'header', key: 'h-venues', label: cat ? categoryLabel(cat) + 's' : 'Places' });
      out.push(...venueHits.map<Item>((venue) => ({ type: 'venue', key: venue.id, venue })));
    }
    const inviteHits = invites.filter((i) => i.description.toLowerCase().includes(query));
    if (inviteHits.length) {
      out.push({ type: 'header', key: 'h-inv', label: 'Invites' });
      out.push(...inviteHits.map<Item>((invite) => ({ type: 'invite', key: invite.id, invite })));
    }
    return out;
  }, [q, view]);

  return (
    <View style={[styles.fill, { paddingTop: insets.top + 6 }]}>
      <Row gap={space.sm} style={{ paddingHorizontal: space.md }}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityRole="button" accessibilityLabel="Back to map">
          <BackIcon color={colors.text} />
        </Pressable>
        <TextInput
          autoFocus
          value={q}
          onChangeText={setQ}
          placeholder="Area, category, or a specific night"
          placeholderTextColor={colors.faint}
          style={styles.input}
          returnKeyType="search"
          clearButtonMode="while-editing"
        />
      </Row>
      <FlatList
        data={items}
        keyExtractor={(i) => i.key}
        contentContainerStyle={{ padding: space.md, gap: space.sm, paddingBottom: 40 }}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Small style={{ textAlign: 'center', marginTop: 40 }}>
            {q ? `Nothing for “${q}” — try an area like Mission, or “bars”.` : 'Nothing nearby yet.'}
          </Small>
        }
        renderItem={({ item }) => {
          if (item.type === 'header') return <Eyebrow style={{ marginTop: space.sm }}>{item.label}</Eyebrow>;
          if (item.type === 'invite') return <InviteCard invite={item.invite} onPress={() => onPickInvite(item.invite)} />;
          if (item.type === 'area') {
            return (
              <Pressable
                style={styles.rowCard}
                onPress={() => onPickArea(item.center)}
                accessibilityRole="button"
                accessibilityLabel={`${item.area}, ${item.count} places`}
              >
                <Body style={{ fontWeight: '600' }}>{item.area}</Body>
                <Small>{item.count} places</Small>
              </Pressable>
            );
          }
          return <VenueRow venue={item.venue} onPress={() => onPickVenue(item.venue)} />;
        }}
      />
      <Text style={styles.hint}>Price shows as $ tiers only — never a filter.</Text>
    </View>
  );
}

/** Compact, scannable venue row — glass shell, category + area + price + distance from the viewer's own location. */
function VenueRow({ venue, onPress }: { venue: Venue; onPress: () => void }) {
  const view = useView();
  const myLocation = viewerLocation(view);
  const distance = myLocation ? formatDistanceKm(distanceKm(myLocation, venue.location)) : null;
  const label = `${venue.name}, ${categoryLabel(venue.category)}${distance ? `, ${distance} away` : ''}`;
  return (
    <GlassCard onPress={onPress} style={styles.venueRow} accessibilityLabel={label}>
      <Row gap={space.md}>
        <View style={[styles.dot, { backgroundColor: categoryColor(venue.category) }]} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>{venue.name}</Body>
          <Small>
            {venue.area} · {priceSymbols(venue.priceTier)}
            {distance ? ` · ${distance}` : ''}
          </Small>
        </View>
        <Pill label={categoryLabel(venue.category)} color={categoryColor(venue.category)} />
      </Row>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  fill: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.bg },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 11,
    fontSize: 15,
    borderWidth: 1,
    borderColor: colors.border,
  },
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: space.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  dot: { width: 10, height: 10, borderRadius: 5 },
  venueRow: { padding: space.md },
  hint: { color: colors.faint, fontSize: 11, textAlign: 'center', paddingBottom: 8 },
});
