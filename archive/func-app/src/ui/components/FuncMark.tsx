/**
 * The func mark.
 *
 * The chrome **`func`** lockup, with the eye-and-person replacing the "n",
 * authored as vectors against the written description in
 * `team/standing-orders.md` (2026-08-07, second pass).
 *
 * ## The name is `func` — never `func.`
 *
 * Founder instruction, confirmed 2026-08-12. There is **no trailing full
 * stop**, in the mark or anywhere else. `func-app/HANDOVER.md` §7 carried this
 * as an open judgment call ("`func`, no trailing full stop. Unconfirmed") and
 * it is now settled. An earlier pass of this file drew a stop after the `c`;
 * it has been removed, and the artboard re-centred around what is left.
 *
 * ## The construction
 *
 * Everything lives in one 404×170 space with the eye centred at (222, 76) and
 * the letters sitting on a 126 baseline. That single alignment is what makes
 * the opening film possible: the letters can retract *into* the pupil because
 * the pupil is a real point in the same coordinate space, not a separate asset
 * that has to be lined up by eye.
 *
 * - `f` `u` — chrome line-art, round caps, drawn as strokes rather than filled
 *   letterforms so the retraction reads as the mark disassembling rather than
 *   shapes shrinking.
 * - The **eye** replaces the `n`: two arcs meeting at (178, 76) and (266, 76),
 *   rising to the `f`'s ascender height so it holds the `n`'s slot rather than
 *   floating above the word.
 * - The **person** is the pupil: the head *is* the pupil disc, arms raised into
 *   the eye's upper lid, legs coming down to the baseline to form the stem the
 *   `n` would have had. Someone in a crowd with their hands up, inside an eye.
 * - `c` closes the lockup. There is no full stop — the name is `func`.
 *
 * ## Why it is not flat
 *
 * A single grey stroke reads as plastic. Two things fix that, and both are
 * required — the brief rules out a "flat SVG-looking logo" explicitly:
 *
 * 1. `chrome.stops` is a seven-stop sweep — highlight, falloff, a hard dark
 *    band, a blown specular, falloff again. That stop *pattern* is what the eye
 *    reads as polished metal.
 * 2. A second copy of every stroke is drawn on top, painted with a moving
 *    transparent→white→transparent gradient. Because it is the same geometry,
 *    the highlight is clipped to the glyph strokes for free — no mask needed —
 *    and it travels across the mark like a light source passing over metal.
 */

import React from 'react';
import Animated, { useAnimatedProps, type SharedValue } from 'react-native-reanimated';
import Svg, { Circle, Defs, G, LinearGradient, Path, Stop } from 'react-native-svg';

import { chrome } from '../theme';

/**
 * The lockup's coordinate space.
 *
 * Sized so the drawn mark is optically centred on its own midpoint without any
 * path needing an offset — which matters because the film transforms
 * sub-groups independently, and a wrapper translation would have to be undone
 * inside every one of them.
 *
 * The glyphs span x≈70 (the `f`'s crossbar, plus its round cap) to x≈334 (the
 * `c`'s terminal), centring on 202. Hence 404.
 */
export const MARK_VIEWBOX = { width: 404, height: 170 } as const;

/** Where the pupil sits. The film retracts the letters to exactly this point. */
export const PUPIL = { x: 222, y: 76, r: 14 } as const;

const STROKE = 7.5;

/**
 * The metrics every glyph is cut against.
 *
 * Baseline 126, x-height top 86, ascender 40. The eye rises to ascender height
 * and the person's legs land on the baseline, so the eye-and-person together
 * occupy exactly the slot an `n` would — that is what makes it read as a word
 * rather than as a logo with a picture dropped into the middle of it.
 */

/** `f` and `u` — everything left of the eye. */
export const LETTERS_LEFT =
  'M94 126V58c0-14 10-21 22-18 M74 86h40 M134 86v22c0 11 8 18 18 18s18-7 18-18V86 M170 86v40';

/** `c` — everything right of the eye. */
export const LETTERS_RIGHT = 'M330 98c-5-9-13-14-23-14-15 0-25 11-25 24s10 24 25 24c10 0 18-5 23-14';

/**
 * The eye's two lids, open. Spans x 178→266 and rises to y=46 — the same
 * height as the `f`'s ascender, which is what gives the lockup its silhouette.
 */
