import { useRouter } from 'expo-router';
import React from 'react';
import { Alert, Pressable, SectionList, StyleSheet, View } from 'react-native';
import { useCommands, useView } from '@/data/DataContext';
import type { IncomingMessageRequestView, InviteCardView, PersonSummary, ThreadView } from '@/data/views';
import { Avatar, AvatarStack, avatarUserOf } from '@/ui/components/Avatar';
import { ChevronIcon } from '@/ui/components/Icons';
import { InviteCover } from '@/ui/components/InviteBits';
import { Body, Button, Empty, Eyebrow, Pill, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { ThreadRow } from '@/ui/components/ThreadRow';
import { colors, radius, space } from '@/ui/theme';
import { timeAgo } from '@/ui/time';

type JoinBatch = { invite: InviteCardView; pendingCount: number; pendingLeads: readonly PersonSummary[] };

type Section =
  | { key: 'joins'; title: string; data: readonly JoinBatch[] }
  | { key: 'msgreq'; title: string; data: readonly IncomingMessageRequestView[] }
  | { key: 'threads'; title: string; data: readonly ThreadView[] };

/**
 * Inbox: request-gated content. Pending join requests for invites you host
 * (batched per invite), pending message requests, then accepted threads.
 */
export default function InboxScreen() {
  const view = useView();
  const joins = view.inbox.joinBatches;
  const msgreq = view.inbox.messageRequests;
  const threads = view.threads;

  const sections: Section[] = [];
  if (joins.length) sections.push({ key: 'joins', title: 'Join requests', data: joins });
  if (msgreq.length) sections.push({ key: 'msgreq', title: 'Message requests', data: msgreq });
  sections.push({ key: 'threads', title: 'Messages', data: threads });

  return (
    <Screen>
      <ScreenHeader title="Inbox" />
      <SectionList
        sections={sections as never}
        keyExtractor={(item: { id?: string; invite?: InviteCardView }) => item.id ?? item.invite?.id ?? 'x'}
        contentContainerStyle={{ padding: space.lg, gap: space.sm, paddingBottom: 40 }}
        stickySectionHeadersEnabled={false}
        renderSectionHeader={({ section }) => <Eyebrow style={{ marginTop: space.sm }}>{(section as Section).title}</Eyebrow>}
        renderItem={({ item, section }) => {
          const s = section as Section;
          if (s.key === 'joins') return <JoinBatchRow batch={item as JoinBatch} />;
          if (s.key === 'msgreq') return <MessageRequestRow req={item as IncomingMessageRequestView} />;
          return <ThreadRow thread={item as ThreadView} />;
        }}
        ListEmptyComponent={<Empty title="Quiet in here" />}
      />
    </Screen>
  );
}

/** One row per hosted invite — opens the batch review screen, never one-at-a-time. */
function JoinBatchRow({ batch }: { batch: JoinBatch }) {
  const router = useRouter();
  return (
    <Pressable style={styles.batch} onPress={() => router.push({ pathname: '/review/[id]', params: { id: batch.invite.id } })}>
      <InviteCover invite={batch.invite} size={48} />
      <View style={{ flex: 1, gap: 4 }}>
        <Body numberOfLines={1} style={{ fontWeight: '600' }}>{batch.invite.description}</Body>
        <Row gap={6}>
          <AvatarStack users={batch.pendingLeads.map(avatarUserOf)} size={20} />
          <Small>{batch.pendingCount} waiting</Small>
        </Row>
      </View>
      <Pill label={`${batch.pendingCount}`} color={colors.casual} filled />
      <ChevronIcon color={colors.muted} />
    </Pressable>
  );
}

function MessageRequestRow({ req }: { req: IncomingMessageRequestView }) {
  const commands = useCommands();
  const decide = (d: 'accepted' | 'denied') => {
    const r = commands.respondToMessageRequest(req.id, d);
    if (!r.ok) Alert.alert('Hmm', r.reason);
  };
  return (
    <View style={styles.msgreq}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <Avatar user={avatarUserOf(req.from)} size={40} />
        <View style={{ flex: 1, gap: 2 }}>
          <Row gap={6}>
            <Body style={{ fontWeight: '600' }}>{req.from.displayName}</Body>
            <Small>@{req.from.handle} · {timeAgo(req.createdAt, new Date())}</Small>
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
