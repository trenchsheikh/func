/**
 * Browse — swipe for anything.
 *
 * Venues, after-parties and local spots in one deck. People are deliberately
 * absent: a swipeable deck of people who are out is a dating product, and the
 * presence model now makes "who is out" ambient rather than something to flick
 * through. Interest still exists on a profile; it is not a game here.
 */

import { useRouter } from 'expo-router';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { heatFor } from '../../src/data/schema';
import { Icon } from '../../src/ui/components/Icon';
import {
  Body,
  Button,
  Card,
  Chip,
  Empty,
  H1,
  Label,
  Row,
  Screen,
  Small,
  Spacer,
} from '../../src/ui/components/kit';
import { useApp } from '../../src/ui/state/AppProvider';
import { toggleSaved } from '../../src/ui/state/actions';
import { afterHeadcount, displayName, presenceAtVenue } from '../../src/ui/state/selectors';
import { colour, radius, space } from '../../src/ui/theme';

type DeckItem =
  | { kind: 'venue'; id: string; title: string; sub: string; body: string; heat: number; who: string | null; venueKind: string }
  | { kind: 'after'; id: string; title: string; sub: string; body: string }
  | { kind: 'spot'; id: string; title: string; sub: string; body: string };

// Same three kinds Map filters by (app/(tabs)/map.tsx) — kept identical so
// the two screens agree on what "Bars" or "Clubs" means.
const KINDS = ['dinner', 'bar', 'club'] as const;

