/**
 * A func pass.
 *
 * The brief: *it should feel like you got in — valuable, scarce, social, and
 * worth showing someone.* What it replaces was a grey bottom sheet containing a
 * concentric-circle glyph standing in for a QR code, a monospace string, and
 * the words "Show this on the door". Nothing about it said you had been let in
 * anywhere.
 *
 * ## What makes it read as an object rather than a screen
 *
 * - **It is a card with a physical proportion and a die-cut notch.** The two
 *   half-circles bitten out of its edges are the single strongest cue: real
 *   tickets are torn, and a shape that could only exist as a manufactured
 *   object stops reading as a rectangle of UI.
 * - **A chrome bar across the head**, using the same seven-stop metal as the
 *   mark, so the pass is visibly made of the same material as the brand.
 * - **The code is set large, in monospace, letterspaced** — it is the thing you
 *   hold up, so it is the loudest element after the venue's name.
 * - **The heat of the room it gets you into** washes the card. A pass to a
 *   place that is going off does not look like a pass to a quiet bar, which is
 *   most of what "scarce" and "social" actually mean here.
 *
 * The perforation is drawn with two circles the colour of whatever sits behind
 * the card, rather than with a real clipping path. A mask would be exact, but it
 * would also mean the card could no longer sit on an arbitrary background — and
 * this has to work both on the celebration's blackout and inline in Plans.
 * The background colour is therefore a required prop, not a guess.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';

import { chrome, colour, heat as heatColour, radius, space, type as typeScale } from '../theme';

export interface PassCardProps {
  readonly venue: string;
  readonly detail: string;
  readonly code: string;
  /** 0–1. Washes the card with the temperature of the room it gets you into. */
  readonly heat?: number;
  /**
   * What sits behind the card. The die-cut notches are painted in this colour,
   * so getting it wrong shows up as two floating dots.
   */
  readonly behind?: string;
  readonly width?: number;
}

const NOTCH = 13;

export function PassCard({
  venue,
  detail,
  code,
  heat = 0.6,
  behind = colour.void,
  width = 300,
}: PassCardProps): React.JSX.Element {
  const hot = heatColour(heat);

  return (
    <View style={[styles.card, { width }]}>
      {/* The heat of the room, bled up from the foot of the card. */}
      <Svg style={StyleSheet.absoluteFill} width={width} height="100%">
        <Defs>
          <LinearGradient id="pass-heat" x1="0" y1="1" x2="0.35" y2="0">
            <Stop offset="0%" stopColor={hot} stopOpacity="0.30" />
            <Stop offset="60%" stopColor={hot} stopOpacity="0.05" />
            <Stop offset="100%" stopColor={hot} stopOpacity="0" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height="100%" fill="url(#pass-heat)" />
      </Svg>

      {/* The chrome bar — the pass is made of the same metal as the mark. */}
      <Svg width={width} height={5} style={styles.bar}>
        <Defs>
          <LinearGradient id="pass-chrome" x1="0" y1="0" x2="1" y2="0.4">
            {chrome.stops.map((s) => (
              <Stop key={s.offset} offset={s.offset} stopColor={s.color} />
            ))}
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width={width} height={5} fill="url(#pass-chrome)" />
      </Svg>

      <View style={styles.body}>
        <Text style={styles.kicker}>FUNC PASS</Text>
        <Text style={styles.venue} numberOfLines={2}>
          {venue}
        </Text>
        <Text style={styles.detail}>{detail}</Text>
      </View>

      {/* The tear line, with its die-cut notches. */}
      <View style={styles.tear}>
        <View style={[styles.notch, styles.notchLeft, { backgroundColor: behind }]} />
        <View style={styles.perforation} />
        <View style={[styles.notch, styles.notchRight, { backgroundColor: behind }]} />
      </View>

      <View style={styles.stub}>
        <Text style={styles.code}>{code}</Text>
        <Text style={styles.door}>Show this on the door</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0A0A0C',
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colour.hairline,
    borderTopColor: colour.hairlineHi,
    overflow: 'hidden',
  },
  bar: { position: 'absolute', top: 0, left: 0 },
  body: { paddingHorizontal: space.xl, paddingTop: space.xl, paddingBottom: space.lg },
  kicker: { ...(typeScale.label as object), color: colour.fg3, marginBottom: space.sm },
  venue: { fontSize: 30, fontWeight: '800', letterSpacing: -0.7, color: colour.fg },
  detail: { ...(typeScale.small as object), color: colour.fg2, marginTop: space.xs },

  tear: { height: NOTCH * 2, justifyContent: 'center' },
  perforation: {
    height: 1,
    marginHorizontal: NOTCH + 4,
    borderTopWidth: 1,
    borderColor: colour.hairline,
    borderStyle: 'dashed',
  },
  notch: {
    position: 'absolute',
    width: NOTCH * 2,
    height: NOTCH * 2,
    borderRadius: NOTCH,
    top: 0,
  },
  notchLeft: { left: -NOTCH },
  notchRight: { right: -NOTCH },

  stub: { paddingHorizontal: space.xl, paddingBottom: space.xl, paddingTop: space.sm },
  code: {
    fontSize: 27,
    fontWeight: '700',
    letterSpacing: 5,
    color: colour.fg,
    fontVariant: ['tabular-nums'],
  },
  door: { ...(typeScale.small as object), color: colour.fg3, marginTop: space.xs },
});
