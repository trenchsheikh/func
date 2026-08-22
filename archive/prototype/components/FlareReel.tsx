import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import React, { useEffect, useRef, useState } from 'react';
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Story } from '../data/types';
import { userById } from '../data/users';
import { colors, radius, spacing } from '../lib/theme';

function ago(minutes: number): string {
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.round(minutes / 60)}h ago`;
}

interface Props {
  stories: Story[];
  venueName: string;
  costLabel: string;
  onClose: () => void;
  onCallIt: () => void;
  onPoolUsIn?: () => void;
}

// The reel — a full-screen ephemeral-story viewer anchored to a venue (Map v3 spec
// §2.5). You are watching the PLACE, not one author: clips auto-advance through
// everyone's Flares. Every reel ends on a "Go" beat — Call It or Pool us in.
export function FlareReel({ stories, venueName, costLabel, onClose, onCallIt, onPoolUsIn }: Props) {
  const [index, setIndex] = useState(0);
  const [hyped, setHyped] = useState<Record<string, boolean>>({});
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const story = stories[index];
  const insets = useSafeAreaInsets();
  // Tap zones must dodge the real header/footer, whatever the device's notch or
  // home-indicator area turns out to be — measured, never guessed.
  const [headerH, setHeaderH] = useState(0);
  const [footerH, setFooterH] = useState(0);
  const onHeaderLayout = (e: LayoutChangeEvent) => setHeaderH(e.nativeEvent.layout.height);
  const onFooterLayout = (e: LayoutChangeEvent) => setFooterH(e.nativeEvent.layout.height);

  useEffect(() => {
    if (!story) return;
    timer.current = setTimeout(() => {
      setIndex((i) => (i < stories.length - 1 ? i + 1 : i));
    }, 3200);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [index, story, stories.length]);

  if (!story) return null;
  const author = userById(story.authorId);

  return (
    <View style={[StyleSheet.absoluteFill, { zIndex: 50 }]}>
      <LinearGradient colors={[...story.gradient]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />

      <View onLayout={onHeaderLayout} style={{ paddingTop: insets.top }}>
        <View style={styles.progressRow}>
          {stories.map((s, i) => (
            <View key={s.id} style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: i < index ? '100%' : i === index ? '100%' : '0%' }]} />
            </View>
          ))}
        </View>

        <View style={styles.header}>
          <View style={{ flex: 1 }}>
            <Text style={styles.venueName}>{venueName}</Text>
            <Text style={styles.meta}>
              {author.name} · {ago(story.minutesAgo)}
            </Text>
          </View>
          <View style={styles.costChip}>
            <Text style={styles.costChipText}>{costLabel}</Text>
          </View>
          <Pressable onPress={onClose} hitSlop={10} style={{ marginLeft: spacing.sm }}>
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </Pressable>
        </View>
      </View>

      {/* tap zones: left = prev, right = next — dodges the measured header/footer */}
      {headerH > 0 && footerH > 0 && (
        <View style={[styles.tapZones, { top: headerH, bottom: footerH }]} pointerEvents="box-none">
          <Pressable style={{ flex: 1 }} onPress={() => setIndex((i) => Math.max(0, i - 1))} />
          <Pressable style={{ flex: 2 }} onPress={() => (index < stories.length - 1 ? setIndex(index + 1) : onClose())} />
        </View>
      )}

      <View style={styles.captionWrap} pointerEvents="none">
        <Text style={styles.caption}>{story.caption}</Text>
      </View>

      <View onLayout={onFooterLayout} style={[styles.actionBar, { paddingBottom: insets.bottom + spacing.sm }]}>
        <Pressable style={styles.actionBtn} onPress={onCallIt}>
          <Text style={styles.actionEmoji}>📣</Text>
          <Text style={styles.actionLabel}>Call It</Text>
        </Pressable>
        {onPoolUsIn && (
          <Pressable style={styles.actionBtn} onPress={onPoolUsIn}>
            <Text style={styles.actionEmoji}>👯</Text>
            <Text style={styles.actionLabel}>Pool us in</Text>
          </Pressable>
        )}
        <Pressable
          style={styles.actionBtn}
          onPress={() => setHyped((h) => ({ ...h, [story.id]: !h[story.id] }))}
        >
          <Text style={styles.actionEmoji}>{hyped[story.id] ? '🔥' : '🧯'}</Text>
          <Text style={styles.actionLabel}>Hype</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressRow: { flexDirection: 'row', gap: 4, paddingTop: spacing.sm, paddingHorizontal: spacing.md },
  progressTrack: { flex: 1, height: 2.5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.3)', overflow: 'hidden' },
  progressFill: { height: '100%', backgroundColor: '#FFFFFF' },
  header: { flexDirection: 'row', alignItems: 'center', padding: spacing.md, paddingTop: spacing.sm },
  venueName: { color: '#FFFFFF', fontWeight: '900', fontSize: 15 },
  meta: { color: 'rgba(255,255,255,0.8)', fontSize: 12, marginTop: 2 },
  costChip: { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4 },
  costChipText: { color: '#FFFFFF', fontSize: 12, fontWeight: '700' },
  tapZones: { position: 'absolute', left: 0, right: 0, flexDirection: 'row' },
  captionWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: spacing.xl },
  caption: { color: '#FFFFFF', fontSize: 30, fontWeight: '800', textAlign: 'center', textShadowColor: 'rgba(0,0,0,0.35)', textShadowRadius: 12 },
  actionBar: { flexDirection: 'row', paddingHorizontal: spacing.md, gap: spacing.sm },
  actionBtn: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(0,0,0,0.35)',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm + 2,
  },
  actionEmoji: { fontSize: 20 },
  actionLabel: { color: '#FFFFFF', fontSize: 11, fontWeight: '700' },
});
