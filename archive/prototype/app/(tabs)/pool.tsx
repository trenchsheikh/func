import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarStack } from '../../components/AvatarStack';
import { Chip, StatusChip } from '../../components/Chip';
import { NeonButton } from '../../components/NeonButton';
import { groupById } from '../../data/groups';
import { poolInvites } from '../../data/poolInvites';
import { userById } from '../../data/users';
import { districtName } from '../../data/velmont';
import { useDemo } from '../../lib/store';
import { colors, radius, spacing } from '../../lib/theme';

type SubTab = 'browse' | 'inbox';

function ageRange(memberIds: string[]): string {
  const ages = memberIds.map((id) => userById(id).age);
  const lo = Math.min(...ages);
  const hi = Math.max(...ages);
  return lo === hi ? `${lo}` : `${lo}–${hi}`;
}

export default function PoolScreen() {
  const [tab, setTab] = useState<SubTab>('browse');
  const demo = useDemo();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title}>The Pool</Text>
      <Text style={styles.subtitle}>Groups looking for groups. Meet in packs, not alone.</Text>

      <View style={styles.segment}>
        {(['browse', 'inbox'] as const).map((t) => (
          <Pressable
            key={t}
            onPress={() => setTab(t)}
            style={[styles.segmentBtn, tab === t && styles.segmentActive]}
          >
            <Text style={[styles.segmentText, tab === t && styles.segmentTextActive]}>
              {t === 'browse' ? 'Browse' : 'Inbox'}
            </Text>
          </Pressable>
        ))}
      </View>

      {tab === 'browse' ? (
        <FlatList
          data={poolInvites}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const g = groupById(item.groupId);
            const sent = !!demo.sentInvites[g.id];
            return (
              <View style={styles.card}>
                <Pressable style={styles.cardTop} onPress={() => router.push(`/group/${g.id}`)}>
                  <AvatarStack userIds={g.memberIds} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>
                      {g.name} <Text style={styles.ages}>· {ageRange(g.memberIds)}</Text>
                    </Text>
                    <Text style={styles.vibe}>{g.vibe}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={18} color={colors.textDim} />
                </Pressable>
                <Text style={styles.note}>“{item.note}”</Text>
                <View style={styles.chipRow}>
                  <Chip label={districtName(g.district)} tint={colors.primary} />
                  <Chip label={g.night} tint={colors.accent} />
                </View>
                <Text style={styles.lookingFor}>Looking for: {g.lookingFor}</Text>
                <NeonButton
                  label={sent ? 'Invite sent ✓' : 'Send invite'}
                  variant={sent ? 'outline' : 'primary'}
                  disabled={sent}
                  onPress={() => demo.sendInvite(g.id)}
                />
              </View>
            );
          }}
        />
      ) : (
        <FlatList
          data={demo.inbox}
          keyExtractor={(i) => i.id}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const g = groupById(item.groupId);
            return (
              <View style={styles.card}>
                <Pressable style={styles.cardTop} onPress={() => router.push(`/group/${g.id}`)}>
                  <AvatarStack userIds={g.memberIds} size={28} max={3} />
                  <View style={{ flex: 1 }}>
                    <Text style={styles.groupName}>{g.name}</Text>
                    <Text style={styles.vibe}>
                      {item.direction === 'incoming' ? 'Invited your group' : 'You invited them'}
                    </Text>
                  </View>
                  <StatusChip status={item.status} />
                </Pressable>
                <Text style={styles.note}>{item.note}</Text>
                {item.direction === 'incoming' && item.status === 'pending' && (
                  <View style={styles.actionRow}>
                    <NeonButton
                      label="Accept"
                      style={{ flex: 1 }}
                      onPress={() => demo.respond(item.id, 'accepted')}
                    />
                    <NeonButton
                      label="Deny"
                      variant="ghost"
                      style={{ flex: 1 }}
                      onPress={() => demo.respond(item.id, 'denied')}
                    />
                  </View>
                )}
                {item.id === 'i-incoming' && item.status === 'accepted' && (
                  <Text style={styles.linked}>You're linked up 🎉 Plan the night in your group chat.</Text>
                )}
              </View>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  subtitle: { color: colors.textDim, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: 2 },
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: radius.pill,
    margin: spacing.lg,
    marginBottom: spacing.sm,
    padding: 4,
  },
  segmentBtn: { flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: radius.pill },
  segmentActive: { backgroundColor: colors.surfaceHi },
  segmentText: { color: colors.textDim, fontWeight: '700', fontSize: 13 },
  segmentTextActive: { color: colors.text },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  groupName: { color: colors.text, fontWeight: '800', fontSize: 15 },
  ages: { color: colors.textDim, fontWeight: '600', fontSize: 13 },
  vibe: { color: colors.textDim, fontSize: 12, marginTop: 1 },
  note: { color: colors.text, fontSize: 13, lineHeight: 18 },
  chipRow: { flexDirection: 'row', gap: 6 },
  lookingFor: { color: colors.textDim, fontSize: 12 },
  actionRow: { flexDirection: 'row', gap: spacing.sm },
  linked: { color: colors.success, fontWeight: '700', fontSize: 13 },
});
