import { useRouter } from 'expo-router';
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Alert, Animated, Easing, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepository, useSnapshot } from '@/data/DataContext';
import { hostDisplayName } from '@/data/selectors';
import type { LatLng } from '@/domain/types';
import { Avatar } from '@/ui/components/Avatar';
import { CloseIcon, SearchIcon } from '@/ui/components/Icons';
import { InviteActions, InviteCover, InviteMeta } from '@/ui/components/InviteBits';
import { Body, Button, Pill, Row, Small } from '@/ui/components/Primitives';
import { FuncMap, type MapHandle, type MapPin } from '@/ui/map/FuncMap';
import { mapPins } from '@/ui/map/content';
import { mapEntrance } from '@/ui/map/entrance';
import { categoryColor, categoryLabel, colors, priceSymbols, radius, space, statusColor, statusLabel } from '@/ui/theme';
import { useNow } from '@/ui/time';
import { Discover } from '@/ui/map/Discover';

export default function MapScreen() {
  const snap = useSnapshot();
  const now = useNow();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const mapRef = useRef<MapHandle>(null);
  const pins = useMemo(() => mapPins(snap, now), [snap, now]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [discoverOpen, setDiscoverOpen] = useState(false);
  const selected = pins.find((p) => p.id === selectedId) ?? null;

  // Entrance: simple zoom/fade. Polished motion is a later pass.
  const scale = useRef(new Animated.Value(0.92)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const play = useCallback(() => {
    scale.setValue(0.92);
    opacity.setValue(0);
    Animated.parallel([
      Animated.timing(scale, { toValue: 1, duration: 420, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(opacity, { toValue: 1, duration: 360, useNativeDriver: true }),
    ]).start();
  }, [scale, opacity]);
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
        <Pressable style={styles.search} onPress={() => setDiscoverOpen(true)} accessibilityRole="search">
          <SearchIcon color={colors.muted} size={18} />
          <Text style={styles.searchText}>Search an area, a category, a night…</Text>
        </Pressable>
        <Text style={styles.brand}>func</Text>
      </View>

      {/* selected pin preview */}
      {selected && !discoverOpen ? (
        <View style={[styles.card, { bottom: 14 }]}>
          <Pressable style={styles.close} onPress={() => setSelectedId(null)} hitSlop={8}>
            <CloseIcon color={colors.muted} size={16} />
          </Pressable>
          {selected.kind === 'venue' ? <VenuePreview pin={selected} /> : null}
          {selected.kind === 'invite' ? <InvitePreview pin={selected} /> : null}
          {selected.kind === 'live' ? <LivePreview pin={selected} /> : null}
        </View>
      ) : null}

      {discoverOpen ? (
        <Discover
          onClose={() => setDiscoverOpen(false)}
          onPickInvite={(inv) => goTo(inv.location, pins.find((p) => p.id === `invite:${inv.id}`))}
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
  const snap = useSnapshot();
  const inv = pin.invite;
  return (
    <View style={{ gap: space.sm }}>
      <Pressable onPress={() => router.push({ pathname: '/invite/[id]', params: { id: inv.id } })}>
        <Row gap={space.md} style={[{ alignItems: 'flex-start' }, styles.headRow]}>
          <InviteCover invite={inv} size={48} />
          <View style={{ flex: 1, gap: 4 }}>
            <Body numberOfLines={2} style={{ fontWeight: '600' }}>{inv.description}</Body>
            <Small>by {hostDisplayName(snap, inv)} · tap for details</Small>
          </View>
        </Row>
      </Pressable>
      <InviteMeta invite={inv} />
      <InviteActions invite={inv} compact />
    </View>
  );
}

function LivePreview({ pin }: { pin: Extract<MapPin, { kind: 'live' }> }) {
  const repo = useRepository();
  const snap = useSnapshot();
  const [text, setText] = useState('');
  const isMe = pin.user.id === snap.currentUserId;
  const u = pin.user;
  const pendingToThem = snap.messageRequests.some((r) => r.fromUserId === snap.currentUserId && r.toUserId === u.id && r.status === 'pending');

  if (pin.live.kind === 'business') {
    return (
      <Row gap={space.md} style={styles.headRow}>
        <Avatar user={u} size={40} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>{pin.live.venueName}</Body>
          <Small>Business account · @{u.handle}</Small>
        </View>
        <Pill label="Venue" color={colors.club} />
      </Row>
    );
  }
  const { status, elapsedHours, premium } = pin.live;
  return (
    <View style={{ gap: space.sm }}>
      <Row gap={space.md} style={styles.headRow}>
        <Avatar user={u} size={40} ring={statusColor(status)} />
        <View style={{ flex: 1 }}>
          <Body style={{ fontWeight: '600' }}>
            {u.personalProfile.displayName}
            {isMe ? ' (you)' : ''}
          </Body>
          <Small>
            @{u.handle}
            {premium ? ' · premium' : ''}
          </Small>
        </View>
        <Pill label={status === 'off' ? `Off · ${elapsedHours}h ago` : statusLabel(status)} color={statusColor(status)} filled={status !== 'off'} />
      </Row>
      {!isMe ? (
        pendingToThem ? (
          <Pill label="Message request sent" color={colors.casual} />
        ) : (
          <Row gap={space.sm}>
            <TextInput
              value={text}
              onChangeText={setText}
              placeholder={`Say hi to ${u.personalProfile.displayName}`}
              placeholderTextColor={colors.faint}
              style={styles.input}
            />
            <Button
              small
              label="Send"
              onPress={() => {
                const r = repo.sendMessageRequest(u.id, text);
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

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  top: { position: 'absolute', left: 12, right: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  search: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(31,31,37,0.94)',
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
    backgroundColor: 'rgba(31,31,37,0.97)',
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
