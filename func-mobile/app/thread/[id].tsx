import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import { Alert, FlatList, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useRepository, useSnapshot } from '@/data/DataContext';
import { groupLead, threadById, userById } from '@/data/selectors';
import { Avatar } from '@/ui/components/Avatar';
import { Button, Empty, Row, Screen, Small } from '@/ui/components/Primitives';
import { ScreenHeader } from '@/ui/components/ScreenHeader';
import { colors, radius, space } from '@/ui/theme';
import { clock } from '@/ui/time';

export default function ThreadScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const repo = useRepository();
  const snap = useSnapshot();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [text, setText] = useState('');
  const list = useRef<FlatList>(null);
  const thread = threadById(snap, id ?? '');
  if (!thread) {
    return (
      <Screen>
        <ScreenHeader title="Chat" back />
        <Empty title="Thread not found." />
      </Screen>
    );
  }
  const members = thread.participantGroupIds.map((g) => groupLead(snap, g)).filter(Boolean);

  const send = () => {
    const r = repo.sendMessage(thread.id, text);
    if (!r.ok) return Alert.alert('Not sent', r.reason);
    setText('');
    setTimeout(() => list.current?.scrollToEnd({ animated: true }), 50);
  };

  return (
    <Screen>
      <ScreenHeader
        title={thread.title}
        back
        right={
          thread.poolInviteId ? (
            <Button small variant="ghost" label="Invite" onPress={() => router.push({ pathname: '/invite/[id]', params: { id: thread.poolInviteId! } })} />
          ) : undefined
        }
      />
      <Row gap={6} style={{ paddingHorizontal: space.lg, paddingBottom: space.sm }}>
        <Small>{thread.kind === 'pool' ? 'Group chat' : 'Direct'} · {members.map((m) => m?.personalProfile.displayName).join(', ')}</Small>
      </Row>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <FlatList
          ref={list}
          data={thread.messages}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: space.lg, gap: space.sm }}
          onContentSizeChange={() => list.current?.scrollToEnd({ animated: false })}
          renderItem={({ item }) => {
            const mine = item.senderUserId === snap.currentUserId;
            const sender = userById(snap, item.senderUserId);
            return (
              <View style={[styles.msgRow, mine && { flexDirection: 'row-reverse' }]}>
                {!mine ? <Avatar user={sender} size={26} /> : null}
                <View style={[styles.bubble, mine ? styles.mine : styles.theirs]}>
                  {!mine && thread.kind === 'pool' ? <Text style={styles.sender}>{sender?.personalProfile.displayName}</Text> : null}
                  <Text style={[styles.msgText, mine && { color: colors.bg }]}>{item.text}</Text>
                  <Text style={[styles.time, mine && { color: '#3a3a44' }]}>{clock(item.sentAt)}</Text>
                </View>
              </View>
            );
          }}
        />
        <View style={[styles.composer, { paddingBottom: Math.max(insets.bottom, 10) }]}>
          <TextInput
            value={text}
            onChangeText={setText}
            placeholder="Message"
            placeholderTextColor={colors.faint}
            style={styles.input}
            multiline
          />
          <Pressable onPress={send} style={styles.send} accessibilityLabel="Send">
            <Text style={{ color: colors.bg, fontWeight: '700' }}>Send</Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  bubble: { maxWidth: '78%', borderRadius: radius.lg, paddingHorizontal: 12, paddingVertical: 8 },
  mine: { backgroundColor: colors.accent, borderBottomRightRadius: 4 },
  theirs: { backgroundColor: colors.surfaceRaised, borderBottomLeftRadius: 4 },
  sender: { color: colors.muted, fontSize: 11, marginBottom: 2 },
  msgText: { color: colors.text, fontSize: 15 },
  time: { color: colors.faint, fontSize: 10, marginTop: 3, alignSelf: 'flex-end' },
  composer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    padding: space.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    color: colors.text,
    borderRadius: radius.lg,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    maxHeight: 120,
  },
  send: { backgroundColor: colors.accent, borderRadius: radius.lg, paddingHorizontal: 16, paddingVertical: 11 },
});
