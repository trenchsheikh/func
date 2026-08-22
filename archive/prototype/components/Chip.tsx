import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius } from '../lib/theme';
import { InboxStatus } from '../data/types';

export function Chip({ label, tint = colors.textDim }: { label: string; tint?: string }) {
  return (
    <View style={[styles.chip, { borderColor: tint }]}>
      <Text style={[styles.text, { color: tint }]}>{label}</Text>
    </View>
  );
}

const STATUS_STYLE: Record<InboxStatus, { label: string; tint: string }> = {
  pending: { label: 'Pending', tint: '#FBBF24' },
  accepted: { label: 'Accepted', tint: colors.success },
  denied: { label: 'Denied', tint: colors.danger },
};

export function StatusChip({ status }: { status: InboxStatus }) {
  const s = STATUS_STYLE[status];
  return <Chip label={s.label} tint={s.tint} />;
}

const styles = StyleSheet.create({
  chip: {
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 3,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '700', letterSpacing: 0.3 },
});
