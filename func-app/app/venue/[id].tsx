/**
 * A venue.
 *
 * The screen where the friend/mutual gradient becomes visible to a user:
 * friends are named, mutuals are a count. In the prototype both rendered as
 * identical named avatars, which is the leak this fixes.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { asVenueId, type TableOffer } from '../../src/domain';
import {
  Body,
  Button,
  Card,
  Chip,
  Divider,
  Empty,
  H1,
  H2,
  Label,
  Notice,
  Row,
  Screen,
  Sheet,
  Small,
  Spacer,
} from '../../src/ui/components/kit';
import { useApp } from '../../src/ui/state/AppProvider';
import { checkInAt, requestTable, toggleSaved, type ActionResult } from '../../src/ui/state/actions';
import { displayName, seatsLeft, venueSummary } from '../../src/ui/state/selectors';
import { colour, space } from '../../src/ui/theme';

const PARTY_SIZES = [1, 2, 3, 4, 5, 6];

export default function VenueScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [requesting, setRequesting] = useState<TableOffer | null>(null);
  const [partySize, setPartySize] = useState(4);
  const [feedback, setFeedback] = useState<string | null>(null);

  const venue = app.places.venueByIdSync(asVenueId(params.id ?? ''));
  if (!venue) return <Empty title="Not found" body="That place is not on the map." />;

  const summary = venueSummary(app, venue);
  const district = venue.districtId ? app.places.districtById(venue.districtId as string)?.name : null;
  const saved = app.state.saved.some(
    (s) => s.personId === app.meId && s.kind === 'venue' && (s.refId as string) === (venue.id as string),
  );

  const show = (result: ActionResult) =>
    setFeedback(result.ok ? null : result.reason);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Label>{[district, venue.kind].filter(Boolean).join(' · ')}</Label>
        <Spacer h={space.sm} />
        <H1>{venue.name}</H1>
        <Spacer h={space.sm} />
        <Body>{venue.blurb}</Body>

        <Spacer h={space.md} />
        <Row style={styles.wrapRow}>
          {venue.vibe.map((v) => (
            <Chip key={v} label={v} />
          ))}
        </Row>

        <Spacer h={space.lg} />
        <Row>
          <Stat label="Right now" value={heatWord(summary.heat)} tone="life" />
          <Stat label="In" value={priceRange(venue.entry.min.amount, venue.entry.max.amount)} />
          <Stat label="A night" value={priceRange(venue.spend.min.amount, venue.spend.max.amount)} />
        </Row>

        <Divider />

        <Label>Who is here</Label>
        <Spacer h={space.sm} />
        <WhoIsHere
          friends={summary.presence.friends.map((id) => displayName(app.state, id as string))}
          mutualCount={summary.presence.mutualCount}
        />

        {summary.stories.length > 0 && (
          <>
            <Spacer h={space.lg} />
            <Label>Live from inside · {summary.stories.length}</Label>
            <Spacer h={space.sm} />
            <Row style={styles.wrapRow}>
              {summary.stories.map((s) => (
                <View key={s.id as string} style={[styles.story, { borderColor: s.gradient[0] }]}>
                  <Small tone="life">{Math.round((app.clock.now() - s.postedAt) / 60_000)}m</Small>
                </View>
              ))}
            </Row>
          </>
        )}

        <Divider />

        <Label>Tables tonight</Label>
        <Spacer h={space.sm} />
        {summary.tables.length === 0 ? (
          <Small>No tables here tonight.</Small>
        ) : (
          summary.tables.map((table) => {
            const left = seatsLeft(app, table);
            return (
              <Card key={table.id as string} style={styles.tableCard}>
                <H2>{table.name}</H2>
                <Small>{table.vibe}</Small>
                <Spacer h={space.sm} />
                <Row>
                  <View style={styles.flex}>
                    <Small tone="default">{money(table.perHead.amount)} per head</Small>
                    <Small>{left > 0 ? `${left} of ${table.seats} spots left` : 'Full tonight'}</Small>
                  </View>
                  <Button
                    label="Request"
                    disabled={left <= 0}
                    onPress={() => {
                      setPartySize(Math.min(4, Math.max(1, left)));
                      setRequesting(table);
                    }}
                    testID={`request-${table.id}`}
                  />
                </Row>
              </Card>
            );
          })
        )}

        <Spacer h={space.lg} />
        <Notice text="func does not take payment. You sort the money at the door — we get you the spot and the pass." />

        <Spacer h={space.lg} />
        <Row>
          <Button
            label={saved ? 'Saved' : 'Save'}
            variant="ghost"
            onPress={() => toggleSaved(app, 'venue', venue.id)}
            style={styles.flex}
            testID="save-venue"
          />
          <Button
            label="Check in"
            variant="ghost"
            onPress={() => show(checkInAt(app, venue.id))}
            style={styles.flex}
            testID="check-in"
          />
        </Row>

        {feedback ? (
          <>
            <Spacer h={space.md} />
            <Notice text={feedback} tone="danger" />
          </>
        ) : null}

        <Spacer h={space.lg} />
        <Button label="Back to the map" variant="ghost" onPress={() => router.back()} />
      </ScrollView>

      <Sheet visible={requesting !== null} onClose={() => setRequesting(null)}>
        {requesting && (
          <>
            <Label>Request</Label>
            <Spacer h={space.sm} />
            <H1>{requesting.name}</H1>
            <Small>
              {venue.name} · {money(requesting.perHead.amount)} per head
            </Small>

            <Spacer h={space.lg} />
            <Label>How many of you?</Label>
            <Spacer h={space.sm} />
            <Row style={styles.wrapRow}>
              {PARTY_SIZES.map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  active={partySize === n}
                  onPress={() => setPartySize(n)}
                  testID={`party-${n}`}
                />
              ))}
            </Row>
            <Spacer h={space.sm} />
            <Small>Just a number — like booking a restaurant. Nothing to set up.</Small>

            <Spacer h={space.lg} />
            <Button
              label="Send request"
              testID="send-request"
              onPress={() => {
                const result = requestTable(app, requesting, partySize);
                setRequesting(null);
                show(result);
              }}
            />
          </>
        )}
      </Sheet>
    </Screen>
  );
}

/**
 * The intimacy gradient, rendered.
 *
 * Friends by name. Mutuals as a number with no names attached — the component
 * is not given any, so it could not show them if it tried.
 */
