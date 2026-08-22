/**
 * The cold open.
 *
 * The storyboard, verbatim from the founder's direction and unchanged since
 * `team/standing-orders.md` recorded it on 2026-08-07:
 *
 *   pure black → the chrome mark appears → the letters retract into the pupil
 *   → the eye blinks → the pupil becomes Earth → Earth expands toward the
 *   viewer → we dive from space into the launch city → the live func map.
 *
 * ## How it is built, and why this way
 *
 * One master clock (`t`, in milliseconds) runs on the UI thread via
 * Reanimated, and every beat derives its own transforms from it. This is the
 * same shape as a `requestAnimationFrame` timeline, which matters because the
 * sequence is genuinely *choreographed* — beats overlap deliberately (the
 * globe starts growing while the eye is still fading) and that is far easier
 * to express and tune against one clock than as a chain of chained callbacks.
 *
 * Nothing here touches the JS thread once it starts, so the film cannot be
 * stuttered by the app booting behind it — which it is, at exactly the same
 * moment.
 *
 * **The blink uses `scaleY` on the lids, not path morphing.** Collapsing the
 * two lid arcs toward the eye's centre line reads as a lid closing and needs
 * only a transform; animating the path `d` would need per-frame string
 * interpolation for no visible gain.
 *
 * **The dive is not faked.** The last beat hands the move to MapLibre — see
 * `../coldOpen.ts`. The film fades out while the real map is already flying in
 * from orbit, so there is no cut between the film and the product.
 *
 * ## Deliberately not implemented
 *
 * The storyboard's first beat is "app launches from the home screen". That
 * transition belongs to iOS and is drawn by iOS; faking a home screen would
 * also mean drawing other companies' icons. The film starts at the black the
 * OS hands us, which is the same frame the user actually sees.
 */

import React, { useCallback, useEffect, useState } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Defs, Ellipse, G, Path, RadialGradient, Stop } from 'react-native-svg';

import { signalArrival } from '../coldOpen';
import { timing } from '../theme';
import {
  ChromeDefs,
  LETTERS_LEFT,
  LETTERS_RIGHT,
  LID_BOTTOM,
  LID_TOP,
  MARK_VIEWBOX,
  PERSON_BODY,
  PUPIL,
} from './FuncMark';

const AnimatedG = Animated.createAnimatedComponent(G);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

// --- The timeline -----------------------------------------------------------

const B = timing.coldOpen;
const T0 = B.hold; // black
const T1 = T0 + B.mark; // the mark has resolved
const T2 = T1 + B.retract; // letters are inside the pupil
const T3 = T2 + B.blink; // the eye has blinked
const T4 = T3 + B.become; // the pupil is Earth
const T5 = T4 + B.grow; // Earth fills the frame
const TOTAL = T5 + B.dive; // we are through the atmosphere

/** Smoothstep. */
const ease = (p: number): number => {
  'worklet';
  return p * p * (3 - 2 * p);
};

/** Cubic ease-out — for things arriving. */
const easeOut = (p: number): number => {
  'worklet';
  return 1 - Math.pow(1 - p, 3);
};

const clamp01 = (n: number): number => {
  'worklet';
  return n < 0 ? 0 : n > 1 ? 1 : n;
};

/** Progress through a beat, clamped either side. */
const beat = (t: number, from: number, to: number): number => {
  'worklet';
  return clamp01((t - from) / (to - from));
};

/**
 * Geometric (log-space) interpolation between two scales.
 *
 *     geom(a, b, k) = a · (b/a)^k
 *
 * **Scale must never be interpolated linearly.** Perceived zoom is
 * logarithmic — going 1×→2× and 50×→100× are the same *visual* event — so a
 * linear ramp of radius reads as decelerating badly: it rushes at the start and
 * crawls at the end, exactly the opposite of a dive. Interpolating linearly in
 * log space makes the perceived zoom rate constant, and raising `k` to a power
 * then makes it accelerate on purpose.
 *
 * This is the same principle behind Van Wijk & Nuij's smooth-zoom formulation,
 * which is what MapLibre's own `flyTo` uses internally — so matching it here is
 * also what keeps the overlay and the real map camera on the *same curve*
 * through the handoff, instead of cross-fading two different ones.
 */
