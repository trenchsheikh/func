import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSnapshot } from '@/data/DataContext';
import { InviteCard } from '@/ui/components/InviteBits';
import { Body, Empty, Eyebrow, Pill, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { categoryColor, categoryLabel, priceSymbols, space } from '@/ui/theme';

function distanceKm(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const x = Math.sin(dLat / 2) ** 2 + Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

export default function VenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const snap = useSnapshot();
  const v = snap.venues.find((x) => x.id === id);
  if (!v) {
    return (
      <Screen>
        <ScreenHeader title="Place" back />
        <Empty title="Not found." />
      </Screen>
    );
  }
  const nearby = snap.invites.filter((i) => distanceKm(i.location, v.location) < 0.6);
  return (
    <Screen>
      <ScreenHeader title={v.name} back />
      <ScrollView contentContainerStyle={styles.body}>
        <Row gap={space.sm}>
          <View style={[styles.dot, { backgroundColor: categoryColor(v.category) }]} />
          <Pill label={categoryLabel(v.category)} color={categoryColor(v.category)} />
          <Small>{v.area}</Small>
          <Small>·</Small>
          <Small>{priceSymbols(v.priceTier)}</Small>
        </Row>
        <Body>{v.blurb}</Body>
        <Eyebrow style={{ marginTop: space.md }}>Invites nearby</Eyebrow>
        {nearby.length ? nearby.map((inv) => <InviteCard key={inv.id} invite={inv} />) : <Small>Nothing posted near here yet.</Small>}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.md, paddingBottom: 48 },
  dot: { width: 12, height: 12, borderRadius: 6 },
});
