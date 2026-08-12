/**
 * The big-moment overlay.
 *
 * The top of the animation hierarchy. Small moments get a press spring; *this*
 * is for the handful of things that are genuinely a change in status — a host
 * says yes, a pass lands, you get into something that not everyone gets into.
 *
 * The problem it exists to solve was measured, not assumed: on the pre-reset
 * build, sending a request for a table left the screen **byte-identical**. The
 * table still read "6 of 6 spots left", the button stayed live, nothing moved.
 * The request was recorded correctly — it appeared in Plans — so the product
 * logic was fine and the *moment* was simply missing. Asking a club to hold you
 * a table felt exactly like submitting a form, which is the specific thing the
 * brief says it must never feel like.
 *
 * ## What it does
 *
 * A chrome ring expands out of the centre and dissolves, the content lands with
 * an under-damped spring so it overshoots and settles like an object rather
 * than appearing like a view, and a wash of colour blooms behind it. Colour is
 * passed in by the caller because these moments mean different things: an
 * accepted table is heat, an after-party is violet, a friend arriving is
 * emerald.
 *
 * ## Haptics
 *
 * Deliberately absent. `expo-haptics` is not in the dependency set and adding
 * it needs a native rebuild — see the handover note. Every visual layer of the
 * moment is here and the haptic drops in as one call in `useEffect` when that
 * rebuild happens; it is a genuine gap, not an oversight.
 */

import React, { useCallback, useEffect } from 'react';
import { Pressable, StyleSheet, useWindowDimensions, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, RadialGradient, Stop } from 'react-native-svg';

import { BLANK_CANVAS, colour, spring } from '../theme';

/**
 * How long the ring takes to expand and dissolve. Not a `theme.ts` token —
 * collapsed to near-instant in blank-canvas mode since the ring is a purely
 * decorative flourish, not the confirmation itself (the content underneath
 * still arrives via `spring.arrive`, which is already fast in that mode).
 */
const BLOOM = BLANK_CANVAS ? 120 : 900;

export function Celebrate({
  visible,
  tint = colour.life,
  onClose,
  children,
}: {
  visible: boolean;
  /** What this moment *means*. Heat for a table, violet for afters, emerald for people. */
  tint?: string;
  onClose: () => void;
  children: React.ReactNode;
}): React.JSX.Element | null {
  const { width, height } = useWindowDimensions();

  const enter = useSharedValue(0);
  const ring = useSharedValue(0);

  const close = useCallback(() => onClose(), [onClose]);

  useEffect(() => {
    if (!visible) {
      enter.value = 0;
      ring.value = 0;
      return;
    }
    // Under-damped on purpose: the content overshoots and settles, which is
    // what makes it read as something landing rather than something fading in.
    enter.value = withSpring(1, spring.arrive);
    ring.value = withTiming(1, { duration: BLOOM, easing: Easing.out(Easing.cubic) });
  }, [visible, enter, ring]);

  const contentStyle = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ scale: 0.86 + enter.value * 0.14 }],
  }));

  const ringStyle = useAnimatedStyle(() => ({
    opacity: (1 - ring.value) * 0.9,
    transform: [{ scale: 0.2 + ring.value * 2.6 }],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, enter.value * 1.6),
  }));

  if (!visible) return null;

  const bloom = Math.max(width, height) * 0.9;

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="box-none">
      <Animated.View style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={close} accessibilityLabel="Dismiss" />
      </Animated.View>

      {/* The bloom — a wash of what this moment means, behind everything. */}
      <View style={styles.centre} pointerEvents="none">
        <Svg width={bloom} height={bloom}>
          <Defs>
            <RadialGradient id="celebrate-bloom" cx="50%" cy="50%" r="50%">
              <Stop offset="0%" stopColor={tint} stopOpacity="0.34" />
              <Stop offset="55%" stopColor={tint} stopOpacity="0.08" />
              <Stop offset="100%" stopColor={tint} stopOpacity="0" />
            </RadialGradient>
          </Defs>
          <Circle cx={bloom / 2} cy={bloom / 2} r={bloom / 2} fill="url(#celebrate-bloom)" />
        </Svg>
      </View>

      {/* A single chrome ring expanding out through the content and away. */}
      <Animated.View style={[styles.centre, ringStyle]} pointerEvents="none">
        <View style={[styles.ring, { borderColor: tint }]} />
      </Animated.View>

      <Animated.View style={[styles.centre, contentStyle]} pointerEvents="box-none">
        {children}
      </Animated.View>
    </View>
  );
}

/**
 * A one-shot confirmation that does not take over the screen.
 *
 * The middle rung of the hierarchy: bigger than a press, smaller than a pass.
 * Sending a request earns this — it is a real commitment and must be
 * acknowledged, but it is not yet a yes, so celebrating it would be lying about
 * what just happened.
 */
export function Landed({
  visible,
  onDone,
  children,
  style,
}: {
  visible: boolean;
  onDone: () => void;
  children: React.ReactNode;
  style?: ViewStyle;
}): React.JSX.Element | null {
  const enter = useSharedValue(0);

  useEffect(() => {
    if (!visible) return;
    // One sequence, not two assignments: assigning twice would cancel the
    // spring the instant it started and the thing would only ever fade.
    // Auto-dismisses, because an acknowledgement you have to close is a
    // dialog, and a dialog is the opposite of a moment.
    enter.value = withSequence(
      withSpring(1, spring.snap),
      withDelay(
        // Two lines of text — the table and who you are waiting on — is more
        // than a glance. Under ~2s total it is gone before it has been read,
        // which is barely better than the silence it replaces. (Blank canvas
        // still needs this to be readable, not instant — trimmed, not gutted.)
        BLANK_CANVAS ? 1400 : 2600,
        withTiming(0, { duration: BLANK_CANVAS ? 140 : 260 }, (done) => {
          'worklet';
          // Only on natural completion. A cancelled run (the effect re-firing
          // because `onDone` is a fresh closure each render) must not report
          // itself as finished, or the toast dismisses itself mid-entrance.
          if (done) runOnJS(onDone)();
        }),
      ),
    );
  }, [visible, enter, onDone]);

  const animated = useAnimatedStyle(() => ({
    opacity: enter.value,
    transform: [{ translateY: (1 - enter.value) * 22 }, { scale: 0.94 + enter.value * 0.06 }],
  }));

  if (!visible) return null;

  return (
    <Animated.View style={[styles.landed, animated, style]} pointerEvents="none">
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  /*
   * Fully opaque, not a scrim.
   *
   * Two reasons, and the second is not cosmetic. A pass is meant to be held up
   * to another person — the screen has to be given over to it, not shared with
   * a list of cancelled requests showing through. And `PassCard` paints its
   * die-cut notches in the colour of whatever is behind it; over a translucent
   * scrim there *is* no single colour behind it, so the notches stop reading as
   * holes and start reading as two dark blobs stuck to the card's edges.
   */
  backdrop: { backgroundColor: '#000000' },
  centre: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ring: { width: 180, height: 180, borderRadius: 90, borderWidth: 1.5 },
  landed: {
    position: 'absolute',
    left: 16,
    right: 16,
    bottom: 28,
    alignItems: 'center',
  },
});
