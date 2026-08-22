import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Chip } from '../../components/Chip';
import { NeonButton } from '../../components/NeonButton';
import { groupById } from '../../data/groups';
import { userById } from '../../data/users';
import { districtName } from '../../data/velmont';
import { useDemo } from '../../lib/store';
import { colors, radius, spacing } from '../../lib/theme';

export default function GroupModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const demo = useDemo();
  const g = groupById(String(id));
  const isYours = g.id === 'g-you';
  const sent = !!demo.sentInvites[g.id];

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Stack.Screen options={{ title: g.name }} />
      <View style={styles.hero}>
        <Text style={styles.name}>{g.name}</Text>
        <Text style={styles.vibe}>{g.vibe}</Text>
        <View style={styles.chipRow}>
          <Chip label={districtName(g.district)} tint={colors.primary} />
          <Chip label={g.night} tint={colors.accent} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Looking for</Text>
        <Text style={styles.body}>{g.lookingFor}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Members</Text>
        {g.memberIds.map((mid) => {
          const m = userById(mid);
          return (
            <Pressable key={mid} style={styles.memberRow} onPress={() => router.push(`/person/${mid}`)}>
              <Avatar userId={mid} name={m.name} size={40} verified={m.verified} />
              <View style={{ flex: 1 }}>
                <Text style={styles.memberName}>
                  {m.name}, {m.age}
                </Text>
                <Text style={styles.memberMeta}>{districtName(m.district)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </Pressable>
          );
        })}
      </View>

      {!isYours && (
        <NeonButton
          label={sent ? 'Invite sent ✓' : `Invite ${g.name} to link up`}
          variant={sent ? 'outline' : 'primary'}
          disabled={sent}
          onPress={() => demo.sendInvite(g.id)}
        />
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: 'center', gap: 6 },
  name: { color: colors.text, fontSize: 24, fontWeight: '900' },
  vibe: { color: colors.textDim, fontSize: 13, textAlign: 'center' },
  chipRow: { flexDirection: 'row', gap: 6, marginTop: 4 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  body: { color: colors.text, fontSize: 14, lineHeight: 20 },
  memberRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  memberName: { color: colors.text, fontWeight: '700', fontSize: 14 },
  memberMeta: { color: colors.textDim, fontSize: 12 },
});
