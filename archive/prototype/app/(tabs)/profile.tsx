import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { AvatarStack } from '../../components/AvatarStack';
import { Chip } from '../../components/Chip';
import { groupById } from '../../data/groups';
import { userById, YOU_ID } from '../../data/users';
import { districtName } from '../../data/velmont';
import { useDemo } from '../../lib/store';
import { colors, radius, spacing } from '../../lib/theme';

export default function ProfileScreen() {
  const you = userById(YOU_ID);
  const group = groupById('g-you');
  const demo = useDemo();
  const router = useRouter();

  const eventsJoined = 12 + Object.values(demo.joined).filter(Boolean).length;
  const poolMeets = 5 + demo.inbox.filter((i) => i.status === 'accepted').length;

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.hero}>
          <Avatar userId={you.id} name={you.name} size={96} verified />
          <Text style={styles.name}>
            {you.name}, {you.age}
          </Text>
          <Text style={styles.meta}>{districtName(you.district)} · Velmont</Text>
          <View style={styles.publicNote}>
            <Ionicons name="eye-outline" size={13} color={colors.textDim} />
            <Text style={styles.publicText}>This is what others see</Text>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.bio}>{you.bio}</Text>
          <View style={styles.chipRow}>
            {you.interests.map((tag) => (
              <Chip key={tag} label={tag} tint={colors.primary} />
            ))}
          </View>
        </View>

        <Pressable style={styles.card} onPress={() => router.push('/group/g-you')}>
          <Text style={styles.sectionTitle}>Your group</Text>
          <View style={styles.groupRow}>
            <AvatarStack userIds={group.memberIds} />
            <View style={{ flex: 1 }}>
              <Text style={styles.groupName}>{group.name}</Text>
              <Text style={styles.groupVibe}>{group.vibe}</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
          </View>
        </Pressable>

        <View style={styles.badgeRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeNum}>{eventsJoined}</Text>
            <Text style={styles.badgeLabel}>events attended</Text>
          </View>
          <View style={styles.badge}>
            <Text style={styles.badgeNum}>{poolMeets}</Text>
            <Text style={styles.badgeLabel}>pool meets</Text>
          </View>
          <View style={styles.badge}>
            <Ionicons name="shield-checkmark" size={22} color={colors.accent} />
            <Text style={styles.badgeLabel}>ID verified</Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  hero: { alignItems: 'center', gap: 6, marginTop: spacing.sm },
  name: { color: colors.text, fontSize: 24, fontWeight: '900', marginTop: spacing.sm },
  meta: { color: colors.textDim, fontSize: 13 },
  publicNote: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  publicText: { color: colors.textDim, fontSize: 12, fontStyle: 'italic' },
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
  groupVibe: { color: colors.textDim, fontSize: 12 },
  badgeRow: { flexDirection: 'row', gap: spacing.sm },
  badge: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.md,
    alignItems: 'center',
    paddingVertical: spacing.md,
    gap: 4,
  },
  badgeNum: { color: colors.text, fontSize: 20, fontWeight: '900' },
  badgeLabel: { color: colors.textDim, fontSize: 11, textAlign: 'center' },
});
