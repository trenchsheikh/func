/**
 * An after-party.
 *
 * The address is revealed only once the host accepts — safety and exclusivity
 * in one mechanic. This screen asks the domain whether it may show it
 * (`canSeeAfterAddress`) rather than checking a request status itself, so the
 * reveal rule lives in exactly one place.
 */

import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { asAfterPartyId, canSeeAfterAddress } from '../../src/domain';
import { Icon } from '../../src/ui/components/Icon';
import {
  Body,
  Button,
  Card,
  Chip,
  Empty,
  H1,
  H2,
  Label,
  Notice,
  Row,
  Screen,
  Small,
  Spacer,
} from '../../src/ui/components/kit';
import { useApp } from '../../src/ui/state/AppProvider';
import { askAfterParty, type ActionResult } from '../../src/ui/state/actions';
import { afterHeadcount, displayName } from '../../src/ui/state/selectors';
import { colour, space } from '../../src/ui/theme';

const PARTY_SIZES = [1, 2, 3, 4, 5, 6];

export default function AfterPartyScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const params = useLocalSearchParams<{ id: string }>();
  const [partySize, setPartySize] = useState(2);
  const [feedback, setFeedback] = useState<string | null>(null);

  const after = app.state.afterParties.find((a) => a.id === asAfterPartyId(params.id ?? ''));
  if (!after) return <Empty title="Not found" body="That after-party has gone." />;

  const me = app.meId;
  const going = afterHeadcount(app, after);
  const spacesLeft = Math.max(0, after.capacity - going);
  const canSeeAddress = me ? canSeeAfterAddress(after, me, app.state.requests) : false;
  const myRequest = app.state.requests.find(
    (r) => r.afterId === after.id && r.guestId === me,
  );

  const show = (result: ActionResult) => setFeedback(result.ok ? null : result.reason);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Label>{after.area}</Label>
        <Spacer h={space.sm} />
        <H1>{displayName(app.state, after.hostId as string)}’s</H1>
        <Spacer h={space.sm} />
        <Body>{after.note}</Body>

        <Spacer h={space.md} />
        <Row style={styles.wrapRow}>
          {after.vibe.map((v) => (
            <Chip key={v} label={v} />
          ))}
        </Row>

        <Spacer h={space.lg} />
        <Card>
          <Row>
            <View style={styles.flex}>
              <Label>Going</Label>
              <Spacer h={space.xs} />
              <H2 tone="life">
                {going} of {after.capacity}
              </H2>
            </View>
            <View style={styles.flex}>
              <Label>Space left</Label>
              <Spacer h={space.xs} />
              <H2>{spacesLeft > 0 ? String(spacesLeft) : 'Full'}</H2>
            </View>
          </Row>
        </Card>

        <Spacer h={space.lg} />
        <Label>Address</Label>
        <Spacer h={space.sm} />

        {canSeeAddress ? (
          <Card style={{ borderColor: colour.em }}>
            <Row>
              <Icon name="pin" size={18} color={colour.em} />
              <Body tone="default" style={styles.flex}>
                {after.address}
              </Body>
            </Row>
          </Card>
        ) : (
          <Card>
            <Row>
              <Icon name="lock" size={18} color={colour.fg3} />
              <View style={styles.flex}>
                <Small tone="default">Revealed when {displayName(app.state, after.hostId as string)} accepts you</Small>
                <Small>Until then it is the neighbourhood, and nothing more.</Small>
              </View>
            </Row>
          </Card>
        )}

        <Spacer h={space.xl} />

        {myRequest ? (
          <Notice
            text={
              myRequest.status === 'pending'
                ? `Asked — waiting on ${displayName(app.state, after.hostId as string)}.`
                : myRequest.status === 'accepted'
                  ? 'You are in.'
                  : myRequest.status === 'declined'
                    ? 'Not this time.'
                    : 'You cancelled this.'
            }
          />
        ) : (
          <>
            <Label>How many of you?</Label>
            <Spacer h={space.sm} />
            <Row style={styles.wrapRow}>
              {PARTY_SIZES.map((n) => (
                <Chip
                  key={n}
                  label={String(n)}
                  active={partySize === n}
                  onPress={() => setPartySize(n)}
                  testID={`after-party-${n}`}
                />
              ))}
            </Row>
            <Spacer h={space.lg} />
            <Button
              label="Ask to come"
              disabled={spacesLeft <= 0}
              testID="ask-after"
              onPress={() => show(askAfterParty(app, after, partySize))}
            />
          </>
        )}

        {feedback ? (
          <>
            <Spacer h={space.md} />
            <Notice text={feedback} tone="danger" />
          </>
        ) : null}

        <Spacer h={space.lg} />
        <Button label="Back" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  wrapRow: { flexWrap: 'wrap', gap: space.sm },
});