function WhoIsHere({ friends, mutualCount }: { friends: readonly string[]; mutualCount: number }) {
  if (!friends.length && mutualCount === 0) {
    return <Small>Nobody you know, yet.</Small>;
  }
  return (
    <View style={{ gap: space.sm }}>
      {friends.length > 0 && (
        <Row style={styles.wrapRow}>
          {friends.map((name) => (
            <View key={name} style={styles.friend}>
              <View style={styles.friendDot} />
              <Small tone="default">{name}</Small>
            </View>
          ))}
        </Row>
      )}
      {mutualCount > 0 && (
        <Small tone="dim">
          {mutualCount} {mutualCount === 1 ? 'person' : 'people'} you know through friends
        </Small>
      )}
    </View>
  );
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'life' }) {
  return (
    <Card style={styles.flex}>
      <Label>{label}</Label>
      <Spacer h={space.xs} />
      <H2 tone={tone === 'life' ? 'life' : 'default'}>{value}</H2>
    </Card>
  );
}

const money = (minor: number): string => `$${(minor / 100).toFixed(minor % 100 === 0 ? 0 : 2)}`;

const priceRange = (min: number, max: number): string =>
  min === 0 && max === 0 ? 'Free' : `${money(min)}–${money(max)}`;

/** Heat as a word, never a number — the map rule, applied to copy. */
function heatWord(heat: number): string {
  if (heat >= 0.85) return 'Going off';
  if (heat >= 0.7) return 'Rammed';
  if (heat >= 0.55) return 'Busy';
  if (heat >= 0.4) return 'Filling up';
  return 'Warming up';
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  wrapRow: { flexWrap: 'wrap', gap: space.sm },
  tableCard: { marginBottom: space.sm },
  story: {
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colour.surface,
  },
  friend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 6,
    paddingHorizontal: space.md,
    borderRadius: 999,
    backgroundColor: colour.emDim,
    borderWidth: 1,
    borderColor: colour.em,
  },
  friendDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colour.em },
});
