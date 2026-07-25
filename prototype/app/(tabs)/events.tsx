import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { AvatarStack } from '../../components/AvatarStack';
import { Chip } from '../../components/Chip';
import { events } from '../../data/events';
import { districtName } from '../../data/velmont';
import { nightRange } from '../../lib/cost';
import { useDemo } from '../../lib/store';
import { colors, gradientFor, radius, spacing } from '../../lib/theme';

export default function EventsScreen() {
  const router = useRouter();
  const demo = useDemo();

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title}>Events</Text>
      <Text style={styles.subtitle}>Reasons to leave the house. Day and night.</Text>
      <FlatList
        data={events}
        keyExtractor={(e) => e.id}
        contentContainerStyle={styles.list}
        renderItem={({ item }) => {
          const joined = !!demo.joined[item.id];
          const count = item.attendeeIds.length + (joined ? 1 : 0);
          const [c1, c2] = gradientFor(item.id);
          return (
            <Pressable style={styles.card} onPress={() => router.push(`/event/${item.id}`)}>
              <LinearGradient
                colors={[c1, c2]}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.art}
              >
                <Text style={styles.artEmoji}>{item.emoji}</Text>
                {joined && (
                  <View style={styles.goingBadge}>
                    <Text style={styles.goingText}>You're going 🎉</Text>
                  </View>
                )}
              </LinearGradient>
              <View style={styles.body}>
                <Text style={styles.eventTitle}>{item.title}</Text>
                <Text style={styles.meta}>
                  {item.venue} · {districtName(item.district)}
                </Text>
                <View style={styles.chipRow}>
                  <Chip label={item.when} tint={colors.accent} />
                  <Chip label={`💸 ${nightRange(item.costBreakdown)}`} tint={colors.secondary} />
                </View>
                <View style={styles.attendRow}>
                  <AvatarStack userIds={item.attendeeIds} size={26} max={4} />
                  <Text style={styles.attendText}>{count} going</Text>
                </View>
              </View>
            </Pressable>
          );
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  subtitle: { color: colors.textDim, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: 2, marginBottom: spacing.sm },
  list: { paddingHorizontal: spacing.lg, paddingBottom: spacing.xl, gap: spacing.md },
  card: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
  },
  art: { height: 96, alignItems: 'center', justifyContent: 'center' },
  artEmoji: { fontSize: 40 },
  goingBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    backgroundColor: 'rgba(10,10,15,0.85)',
    borderRadius: radius.pill,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  goingText: { color: colors.success, fontWeight: '800', fontSize: 12 },
  body: { padding: spacing.md, gap: 6 },
  eventTitle: { color: colors.text, fontSize: 17, fontWeight: '800' },
  meta: { color: colors.textDim, fontSize: 12 },
  chipRow: { flexDirection: 'row', gap: 6 },
  attendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginTop: 2 },
  attendText: { color: colors.textDim, fontSize: 12, fontWeight: '600' },
});
