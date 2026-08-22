/**
 * A thread.
 *
 * Scoped to one request, and closed once that request resolves against you.
 * Tier 0: func does not host the conversation — this is correspondence about a
 * specific ask, not a chat app.
 */

import { useLocalSearchParams } from 'expo-router';
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { asThreadId, messagesFor } from '../../src/domain';
import {
  Button,
  Empty,
  Label,
  Notice,
  Row,
  Screen,
  Small,
  Spacer,
} from '../../src/ui/components/kit';
import { useApp } from '../../src/ui/state/AppProvider';
import { sendMessage } from '../../src/ui/state/actions';
import { displayName } from '../../src/ui/state/selectors';
import { colour, radius, space } from '../../src/ui/theme';

export default function ThreadScreen(): React.JSX.Element {
  const app = useApp();
  const params = useLocalSearchParams<{ id: string }>();
  const [draft, setDraft] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);

  const threadId = asThreadId(params.id ?? '');
  const thread = app.state.threads.find((t) => t.id === threadId);
  if (!thread) return <Empty title="Gone" body="That conversation no longer exists." />;

  const messages = messagesFor(app.state.messages, threadId);
  const other = thread.participantIds.find((id) => id !== app.meId);

  return (
    <Screen>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={90}
      >
        <ScrollView contentContainerStyle={styles.pad}>
          <Label>{other ? displayName(app.state, other as string) : 'Thread'}</Label>
          <Spacer h={space.md} />

          {messages.length === 0 && <Small>No messages yet.</Small>}

          {messages.map((message) => {
            if (message.sender.kind === 'system') {
              return (
                <View key={message.id as string} style={styles.system}>
                  <Small tone="life">{message.body}</Small>
                </View>
              );
            }
            const mine = message.sender.id === app.meId;
            return (
              <View
                key={message.id as string}
                style={[styles.bubble, mine ? styles.mine : styles.theirs]}
              >
                <Small tone={mine ? 'default' : 'dim'}>{message.body}</Small>
              </View>
            );
          })}
        </ScrollView>

        {thread.status === 'closed' ? (
          <View style={styles.composer}>
            <Notice text="This one is closed." />
          </View>
        ) : (
          <View style={styles.composer}>
            {feedback ? (
              <>
                <Notice text={feedback} tone="danger" />
                <Spacer h={space.sm} />
              </>
            ) : null}
            <Row>
              <TextInput
                style={styles.input}
                placeholder="Message"
                placeholderTextColor={colour.fg4}
                value={draft}
                onChangeText={setDraft}
                testID="message-input"
              />
              <Button
                label="Send"
                testID="send-message"
                onPress={() => {
                  const result = sendMessage(app, threadId, draft);
                  if (result.ok) {
                    setDraft('');
                    setFeedback(null);
                  } else {
                    setFeedback(result.reason);
                  }
                }}
              />
            </Row>
          </View>
        )}
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  pad: { padding: space.lg, paddingBottom: space.xl, gap: space.sm },
  bubble: { maxWidth: '80%', padding: space.md, borderRadius: radius.md },
  mine: { alignSelf: 'flex-end', backgroundColor: colour.emDim, borderWidth: 1, borderColor: colour.em },
  theirs: { alignSelf: 'flex-start', backgroundColor: colour.surface, borderWidth: 1, borderColor: colour.hairline },
  system: { alignSelf: 'center', paddingVertical: space.xs },
  composer: {
    padding: space.md,
    borderTopWidth: 1,
    borderTopColor: colour.hairline,
    backgroundColor: colour.ink2,
  },
  input: {
    flex: 1,
    height: 44,
    borderRadius: radius.md,
    backgroundColor: colour.surface,
    borderWidth: 1,
    borderColor: colour.hairline,
    paddingHorizontal: space.md,
    color: colour.fg,
  },
});
