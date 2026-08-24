import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import type { InviteCardView, PersonSummary } from '@/data/views';
import type { PersonDisclosure } from '@/domain/visibility';
import type { Venue } from '@/domain/types';
import { Avatar, AvatarStack, type AvatarUser } from '../components/Avatar';
import { DiscoBall } from '../components/DiscoBall';
import { DiscoBallIcon, LockIcon } from '../components/Icons';
import { categoryColor, colors } from '../theme';
import { useReducedMotion } from '../useReducedMotion';
import { personMarkerTreatment } from './markerTreatment';

/** Fixed box so MarkerView and the schematic renderer agree on hit areas. */
export const PIN_SIZE = 36;

/** `PersonSummary` -> the identity shape `Avatar`/`AvatarStack` expect. */
function avatarUserOf(person: PersonSummary): AvatarUser {
  return {
    id: person.id,
    activeProfile: person.verifiedBusiness ? 'business' : 'personal',
    personalProfile: { displayName: person.displayName, photo: person.photo },
    ...(person.verifiedBusiness ? { businessProfile: { venueName: person.verifiedBusiness.venueName } } : {}),
  };
}

/** Anonymous aggregate energy overlay: no count, person, or identity-bearing affordance. Layered behind a venue's own dot/badge, never replacing it. */
function VenueGlowOverlay() {
  return (
    <View pointerEvents="none" style={styles.glowOverlay}>
      <View style={styles.glowOuter}>
        <View style={styles.glowInner} />
      </View>
    </View>
  );
}

export function VenuePinView({ venue, glow, selected }: { venue: Venue; glow?: boolean; selected?: boolean }) {
  const c = categoryColor(venue.category);
  return (
    <View style={styles.box}>
      {glow ? <VenueGlowOverlay /> : null}
      <View style={[styles.venueDot, { backgroundColor: c }, selected && styles.selectedRing]} />
    </View>
  );
}

export function InvitePinView({ invite, selected }: { invite: InviteCardView; selected?: boolean }) {
  const business = invite.hostedByVerifiedBusiness;
  return (
      <View style={styles.box}>
        <View style={[styles.inviteBadge, selected && styles.selectedRing, business && styles.inviteBusiness]}>
          {invite.access.mode === 'private' ? <LockIcon size={15} color={colors.nearBlack} /> : <DiscoBallIcon size={17} color={colors.nearBlack} />}
        </View>
      </View>
  );
}

function Pulse({ color }: { color: string }) {
  const reduceMotion = useReducedMotion();
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0.7)).current;
  useEffect(() => {
    if (reduceMotion) {
      scale.setValue(1);
      opacity.setValue(0.24);
      return;
    }
    scale.setValue(0.6);
    opacity.setValue(0.7);
    const loop = Animated.loop(
      Animated.parallel([
        Animated.timing(scale, { toValue: 1.6, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0, duration: 1400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [reduceMotion, scale, opacity]);
  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.pulse, { backgroundColor: color, transform: [{ scale }], opacity }]}
    />
  );
}

/** Self or an eligible friend -- disclosure is always 'self' | 'exact' (see `content.ts`), never carries anything beyond what `personDisclosure` already cleared. */
export function PersonPinView({
  person,
  disclosure,
  selected,
}: {
  person: PersonSummary;
  disclosure: Extract<PersonDisclosure, { kind: 'self' | 'exact' }>;
  selected?: boolean;
}) {
  const treatment = personMarkerTreatment(disclosure);
  return (
    <View style={styles.box}>
      {treatment.showHeartbeat ? <Pulse color={colors.dtf} /> : null}
      <View style={[styles.personFrame, selected && styles.selectedHalo]}>
        <Avatar user={avatarUserOf(person)} size={28} ring={treatment.showPremiumRing ? colors.chromeBright : undefined} />
      </View>
    </View>
  );
}

/** A verified business acting account: plain silver disco ball, always -- never the operator's identity. */
export function BusinessPinView({ selected }: { selected?: boolean }) {
  return (
    <View style={styles.box}>
      <View style={selected ? styles.selectedHalo : null}>
        <DiscoBall size={24} tint="silver" />
      </View>
    </View>
  );
}

/**
 * Cluster views: rendered only when a group has more than one pin — a
 * single-pin group always renders via the plain views above, unchanged.
 * None of these are wrapped in `Pressable` by the caller (see
 * MapboxGlobe/SchematicMap); expanding a cluster happens by the user zooming
 * in, not by tapping it.
 */

export function VenueClusterView({ count, glow }: { count: number; glow?: boolean }) {
  return (
    <View style={styles.box}>
      {glow ? <VenueGlowOverlay /> : null}
      <View style={styles.clusterBadge}>
        <Text style={styles.clusterCount}>{count}</Text>
      </View>
    </View>
  );
}

export function InviteClusterView({ count }: { count: number }) {
  return (
    <View style={styles.box}>
      <View style={[styles.clusterBadge, styles.inviteClusterBadge]}>
        <Text style={[styles.clusterCount, styles.inviteClusterCount]}>{count}</Text>
      </View>
    </View>
  );
}

/** Eligible people only (already `personDisclosure`-gated) stacked via the existing AvatarStack treatment. */
export function PersonClusterView({ people, hasHeartbeat }: { people: PersonSummary[]; hasHeartbeat: boolean }) {
  return (
    <View style={styles.box}>
      {hasHeartbeat ? <Pulse color={colors.dtf} /> : null}
      <AvatarStack users={people.map(avatarUserOf)} size={22} max={3} />
    </View>
  );
}

/** Business pins never carry identity and always render this one way, singly or grouped — same as BusinessPinView. */
export function BusinessClusterView() {
  return (
    <View style={styles.box}>
      <DiscoBall size={24} tint="silver" />
    </View>
  );
}

const styles = StyleSheet.create({
  box: { width: PIN_SIZE, height: PIN_SIZE, alignItems: 'center', justifyContent: 'center' },
  venueDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: colors.nearBlack,
  },
  inviteBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.highlightSoft,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.nearBlack,
  },
  inviteBusiness: { backgroundColor: colors.club },
  clusterBadge: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: colors.glassRaised,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.chrome,
  },
  inviteClusterBadge: { backgroundColor: colors.highlightSoft, borderColor: colors.nearBlack },
  clusterCount: { color: colors.text, fontSize: 12, fontWeight: '700' },
  inviteClusterCount: { color: colors.nearBlack },
  pulse: { position: 'absolute', width: 22, height: 22, borderRadius: 11 },
  personFrame: { borderRadius: 17, padding: 1 },
  glowOverlay: { position: 'absolute', alignItems: 'center', justifyContent: 'center' },
  glowOuter: {
    width: 54,
    height: 54,
    borderRadius: 27,
    backgroundColor: 'rgba(34, 197, 94, 0.14)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  glowInner: { width: 30, height: 30, borderRadius: 15, backgroundColor: 'rgba(34, 197, 94, 0.2)' },
  selectedRing: { borderColor: colors.highlight, borderWidth: 2 },
  selectedHalo: { borderRadius: 16, borderWidth: 2, borderColor: colors.highlight, padding: 1 },
});
