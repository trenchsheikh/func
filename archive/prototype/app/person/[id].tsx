import { Ionicons } from '@expo/vector-icons';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { AvatarStack } from '../../components/AvatarStack';
import { Chip } from '../../components/Chip';
import { groupById } from '../../data/groups';
import { userById } from '../../data/users';
import { districtName } from '../../data/velmont';
import { colors, radius, spacing } from '../../lib/theme';

export default function PersonModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const u = userById(String(id));
  const group = u.groupId ? groupById(u.groupId) : null;

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Stack.Screen options={{ title: u.name }} />
      <View style={styles.hero}>
        <Avatar userId={u.id} name={u.name} size={96} verified={u.verified} />
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {u.name}, {u.age}
          </Text>
          {u.verified && <Ionicons name="checkmark-circle" size={20} color={colors.accent} />}
        </View>
        <Text style={styles.meta}>{districtName(u.district)} · Velmont</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>About</Text>
        <Text style={styles.bio}>{u.bio}</Text>
        <View style={styles.chipRow}>
          {u.interests.map((t) => (
            <Chip key={t} label={t} tint={colors.primary} />
          ))}
        </View>
      </View>

      {group && (
        <Pressable style={styles.card} onPress={() => router.push(`/group/${group.id}`)}>
          <Text style={styles.sectionTitle}>Goes out with</Text>
          <View style={styles.groupRow}>
            <AvatarStack userIds={group.memberIds} size={28} />
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.meta}>{group.vibe}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </View>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: 'center', gap: 4 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.sm },
  name: { color: colors.text, fontSize: 22, fontWeight: '900' },
  meta: { color: colors.textDim, fontSize: 12 },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionTitle: { color: colors.textDim, fontSize: 11, fontWeight: '800', letterSpacing: 1.2, textTransform: 'uppercase' },
  bio: { color: colors.text, fontSize: 14, lineHeight: 20 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  groupRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupName: { color: colors.text, fontWeight: '800', fontSize: 15 },
});
