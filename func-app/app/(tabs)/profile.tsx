/**
 * Profile.
 *
 * Also where the friend list lives, because under the new model friendship is
 * the thing that grants visibility — so it has to be inspectable and
 * revocable, not buried.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { resolvePresence } from '../../src/domain';
import {
  Body,
  Button,
  Card,
  Divider,
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
import { dropSpot, logout, postStory, removeFriend, resetDemoWorld } from '../../src/ui/state/actions';
import {
  displayName,
  myCheckIn,
  myPresence,
  myStories,
  presenceOf,
  profileOf,
} from '../../src/ui/state/selectors';
import { colour, presenceColour, space } from '../../src/ui/theme';

const STORY_GRADIENTS: readonly (readonly [string, string])[] = [
  ['#12E08A', '#0B7A5B'],
  ['#1BF5A0', '#0E4F6B'],
  ['#F5C542', '#0B7A5B'],
  ['#7A5BF5', '#12E08A'],
];

export default function ProfileScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const [composing, setComposing] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  const me = app.meId;
  if (!me) {
    return (
      <Screen style={styles.pad}>
        <Body>Not signed in.</Body>
      </Screen>
    );
  }

  const profile = profileOf(app.state, me as string);
  const account = app.state.accounts[me as string];
  const presence = myPresence(app);
  const checkIn = myCheckIn(app);
  const stories = myStories(app);
  const friends = app.graph.friendsOf(me);
  const settings = presenceOf(app.state, me as string);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Row>
          <View style={[styles.avatar, { borderColor: presenceColour(presence.kind) }]}>
            <H1>{(profile?.name ?? '?').trim().charAt(0).toUpperCase()}</H1>
          </View>
          <View style={styles.flex}>
            <H1>{profile?.name ?? 'You'}</H1>
            <Small>
              {presence.kind === 'dtf' ? 'DTF' : presence.kind === 'casual' ? 'Casual' : 'Not out'}
              {account?.premium === true ? ' · Disco' : ''}
            </Small>
          </View>
        </Row>

        {profile?.bio ? (
          <>
            <Spacer h={space.md} />
            <Body>{profile.bio}</Body>
          </>
        ) : null}
        {profile?.instagram ? (
          <>
            <Spacer h={space.xs} />
            <Small tone="dim">{profile.instagram}</Small>
          </>
        ) : null}

        <Spacer h={space.lg} />
        <Row>
          <Stat label="Tokens" value={String(profile?.tokens ?? 0)} />
          <Stat label="Spots" value={String(profile?.spotsDropped ?? 0)} />
          <Stat label="Nights" value={String(profile?.nightsOut ?? 0)} />
        </Row>

        <Spacer h={space.lg} />
        <Button label="Presence settings" onPress={() => router.push('/settings')} testID="open-settings" />
        <Spacer h={space.sm} />
        <Notice
          text={
            presence.kind === 'dtf'
              ? `Visible to your ${friends.length} friends${settings.shareWithMutuals ? ', and to mutuals as a count' : ''}. Ends by itself.`
              : 'Nobody can see where you are.'
          }
        />

        <Divider />

        <Label>Tonight</Label>
        <Spacer h={space.sm} />
        <Card>
          {checkIn ? (
            <>
              <H2>Checked in at {app.places.venueByIdSync(checkIn.venueId)?.name ?? 'somewhere'}</H2>
              <Spacer h={space.xs} />
              <Small>You can post a verified story from here.</Small>
              <Spacer h={space.md} />
              <Button label="Post a story" onPress={() => setComposing(true)} testID="post-story" />
            </>
          ) : (
            <>
              <H2>Not checked in</H2>
              <Spacer h={space.xs} />
              <Small>
                Check in from a venue to post a story with the verified mark. You have to actually be there.
              </Small>
            </>
          )}
        </Card>

        {stories.length > 0 && (
          <>
            <Spacer h={space.md} />
            <Small tone="life">
              {stories.length} live {stories.length === 1 ? 'story' : 'stories'}
            </Small>
          </>
        )}

        <Spacer h={space.md} />
        <Button
          label="Drop a local spot"
          variant="ghost"
          testID="drop-spot"
          onPress={() => {
            const fix = app.fixes[me as string];
            if (!fix) {
              setFeedback('No location yet — func needs to know where you are to drop a spot.');
              return;
            }
            const result = dropSpot(app, 'Local spot', 'Worth knowing about.', fix.at);
            setFeedback(result.ok ? 'Dropped — it is on the map now.' : result.reason);
          }}
        />

        {feedback ? (
          <>
            <Spacer h={space.md} />
            <Notice text={feedback} />
          </>
        ) : null}

        <Divider />

        <Label>Friends · {friends.length}</Label>
        <Spacer h={space.xs} />
        <Small>These are the people who can see where you are when DTF is on.</Small>
        <Spacer h={space.sm} />
        {friends.map((friendId) => {
          const theirPresence = resolvePresence(
            presenceOf(app.state, friendId as string).presence,
            app.clock.now(),
          );
          return (
            <Card key={friendId as string} style={styles.item}>
              <Row>
                <View style={[styles.pip, { backgroundColor: presenceColour(theirPresence.kind) }]} />
                <View style={styles.flex}>
                  <H2>{displayName(app.state, friendId as string)}</H2>
                  <Small>
                    {theirPresence.kind === 'dtf'
                      ? 'Out — you can see them'
                      : theirPresence.kind === 'casual'
                        ? 'Out, not sharing'
                        : 'Not out'}
                  </Small>
                </View>
                <Button
                  label="Remove"
                  variant="ghost"
                  onPress={() => removeFriend(app, friendId)}
                  testID={`remove-friend-${friendId}`}
                />
              </Row>
            </Card>
          );
        })}

        <Divider />
        <Button
          label="Reset demo data"
          variant="ghost"
          testID="reset-demo"
          onPress={() => {
            resetDemoWorld(app);
            setFeedback('Reset to the demo world.');
          }}
        />
        <Spacer h={space.sm} />
        <Button
          label="Sign out"
          variant="ghost"
          testID="sign-out"
          onPress={() => logout(app)}
        />
        <Spacer h={space.md} />
        <Small>func · 18+ · ID verified</Small>
        <Spacer h={space.xxl} />
      </ScrollView>

      <Sheet visible={composing} onClose={() => setComposing(false)}>
        <Label>Post a story</Label>
        <Spacer h={space.sm} />
        <H1>Live from inside</H1>
        <Spacer h={space.sm} />
        <Body>Pick a look. It posts as a verified story from where you are checked in.</Body>
        <Spacer h={space.lg} />
        {STORY_GRADIENTS.map((gradient, i) => (
          <View key={i}>
            <Button
              label={`Post — look ${i + 1}`}
              variant={i === 0 ? 'primary' : 'ghost'}
              testID={`story-gradient-${i}`}
              onPress={() => {
                const result = postStory(app, gradient);
                setComposing(false);
                setFeedback(result.ok ? 'Posted — verified from inside.' : result.reason);
              }}
            />
            <Spacer h={space.sm} />
          </View>
        ))}
      </Sheet>
    </Screen>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <Card style={styles.flex}>
      <Label>{label}</Label>
      <Spacer h={space.xs} />
      <H2 tone="life">{value}</H2>
    </Card>
  );
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingTop: space.xxl + space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  item: { marginBottom: space.sm },
  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colour.surface,
    marginRight: space.md,
  },
  pip: { width: 8, height: 8, borderRadius: 4 },
});
