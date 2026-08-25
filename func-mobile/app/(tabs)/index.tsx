import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useCommands, useView } from '@/data/DataContext';
import type { LatLng } from '@/domain/types';
import { Avatar, avatarUserOf } from '@/ui/components/Avatar';
import { CloseIcon, SearchIcon } from '@/ui/components/Icons';
import { InviteActions, InviteCover, InviteMeta } from '@/ui/components/InviteBits';
import { Body, Button, Pill, Row, Small } from '@/ui/components/Primitives';
import { useReducedMotion } from '@/ui/useReducedMotion';
import { FuncMap, type MapHandle, type MapPin } from '@/ui/map/FuncMap';
import { mapPins } from '@/ui/map/content';
import { entranceAnimation, mapEntrance } from '@/ui/map/entrance';
import { categoryColor, categoryLabel, colors, priceSymbols, radius, space, statusColor, statusLabel } from '@/ui/theme';
import { Discover } from '@/ui/map/Discover';

export default function MapScreen() {
  const view = useView();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const reduceMotion = useReducedMotion();
  const pins = useMemo(() => mapPins(view), [view]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const selected = pins.find((p) => p.id === selectedId) ?? null;

  // Entrance: simple zoom/fade. Polished motion is a later pass.
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const play = useCallback(() => {
    const animation = entranceAnimation(reduceMotion);
    scale.setValue(animation.initialScale);
    opacity.setValue(animation.initialOpacity);
    if (animation.duration === 0) return;
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: animation.duration, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [reduceMotion, scale, opacity]);
  useEffect(() => {
    play();
    return mapEntrance.subscribe(play);
  }, [play]);

  const goTo = (target: LatLng, pin?: MapPin) => {
    setDiscoverOpen(false);
    setSelectedId(pin?.id ?? null);
    mapRef.current?.flyTo(target, pin ? 14.5 : 13);
  };

  return (
    <Animated.View style={[styles.fill, { transform: [{ scale }], opacity }]}>
      <FuncMap ref={mapRef} pins={pins} selectedId={selectedId} onSelect={(p) => setSelectedId(p?.id ?? null)} introFromGlobe />

      {/* search bar → discovery */}
      <View style={[styles.top, { top: insets.top + 8 }]}>
        <Pressable
          style={styles.search}
          onPress={() => setDiscoverOpen(true)}
          accessibilityRole="search"
          accessibilityLabel="Search"
        >
          <SearchIcon color={colors.muted} size={18} />
          <Text style={styles.searchText}>Search an area, a category, a night…</Text>
        </Pressable>
        <Text style={styles.brand}>func</Text>
      </View>

      {/* selected pin preview */}
      {selected && !discoverOpen ? (
        <View style={[styles.card, { bottom: 14 }]}>
          <Pressable
            style={styles.close}
            onPress={() => setSelectedId(null)}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Close preview"
          >
            <CloseIcon color={colors.muted} size={16} />
          </Pressable>
          {selected.kind === 'venue' ? <VenuePreview pin={selected} /> : null}
          {selected.kind === 'invite' ? <InvitePreview pin={selected} /> : null}
          {selected.kind === 'person' ? <PersonPreview pin={selected} /> : null}
          {selected.kind === 'business' ? <BusinessPreview pin={selected} /> : null}
        </View>
      ) : null}

      {discoverOpen ? (
        <Discover
          onClose={() => setDiscoverOpen(false)}
          onPickInvite={(inv) => {
            if (inv.where.kind === 'exact') {
              goTo(inv.where.location, pins.find((p) => p.id === `invite:${inv.id}`));
            } else {
              // No disclosed coordinate to fly to (area-only or hidden) — just open its detail page instead.
              setDiscoverOpen(false);
              router.push({ pathname: '/invite/[id]', params: { id: inv.id } });
            }
          }}
          onPickVenue={(v) => goTo(v.location, pins.find((p) => p.id === `venue:${v.id}`))}
          onPickArea={(center) => goTo(center)}
        />
      ) : null}
    </Animated.View>
  );
}

function VenuePreview({ pin }: { pin: Extract<MapPin, { kind: 'venue' }> }) {
  const router = useRouter();
  const v = pin.venue;
  return (
    <View style={{ gap: space.sm }}>
      <Row gap={space.sm} style={styles.headRow}>
        <View style={[styles.dot, { backgroundColor: categoryColor(v.category) }]} />
        <Body style={{ fontWeight: '600', flex: 1 }}>{v.name}</Body>
        <Small>{priceSymbols(v.priceTier)}</Small>
      </Row>
      <Row gap={6}>
        <Pill label={categoryLabel(v.category)} color={categoryColor(v.category)} />
        <Small>{v.area}</Small>
      </Row>
      <Small numberOfLines={2}>{v.blurb}</Small>
      <Button small variant="secondary" label="Details" onPress={() => router.push({ pathname: '/venue/[id]', params: { id: v.id } })} />
    </View>
  );
}

function InvitePreview({ pin }: { pin: Extract<MapPin, { kind: 'invite' }> }) {
  const router = useRouter();
  const inv = pin.invite;
  return (
    <View style={{ gap: space.sm }}>
      <Pressable
        onPress={() => router.push({ pathname: '/invite/[id]', params: { id: inv.id } })}
        accessibilityRole="button"
        accessibilityLabel="View invite details"
      >
        <Row gap={space.md} style={[{ alignItems: 'flex-start' }, styles.headRow]}>
          <InviteCover invite={inv} size={48} />
          <View style={{ flex: 1, gap: 4 }}>
            <Body numberOfLines={2} style={{ fontWeight: '600' }}>{inv.description}</Body>
            <Small>by {inv.host.displayName} · tap for details</Small>
          </View>
        </Row>
      </Pressable>
      <InviteMeta invite={inv} />
      <InviteActions invite={inv} compact />
    </View>
  );
}

function PersonPreview({ pin }: { pin: Extract<MapPin, { kind: 'person' }> }) {
  const view = useView();
  const commands = useCommands();
  const [text, setText] = useState('');
  const u = pin.person;
  const isMe = u.id === view.self.id;
  const pendingToThem = view.self.pendingMessageRequestsTo.includes(u.id);
  const { status, premium } = pin.disclosure;
  return (
    <View style={{ gap: space.sm }}>
      <Row gap={space.md} style={styles.headRow}>
        <Avatar user={avatarUserOf(u)} size={40} ring={statusColor(status)} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>
            {u.displayName}
            {isMe ? ' (you)' : ''}
          </Body>
          <Small>
            @{u.handle}
            {premium ? ' · premium' : ''}
          </Small>
        </View>
        <Pill label={statusLabel(status)} color={statusColor(status)} filled />
      </Row>
      {!isMe ? (
        pendingToThem ? (
          <Pill label="Message request sent" color={colors.casual} />
        ) : (
          <Row gap={space.sm}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={`Say hi to ${u.displayName}`}
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
            <Button
              small
              label="Send"
              onPress={() => {
                const r = commands.sendMessageRequest(u.id, text);
                if (!r.ok) Alert.alert('Not sent', r.reason);
                else setText('');
              }}
            />
          </Row>
        )
      ) : null}
    </View>
  );
}

function BusinessPreview({ pin }: { pin: Extract<MapPin, { kind: 'business' }> }) {
  const u = pin.person;
  return (
    <Row gap={space.md} style={styles.headRow}>
      <Avatar user={avatarUserOf(u)} size={40} />
      <View style={{ flex: 1 }}>
        <Body style={{ fontWeight: '600' }}>{pin.venue.name}</Body>
        <Small>Business account · @{u.handle}</Small>
      </View>
      <Pill label="Venue" color={colors.club} />
    </Row>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: colors.glassSearch,
    borderRadius: radius.pill,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderWidth: 1,
    borderColor: colors.border,
  },
  searchText: { color: colors.muted, fontSize: 14 },
  brand: { color: colors.text, fontSize: 18, fontWeight: '700', letterSpacing: -0.5 },
  card: {
    position: 'absolute',
    left: 12,
    right: 12,
    backgroundColor: colors.glassPreview,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.lg,
  },
  close: { position: 'absolute', top: 10, right: 10, padding: 4 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  headRow: { paddingRight: 26 },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    borderRadius: radius.md,
    paddingHorizontal: space.md,
    paddingVertical: 9,
    fontSize: 14,
  },
});
