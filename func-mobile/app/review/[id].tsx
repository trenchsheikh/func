import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { Alert, ScrollView, StyleSheet, View } from 'react-native';
import { useRepository, useSnapshot } from '@/data/DataContext';
import { groupById, groupLead, inviteById, partySizeOf, userById } from '@/data/selectors';
import { pendingRequests, seatsLeft } from '@/domain/pool';
import type { PoolRequest } from '@/domain/types';
import { Avatar, AvatarStack } from '@/ui/components/Avatar';
import { Body, Button, Card, Empty, Eyebrow, Pill, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { colors, radius, space } from '@/ui/theme';

/**
 * Batch review: every pending request for one hosted invite on a single
 * screen, each with its own accept/deny. Not a one-at-a-time card flow.
 */
export default function ReviewScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repo = useRepository();
  const snap = useSnapshot();
  const invite = inviteById(snap, id ?? '');
  if (!invite) {
    return (
      <Screen>
        <ScreenHeader title="Requests" back />
        <Empty title="Invite not found." />
      </Screen>
    );
  }
  const pending = pendingRequests(invite);
  const decided = invite.requests.filter((r) => r.status !== 'pending' && r.requestingGroupId !== invite.hostGroupId);
  const left = seatsLeft(invite, partySizeOf(snap));

  const decide = (r: PoolRequest, d: 'accepted' | 'denied') => {
    const res = repo.reviewRequest(invite.id, r.requestingGroupId, d);
    if (!res.ok) Alert.alert('Could not do that', res.reason);
  };

  return (
    <Screen>
      <ScreenHeader title="Requests" back />
      <ScrollView contentContainerStyle={styles.body}>
        <Body style={{ fontWeight: '600' }}>{invite.description}</Body>
        <Row gap={6}>
          <Pill label={`${pending.length} pending`} color={colors.casual} filled={pending.length > 0} />
          {left != null ? <Pill label={`${left} of ${invite.capacity.max} left`} /> : <Pill label="No cap" />}
        </Row>

        <Eyebrow style={{ marginTop: space.sm }}>Waiting on you</Eyebrow>
        {pending.length === 0 ? <Small>All caught up.</Small> : null}
        {pending.map((r) => {
          const lead = groupLead(snap, r.requestingGroupId);
          const members = (groupById(snap, r.requestingGroupId)?.memberUserIds ?? []).map((uid) => userById(snap, uid));
          const tooBig = left != null && r.partySize > left;
          return (
            <Card key={r.requestingGroupId} style={{ gap: space.sm }}>
              <Row gap={space.md}>
                <Avatar user={lead} size={44} />
                <View style={{ flex: 1 }}>
                  <Body style={{ fontWeight: '600' }}>{lead?.personalProfile.displayName ?? 'Someone'}</Body>
                  <Small>@{lead?.handle} · party of {r.partySize}</Small>
                </View>
                {members.length > 1 ? <AvatarStack users={members} size={22} /> : null}
              </Row>
              {r.preAcceptMessage ? (
                <View style={styles.bubble}>
                  <Small style={{ color: colors.muted, marginBottom: 2 }}>message before accepting</Small>
                  <Body>{r.preAcceptMessage.text}</Body>
                </View>
              ) : null}
              {tooBig ? <Small style={{ color: colors.casual }}>Not enough room for {r.partySize} — accept someone smaller or deny.</Small> : null}
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
            {decided.map((r) => {
              const lead = groupLead(snap, r.requestingGroupId);
              return (
                <Row key={r.requestingGroupId} gap={space.md} style={styles.decided}>
                  <Avatar user={lead} size={30} />
                  <Body style={{ flex: 1 }}>{lead?.personalProfile.displayName} · {r.partySize}</Body>
                  <Pill label={r.status === 'accepted' ? 'In' : 'Denied'} color={r.status === 'accepted' ? colors.dtf : colors.muted} />
                </Row>
              );
            })}
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
