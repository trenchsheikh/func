import { useLocalSearchParams } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useSnapshot } from '@/data/DataContext';
import { groupLead, hostDisplayName, inviteById, myGroup } from '@/data/selectors';
import { relationTo } from '@/domain/pool';
import { Avatar, AvatarStack } from '@/ui/components/Avatar';
import { GoingStack, InviteActions, InviteCover, InviteMeta } from '@/ui/components/InviteBits';
import { Body, Card, Empty, Eyebrow, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { space } from '@/ui/theme';
import { timeAgo, whenLabel } from '@/ui/time';

export default function InviteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const snap = useSnapshot();
  const invite = inviteById(snap, id ?? '');
  if (!invite) {
    return (
      <Screen>
        <ScreenHeader title="Invite" back />
        <Empty title="This invite is gone." />
      </Screen>
    );
  }
  const host = groupLead(snap, invite.hostGroupId);
  const leads = invite.attendeeGroupIds.map((g) => groupLead(snap, g));
  const now = new Date();
  const rel = relationTo(invite, myGroup(snap).id);
  const ago = timeAgo(invite.createdAt, now);
  return (
    <Screen>
      <ScreenHeader title="Invite" back />
      <ScrollView contentContainerStyle={styles.body}>
        <InviteCover invite={invite} size={96} />
        <Body style={{ fontSize: 20, fontWeight: '700' }}>{invite.description}</Body>
        <Row gap={space.sm}>
          <Avatar user={host} size={28} />
          <Small>
            hosted by {hostDisplayName(snap, invite)} · posted {ago === 'now' ? 'just now' : `${ago} ago`}
            {invite.createdByAccountType === 'business' ? ' · venue account' : ''}
          </Small>
        </Row>
        {invite.startsAt ? <Body>{whenLabel(invite.startsAt, now)}</Body> : null}
        <InviteMeta invite={invite} />
        <Card style={{ gap: space.sm }}>
          <Eyebrow>Who's going</Eyebrow>
          <GoingStack invite={invite} />
          <AvatarStack users={leads} size={28} max={8} />
        </Card>
        <Card style={{ gap: space.sm }}>
          <Eyebrow>{rel === 'host' ? "You're hosting" : rel === 'attending' ? "You're in" : invite.access.mode === 'public' ? 'Walk in' : 'Ask to join'}</Eyebrow>
          <InviteActions invite={invite} />
        </Card>
        <Small>
          {rel === 'host'
            ? invite.access.mode === 'public'
              ? 'Anyone can walk in; they land in your group chat automatically.'
              : 'Requests show up in your Inbox, batched, for you to accept or deny.'
            : invite.access.mode === 'public'
              ? 'Open invite: joining is instant and drops you straight into the group chat.'
              : 'Private invite: the host sees your request (and your message, if you add one) in their Inbox and decides there.'}
        </Small>
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { padding: space.lg, gap: space.md } });
