import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useCommands, useView } from '@/data/DataContext';
import type { RequestReviewItem } from '@/data/views';
import { Avatar, AvatarStack, avatarUserOf } from '@/ui/components/Avatar';
import { Body, Button, Card, Empty, Eyebrow, Pill, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { colors, radius, space } from '@/ui/theme';

/**
 * Batch review: every pending request for one hosted invite on a single
 * screen, each with its own accept/deny. Not a one-at-a-time card flow.
 */
export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const commands = useCommands();
  const view = useView();
  const detail = id ? view.inviteDetails.get(id) : undefined;
  if (!detail || !detail.review) {
    return (
      <Screen>
        <ScreenHeader title="Requests" back />
        <Empty title="Invite not found." />
      </Screen>
    );
  }
  const review = detail.review;
  const pending = review.pending;
  const decided = review.decided;
  const left = review.seatsLeft;

  const decide = (r: RequestReviewItem, d: 'accepted' | 'denied') => {
    const res = commands.reviewRequest(detail.id, r.partyKey, d);
    if (!res.ok) Alert.alert('Could not do that', res.reason);
  };

  return (
    <Screen>
      <ScreenHeader title="Requests" back />
      <ScrollView contentContainerStyle={styles.body}>
        <Body style={{ fontWeight: '600' }}>{detail.description}</Body>
        <Row gap={6}>
          <Pill label={`${pending.length} pending`} color={colors.casual} filled={pending.length > 0} />
          {left != null ? <Pill label={`${left} of ${detail.capacity.max} left`} /> : <Pill label="No cap" />}
        </Row>

        <Eyebrow style={{ marginTop: space.sm }}>Waiting on you</Eyebrow>
        {pending.length === 0 ? <Small>All caught up.</Small> : null}
        {pending.map((r) => {
          const lead = r.party.lead;
          const members = r.party.members;
          const tooBig = left != null && r.party.size > left;
          return (
            <Card key={r.partyKey} style={{ gap: space.sm }}>
              <Row gap={space.md}>
                <Avatar user={avatarUserOf(lead)} size={44} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '600' }}>{lead.displayName}</Body>
                  <Small>@{lead.handle} · party of {r.party.size}</Small>
                </View>
                {members.length > 1 ? <AvatarStack users={members.map(avatarUserOf)} size={22} /> : null}
              </Row>
              {r.preAcceptMessage ? (
                <View style={styles.bubble}>
                  <Small style={{ color: colors.muted, marginBottom: 2 }}>message before accepting</Small>
                  <Body>{r.preAcceptMessage}</Body>
                </View>
              ) : null}
              {tooBig ? <Small style={{ color: colors.casual }}>Not enough room for {r.party.size} — accept someone smaller or deny.</Small> : null}
              <Row gap={space.sm}>
                <Button small variant="ghost" label="Deny" onPress={() => decide(r, 'denied')} style={{ flex: 1 }} />
                <Button small variant="success" label="Accept" disabled={tooBig} onPress={() => decide(r, 'accepted')} style={{ flex: 1 }} />
              </Row>
            </Card>
          );
        })}

        {decided.length ? (
          <>
            <Eyebrow style={{ marginTop: space.md }}>Decided</Eyebrow>
            {decided.map((r) => (
              <Row key={r.partyKey} gap={space.md} style={styles.decided}>
                <Avatar user={avatarUserOf(r.party.lead)} size={30} />
                <Body style={{ flex: 1 }}>{r.party.lead.displayName} · {r.party.size}</Body>
                <Pill label={r.status === 'accepted' ? 'In' : 'Denied'} color={r.status === 'accepted' ? colors.dtf : colors.muted} />
              </Row>
            ))}
          </>
        ) : null}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  body: { padding: space.lg, gap: space.sm, paddingBottom: 48 },
  bubble: { backgroundColor: colors.surfaceRaised, borderRadius: radius.md, padding: space.md },
  decided: { paddingVertical: 6 },
});
