import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { AccountType, BusinessProfile, PersonalProfile } from '@/domain/types';
import type { PersonSummary } from '@/data/views';
import { colors } from '../theme';

export type AvatarUser = {
  id: string;
  activeProfile: AccountType;
  personalProfile: Pick<PersonalProfile, 'displayName' | 'photo'>;
  businessProfile?: Pick<BusinessProfile, 'venueName'>;
};

/** `PersonSummary` (the view-layer identity shape) -> what `Avatar`/`AvatarStack` expect. */
export function avatarUserOf(person: PersonSummary): AvatarUser {
  return {
    id: person.id,
    activeProfile: person.verifiedBusiness ? 'business' : 'personal',
    personalProfile: { displayName: person.displayName, photo: person.photo },
    ...(person.verifiedBusiness ? { businessProfile: { venueName: person.verifiedBusiness.venueName } } : {}),
  };
}

/** Monogram avatar. `photo` is `mono:<hex>` in the prototype. */
export function Avatar({ user, size = 36, ring }: { user: AvatarUser | undefined; size?: number; ring?: string }) {
  const color = user?.personalProfile.photo.startsWith('mono:')
    ? user.personalProfile.photo.slice(5)
    : colors.surfaceRaised;
  const name = user
    ? user.activeProfile === 'business' && user.businessProfile
      ? user.businessProfile.venueName
      : user.personalProfile.displayName
    : '?';
  const initial = name.trim().charAt(0).toUpperCase();
  return (
    <View
      style={[
        styles.wrap,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ring ? { borderWidth: 2, borderColor: ring } : null,
      ]}
    >
      <Text style={[styles.initial, { fontSize: size * 0.42 }]}>{initial}</Text>
    </View>
  );
}

export function AvatarStack({ users, size = 24, max = 4 }: { users: Array<AvatarUser | undefined>; size?: number; max?: number }) {
  const shown = users.slice(0, max);
  const extra = users.length - shown.length;
  return (
    <View style={styles.stack}>
      {shown.map((u, i) => (
        <View key={u?.id ?? i} style={{ marginLeft: i === 0 ? 0 : -size * 0.35 }}>
          <Avatar user={u} size={size} ring={colors.surface} />
        </View>
      ))}
      {extra > 0 ? <Text style={styles.extra}>+{extra}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', justifyContent: 'center' },
  initial: { color: colors.nearBlack, fontWeight: '700' },
  stack: { flexDirection: 'row', alignItems: 'center' },
  extra: { color: colors.muted, fontSize: 12, marginLeft: 6 },
});