export default function BrowseScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const [index, setIndex] = useState(0);
  const [query, setQuery] = useState('');
  const [kinds, setKinds] = useState<Set<string>>(new Set());

  const toggleKind = (kind: string) => {
    setKinds((prev) => {
      const next = new Set(prev);
      if (next.has(kind)) next.delete(kind);
      else next.add(kind);
      return next;
    });
    setIndex(0);
  };

  const items = useMemo<DeckItem[]>(() => {
    const q = query.trim().toLowerCase();
    const matches = (title: string, sub: string) =>
      !q || title.toLowerCase().includes(q) || sub.toLowerCase().includes(q);

    const venues: DeckItem[] = app.places
      .allVenues()
      .slice()
      .sort((a, b) => heatFor(app.state, b.id, 0.3) - heatFor(app.state, a.id, 0.3))
      .filter((v) => kinds.size === 0 || kinds.has(v.kind))
      .map((v) => {
        const presence = presenceAtVenue(app, v.id);
        const bits: string[] = [];
        if (presence.friends.length) {
          bits.push(
            `${presence.friends.length} ${presence.friends.length === 1 ? 'friend' : 'friends'} here`,
          );
        }
        if (presence.mutualCount) bits.push(`${presence.mutualCount} you know through friends`);
        const district = app.places.districtById(v.districtId as string)?.name;
        return {
          kind: 'venue' as const,
          id: v.id as string,
          title: v.name,
          sub: [district, v.kind].filter(Boolean).join(' · '),
          body: v.blurb,
          heat: heatFor(app.state, v.id, 0.3),
          who: bits.length ? bits.join(' · ') : null,
          venueKind: v.kind,
        };
      })
      .filter((v) => matches(v.title, v.sub));

    // Kind chips (Dinner/Bars/Clubs) only describe venues — after-parties and
    // local spots aren't "a kind of place" in that sense, so a kind filter
    // being active just excludes them from the deck rather than trying to
    // guess which one they'd count as.
    const afters: DeckItem[] = kinds.size
      ? []
      : app.state.afterParties
          .map((a) => ({
            kind: 'after' as const,
            id: a.id as string,
            title: `${displayName(app.state, a.hostId as string)}’s`,
            sub: `${a.area} · ${a.vibe.join(' · ')}`,
            body: `${afterHeadcount(app, a)} of ${a.capacity} going · address on accept`,
          }))
          .filter((a) => matches(a.title, a.sub));

    const spots: DeckItem[] = kinds.size
      ? []
      : app.state.spots
          .map((s) => ({
            kind: 'spot' as const,
            id: s.id as string,
            title: s.name,
            sub: `Dropped by ${displayName(app.state, s.droppedBy as string)}`,
            body: s.note,
          }))
          .filter((s) => matches(s.title, s.sub));

    return [...venues, ...afters, ...spots];
  }, [app, query, kinds]);

  const item = items[index];

  const next = () => setIndex((i) => Math.min(i + 1, items.length));
  const save = () => {
    if (!item) return;
    if (item.kind === 'venue') toggleSaved(app, 'venue', item.id as never);
    if (item.kind === 'spot') toggleSaved(app, 'spot', item.id as never);
    next();
  };

  const open = () => {
    if (!item) return;
    if (item.kind === 'venue') router.push(`/venue/${item.id}`);
    if (item.kind === 'after') router.push(`/after/${item.id}`);
  };

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <H1>Browse</H1>
        <Spacer h={space.xs} />
        <Small>
          {items.length === 0 ? 'Nothing matches.' : `${index + 1} of ${items.length}`}
        </Small>

        <Spacer h={space.md} />
        <Row style={styles.searchRow}>
          <Icon name="search" size={18} color={colour.fg3} />
          <TextInput
            style={styles.search}
            placeholder="Search"
            placeholderTextColor={colour.fg4}
            value={query}
            onChangeText={(text) => {
              setQuery(text);
              setIndex(0);
            }}
            testID="browse-search"
          />
        </Row>
        <Spacer h={space.sm} />
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          <Row>
            {KINDS.map((kind) => (
              <Chip
                key={kind}
                label={kind === 'dinner' ? 'Dinner' : kind === 'bar' ? 'Bars' : 'Clubs'}
                active={kinds.has(kind)}
                onPress={() => toggleKind(kind)}
                testID={`browse-filter-${kind}`}
              />
            ))}
          </Row>
        </ScrollView>

        <Spacer h={space.lg} />

        {!item ? (
          <Empty
            title={items.length === 0 ? 'Nothing matches' : 'That is everything'}
            body={
              items.length === 0
                ? 'No venues, after-parties or spots match this filter. Try clearing it.'
                : 'You have been through the whole deck. Start again or go back to the map.'
            }
          />
        ) : (
          <Card style={styles.card}>
            <Row>
              <Chip
                label={item.kind === 'venue' ? 'Place' : item.kind === 'after' ? 'After-party' : 'Local spot'}
                active
                tone={item.kind === 'after' ? colour.disco : item.kind === 'spot' ? colour.gold : colour.em}
              />
            </Row>
            <Spacer h={space.md} />
            <H1>{item.title}</H1>
            <Spacer h={space.xs} />
            <Small>{item.sub}</Small>
            <Spacer h={space.md} />
            <Body>{item.body}</Body>

            {item.kind === 'venue' && item.who && (
              <>
                <Spacer h={space.md} />
                <View style={styles.who}>
                  <Small tone="life">{item.who}</Small>
                </View>
              </>
            )}

            {item.kind === 'venue' && (
              <>
                <Spacer h={space.md} />
                <Label>Right now</Label>
                <Spacer h={space.xs} />
                <View style={styles.heatTrack}>
                  <View style={[styles.heatFill, { width: `${Math.round(item.heat * 100)}%` }]} />
                </View>
              </>
            )}
          </Card>
        )}

        {item && (
          <>
            <Spacer h={space.lg} />
            <Row>
              <Button label="Next" variant="ghost" onPress={next} style={styles.flex} testID="browse-next" />
              {item.kind !== 'after' && (
                <Button label="Save" variant="ghost" onPress={save} style={styles.flex} testID="browse-save" />
              )}
              <Button label="Open" onPress={open} style={styles.flex} testID="browse-open" />
            </Row>
          </>
        )}

        {index > 0 && (
          <>
            <Spacer h={space.md} />
            <Button label="Start again" variant="ghost" onPress={() => setIndex(0)} />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingTop: space.xxl + space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  searchRow: {
    backgroundColor: colour.surface,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colour.hairline,
    paddingHorizontal: space.md,
    height: 44,
    gap: space.sm,
  },
  search: { flex: 1, color: colour.fg, fontSize: 15 },
  card: { minHeight: 300, padding: space.lg },
  who: {
    alignSelf: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: space.md,
    borderRadius: 999,
    backgroundColor: colour.emDim,
    borderWidth: 1,
    borderColor: colour.em,
  },
  heatTrack: { height: 6, borderRadius: 3, backgroundColor: colour.surface2, overflow: 'hidden' },
  heatFill: { height: 6, borderRadius: 3, backgroundColor: colour.em },
});
