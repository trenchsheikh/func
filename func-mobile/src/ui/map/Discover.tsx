import React, { useMemo, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSnapshot } from '@/data/DataContext';
import type { LatLng, PoolInvite, Venue, VenueCategory } from '@/domain/types';
import { BackIcon } from '../components/Icons';
import { InviteCard } from '../components/InviteBits';
import { Body, Eyebrow, Pill, Row, Small } from '../components/Primitives';
import { categoryColor, categoryLabel, colors, priceSymbols, radius, space } from '../theme';

type Props = {
  onClose: () => void;
  onPickInvite: (inv: PoolInvite) => void;
  onPickVenue: (v: Venue) => void;
  onPickArea: (center: LatLng) => void;
};

type Item =
  | { type: 'header'; key: string; label: string }
  | { type: 'invite'; key: string; invite: PoolInvite }
  | { type: 'venue'; key: string; venue: Venue }
  | { type: 'area'; key: string; area: string; center: LatLng; count: number };

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
  const snap = useSnapshot();
  const insets = useSafeAreaInsets();
  const [q, setQ] = useState('');

  const items = useMemo<Item[]>(() => {
    const query = q.trim().toLowerCase();
    const invites = [...snap.invites].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
    const mapVenues = snap.venues.filter((v) => v.category !== 'shop');

    if (!query) {
      return [
        { type: 'header', key: 'h-near', label: 'Nearby tonight' },
        ...invites.map<Item>((invite) => ({ type: 'invite', key: invite.id, invite })),
      ];
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
  }, [q, snap]);

  return (
    <View style={[styles.fill, { paddingTop: insets.top + 6 }]}>
      <Row gap={space.sm} style={{ paddingHorizontal: space.md }}>
        <Pressable onPress={onClose} hitSlop={10} accessibilityLabel="Back to map">
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
        ListEmptyComponent={<Small style={{ textAlign: 'center', marginTop: 40 }}>Nothing for “{q}” — try an area like Mission, or “bars”.</Small>}
        renderItem={({ item }) => {
          if (item.type === 'header') return <Eyebrow style={{ marginTop: space.sm }}>{item.label}</Eyebrow>;
          if (item.type === 'invite') return <InviteCard invite={item.invite} onPress={() => onPickInvite(item.invite)} />;
          if (item.type === 'area') {
            return (
              <Pressable style={styles.rowCard} onPress={() => onPickArea(item.center)}>
                <Body style={{ fontWeight: '600' }}>{item.area}</Body>
                <Small>{item.count} places</Small>
              </Pressable>
            );
          }
          const v = item.venue;
          return (
            <Pressable style={styles.rowCard} onPress={() => onPickVenue(v)}>
              <View style={[styles.dot, { backgroundColor: categoryColor(v.category) }]} />
              <View style={{ flex: 1 }}>
                <Body style={{ fontWeight: '600' }}>{v.name}</Body>
                <Small>{v.area} · {priceSymbols(v.priceTier)}</Small>
              </View>
              <Pill label={categoryLabel(v.category)} color={categoryColor(v.category)} />
            </Pressable>
          );
        }}
      />
      <Text style={styles.hint}>Price shows as $ tiers only — never a filter.</Text>
    </View>
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
  hint: { color: colors.faint, fontSize: 11, textAlign: 'center', paddingBottom: 8 },
});
