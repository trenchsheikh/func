import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import React, { useRef, useState } from 'react';
import {
  Animated,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  useWindowDimensions,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Avatar } from '../../components/Avatar';
import { Chip } from '../../components/Chip';
import { NeonButton } from '../../components/NeonButton';
import { datingCards } from '../../data/datingProfiles';
import { userById, YOU_ID } from '../../data/users';
import { districtName } from '../../data/velmont';
import { useDemo } from '../../lib/store';
import { colors, gradientFor, radius, spacing } from '../../lib/theme';

const SWIPE_THRESHOLD = 110;

export default function DatingScreen() {
  const [index, setIndexState] = useState(0);
  const [matchedId, setMatchedId] = useState<string | null>(null);
  const demo = useDemo();
  const router = useRouter();
  const { width } = useWindowDimensions();
  const position = useRef(new Animated.ValueXY()).current;

  // The PanResponder below is created once, so it must reach handlers through refs —
  // capturing `index` directly would freeze the deck on card 1.
  const indexRef = useRef(0);
  const setIndex = (i: number) => {
    indexRef.current = i;
    setIndexState(i);
  };

  const card = datingCards[index];
  const nextCard = datingCards[index + 1];

  const advance = (liked: boolean) => {
    const current = datingCards[indexRef.current];
    position.setValue({ x: 0, y: 0 });
    setIndex(indexRef.current + 1);
    if (liked && current?.alwaysMatch) {
      demo.addMatch(current.userId);
      setMatchedId(current.userId);
    }
  };

  const swipeAway = (liked: boolean) => {
    Animated.timing(position, {
      toValue: { x: liked ? width * 1.2 : -width * 1.2, y: 30 },
      duration: 220,
      useNativeDriver: false,
    }).start(() => advance(liked));
  };

  const swipeAwayRef = useRef(swipeAway);
  swipeAwayRef.current = swipeAway;

  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_e, g) => Math.abs(g.dx) > 8,
      onPanResponderMove: (_e, g) => position.setValue({ x: g.dx, y: g.dy * 0.4 }),
      onPanResponderRelease: (_e, g) => {
        if (g.dx > SWIPE_THRESHOLD) swipeAwayRef.current(true);
        else if (g.dx < -SWIPE_THRESHOLD) swipeAwayRef.current(false);
        else
          Animated.spring(position, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
      },
    })
  ).current;

  const rotate = position.x.interpolate({
    inputRange: [-width, 0, width],
    outputRange: ['-12deg', '0deg', '12deg'],
  });
  const likeOpacity = position.x.interpolate({
    inputRange: [20, SWIPE_THRESHOLD],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });
  const nopeOpacity = position.x.interpolate({
    inputRange: [-SWIPE_THRESHOLD, -20],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const matchedUser = matchedId ? userById(matchedId) : null;
  const you = userById(YOU_ID);

  return (
    <SafeAreaView style={styles.root} edges={['top']}>
      <Text style={styles.title}>Dating</Text>
      <Text style={styles.subtitle}>People out in Velmont this week.</Text>

      <View style={styles.deck}>
        {!card ? (
          <View style={styles.empty}>
            <Text style={styles.emptyEmoji}>🌃</Text>
            <Text style={styles.emptyTitle}>That's everyone nearby</Text>
            <Text style={styles.emptyText}>Check back tomorrow — Velmont never stays quiet for long.</Text>
            <NeonButton label="Start over (demo)" variant="outline" onPress={() => setIndex(0)} />
          </View>
        ) : (
          <>
            {nextCard && <ProfileCard userId={nextCard.userId} style={styles.behindCard} />}
            <Animated.View
              style={[
                styles.animatedCard,
                { transform: [{ translateX: position.x }, { translateY: position.y }, { rotate }] },
              ]}
              {...pan.panHandlers}
            >
              <ProfileCard userId={card.userId} />
              <Animated.View style={[styles.stamp, styles.likeStamp, { opacity: likeOpacity }]}>
                <Text style={[styles.stampText, { color: colors.success }]}>YES</Text>
              </Animated.View>
              <Animated.View style={[styles.stamp, styles.nopeStamp, { opacity: nopeOpacity }]}>
                <Text style={[styles.stampText, { color: colors.danger }]}>NOPE</Text>
              </Animated.View>
            </Animated.View>
          </>
        )}
      </View>

      {card && (
        <View style={styles.controls}>
          <Pressable style={[styles.controlBtn, { borderColor: colors.danger }]} onPress={() => swipeAway(false)}>
            <Ionicons name="close" size={30} color={colors.danger} />
          </Pressable>
          <Pressable style={[styles.controlBtn, { borderColor: colors.success }]} onPress={() => swipeAway(true)}>
            <Ionicons name="heart" size={28} color={colors.success} />
          </Pressable>
        </View>
      )}

      {/* Match overlay — the reliable pitch moment */}
      {matchedUser && (
        <View style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(10,10,15,0.96)', 'rgba(88,28,135,0.96)']} style={styles.matchOverlay}>
            <Text style={styles.matchKicker}>⚡ IT'S A MATCH ⚡</Text>
            <View style={styles.matchAvatars}>
              <Avatar userId={you.id} name={you.name} size={92} verified />
              <View style={{ marginLeft: -18 }}>
                <Avatar userId={matchedUser.id} name={matchedUser.name} size={92} verified />
              </View>
            </View>
            <Text style={styles.matchText}>
              You and {matchedUser.name} both want tonight to happen.
            </Text>
            <View style={{ gap: spacing.sm, alignSelf: 'stretch' }}>
              <NeonButton
                label="Send a message"
                onPress={() => {
                  const id = matchedUser.id;
                  setMatchedId(null);
                  router.push(`/chat/${id}`);
                }}
              />
              <NeonButton label="Keep swiping" variant="ghost" onPress={() => setMatchedId(null)} />
            </View>
          </LinearGradient>
        </View>
      )}
    </SafeAreaView>
  );
}

function ProfileCard({ userId, style }: { userId: string; style?: object }) {
  const u = userById(userId);
  const [c1, c2] = gradientFor(userId);
  return (
    <View style={[styles.card, style]}>
      <LinearGradient colors={[c1, c2]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.photo}>
        <Text style={styles.photoInitial}>{u.name.charAt(0)}</Text>
      </LinearGradient>
      <View style={styles.cardBody}>
        <View style={styles.nameRow}>
          <Text style={styles.name}>
            {u.name}, {u.age}
          </Text>
          <Ionicons name="checkmark-circle" size={18} color={colors.accent} />
        </View>
        <Text style={styles.district}>{districtName(u.district)}</Text>
        <View style={styles.chipRow}>
          {u.interests.map((tag) => (
            <Chip key={tag} label={tag} tint={colors.primary} />
          ))}
        </View>
        <Text style={styles.bio} numberOfLines={2}>
          {u.bio}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  title: { color: colors.text, fontSize: 26, fontWeight: '900', paddingHorizontal: spacing.lg, paddingTop: spacing.sm },
  subtitle: { color: colors.textDim, fontSize: 13, paddingHorizontal: spacing.lg, marginTop: 2 },
  deck: { flex: 1, margin: spacing.lg, marginBottom: spacing.sm },
  animatedCard: { ...StyleSheet.absoluteFillObject },
  behindCard: { ...StyleSheet.absoluteFillObject, transform: [{ scale: 0.96 }], opacity: 0.6 },
  card: {
    flex: 1,
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    overflow: 'hidden',
    userSelect: 'none', // web: stop drags text-selecting the card
  },
  photo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  photoInitial: { fontSize: 96, fontWeight: '900', color: 'rgba(255,255,255,0.85)' },
  cardBody: { padding: spacing.md, gap: 6 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  name: { color: colors.text, fontSize: 20, fontWeight: '900' },
  district: { color: colors.textDim, fontSize: 12 },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  bio: { color: colors.textDim, fontSize: 13, lineHeight: 18 },
  stamp: {
    position: 'absolute',
    top: 24,
    borderWidth: 3,
    borderRadius: radius.sm,
    paddingHorizontal: 10,
    paddingVertical: 2,
    transform: [{ rotate: '-12deg' }],
  },
  likeStamp: { left: 20, borderColor: colors.success },
  nopeStamp: { right: 20, borderColor: colors.danger, transform: [{ rotate: '12deg' }] },
  stampText: { fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingBottom: spacing.md,
  },
  controlBtn: {
    width: 62,
    height: 62,
    borderRadius: 31,
    borderWidth: 2,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing.sm, padding: spacing.lg },
  emptyEmoji: { fontSize: 44 },
  emptyTitle: { color: colors.text, fontSize: 18, fontWeight: '800' },
  emptyText: { color: colors.textDim, fontSize: 13, textAlign: 'center', marginBottom: spacing.sm },
  matchOverlay: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.lg },
  matchKicker: { color: colors.accent, fontSize: 24, fontWeight: '900', letterSpacing: 2 },
  matchAvatars: { flexDirection: 'row' },
  matchText: { color: colors.text, fontSize: 15, textAlign: 'center' },
});