const geom = (a: number, b: number, k: number): number => {
  'worklet';
  return a * Math.pow(b / a, k);
};

export function ColdOpen({
  onDone,
  speed = 1,
  freezeAt,
}: {
  onDone: () => void;
  /**
   * Playback rate. Only the dev harness passes anything but 1 — a 4.6s film
   * cannot be judged beat by beat from screenshots at full speed, and slowing
   * the clock is the honest way to inspect it (every easing curve and overlap
   * stays exactly as it ships, just stretched).
   */
  speed?: number;
  /**
   * Hold the timeline at a fixed position, 0–1, instead of playing.
   *
   * Chasing beats with sleeps does not work: the round trip to capture a
   * screenshot is longer than several of the beats, so which frame you get is
   * a race. Freezing makes every beat reproducible, which is the difference
   * between tuning this and guessing at it. Harness only.
   */
  freezeAt?: number;
}): React.JSX.Element | null {
  const { width, height } = useWindowDimensions();
  const [gone, setGone] = useState(false);

  const t = useSharedValue(0);
  const sweep = useSharedValue(0);

  const finish = useCallback(() => {
    setGone(true);
    onDone();
  }, [onDone]);

  const arrive = useCallback(() => {
    signalArrival();
  }, []);

  useEffect(() => {
    if (freezeAt !== undefined) {
      t.value = freezeAt * TOTAL;
      // The specular is tied to the mark's own beats, so scrub it in step.
      sweep.value = clamp01((freezeAt * TOTAL - T0) / (T2 - T0 + 200));
      return;
    }
    const rate = speed > 0 ? speed : 1;
    t.value = withTiming(TOTAL, { duration: TOTAL / rate, easing: Easing.linear }, (done) => {
      'worklet';
      if (done) runOnJS(finish)();
    });
    // The specular runs its own slower pass across the mark while the mark is
    // on screen — a light source moving over metal, not tied to the beats.
    sweep.value = withTiming(1, {
      duration: (T2 - T0 + 200) / rate,
      easing: Easing.inOut(Easing.quad),
    });
  }, [t, sweep, finish, speed, freezeAt]);

  // Fire the map's arrival shot slightly *before* the dive, so MapLibre is
  // already moving by the time the film clears. A reaction, not animated props
  // — `useAnimatedProps` only runs when it is attached to a component, so
  // using it purely for a side effect would silently never fire.
  const fired = useSharedValue(0);
  useAnimatedReaction(
    () => t.value,
    (now) => {
      if (fired.value === 0 && now >= T5 - 260) {
        fired.value = 1;
        runOnJS(arrive)();
      }
    },
  );

  /*
   * Where the pupil actually lands on screen.
   *
   * The mark's artboard is centred on the display, so its *artboard centre*
   * sits at the screen centre — but the pupil is not at the artboard centre
   * (it is at 222,76 in a 404×170 box, i.e. right of and well above middle).
   * Assuming screen centre put the planet visibly off the eye it was supposed
   * to be growing out of, which breaks the one continuity the whole sequence
   * depends on. Project the pupil properly instead.
   */
  const markScale = (width * 0.78) / MARK_VIEWBOX.width;
  const pupilScreen = {
    x: width / 2 + (PUPIL.x - MARK_VIEWBOX.width / 2) * markScale,
    y: height / 2 + (PUPIL.y - MARK_VIEWBOX.height / 2) * markScale,
  };

  // --- Beat 2: the mark resolves --------------------------------------------
  const markStyle = useAnimatedStyle(() => {
    const p = beat(t.value, T0, T1);
    const e = easeOut(p);
    // Fades up while settling the last few points — it arrives, it does not
    // slide in.
    return {
      opacity: p <= 0 ? 0 : e,
      transform: [{ translateY: (1 - e) * 14 }, { scale: 0.965 + e * 0.035 }],
    };
  });

  // --- Beat 3: the letters retract into the pupil ---------------------------
  //
  // Note on the transform props below: these are react-native-svg's discrete
  // `scale` / `originX` / `originY` props, **not** a `transform` string.
  // A transform *string* set through `animatedProps` silently does nothing —
  // animated props are written straight to the native shadow node and skip the
  // parser that turns `"translate(…) scale(…)"` into a matrix. It fails
  // quietly, which is exactly how a blink can look like a fade. Setting an
  // origin also removes the hand-rolled fixed-point maths entirely.
  const lettersProps = useAnimatedProps(() => {
    const e = ease(beat(t.value, T1, T2));
    // Scaling about the pupil *is* the retraction — every stroke converges on
    // the head rather than on the middle of the artboard.
    return {
      opacity: 1 - e,
      scale: 1 - e,
      originX: PUPIL.x,
      originY: PUPIL.y,
    };
  });

  // --- Beat 4: the blink -----------------------------------------------------
  const lidsProps = useAnimatedProps(() => {
    const p = beat(t.value, T2, T3);
    // Down then up: a real blink, not a fade.
    const k = p < 0.5 ? 1 - p * 2 : (p - 0.5) * 2;
    // Once the globe takes over, the lids leave for good.
    const out = 1 - beat(t.value, T3 + B.become * 0.45, T4);
    return {
      opacity: out,
      scaleY: k,
      originX: PUPIL.x,
      originY: PUPIL.y,
    };
  });

  const personProps = useAnimatedProps(() => {
    // The person goes with the blink — the pupil is about to stop being a
    // pupil, and a figure standing inside a planet reads as a mistake.
    const e = beat(t.value, T2, T2 + B.blink * 0.55);
    return { opacity: 1 - e };
  });

  const pupilProps = useAnimatedProps(() => {
    const e = beat(t.value, T3, T3 + B.become * 0.5);
    return { opacity: 1 - e };
  });

  // --- Beats 5–7: the pupil becomes Earth, grows, and we dive ---------------
  const worldStyle = useAnimatedStyle(() => {
    const born = beat(t.value, T3, T4);
    if (born <= 0) return { opacity: 0, transform: [{ scale: 0 }] };

    // The pupil's on-screen radius is where the planet starts, so the swap is
    // a continuation of one object rather than a replacement of two.
    const startR = PUPIL.r * markScale;
    const grow = ease(beat(t.value, T4, T5));
    const dive = beat(t.value, T5, TOTAL);

    const bornR = geom(startR, Math.min(width, height) * 0.3, easeOut(born));
    const grownR = geom(bornR, Math.min(width, height) * 0.92, grow);
    // Quadratic *in log space*: the zoom rate itself accelerates, which is what
    // separates falling toward a planet from zooming in on a picture of one.
    const r = geom(grownR, Math.max(width, height) * 9, dive * dive);

    return {
      opacity: born < 1 ? born : 1 - clamp01(dive * 1.25),
      transform: [{ scale: r / GLOBE_R }, { rotate: `${-8 * grow - 10 * dive}deg` }],
    };
  });

  // The screen bleaches toward atmosphere as we come through it.
  const atmosphereStyle = useAnimatedStyle(() => {
    const dive = beat(t.value, T5, TOTAL);
    return { opacity: dive * dive * 0.55 };
  });

  // The whole film clears, revealing the map already flying in beneath.
  const overlayStyle = useAnimatedStyle(() => {
    const out = beat(t.value, TOTAL - B.dive * 0.55, TOTAL);
    return { opacity: 1 - out };
  });

  if (gone) return null;

  return (
    <Animated.View style={[StyleSheet.absoluteFill, styles.overlay, overlayStyle]} pointerEvents="none">
      {/* The world. Sits underneath the mark so the pupil covers it until the
          moment it becomes it. */}
      <Animated.View
        style={[
          styles.centred,
          { left: pupilScreen.x - GLOBE_SIZE / 2, top: pupilScreen.y - GLOBE_SIZE / 2 },
          worldStyle,
        ]}
      >
        <Globe />
      </Animated.View>

      {/* The mark. */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.centre, markStyle]}>
        <Svg
          width={width * 0.78}
          height={width * 0.78 * (MARK_VIEWBOX.height / MARK_VIEWBOX.width)}
          viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}
        >
          <ChromeDefs sweep={sweep} />

          {/* f u c . — the parts that retract. */}
          <AnimatedG animatedProps={lettersProps}>
            <G stroke="url(#fm-chrome)" {...strokeCommon}>
              <Path d={LETTERS_LEFT} />
              <Path d={LETTERS_RIGHT} />
            </G>
            <G stroke="url(#fm-sweep)" {...strokeCommon}>
              <Path d={LETTERS_LEFT} />
              <Path d={LETTERS_RIGHT} />
            </G>
          </AnimatedG>

          {/* The eye. */}
          <AnimatedG animatedProps={lidsProps}>
            <G stroke="url(#fm-chrome)" {...strokeCommon}>
              <Path d={LID_TOP} />
              <Path d={LID_BOTTOM} />
            </G>
            <G stroke="url(#fm-sweep)" {...strokeCommon}>
              <Path d={LID_TOP} />
              <Path d={LID_BOTTOM} />
            </G>
          </AnimatedG>

          {/* The person — the head is the pupil. */}
          <AnimatedG animatedProps={personProps}>
            <G stroke="url(#fm-chrome)" {...strokeCommon} strokeWidth={7}>
              <Path d={PERSON_BODY} />
            </G>
          </AnimatedG>
          <AnimatedCircle
            cx={PUPIL.x}
            cy={PUPIL.y}
            r={PUPIL.r}
            fill="url(#fm-pearl)"
            animatedProps={pupilProps}
          />
        </Svg>
      </Animated.View>

      {/* Coming through the atmosphere. */}
      <Animated.View style={[StyleSheet.absoluteFill, styles.atmosphere, atmosphereStyle]} />
    </Animated.View>
  );
}

