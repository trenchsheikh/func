import { useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useView } from '@/data/DataContext';
import { Avatar, AvatarStack, avatarUserOf } from '@/ui/components/Avatar';
import { GoingStack, InviteActions, InviteCover, InviteMeta } from '@/ui/components/InviteBits';
import { Body, Button, Empty, Eyebrow, GlassCard, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { space } from '@/ui/theme';
import { timeAgo, whenLabel } from '@/ui/time';

export default function InviteDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const view = useView();
  const router = useRouter();
  const detail = id ? view.inviteDetails.get(id) : undefined;
  if (!detail) {
    return (
      <Screen>
        <ScreenHeader title="Invite" back />
        <Empty title="This invite is gone." />
      </Screen>
    );
  }
  const now = new Date();
  const rel = detail.viewer.relation;
  const ago = timeAgo(detail.createdAt, now);
  const attendeeLeads = detail.plan?.attendees.map((a) => a.lead) ?? [];
  return (
    <Screen>
      <ScreenHeader
        title="Invite"
        back
        right={
          detail.plan ? (
            <Button
              small
              variant="ghost"
              label="Chat"
              onPress={() => router.push({ pathname: '/thread/[id]', params: { id: detail.plan!.threadId } })}
            />
          ) : undefined
        }
      />
      <ScrollView contentContainerStyle={styles.body}>
        <InviteCover invite={detail} size={96} />
        <Body style={{ fontSize: 20, fontWeight: '700' }}>{detail.description}</Body>
        <Row gap={space.sm}>
          <Avatar user={avatarUserOf(detail.host)} size={28} />
          <Small>
            hosted by {detail.host.displayName} · posted {ago === 'now' ? 'just now' : `${ago} ago`}
            {detail.hostedByVerifiedBusiness ? ' · venue account' : ''}
          </Small>
        </Row>
        {detail.startsAt ? <Body>{whenLabel(detail.startsAt, now)}</Body> : null}
        <InviteMeta invite={detail} />
        <GlassCard style={{ gap: space.sm }}>
          <Eyebrow>Who's going</Eyebrow>
          <GoingStack invite={detail} leads={attendeeLeads} />
          <AvatarStack users={attendeeLeads.map(avatarUserOf)} size={28} max={8} />
        </GlassCard>
        <GlassCard style={{ gap: space.sm }}>
          <Eyebrow>{rel === 'host' ? "You're hosting" : rel === 'attending' ? "You're in" : detail.access.mode === 'public' ? 'Walk in' : 'Ask to join'}</Eyebrow>
          <InviteActions invite={detail} />
        </GlassCard>
        <Small>
          {rel === 'host'
            ? detail.access.mode === 'public'
              ? 'Anyone can walk in; they land in your group chat automatically.'
              : 'Requests show up in your Inbox, batched, for you to accept or deny.'
            : detail.access.mode === 'public'
              ? 'Open invite: joining is instant and drops you straight into the group chat.'
              : 'Private invite: the host sees your request (and your message, if you add one) in their Inbox and decides there.'}
        </Small>
        <View style={{ height: 24 }} />
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({ body: { padding: space.lg, gap: space.md } });
