import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, TextInput, View } from 'react-native';
import { useRepository, useSnapshot } from '@/data/DataContext';
import { groupById, groupLead, hostDisplayName, myGroup, partySizeOf } from '@/data/selectors';
import { accessLabel, capacityLabel, isFull, relationTo, seatsLeft, seatsTaken } from '@/domain/pool';
import type { PoolInvite } from '@/domain/types';
import { colors, radius, space } from '../theme';
import { whenLabel } from '../time';
import { AvatarStack } from './Avatar';
import { Body, Button, Pill, Row, Small } from './Primitives';

/** Deterministic "cover image" stand-in: a colour block + glyph per invite. */
const COVERS = ['#3b2f5c', '#4a2c2c', '#23414a', '#4a3a1e', '#2c4a36', '#3f2c4a', '#2c3a4a'];
const GLYPHS = ['🪩', '🌃', '🎤', '🍸', '🌅', '🎧', '🔥', '🍕'];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

export function InviteCover({ invite, size = 64, radiusOverride }: { invite: PoolInvite; size?: number; radiusOverride?: number }) {
  const h = hash(invite.id);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radiusOverride ?? radius.md,
        backgroundColor: COVERS[h % COVERS.length],
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <Text style={{ fontSize: size * 0.45 }}>{GLYPHS[h % GLYPHS.length]}</Text>
    </View>
  );
}

/** Who's going — attendee leads as an avatar stack with a count. */
export function GoingStack({ invite }: { invite: PoolInvite }) {
  const snap = useSnapshot();
  const leads = invite.attendeeGroupIds.map((g) => groupLead(snap, g));
  const people = seatsTaken(invite, partySizeOf(snap)) + partySizeOf(snap)(invite.hostGroupId);
  return (
    <Row gap={6}>
      <AvatarStack users={leads} size={22} />
      <Small>{people} going</Small>
    </Row>
  );
}

export function InviteMeta({ invite }: { invite: PoolInvite }) {
  const snap = useSnapshot();
  const left = seatsLeft(invite, partySizeOf(snap));
  return (
    <Row gap={6} style={{ flexWrap: 'wrap' }}>
      <Pill label={accessLabel(invite)} color={invite.access.mode === 'private' ? colors.bar : colors.chrome} />
      <Pill label={left == null ? capacityLabel(invite) : left === 0 ? 'Full' : `${left} left · ${capacityLabel(invite)}`} />
      {invite.createdByAccountType === 'business' ? <Pill label="Venue" color={colors.club} /> : null}
    </Row>
  );
}

/** Partiful-style list card: cover, title, who's going. */
export function InviteCard({ invite, onPress }: { invite: PoolInvite; onPress?: () => void }) {
  const snap = useSnapshot();
  const router = useRouter();
  const now = new Date();
  return (
    <View style={styles.card}>
      <Row gap={space.md} style={{ alignItems: 'flex-start' }}>
        <InviteCover invite={invite} />
        <View style={{ flex: 1, gap: 6 }}>
          <Body numberOfLines={2} style={{ fontWeight: '600' }}>{invite.description}</Body>
          <Small>
            by {hostDisplayName(snap, invite)}
            {invite.startsAt ? ` · ${whenLabel(invite.startsAt, now)}` : ''}
          </Small>
          <GoingStack invite={invite} />
          <InviteMeta invite={invite} />
        </View>
      </Row>
      <Button
        small
        variant="secondary"
        label="Open"
        style={{ marginTop: space.md, alignSelf: 'flex-start' }}
        onPress={onPress ?? (() => router.push({ pathname: '/invite/[id]', params: { id: invite.id } }))}
      />
    </View>
  );
}

/**
 * The join / request-to-join control. Public → joins immediately (subject to
 * cap). Private → creates a pending request, optionally with a message the
 * host sees before accepting.
 */
export function InviteActions({ invite, compact }: { invite: PoolInvite; compact?: boolean }) {
  const repo = useRepository();
  const snap = useSnapshot();
  const router = useRouter();
  const gid = myGroup(snap).id;
  const rel = relationTo(invite, gid);
  const [partySize, setPartySize] = useState(Math.max(1, groupById(snap, gid)?.memberUserIds.length ?? 1));
  const [message, setMessage] = useState('');
  const [composing, setComposing] = useState(false);
  const full = isFull(invite, partySizeOf(snap), partySize);

  const openChat = () => router.push({ pathname: '/thread/[id]', params: { id: invite.groupChatId } });

  if (rel === 'host') {
    const pending = invite.requests.filter((r) => r.status === 'pending').length;
    return (
      <Row gap={space.sm}>
        <Button small={compact} label="Group chat" variant="secondary" onPress={openChat} style={{ flex: 1 }} />
        {invite.access.mode === 'private' ? (
          <Button
            small={compact}
            label={pending ? `Review ${pending}` : 'Requests'}
            onPress={() => router.push({ pathname: '/review/[id]', params: { id: invite.id } })}
            style={{ flex: 1 }}
          />
        ) : null}
      </Row>
    );
  }
  if (rel === 'attending') {
    return (
      <Row gap={space.sm}>
        <Pill label="You're in" color={colors.dtf} filled />
        <Button small={compact} label="Group chat" variant="secondary" onPress={openChat} style={{ flex: 1 }} />
      </Row>
    );
  }
  if (rel === 'requested') {
    return <Pill label="Requested — waiting on the host" color={colors.casual} />;
  }
  if (rel === 'denied') {
    return <Pill label="Host said not tonight" color={colors.muted} />;
  }

  const sizeStepper = (
    <Row gap={space.sm}>
      <Small>Party of</Small>
      <Button small variant="ghost" label="−" onPress={() => setPartySize((n) => Math.max(1, n - 1))} />
      <Body style={{ minWidth: 18, textAlign: 'center' }}>{partySize}</Body>
      <Button small variant="ghost" label="+" onPress={() => setPartySize((n) => Math.min(12, n + 1))} />
    </Row>
  );

  if (invite.access.mode === 'public') {
    return (
      <View style={{ gap: space.sm }}>
        {!compact ? sizeStepper : null}
        <Button
          small={compact}
          label={full ? 'Full' : compact ? 'Join' : `Join · party of ${partySize}`}
          variant="success"
          disabled={full}
          onPress={() => {
            const r = repo.joinInvite(invite.id, partySize);
            if (!r.ok) Alert.alert('Could not join', r.reason);
          }}
        />
      </View>
    );
  }

  // private
  return (
    <View style={{ gap: space.sm }}>
      {!compact ? sizeStepper : null}
      {composing || !compact ? (
        <TextInput
          value={message}
          onChangeText={setMessage}
          placeholder="Message for the host (optional) — e.g. we’re bringing drinks"
          placeholderTextColor={colors.faint}
          style={styles.input}
          multiline
        />
      ) : null}
      <Row gap={space.sm}>
        {compact && !composing ? (
          <Button small variant="ghost" label="Add message" onPress={() => setComposing(true)} />
        ) : null}
        <Button
          small={compact}
          label="Request to join"
          style={{ flex: 1 }}
          onPress={() => {
            const r = repo.requestToJoin(invite.id, partySize, message);
            if (!r.ok) Alert.alert('Could not request', r.reason);
          }}
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: space.md,
  },
  input: {
    backgroundColor: colors.surfaceRaised,
    color: colors.text,
    borderRadius: radius.md,
    padding: space.md,
    minHeight: 44,
    fontSize: 14,
  },
});
