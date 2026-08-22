import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSnapshot } from '@/data/DataContext';
import { groupLead, lastActivity, userById } from '@/data/selectors';
import type { ChatThread } from '@/domain/types';
import { colors, radius, space } from '../theme';
import { timeAgo } from '../time';
import { Avatar, AvatarStack } from './Avatar';
import { Body, Pill, Row, Small } from './Primitives';

export function ThreadRow({ thread }: { thread: ChatThread }) {
  const snap = useSnapshot();
  const router = useRouter();
  const last = thread.messages[thread.messages.length - 1];
  const other = thread.kind === 'dm'
    ? groupLead(snap, thread.participantGroupIds.find((g) => groupLead(snap, g)?.id !== snap.currentUserId) ?? '')
    : undefined;
  const leads = thread.participantGroupIds.map((g) => groupLead(snap, g));
  const sender = last ? userById(snap, last.senderUserId) : undefined;
  return (
    <Pressable style={styles.row} onPress={() => router.push({ pathname: '/thread/[id]', params: { id: thread.id } })}>
      {thread.kind === 'dm' ? <Avatar user={other} size={42} /> : <AvatarStack users={leads} size={30} max={3} />}
      <View style={{ flex: 1, gap: 2 }}>
        <Row gap={6}>
          <Body numberOfLines={1} style={{ fontWeight: '600', flex: 1 }}>{thread.title}</Body>
          {thread.kind === 'pool' ? <Pill label="Pool" /> : null}
        </Row>
        <Small numberOfLines={1}>
          {last ? `${sender?.id === snap.currentUserId ? 'You' : sender?.personalProfile.displayName ?? '?'}: ${last.text}` : 'No messages yet'}
        </Small>
      </View>
      <Small>{lastActivity(thread) ? timeAgo(lastActivity(thread), new Date()) : ''}</Small>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
});
