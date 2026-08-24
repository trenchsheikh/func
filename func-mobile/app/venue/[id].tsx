import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useView } from '@/data/DataContext';
import { distanceKm, formatDistanceKm } from '@/domain/geo';
import { InviteCard } from '@/ui/components/InviteBits';
import { Body, Empty, Eyebrow, Pill, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { categoryColor, categoryLabel, priceSymbols, space } from '@/ui/theme';
import { viewerLocation } from '@/ui/viewerGeo';

export default function VenueDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const view = useView();
  const v = view.venues.find((x) => x.id === id);
  if (!v) {
    return (
      <Screen>
        <ScreenHeader title="Place" back />
        <Empty title="Not found." />
      </Screen>
    );
  }
  const myLocation = viewerLocation(view);
  const nearby = view.invites.filter((i) => i.where.kind === 'exact' && distanceKm(i.where.location, v.location) < 0.6);
  return (
    <Screen>
      <ScreenHeader title={v.name} back />
      <ScrollView contentContainerStyle={styles.body}>
        <Row gap={space.sm} style={{ flexWrap: 'wrap' }}>
          <View style={[styles.dot, { backgroundColor: categoryColor(v.category) }]} />
          <Pill label={categoryLabel(v.category)} color={categoryColor(v.category)} />
          <Small>{v.area}</Small>
          <Small>·</Small>
          <Small>{priceSymbols(v.priceTier)}</Small>
          {myLocation ? (
            <>
              <Small>·</Small>
              <Small>{formatDistanceKm(distanceKm(myLocation, v.location))} away</Small>
            </>
          ) : null}
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
