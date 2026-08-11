/**
 * Plans — what you have actually committed to.
 *
 * Only explicit commitments appear here. Being out is not a plan; asking a host
 * to hold you a table is. That distinction is the point of the whole model.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { AccessRequest, Pass } from '../../src/domain';
import { Icon } from '../../src/ui/components/Icon';
import {
  Body,
  Button,
  Card,
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
import { cancelRequest, rateNight, toggleSaved } from '../../src/ui/state/actions';
import { displayName, mySaved, myPasses, myRequests, unratedPass } from '../../src/ui/state/selectors';
import { colour, radius, space } from '../../src/ui/theme';

export default function PlansScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const [showPass, setShowPass] = useState<Pass | null>(null);
  const [rating, setRating] = useState(false);
  const [stars, setStars] = useState(0);

  const requests = myRequests(app);
  const passes = myPasses(app);
  const saved = mySaved(app);
  const toRate = unratedPass(app);

  const pending = requests.filter((r) => r.status === 'pending');
  const resolved = requests.filter((r) => r.status !== 'pending');

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <H1>Plans</H1>
        <Spacer h={space.xs} />
        <Small>What you have actually committed to.</Small>

        {toRate && (
          <>
            <Spacer h={space.lg} />
            <Card style={{ borderColor: colour.em }}>
              <H2>How was {venueName(app, toRate)}?</H2>
              <Spacer h={space.xs} />
              <Small>Nobody reads this. It just makes the map more honest.</Small>
              <Spacer h={space.md} />
              <Button label="Rate it" onPress={() => { setStars(0); setRating(true); }} testID="open-rating" />
            </Card>
          </>
        )}

        <Spacer h={space.xl} />
        <Label>Passes</Label>
        <Spacer h={space.sm} />
        {passes.length === 0 ? (
          <Small>No passes yet. Request a table and a host has to say yes.</Small>
        ) : (
          passes.map((pass) => (
            <Card key={pass.id as string} style={styles.item}>
              <Row>
                <View style={styles.flex}>
                  <H2>{venueName(app, pass)}</H2>
                  <Small>
                    {pass.partySize} {pass.partySize === 1 ? 'person' : 'people'} · {pass.code}
                  </Small>
                </View>
                <Button label="Show" variant="ghost" onPress={() => setShowPass(pass)} testID={`show-pass-${pass.id}`} />
              </Row>
            </Card>
          ))
        )}

        <Spacer h={space.xl} />
        <Label>Waiting on a yes</Label>
        <Spacer h={space.sm} />
        {pending.length === 0 ? (
          <Small>Nothing outstanding.</Small>
        ) : (
          pending.map((request) => (
            <Card key={request.id as string} style={styles.item}>
              <Row>
                <View style={styles.flex}>
                  <H2>{requestTitle(app, request)}</H2>
                  <Small>
                    {request.partySize} of you · asked {displayName(app.state, request.hostId as string)}
                  </Small>
                </View>
                <Button
                  label="Cancel"
                  variant="ghost"
                  onPress={() => cancelRequest(app, request)}
                  testID={`cancel-${request.id}`}
                />
              </Row>
              {request.threadId && (
                <>
                  <Spacer h={space.sm} />
                  <Button
                    label="Message"
                    variant="ghost"
                    onPress={() => router.push(`/thread/${request.threadId}`)}
                  />
                </>
              )}
            </Card>
          ))
        )}

        {resolved.length > 0 && (
          <>
            <Spacer h={space.xl} />
            <Label>Earlier</Label>
            <Spacer h={space.sm} />
            {resolved.map((request) => (
              <Card key={request.id as string} style={styles.item}>
                <H2>{requestTitle(app, request)}</H2>
                <Small tone={request.status === 'accepted' ? 'life' : 'dimmer'}>
                  {request.status === 'accepted'
                    ? 'Accepted'
                    : request.status === 'declined'
                      ? 'Declined'
                      : 'Cancelled'}
                </Small>
              </Card>
            ))}
          </>
        )}

        {saved.length > 0 && (
          <>
            <Spacer h={space.xl} />
            <Label>Saved</Label>
            <Spacer h={space.sm} />
            {saved.map((item) => {
              const href = item.href;
              return (
              <Card key={`${item.kind}-${item.refId}`} style={styles.item}>
                <Row>
                  <View style={styles.flex}>
                    <H2>{item.name}</H2>
                    <Small>{item.sub}</Small>
                  </View>
                  {href && (
                    <Button
                      label="Open"
                      variant="ghost"
                      onPress={() => router.push(href)}
                    />
                  )}
                  <Button
                    label="Unsave"
                    variant="ghost"
                    onPress={() => toggleSaved(app, item.kind, item.refId as never)}
                  />
                </Row>
              </Card>
              );
            })}
          </>
        )}

        {passes.length === 0 && requests.length === 0 && saved.length === 0 && (
          <>
            <Spacer h={space.xxl} />
            <Empty title="Nothing yet" body="Being out is not a plan. This fills up when you commit to something." />
          </>
        )}
      </ScrollView>

      <Sheet visible={showPass !== null} onClose={() => setShowPass(null)}>
        {showPass && (
          <View style={styles.passCard}>
            <Label tone="life">func pass</Label>
            <Spacer h={space.sm} />
            <H1>{venueName(app, showPass)}</H1>
            <Small>
              {showPass.partySize} {showPass.partySize === 1 ? 'person' : 'people'} · tonight
            </Small>
            <Spacer h={space.lg} />
            <View style={styles.qr}>
              <Icon name="token" size={96} color={colour.em} />
            </View>
            <Spacer h={space.lg} />
            <H2 tone="life">{showPass.code}</H2>
            <Spacer h={space.xs} />
            <Small>Show this on the door</Small>
          </View>
        )}
      </Sheet>

      <Sheet visible={rating} onClose={() => setRating(false)}>
        <Label>Last night</Label>
        <Spacer h={space.sm} />
        <H1>{toRate ? venueName(app, toRate) : 'Your night'}</H1>
        <Spacer h={space.sm} />
        <Body>Was it worth it?</Body>
        <Spacer h={space.lg} />
        <Row style={{ justifyContent: 'center', gap: space.md }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Icon
              key={n}
              name="star"
              size={34}
              color={n <= stars ? colour.emHi : colour.fg4}
            />
          ))}
        </Row>
        <Spacer h={space.md} />
        <Row style={{ justifyContent: 'center', gap: space.sm }}>
          {[1, 2, 3, 4, 5].map((n) => (
            <Button
              key={n}
              label={String(n)}
              variant={stars === n ? 'primary' : 'ghost'}
              onPress={() => setStars(n)}
              style={styles.starButton}
              testID={`star-${n}`}
            />
          ))}
        </Row>
        <Spacer h={space.lg} />
        {/* Disabled until a star is chosen — zero must never submit as a rating. */}
        <Button
          label="Send it"
          disabled={stars === 0}
          testID="send-rating"
          onPress={() => {
            rateNight(app, stars);
            setRating(false);
          }}
        />
        <Spacer h={space.sm} />
        <Notice text="Private. It only moves how busy the map says this place is." />
      </Sheet>
    </Screen>
  );
}

function venueName(app: ReturnType<typeof useApp>, pass: Pass): string {
  return app.places.venueByIdSync(pass.venueId)?.name ?? 'Somewhere';
}

function requestTitle(app: ReturnType<typeof useApp>, request: AccessRequest): string {
  if (request.kind === 'after') {
    const after = app.state.afterParties.find((a) => a.id === request.afterId);
    return after ? `${displayName(app.state, after.hostId as string)}’s · ${after.area}` : 'After-party';
  }
  const table = app.state.tables.find((t) => t.id === request.tableId);
  const venue = request.venueId ? app.places.venueByIdSync(request.venueId) : null;
  return [venue?.name, table?.name].filter(Boolean).join(' · ') || 'Table';
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingTop: space.xxl + space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  item: { marginBottom: space.sm },
  passCard: { alignItems: 'center' },
  qr: {
    width: 150,
    height: 150,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colour.hairline,
    backgroundColor: colour.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  starButton: { flex: 1, height: 40, paddingHorizontal: 0 },
});
