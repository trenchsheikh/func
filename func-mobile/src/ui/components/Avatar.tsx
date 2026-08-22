import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { FuncUser } from '@/domain/types';
import { colors } from '../theme';

/** Monogram avatar. `photo` is `mono:<hex>` in the prototype. */
export function Avatar({ user, size = 36, ring }: { user: FuncUser | undefined; size?: number; ring?: string }) {
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

export function AvatarStack({ users, size = 24, max = 4 }: { users: Array<FuncUser | undefined>; size?: number; max?: number }) {
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
  initial: { color: '#16161a', fontWeight: '700' },
  stack: { flexDirection: 'row', alignItems: 'center' },
  extra: { color: colors.muted, fontSize: 12, marginLeft: 6 },
});
