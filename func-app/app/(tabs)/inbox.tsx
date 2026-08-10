/**
 * Inbox — anything that needs you.
 *
 * Covers both hats at once: requests waiting on you as an after-party host, and
 * requests waiting on any business this account is. The prototype keyed the
 * host queue off a business id only, so a person hosting an after-party saw an
 * empty inbox while people waited on them.
 */

import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';

import type { AccessRequest } from '../../src/domain';
import {
  Button,
  Card,
  Empty,
  H1,
  H2,
  Label,
  Notice,
  Row,
  Screen,
  Small,
  Spacer,
} from '../../src/ui/components/kit';
import { useApp } from '../../src/ui/state/AppProvider';
import { acceptRequest, declineRequest, type ActionResult } from '../../src/ui/state/actions';
import {
  awaitingMyDecision,
  displayName,
  myBusinesses,
} from '../../src/ui/state/selectors';
import { threadsFor } from '../../src/domain/threads';
import { space } from '../../src/ui/theme';

export default function InboxScreen(): React.JSX.Element {
  const app = useApp();
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);

  const waiting = awaitingMyDecision(app);
  const businesses = myBusinesses(app);
  const threads = app.meId ? threadsFor(app.state.threads, app.meId) : [];

  const show = (result: ActionResult) => setFeedback(result.ok ? null : result.reason);

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.pad}>
        <H1>Inbox</H1>
        <Spacer h={space.xs} />
        <Small>Anything that needs you.</Small>

        {feedback ? (
          <>
            <Spacer h={space.md} />
            <Notice text={feedback} tone="danger" />
          </>
        ) : null}

        <Spacer h={space.xl} />
        <Label>Waiting on you</Label>
        <Spacer h={space.sm} />
        {waiting.length === 0 ? (
          <Small>Nothing to decide.</Small>
        ) : (
          waiting.map((request) => (
            <Card key={request.id as string} style={styles.item}>
              <H2>{displayName(app.state, request.guestId as string)}</H2>
              <Small>
                {request.partySize} {request.partySize === 1 ? 'person' : 'people'} · {targetLabel(app, request)}
              </Small>
              <Spacer h={space.md} />
              <Row>
                <Button
                  label="Accept"
                  onPress={() => show(acceptRequest(app, request))}
                  style={styles.flex}
                  testID={`accept-${request.id}`}
                />
                <Button
                  label="Not this time"
                  variant="ghost"
                  onPress={() => show(declineRequest(app, request, null))}
                  style={styles.flex}
                  testID={`decline-${request.id}`}
                />
              </Row>
            </Card>
          ))
        )}

        {businesses.length > 0 && (
          <>
            <Spacer h={space.xl} />
            <Label>Your business</Label>
            <Spacer h={space.sm} />
            {businesses.map((business) => (
              <Card key={business.id as string} style={styles.item}>
                <H2>{business.name}</H2>
                <Small>
                  {business.venueIds.length} {business.venueIds.length === 1 ? 'venue' : 'venues'}
                </Small>
                <Spacer h={space.md} />
                <Button label="Open dashboard" variant="ghost" onPress={() => router.push('/business')} />
              </Card>
            ))}
          </>
        )}

        <Spacer h={space.xl} />
        <Label>Messages</Label>
        <Spacer h={space.sm} />
        {threads.length === 0 ? (
          <Small>Nothing here. Threads appear when you request something.</Small>
        ) : (
          threads.map((thread) => {
            const request = app.state.requests.find((r) => r.id === thread.requestId);
            const other = thread.participantIds.find((id) => id !== app.meId);
            return (
              <Card key={thread.id as string} style={styles.item}>
                <Row>
                  <View style={styles.flex}>
                    <H2>{other ? displayName(app.state, other as string) : 'Thread'}</H2>
                    <Small>{request ? targetLabel(app, request) : ''}</Small>
                  </View>
                  <Button
                    label={thread.status === 'closed' ? 'Read' : 'Open'}
                    variant="ghost"
                    onPress={() => router.push(`/thread/${thread.id}`)}
                    testID={`open-thread-${thread.id}`}
                  />
                </Row>
              </Card>
            );
          })
        )}

        {waiting.length === 0 && threads.length === 0 && businesses.length === 0 && (
          <>
            <Spacer h={space.xxl} />
            <Empty title="All clear" body="func only interrupts you for something you started." />
          </>
        )}
      </ScrollView>
    </Screen>
  );
}

function targetLabel(app: ReturnType<typeof useApp>, request: AccessRequest): string {
  if (request.kind === 'after') {
    const after = app.state.afterParties.find((a) => a.id === request.afterId);
    return after ? `your place · ${after.area}` : 'after-party';
  }
  const table = app.state.tables.find((t) => t.id === request.tableId);
  const venue = request.venueId ? app.places.venueByIdSync(request.venueId) : null;
  return [venue?.name, table?.name].filter(Boolean).join(' · ') || 'table';
}

const styles = StyleSheet.create({
  pad: { padding: space.lg, paddingTop: space.xxl + space.lg, paddingBottom: space.xxl },
  flex: { flex: 1 },
  item: { marginBottom: space.sm },
});
