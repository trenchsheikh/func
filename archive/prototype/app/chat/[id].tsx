import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { Avatar } from '../../components/Avatar';
import { userById } from '../../data/users';
import { colors, radius, spacing } from '../../lib/theme';

interface Msg {
  id: string;
  from: 'you' | 'them';
  text: string;
}

const CANNED_REPLIES = [
  'yesss we were thinking the same — Archive 9 later? 🌀',
  'haha finally! our group is out Saturday, come find us',
  'omg hi! we saw your group on the map 😄',
];

export default function ChatModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const them = userById(String(id));
  const [messages, setMessages] = useState<Msg[]>([
    { id: 'm0', from: 'them', text: `You matched with ${them.name} — say hi 👋` },
  ]);
  const [draft, setDraft] = useState('');
  const replyTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const replyCount = useRef(0);

  useEffect(() => {
    return () => {
      if (replyTimer.current) clearTimeout(replyTimer.current);
    };
  }, []);

  const send = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    setMessages((m) => [...m, { id: `m${m.length}`, from: 'you', text }]);
    const reply = CANNED_REPLIES[replyCount.current % CANNED_REPLIES.length];
    replyCount.current += 1;
    replyTimer.current = setTimeout(() => {
      setMessages((m) => [...m, { id: `m${m.length}`, from: 'them', text: reply }]);
    }, 900);
  };

  return (
    <KeyboardAvoidingView
      style={styles.root}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={90}
    >
      <Stack.Screen options={{ title: them.name }} />
      <FlatList
        data={messages}
        keyExtractor={(m) => m.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <View style={[styles.msgRow, item.from === 'you' && styles.msgRowYou]}>
            {item.from === 'them' && <Avatar userId={them.id} name={them.name} size={28} />}
            <View style={[styles.bubble, item.from === 'you' ? styles.bubbleYou : styles.bubbleThem]}>
              <Text style={styles.msgText}>{item.text}</Text>
            </View>
          </View>
        )}
      />
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={draft}
          onChangeText={setDraft}
          placeholder="Message…"
          placeholderTextColor={colors.textDim}
          onSubmitEditing={send}
          returnKeyType="send"
        />
        <Pressable style={styles.sendBtn} onPress={send}>
          <Ionicons name="arrow-up" size={20} color="#FFFFFF" />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  list: { padding: spacing.lg, gap: spacing.sm },
  msgRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8 },
  msgRowYou: { justifyContent: 'flex-end' },
  bubble: { maxWidth: '75%', borderRadius: radius.lg, paddingHorizontal: 14, paddingVertical: 9 },
  bubbleThem: { backgroundColor: colors.surfaceHi, borderBottomLeftRadius: 4 },
  bubbleYou: { backgroundColor: colors.primary, borderBottomRightRadius: 4 },
  msgText: { color: colors.text, fontSize: 14, lineHeight: 19 },
  inputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.surface,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surfaceHi,
    borderRadius: radius.pill,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: colors.text,
    fontSize: 14,
  },
  sendBtn: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
