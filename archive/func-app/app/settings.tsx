/**
 * Presence settings — the new product model, made operable.
 *
 * The screen has to make three things obvious, because they are the whole
 * change:
 *
 *   1. DTF is what lets your friends see you. It is not "am I in the mood".
 *   2. It ends by itself, and you can see exactly when.
 *   3. The mutuals setting is permanent, needs both sides, and does nothing
 *      on its own.
 */

import { useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import { nextLocalNoon, resolvePresence, timeRemaining } from '../src/domain';
import {
  Body,
  Button,
  Card,
  H1,
  H2,
  Label,
  Notice,
  Row,
  Screen,
  Small,
  Spacer,
  Toggle,
} from '../src/ui/components/kit';
import { useApp } from '../src/ui/state/AppProvider';
import { adjustExpiry, setCasual, setDtf, setOff, setShareWithMutuals } from '../src/ui/state/actions';
import { presenceOf } from '../src/ui/state/selectors';
import { colour, presenceColour, space } from '../src/ui/theme';

export default function SettingsScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const me = app.meId;

  if (!me) {
    return (
      <Screen style={styles.pad}>
        <Body>Sign in first.</Body>
      </Screen>
    );
  }

  const profile = presenceOf(app.state, me as string);
  const now = app.clock.now();
  const live = resolvePresence(profile.presence, now);
  const remaining = timeRemaining(profile.presence, now);

  const friendCount = app.graph.friendsOf(me).length;

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <Label>Tonight</Label>
        <Spacer h={space.sm} />
        <H1>{live.kind === 'dtf' ? 'You are out' : live.kind === 'casual' ? 'Having a look' : 'Not out'}</H1>
        <Spacer h={space.sm} />
        <Body>
          {live.kind === 'dtf'
            ? `Your ${friendCount} friends can see where you are. You do not need to keep func open.`
            : live.kind === 'casual'
              ? 'You can see what is on. Nobody can see where you are.'
              : 'Nobody can see where you are.'}
        </Body>

        <Spacer h={space.lg} />

        <Row>
          <Button
            label="DTF"
            variant={live.kind === 'dtf' ? 'primary' : 'ghost'}
            onPress={() => setDtf(app)}
            style={styles.flex}
            testID="set-dtf"
          />
          <Button
            label="Casual"
            variant={live.kind === 'casual' ? 'primary' : 'ghost'}
            onPress={() => setCasual(app)}
            style={styles.flex}
            testID="set-casual"
          />
          <Button
            label="Off"
            variant={live.kind === 'off' ? 'primary' : 'ghost'}
            onPress={() => setOff(app)}
            style={styles.flex}
            testID="set-off"
          />
        </Row>

        {live.kind !== 'off' && (
          <>
            <Spacer h={space.lg} />
            <Card>
              <Row>
                <View style={[styles.dot, { backgroundColor: presenceColour(live.kind) }]} />
                <View style={styles.flex}>
                  <H2>Ends {formatClock(live.expiresAt)}</H2>
                  <Small>{formatRemaining(remaining)} left — it stops by itself</Small>
                </View>
              </Row>
              <Spacer h={space.md} />
              <Row>
                <Button
                  label="+1 hour"
                  variant="ghost"
                  onPress={() => adjustExpiry(app, live.expiresAt + 3_600_000)}
                  style={styles.flex}
                  testID="extend-hour"
                />
                <Button
                  label="Till midday"
                  variant="ghost"
                  onPress={() => adjustExpiry(app, nextLocalNoon(now, app.clock.timeZone()))}
                  style={styles.flex}
                  testID="extend-noon"
                />
              </Row>
              <Spacer h={space.sm} />
              <Button
                label="End now"
                variant="danger"
                onPress={() => setOff(app)}
                testID="end-now"
              />
            </Card>
          </>
        )}

        <Spacer h={space.xl} />
        <Label>Friends of friends</Label>
        <Spacer h={space.sm} />

        <Card>
          <Row>
            <View style={styles.flex}>
              <H2>Let mutuals see you are out</H2>
              <Spacer h={space.xs} />
              <Small>
                People who share a friend with you can see that someone they know is at a
                place — never who, and never exactly where.
              </Small>
            </View>
            <Toggle
              on={profile.shareWithMutuals}
              onChange={(next) => setShareWithMutuals(app, next)}
              testID="toggle-mutuals"
            />
          </Row>
        </Card>

        <Spacer h={space.md} />
        <Notice
          text={
            profile.shareWithMutuals
              ? 'This setting stays on until you turn it off — it does not expire. It only does anything when you are DTF and they are too.'
              : 'Off. Mutuals cannot see you even when you are both out.'
          }
        />

        <Spacer h={space.xl} />
        <Label>Who sees what</Label>
        <Spacer h={space.sm} />
        <Card>
          <Rule who="Friends" what="Exactly where you are" on={live.kind === 'dtf'} />
          <Spacer h={space.sm} />
          <Rule
            who="Mutuals"
            what="That someone they know is here"
            on={live.kind === 'dtf' && profile.shareWithMutuals}
          />
          <Spacer h={space.sm} />
          <Rule who="Everyone else" what="Nothing, ever" on={false} always />
        </Card>

        <Spacer h={space.xl} />
        <Button label="Done" variant="ghost" onPress={() => router.back()} />
      </ScrollView>
    </Screen>
  );
}

function Rule({ who, what, on, always }: { who: string; what: string; on: boolean; always?: boolean }) {
  return (
    <Row>
      <View style={[styles.pip, { backgroundColor: on ? colour.em : colour.fg4 }]} />
      <View style={styles.flex}>
        <Small tone="default">{who}</Small>
        <Small>{what}</Small>
      </View>
      <Small tone={on ? 'life' : 'dimmer'}>{always === true ? '—' : on ? 'On' : 'Off'}</Small>
    </Row>
  );
}

function formatClock(at: number): string {
  const d = new Date(at);
  const hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, '0');
  const h12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${h12}:${minutes}${hours >= 12 ? 'pm' : 'am'}`;
}

function formatRemaining(ms: number): string {
  if (ms <= 0) return 'No time';
  const totalMinutes = Math.round(ms / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours}h` : `${hours}h ${minutes}m`;
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  dot: { width: 10, height: 10, borderRadius: 5 },
  pip: { width: 6, height: 6, borderRadius: 3 },
});
