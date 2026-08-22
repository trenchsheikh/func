import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useRepository, useSnapshot } from '@/data/DataContext';
import { groupLead, hostedInvitesWithPending, myThreads, pendingMessageRequests, userById } from '@/data/selectors';
import { pendingRequests } from '@/domain/pool';
import type { ChatThread, MessageRequest, PoolInvite } from '@/domain/types';
import { Avatar, AvatarStack } from '@/ui/components/Avatar';
import { ChevronIcon } from '@/ui/components/Icons';
import { InviteCover } from '@/ui/components/InviteBits';
import { Body, Button, Empty, Eyebrow, Pill, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { ThreadRow } from '@/ui/components/ThreadRow';
import { colors, radius, space } from '@/ui/theme';
import { timeAgo } from '@/ui/time';

type Section =
  | { key: 'joins'; title: string; data: Array<{ invite: PoolInvite; pending: number }> }
  | { key: 'msgreq'; title: string; data: MessageRequest[] }
  | { key: 'threads'; title: string; data: ChatThread[] };

/**
 * Inbox: request-gated content. Pending join requests for invites you host
 * (batched per invite), pending message requests, then accepted threads.
 */
export default function InboxScreen() {
  const snap = useSnapshot();
  const joins = hostedInvitesWithPending(snap);
  const msgreq = pendingMessageRequests(snap);
  const threads = myThreads(snap);

  const sections: Section[] = [];
  if (joins.length) sections.push({ key: 'joins', title: 'Join requests', data: joins });
  if (msgreq.length) sections.push({ key: 'msgreq', title: 'Message requests', data: msgreq });
  sections.push({ key: 'threads', title: 'Messages', data: threads });

  return (
    <Screen>
      <ScreenHeader title="Inbox" />
      <SectionList
        sections={sections as never}
        keyExtractor={(item: { id?: string; invite?: PoolInvite }) => item.id ?? item.invite?.id ?? 'x'}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Eyebrow style={{ marginTop: space.sm }}>{(section as Section).title}</Eyebrow>}
        renderItem={({ item, section }) => {
          const s = section as Section;
          if (s.key === 'joins') return <JoinBatchRow batch={item as { invite: PoolInvite; pending: number }} />;
          if (s.key === 'msgreq') return <MessageRequestRow req={item as MessageRequest} />;
          return <ThreadRow thread={item as ChatThread} />;
        }}
        ListEmptyComponent={<Empty title="Quiet in here" />}
      />
    </Screen>
  );
}

/** One row per hosted invite — opens the batch review screen, never one-at-a-time. */
function JoinBatchRow({ batch }: { batch: { invite: PoolInvite; pending: number } }) {
  const snap = useSnapshot();
  const router = useRouter();
  const reqs = pendingRequests(batch.invite);
  const leads = reqs.map((r) => groupLead(snap, r.requestingGroupId));
  const withMsg = reqs.filter((r) => r.preAcceptMessage).length;
  return (
    <Pressable style={styles.batch} onPress={() => router.push({ pathname: '/review/[id]', params: { id: batch.invite.id } })}>
      <InviteCover invite={batch.invite} size={48} />
      <View style={{ flex: 1, gap: 4 }}>
        <Body numberOfLines={1} style={{ fontWeight: '600' }}>{batch.invite.description}</Body>
        <Row gap={6}>
          <AvatarStack users={leads} size={20} />
          <Small>{batch.pending} waiting{withMsg ? ` · ${withMsg} with a message` : ''}</Small>
        </Row>
      </View>
      <Pill label={`${batch.pending}`} color={colors.casual} filled />
      <ChevronIcon color={colors.muted} />
    </Pressable>
  );
}

function MessageRequestRow({ req }: { req: MessageRequest }) {
  const repo = useRepository();
  const snap = useSnapshot();
  const from = userById(snap, req.fromUserId);
  const decide = (d: 'accepted' | 'denied') => {
    const r = repo.respondToMessageRequest(req.id, d);
    if (!r.ok) Alert.alert('Hmm', r.reason);
  };
  return (
    <View style={styles.msgreq}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <Avatar user={from} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6}>
            <Body style={{ fontWeight: '600' }}>{from?.personalProfile.displayName ?? 'Someone'}</Body>
            <Small>@{from?.handle} · {timeAgo(req.createdAt, new Date())}</Small>
          </Row>
          <Body>{req.text}</Body>
        </View>
      </Row>
      <Row gap={space.sm} style={{ marginTop: space.sm }}>
        <Button small variant="ghost" label="Deny" onPress={() => decide('denied')} style={{ flex: 1 }} />
        <Button small variant="success" label="Accept" onPress={() => decide('accepted')} style={{ flex: 1 }} />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  batch: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.casual,
    padding: space.md,
  },
  msgreq: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
});
