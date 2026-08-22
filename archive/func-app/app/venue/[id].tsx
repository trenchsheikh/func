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

import { asSpotId, asVenueId, hasVisited, type TableOffer } from '../../src/domain';
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
import {
  checkInAt,
  requestTable,
  toggleSaved,
  visitSpot,
  type ActionResult,
} from '../../src/ui/state/actions';
import { Landed } from '../../src/ui/components/Celebrate';
import { displayName, seatsLeft, venueSummary } from '../../src/ui/state/selectors';
import { colour, heat as heatColour, radius, space } from '../../src/ui/theme';

const PARTY_SIZES = [1, 2, 3, 4, 5, 6];

/**
 * Local spots share this route (map.tsx pushes `/venue/spot-${id}`) rather
 * than getting a screen of their own — there is only ever a name, a note and
 * a "visit" action to show, not enough to justify a second file.
 */
export default function VenueScreen(): React.JSX.Element {
  const params = useLocalSearchParams<{ id: string }>();
  const rawId = params.id ?? '';
  if (rawId.startsWith('spot-')) return <SpotScreen spotId={rawId.slice('spot-'.length)} />;
  return <PlaceScreen venueId={rawId} />;
}

function SpotScreen({ spotId }: { spotId: string }): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);

  const spot = app.state.spots.find((s) => (s.id as string) === spotId);
  if (!spot) return <Empty title="Not found" body="That spot is gone." />;

  const me = app.meId;
  const isOwn = me !== null && (spot.droppedBy as string) === (me as string);
  const visited = me !== null && hasVisited(app.state.visits, me, asSpotId(spotId));

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Label>Local spot</Label>
        <Spacer h={space.sm} />
        <H1>{spot.name}</H1>
        <Spacer h={space.sm} />
        <Body>{spot.note || 'No note left.'}</Body>

        <Spacer h={space.md} />
        <Small>Dropped by {displayName(app.state, spot.droppedBy as string)}</Small>

        <Spacer h={space.lg} />
        <Card>
          <Label>Tokens earned</Label>
          <Spacer h={space.xs} />
          <H2 tone="life">{spot.tokens}</H2>
        </Card>

        <Spacer h={space.lg} />
        <Button
          label={isOwn ? 'Your own spot' : visited ? 'Already visited' : 'Visit'}
          disabled={isOwn || visited}
          onPress={() => {
            const result = visitSpot(app, asSpotId(spotId));
            setFeedback(result.ok ? 'Counted — a token went to whoever dropped this.' : result.reason);
          }}
          testID="visit-spot"
        />

        {feedback ? (
          <>
            <Spacer h={space.md} />
            <Notice text={feedback} tone={feedback.startsWith('Counted') ? 'life' : 'danger'} />
          </>
        ) : null}

        <Spacer h={space.lg} />
        <Button label="Back to the map" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function PlaceScreen({ venueId }: { venueId: string }): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const [requesting, setRequesting] = useState<TableOffer | null>(null);
  const [partySize, setPartySize] = useState(4);
  const [feedback, setFeedback] = useState<string | null>(null);
  /**
   * What was just asked for.
   *
   * Sending a request used to change nothing on screen at all — verified live
   * on 2026-08-12: the sheet closed and the venue was byte-identical, table
   * still reading "6 of 6 spots left". The request was recorded correctly, so
   * this is purely the missing acknowledgement.
   */
  const [asked, setAsked] = useState<{ table: string; host: string; size: number } | null>(null);

  const venue = app.places.venueByIdSync(asVenueId(venueId));
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
          <Stat label="Right now" value={heatWord(summary.heat)} heat={summary.heat} />
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
                const table = requesting;
                const result = requestTable(app, table, partySize);
                setRequesting(null);
                show(result);
                // Only acknowledge what actually happened. Confirming a
                // request that the domain rejected would be a lie told with
                // an animation, which is worse than the silence it replaces.
                // The host is the table's business, not the venue — a venue can
                // be claimed by a promoter who is not the room itself.
                if (result.ok) {
                  setAsked({
                    table: table.name,
                    host: displayName(app.state, table.businessId as string),
                    size: partySize,
                  });
                }
              }}
            />
          </>
        )}
      </Sheet>

      {/*
        The acknowledgement. Deliberately the *middle* rung of the animation
        hierarchy — a request is a real commitment and has to land, but it is
        not a yes yet. Celebrating here would set the user up for a fall when
        the host declines.
      */}
      <Landed visible={asked !== null} onDone={() => setAsked(null)}>
        {asked && (
          <View style={styles.asked}>
            <View style={[styles.askedDot, { backgroundColor: heatColour(summary.heat) }]} />
            <View style={styles.flex}>
              <Small tone="default">Asked for {asked.table}</Small>
              <Small>
                {asked.size} of you · waiting on {asked.host}
              </Small>
            </View>
          </View>
        )}
      </Landed>
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

/**
 * One of the three facts across the top of a venue.
 *
 * `heat` colours both the value and the card's own edge with the room's actual
 * temperature. It is the same ramp the map uses, so "Going off" here is
 * literally the same colour as the glow you tapped to get here — the venue
 * screen and the map stop being two unrelated views of one place.
 */
function Stat({ label, value, heat }: { label: string; value: string; heat?: number }) {
  const hot = heat === undefined ? null : heatColour(heat);
  return (
    <Card style={[styles.flex, hot ? { borderColor: hot, borderTopColor: hot } : null]}>
      <Label>{label}</Label>
      <Spacer h={space.xs} />
      <H2 style={hot ? { color: hot } : undefined}>{value}</H2>
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
  asked: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    alignSelf: 'stretch',
    paddingVertical: space.md,
    paddingHorizontal: space.lg,
    borderRadius: radius.md,
    backgroundColor: 'rgba(12,12,15,0.96)',
    borderWidth: 1,
    borderColor: colour.hairlineHi,
  },
  askedDot: { width: 9, height: 9, borderRadius: 5 },
});
