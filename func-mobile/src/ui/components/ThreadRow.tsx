import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useView } from '@/data/DataContext';
import type { ThreadView } from '@/data/views';
import { colors, radius, space } from '../theme';
import { timeAgo } from '../time';
import { Avatar, AvatarStack, avatarUserOf } from './Avatar';
import { Body, Pill, Row, Small } from './Primitives';

export function ThreadRow({ thread }: { thread: ThreadView }) {
  const view = useView();
  const router = useRouter();
  const last = thread.messages[thread.messages.length - 1];
  const other = thread.kind === 'dm' ? thread.participants.find((p) => p.id !== view.self.id) : undefined;
  const sender = last ? view.people.get(last.senderId) : undefined;
  return (
    <Pressable style={styles.row} onPress={() => router.push({ pathname: '/thread/[id]', params: { id: thread.id } })}>
      {thread.kind === 'dm' ? (
        <Avatar user={other ? avatarUserOf(other) : undefined} size={42} />
      ) : (
        <AvatarStack users={thread.participants.map(avatarUserOf)} size={30} max={3} />
      )}
      <View style={{ flex: 1, gap: 2 }}>
        <Row gap={6}>
          <Body numberOfLines={1} style={{ fontWeight: '600', flex: 1 }}>{thread.title}</Body>
          {thread.kind === 'pool' ? <Pill label="Pool" /> : null}
        </Row>
        <Small numberOfLines={1}>
          {last ? `${sender?.id === view.self.id ? 'You' : sender?.displayName ?? '?'}: ${last.text}` : 'No messages yet'}
        </Small>
      </View>
      <Small>{thread.lastActivity ? timeAgo(thread.lastActivity, new Date()) : ''}</Small>
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