export const LID_TOP = 'M178 76q44-60 88 0';
export const LID_BOTTOM = 'M178 76q44 60 88 0';

/**
 * The little person: the head *is* the pupil, arms raised into the eye, legs
 * coming down to the baseline to form the stem the `n` would have had.
 *
 * The arms leave the body below the pupil and rise to pupil-centre height at
 * ±24, comfortably outside the pupil's own radius — otherwise they disappear
 * behind the head and the figure loses its raised-hands read entirely.
 */
export const PERSON_BODY = 'M222 90v18 M222 107l-13 19 M222 107l13 19 M222 94l-24-18 M222 94l24-18';

const AnimatedLinearGradient = Animated.createAnimatedComponent(LinearGradient);

/**
 * The chrome gradient definitions.
 *
 * Split out because both the static mark and the opening film need identical
 * paint; the film simply drives `sweep` while the static mark leaves it null.
 */
export function ChromeDefs({ sweep }: { sweep?: SharedValue<number> | undefined }): React.JSX.Element {
  // A band roughly a third of the mark wide, travelling left to right. Values
  // run outside 0..1 at both ends so the highlight fully enters and fully
  // leaves rather than appearing and vanishing at the edges.
  const sweepProps = useAnimatedProps(() => {
    const t = sweep ? sweep.value : 0;
    const x = -0.4 + t * 1.8;
    return { x1: x, x2: x + 0.4 };
  });

  return (
    <Defs>
      <LinearGradient id="fm-chrome" x1="0" y1="0" x2="0.35" y2="1">
        {chrome.stops.map((s) => (
          <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
        ))}
      </LinearGradient>

      <AnimatedLinearGradient
        id="fm-sweep"
        gradientUnits="objectBoundingBox"
        y1="0"
        y2="0.6"
        animatedProps={sweepProps}
      >
        <Stop offset="0%" stopColor="#FFFFFF" stopOpacity="0" />
        <Stop offset="50%" stopColor="#FFFFFF" stopOpacity="0.9" />
        <Stop offset="100%" stopColor="#FFFFFF" stopOpacity="0" />
      </AnimatedLinearGradient>

      {/* The pupil is a pearl, not a flat disc — it has to survive becoming
          a planet a beat later, so it needs a light source from the start. */}
      <LinearGradient id="fm-pearl" x1="0.3" y1="0.15" x2="0.75" y2="0.95">
        <Stop offset="0%" stopColor="#FFFFFF" />
        <Stop offset="38%" stopColor="#DCE3E9" />
        <Stop offset="74%" stopColor="#8E979F" />
        <Stop offset="100%" stopColor="#59626A" />
      </LinearGradient>
    </Defs>
  );
}

const strokeCommon = {
  fill: 'none',
  strokeWidth: STROKE,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
};

/**
 * The static mark. Used anywhere the identity needs to appear outside the film.
 *
 * `sweep` is optional: pass a shared value driven 0→1 to run the liquid-chrome
 * highlight across it, or leave it out for a still mark.
 */
export function FuncMark({
  width = 200,
  sweep,
}: {
  width?: number;
  sweep?: SharedValue<number> | undefined;
}): React.JSX.Element {
  const height = (width / MARK_VIEWBOX.width) * MARK_VIEWBOX.height;

  return (
    <Svg width={width} height={height} viewBox={`0 0 ${MARK_VIEWBOX.width} ${MARK_VIEWBOX.height}`}>
      <ChromeDefs {...(sweep ? { sweep } : {})} />

      {/* Base chrome. */}
      <G stroke="url(#fm-chrome)" {...strokeCommon}>
        <Path d={LETTERS_LEFT} />
        <Path d={LETTERS_RIGHT} />
        <Path d={LID_TOP} />
        <Path d={LID_BOTTOM} />
        <Path d={PERSON_BODY} strokeWidth={7} />
      </G>
      <Circle cx={PUPIL.x} cy={PUPIL.y} r={PUPIL.r} fill="url(#fm-pearl)" />

      {/* The travelling specular, clipped to the glyphs by being the same
          geometry drawn again. */}
      <G stroke="url(#fm-sweep)" {...strokeCommon}>
        <Path d={LETTERS_LEFT} />
        <Path d={LETTERS_RIGHT} />
        <Path d={LID_TOP} />
        <Path d={LID_BOTTOM} />
        <Path d={PERSON_BODY} strokeWidth={7} />
      </G>
    </Svg>
  );
}
