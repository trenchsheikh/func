import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { Stack, useLocalSearchParams, useRouter } from 'expo-router';
import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Avatar } from '../../components/Avatar';
import { Chip } from '../../components/Chip';
import { NeonButton } from '../../components/NeonButton';
import { eventById } from '../../data/events';
import { userById } from '../../data/users';
import { districtName } from '../../data/velmont';
import { costTotal, formatRange } from '../../lib/cost';
import { useDemo } from '../../lib/store';
import { colors, gradientFor, radius, spacing } from '../../lib/theme';

export default function EventModal() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const demo = useDemo();
  const e = eventById(String(id));
  const joined = !!demo.joined[e.id];
  const count = e.attendeeIds.length + (joined ? 1 : 0);
  const [c1, c2] = gradientFor(e.id);
  const total = costTotal(e.costBreakdown);

  return (
    <ScrollView style={styles.root} contentContainerStyle={styles.scroll}>
      <Stack.Screen options={{ title: e.title }} />
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.art}>
        <Text style={styles.artEmoji}>{e.emoji}</Text>
      </LinearGradient>

      <View style={styles.headerBlock}>
        <Text style={styles.title}>{e.title}</Text>
        <Text style={styles.meta}>
          {e.venue} · {districtName(e.district)}
        </Text>
        <View style={styles.chipRow}>
          <Chip label={e.when} tint={colors.accent} />
          <Chip label={`💸 ${formatRange(total.min, total.max)} night`} tint={colors.secondary} />
          <Chip label={`${count} going`} tint={colors.textDim} />
        </View>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>What it is</Text>
        <Text style={styles.body}>{e.description}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>The damage 💸</Text>
        {e.costBreakdown.map((item) => (
          <View key={item.label} style={styles.costRow}>
            <Text style={styles.costEmoji}>{item.emoji}</Text>
            <Text style={styles.costLabel}>{item.label}</Text>
            <Text style={styles.costValue}>
              {item.min === 0 && item.max === 0 ? 'Free' : formatRange(item.min, item.max)}
            </Text>
          </View>
        ))}
        <View style={styles.costDivider} />
        <View style={styles.costRow}>
          <Text style={styles.costEmoji}>🧾</Text>
          <Text style={[styles.costLabel, styles.costTotalLabel]}>All in</Text>
          <Text style={styles.costTotalValue}>{formatRange(total.min, total.max)}</Text>
        </View>
        <Text style={styles.costNote}>Ranges = what people actually spend, tight night → big one.</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Who's going</Text>
        {e.attendeeIds.map((uid) => {
          const u = userById(uid);
          return (
            <Pressable key={uid} style={styles.personRow} onPress={() => router.push(`/person/${uid}`)}>
              <Avatar userId={uid} name={u.name} size={38} verified={u.verified} />
              <View style={{ flex: 1 }}>
                <Text style={styles.personName}>
                  {u.name}, {u.age}
                </Text>
                <Text style={styles.personMeta}>{districtName(u.district)}</Text>
              </View>
              <Ionicons name="chevron-forward" size={16} color={colors.textDim} />
            </Pressable>
          );
        })}
        {joined && (
          <View style={styles.personRow}>
            <Avatar userId="you" name="Jordan" size={38} verified />
            <Text style={styles.personName}>You 🎉</Text>
          </View>
        )}
      </View>

      <NeonButton
        label={joined ? "You're going 🎉" : 'Join event'}
        variant={joined ? 'outline' : 'primary'}
        disabled={joined}
        onPress={() => demo.joinEvent(e.id)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: spacing.lg, gap: spacing.md },
  art: { height: 130, borderRadius: radius.lg, alignItems: 'center', justifyContent: 'center' },
  artEmoji: { fontSize: 52 },
  headerBlock: { gap: 6 },
  title: { color: colors.text, fontSize: 24, fontWeight: '900' },
  meta: { color: colors.textDim, fontSize: 13 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
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
  personRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  personName: { color: colors.text, fontWeight: '700', fontSize: 14 },
  personMeta: { color: colors.textDim, fontSize: 12 },
  costRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  costEmoji: { fontSize: 16, width: 24, textAlign: 'center' },
  costLabel: { color: colors.text, fontSize: 14, flex: 1 },
  costValue: { color: colors.textDim, fontSize: 14, fontWeight: '700' },
  costDivider: { height: 1, backgroundColor: colors.border, marginVertical: 2 },
  costTotalLabel: { fontWeight: '800' },
  costTotalValue: { color: colors.secondary, fontSize: 16, fontWeight: '900' },
  costNote: { color: colors.textDim, fontSize: 11, fontStyle: 'italic', marginTop: 2 },
});
