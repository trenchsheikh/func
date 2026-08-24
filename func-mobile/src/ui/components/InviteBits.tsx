import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';
import { useCommands, useView } from '@/data/DataContext';
import type { InviteCardView, PersonSummary } from '@/data/views';
import { distanceKm, formatDistanceKm } from '@/domain/geo';
import { accessLabel, capacityLabel } from '@/domain/pool';
import { viewerLocation } from '@/ui/viewerGeo';
import { colors, radius, space } from '../theme';
import { whenLabel } from '../time';
import { AvatarStack, avatarUserOf } from './Avatar';
import { InviteCoverIcon, type InviteCoverVariant } from './Icons';
import { Body, Button, GlassCard, Pill, Row, Small } from './Primitives';

/** Deterministic "cover image" stand-in: a colour block + glyph per invite. */
const COVERS = ['#3b2f5c', '#4a2c2c', '#23414a', '#4a3a1e', '#2c4a36', '#3f2c4a', '#2c3a4a'];
const COVER_VARIANTS: InviteCoverVariant[] = ['discoball', 'city', 'mic', 'cocktail', 'sunrise', 'headphones', 'spark', 'pizza'];

function hash(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

function coverVisual(invite: { id: string }): { color: string; variant: InviteCoverVariant } {
  const h = hash(invite.id);
  return { color: COVERS[h % COVERS.length]!, variant: COVER_VARIANTS[h % COVER_VARIANTS.length]! };
}

export function InviteCover({ invite, size = 64, radiusOverride }: { invite: { id: string }; size?: number; radiusOverride?: number }) {
  const { color, variant } = coverVisual(invite);
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radiusOverride ?? radius.md,
        backgroundColor: color,
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      <InviteCoverIcon variant={variant} size={size * 0.52} color={colors.highlightSoft} />
    </View>
  );
}

/**
 * Edge-to-edge hero banner for InviteCard — its own section above the text,
 * never behind or over it. Purely decorative (the description/host/timing
 * text already carries the same information), so it's hidden from screen
 * readers rather than announced as an unlabeled icon.
 */
function InviteCardBanner({ invite }: { invite: { id: string } }) {
  const { color, variant } = coverVisual(invite);
  return (
    <View
      style={[styles.banner, { backgroundColor: color }]}
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <InviteCoverIcon variant={variant} size={40} color={colors.highlightSoft} />
    </View>
  );
}

/**
 * Who's going — a count always; an avatar stack only when the caller has
 * attendee identities to show (host/attending detail views). Card-level
 * browsing never gets attendee identities, only the count `viewFor` disclosed.
 */
export function GoingStack({ invite, leads }: { invite: InviteCardView; leads?: readonly PersonSummary[] }) {
  return (
    <Row gap={6}>
      {leads && leads.length ? <AvatarStack users={leads.map(avatarUserOf)} size={22} /> : null}
      <Small>{invite.goingCount} going</Small>
    </Row>
  );
}

export function InviteMeta({ invite }: { invite: InviteCardView }) {
  const left = invite.seatsLeft;
  return (
    <Row gap={6} style={{ flexWrap: 'wrap' }}>
      <Pill label={accessLabel(invite)} color={invite.access.mode === 'private' ? colors.bar : colors.chrome} />
      <Pill label={left == null ? capacityLabel(invite) : left === 0 ? 'Full' : `${left} left · ${capacityLabel(invite)}`} />
      {invite.hostedByVerifiedBusiness ? <Pill label="Venue" color={colors.club} /> : null}
    </Row>
  );
}

/**
 * Information-first glass/chrome event card: edge-to-edge hero banner, then
 * name → host/timing/distance → safe social proof → capacity/access → the
 * existing open action. Used in Discover rows, the venue detail's nearby
 * list, and the map's tap-to-preview card.
 */
export function InviteCard({ invite, onPress }: { invite: InviteCardView; onPress?: () => void }) {
  const view = useView();
  const router = useRouter();
  const now = new Date();
  const myLocation = viewerLocation(view);
  const distance =
    myLocation && invite.where.kind === 'exact' ? formatDistanceKm(distanceKm(myLocation, invite.where.location)) : null;
  return (
    <GlassCard style={styles.card}>
      <InviteCardBanner invite={invite} />
      <View style={{ gap: 6 }}>
        <Body numberOfLines={2} style={{ fontWeight: '600' }}>{invite.description}</Body>
        <Small>
          by {invite.host.displayName}
          {invite.startsAt ? ` · ${whenLabel(invite.startsAt, now)}` : ''}
          {distance ? ` · ${distance}` : ''}
        </Small>
        <GoingStack invite={invite} />
        <InviteMeta invite={invite} />
      </View>
      <Button
        small
        variant="secondary"
        label="Open"
        style={{ marginTop: space.md, alignSelf: 'flex-start' }}
        onPress={onPress ?? (() => router.push({ pathname: '/invite/[id]', params: { id: invite.id } }))}
      />
    </GlassCard>
  );
}

/**
 * The join / request-to-join control. Public → joins immediately (subject to
 * cap). Private → creates a pending request, optionally with a message the
 * host sees before accepting.
 */
export function InviteActions({ invite, compact }: { invite: InviteCardView; compact?: boolean }) {
  const commands = useCommands();
  const view = useView();
  const router = useRouter();
  const rel = invite.viewer.relation;
  const [partySize, setPartySize] = useState(Math.max(1, view.self.party.size));
  const [message, setMessage] = useState('');
  const [composing, setComposing] = useState(false);
  const full = invite.seatsLeft != null && invite.seatsLeft < partySize;

  // Note: the group chat's thread id lives only on `InviteDetailView.plan`
  // (host/attending only), not on the card-level `InviteCardView` this
  // component actually receives -- so "open the chat" is offered from the
  // invite detail screen itself, not fabricated here from the invite id.
  if (rel === 'host') {
    return (
      <Row gap={space.sm}>
        {invite.access.mode === 'private' ? (
          <Button
            small={compact}
            label="Requests"
            onPress={() => router.push({ pathname: '/review/[id]', params: { id: invite.id } })}
            style={{ flex: 1 }}
          />
        ) : null}
        <Button small={compact} label="Open invite" variant="secondary" onPress={() => router.push({ pathname: '/invite/[id]', params: { id: invite.id } })} style={{ flex: 1 }} />
      </Row>
    );
  }
  if (rel === 'attending') {
    return (
      <Row gap={space.sm}>
        <Pill label="You're in" color={colors.dtf} filled />
        <Button small={compact} label="Open invite" variant="secondary" onPress={() => router.push({ pathname: '/invite/[id]', params: { id: invite.id } })} style={{ flex: 1 }} />
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
            const r = commands.joinInvite(invite.id, partySize);
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
            const r = commands.requestToJoin(invite.id, partySize, message);
            if (!r.ok) Alert.alert('Could not request', r.reason);
          }}
        />
      </Row>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { padding: space.md, overflow: 'hidden' },
  banner: {
    height: 96,
    marginTop: -space.md,
    marginHorizontal: -space.md,
    marginBottom: space.sm,
    alignItems: 'center',
    justifyContent: 'center',
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
