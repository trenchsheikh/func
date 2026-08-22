/**
 * Cold-open test harness — **development only**.
 *
 * The brief on the opening sequence is explicit: *build and test the animation
 * in isolation before integrating it*. This is that isolation.
 *
 * Two modes, because they answer different questions:
 *
 * - **Scrub** holds the timeline at a named beat so it can be inspected and
 *   screenshotted deterministically. Chasing beats on a playing timeline does
 *   not work — the round trip to capture a frame is longer than several of the
 *   beats, so which one you catch is a race, and a race is not verification.
 * - **Play** runs the real thing end to end, at real speed, to judge rhythm.
 *
 * It is deliberately **not reachable from any screen**. Dev tooling does not
 * belong in the user-facing experience, so there is no button, no tab and no
 * link. In a release build it renders a dead screen, so shipping it cannot
 * surface it either.
 *
 * Reach it with:
 *   `xcrun simctl openurl booted func://coldopen`
 */

import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { Easing, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { ColdOpen } from '../src/ui/components/ColdOpen';
import { FuncMark } from '../src/ui/components/FuncMark';
import { colour, radius, space, type as typeScale } from '../src/ui/theme';

/**
 * The beats, as fractions of the whole film.
 *
 * Named rather than evenly spaced: an even sweep wastes most of its frames on
 * the long beats and skips the short ones entirely, which is exactly backwards
 * — the short beats are the ones that are hard to get right.
 */
const BEATS: readonly { at: number; name: string }[] = [
  { at: 0.0, name: 'black' },
  { at: 0.2, name: 'mark arriving' },
  { at: 0.29, name: 'mark at rest' },
  { at: 0.38, name: 'letters retracting' },
  { at: 0.51, name: 'blink' },
  { at: 0.62, name: 'pupil → Earth' },
  { at: 0.78, name: 'Earth grown' },
  { at: 0.9, name: 'dive' },
  { at: 0.97, name: 'handoff' },
];

export default function ColdOpenHarness(): React.JSX.Element {
  // Remounting on a new key restarts the timeline — the film drives itself
  // from one clock started in an effect, so it has no "replay" of its own.
  const [take, setTake] = useState(0);
  const [mode, setMode] = useState<'idle' | 'play' | 'scrub'>('idle');
  const [beat, setBeat] = useState(0);

  // A slow looping specular on the idle mark, so the chrome can be judged in
  // motion rather than as one frozen gradient.
  const idleSweep = useSharedValue(0);
  useEffect(() => {
    idleSweep.value = withRepeat(
      withTiming(1, { duration: 2600, easing: Easing.inOut(Easing.quad) }),
      -1,
      false,
    );
  }, [idleSweep]);

  const play = useCallback(() => {
    setTake((n) => n + 1);
    setMode('play');
  }, []);

  const step = useCallback(() => {
    setTake((n) => n + 1);
    setBeat((b) => (b + 1) % BEATS.length);
    setMode('scrub');
  }, []);

  if (!__DEV__) return <View style={styles.screen} />;

  const current = BEATS[beat] ?? BEATS[0]!;

  return (
    <View style={styles.screen}>
      {mode === 'idle' && (
        <View style={styles.hint}>
          {/* The mark at rest. The film only ever shows it mid-move, so this
              is the only way to judge the lockup itself. */}
          <FuncMark width={300} sweep={idleSweep} />
        </View>
      )}

      {mode === 'play' && <ColdOpen key={`play-${take}`} onDone={() => setMode('idle')} />}
      {mode === 'scrub' && (
        <ColdOpen key={`scrub-${take}`} freezeAt={current.at} onDone={() => {}} />
      )}

      {/* Controls sit above the film — it is `pointerEvents="none"`, so they
          stay reachable even mid-sequence. */}
      <View style={styles.bar} pointerEvents="box-none">
        <Pressable style={styles.button} onPress={step}>
          <Text style={styles.label}>
            {mode === 'scrub' ? `${Math.round(current.at * 100)}% · ${current.name}` : 'Scrub'}
          </Text>
        </Pressable>
        <Pressable style={styles.button} onPress={play}>
          <Text style={styles.label}>Play</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colour.void, alignItems: 'center', justifyContent: 'center' },
  hint: { alignItems: 'center', gap: space.sm },
  bar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 40,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: space.sm,
    zIndex: 1000,
  },
  button: {
    paddingHorizontal: space.lg,
    paddingVertical: space.sm,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colour.hairlineHi,
    backgroundColor: 'rgba(20,20,24,0.9)',
  },
  label: { ...(typeScale.label as object), color: colour.fg2 },
});