// ---------------------------------------------------------------------------
// The globe
//
// Authored in a fixed 240×240 box and scaled as one object, so ocean, land,
// graticule and city lights stay in register no matter how large it gets.
// ---------------------------------------------------------------------------

/** The sphere's radius in artboard units, and the scale reference for the film. */
const GLOBE_R = 120;
/**
 * The canvas is larger than the sphere because the atmosphere ring extends to
 * r=146. Drawing it in a 240-unit box clipped the halo flat against the edge,
 * which killed the sense of a body with air around it.
 */
const GLOBE_SIZE = 300;

function Globe(): React.JSX.Element {
  return (
    <Svg width={GLOBE_SIZE} height={GLOBE_SIZE} viewBox="-30 -30 300 300">
      <Defs>
        {/*
          Lit hard from the upper left and falling off to a genuinely black
          limb. The terminator is what makes this a sphere rather than a blue
          disc, and it has to be *steep* — a gentle falloff reads as a
          schoolroom globe, which is the opposite of the intent. func is a
          night product; most of the planet it opens on should be in darkness.
        */}
        <RadialGradient id="co-ocean" cx="34%" cy="28%" r="76%">
          <Stop offset="0%" stopColor="#BFEBFF" />
          <Stop offset="18%" stopColor="#4FA8E0" />
          <Stop offset="42%" stopColor="#1A5F9E" />
          <Stop offset="66%" stopColor="#082B4C" />
          <Stop offset="86%" stopColor="#02101F" />
          <Stop offset="100%" stopColor="#000509" />
        </RadialGradient>
        <RadialGradient id="co-atmo" cx="50%" cy="50%" r="50%">
          <Stop offset="74%" stopColor="#7FD4FF" stopOpacity="0" />
          <Stop offset="90%" stopColor="#7FD4FF" stopOpacity="0.5" />
          <Stop offset="97%" stopColor="#9FE0FF" stopOpacity="0.22" />
          <Stop offset="100%" stopColor="#7FD4FF" stopOpacity="0" />
        </RadialGradient>
        {/* A specular bloom where the sun actually hits. */}
        <RadialGradient id="co-spec" cx="30%" cy="24%" r="26%">
          <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0.5" />
          <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
        </RadialGradient>
        {/* The night side, laid over everything so city light reads through. */}
        <RadialGradient id="co-night" cx="34%" cy="28%" r="76%">
          <Stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <Stop offset="55%" stopColor="#000000" stopOpacity="0" />
          <Stop offset="100%" stopColor="#000000" stopOpacity="0.55" />
        </RadialGradient>
      </Defs>

      <Circle cx="120" cy="120" r="146" fill="url(#co-atmo)" />
      <Circle cx="120" cy="120" r="120" fill="url(#co-ocean)" />

      {/* Land. Stylised, not cartographic — enough silhouette to read as Earth
          at a glance, which is all it is on screen for. Kept dark and low
          contrast: land is a shadow on a lit ocean, not a green continent. */}
      <G fill="#163A2C" opacity={0.82}>
        <Path d="M62 52c12-13 32-16 44-6 10 8 7 23 0 30-6 7-4 17-11 22-10 6-20-3-25-12-8-14-18-26-8-34Z" />
        <Path d="M103 115c11-6 18 2 16 14-3 15-10 29-15 39-5 8-13 2-11-10 4-16 3-35 10-43Z" />
        <Path d="M154 60c11-3 18 7 13 18-6 13-11 30-16 43-5 12-13 7-11-7 4-18 7-46 14-54Z" />
        <Path d="M77 31c8-4 17 0 14 7-2 6-12 7-17 4-4-4-2-10 3-11Z" />
        <Path d="M172 140c9-4 15 3 11 12-4 8-12 14-17 11-5-4-3-19 6-23Z" />
      </G>

      {/* Graticule — a faint instrument overlay. func looks at the world
          through something, it does not just show a picture of it. */}
      <G fill="none" stroke="#BFE6FF" strokeOpacity={0.14} strokeWidth={0.8}>
        <Circle cx="120" cy="120" r="120" />
        <Ellipse cx="120" cy="120" rx="120" ry="40" />
        <Ellipse cx="120" cy="120" rx="120" ry="82" />
        <Ellipse cx="120" cy="120" rx="40" ry="120" />
        <Ellipse cx="120" cy="120" rx="82" ry="120" />
      </G>

      {/* Night falls across the sphere before the lights go on, so the lights
          are the brightest thing left on the dark side. */}
      <Circle cx="120" cy="120" r="120" fill="url(#co-night)" />
      <Circle cx="120" cy="120" r="120" fill="url(#co-spec)" />

      {/*
        Cities, on the night side where they can actually be seen. The bright
        one with the halo is the launch city — it is the point the dive is
        aimed at, so it has to be findable in the frame before the dive starts.
      */}
      <G>
        <Circle cx="150" cy="150" r="18" fill="#FFD9A0" opacity={0.16} />
        <Circle cx="150" cy="150" r="7" fill="#FFE7BE" opacity={0.4} />
        <Circle cx="150" cy="150" r="2.6" fill="#FFF6E4" />
        <Circle cx="168" cy="168" r="1.7" fill="#FFE7BE" opacity={0.75} />
        <Circle cx="136" cy="171" r="1.5" fill="#FFE7BE" opacity={0.6} />
        <Circle cx="176" cy="140" r="1.4" fill="#FFE7BE" opacity={0.5} />
        <Circle cx="158" cy="186" r="1.2" fill="#FFE7BE" opacity={0.45} />
      </G>
    </Svg>
  );
}

const strokeCommon = {
  fill: 'none',
  strokeWidth: 7.5,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

const styles = StyleSheet.create({
  overlay: { backgroundColor: '#000000', zIndex: 999 },
  centre: { alignItems: 'center', justifyContent: 'center' },
  centred: { position: 'absolute', width: GLOBE_SIZE, height: GLOBE_SIZE },
  atmosphere: { backgroundColor: '#CFEBFF' },
});
