import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { userById } from '../data/users';
import { colors } from '../lib/theme';
import { Avatar } from './Avatar';

interface Props {
  userIds: string[];
  size?: number;
  max?: number;
}

export function AvatarStack({ userIds, size = 32, max = 4 }: Props) {
  const shown = userIds.slice(0, max);
  const extra = userIds.length - shown.length;

  return (
    <View style={styles.row}>
      {shown.map((id, i) => {
        const u = userById(id);
        return (
          <View key={id} style={{ marginLeft: i === 0 ? 0 : -size * 0.3, zIndex: shown.length - i }}>
            <View style={[styles.ring, { borderRadius: (size + 4) / 2 }]}>
              <Avatar userId={id} name={u.name} size={size} />
            </View>
          </View>
        );
      })}
      {extra > 0 && (
        <View
          style={[
            styles.more,
            { width: size, height: size, borderRadius: size / 2, marginLeft: -size * 0.3 },
          ]}
        >
          <Text style={styles.moreText}>+{extra}</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center' },
  ring: { borderWidth: 2, borderColor: colors.bg },
  more: {
    backgroundColor: colors.surfaceHi,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.bg,
    zIndex: 0,
  },
  moreText: { color: colors.textDim, fontSize: 11, fontWeight: '700' },
});
