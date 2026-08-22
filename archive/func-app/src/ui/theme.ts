/**
 * Theme tokens — the black/chrome identity.
 *
 * The governing principle, from the 2026-08-12 aesthetic reset:
 *
 *   **Chrome is the frame. The night is the colour.**
 *
 * Three layers, kept strictly apart. Mixing them is what made the previous
 * build read as a well-built settings screen for nightlife.
 *
 * 1. **The shell is achromatic.** True black, matte black surfaces, chrome
 *    hairlines, white type. Navigation, sheets, headers and buttons carry no
 *    hue at all. This is where the restraint lives.
 *
 * 2. **The world carries colour, and only ever by meaning.**
 *    - `heat()` is a real temperature ramp: cold blue → indigo → violet →
 *      magenta → red → orange → gold-white. It describes how hot a room is.
 *    - `life` (emerald) means **people, and nothing else** — DTF, friends,
 *      your own presence, a live story. Founder call, 2026-08-12: emerald
 *      leaves the heat ramp entirely so green can only ever mean *someone*.
 *      (This makes one line of `team/standing-orders.md` — which still bundles
 *      heat into emerald — stale. That file is outside `func-app` and belongs
 *      to another work stream, so it is flagged, not edited.)
 *    - Venue *kind* is carried by **silhouette, not colour**, so the map stays
 *      readable when everything on it is hot.
 *
 * 3. **Motion is tiered.** Small moments get `spring.press`; big social
 *    moments (a pass, an acceptance) get `spring.arrive` and a full-screen
 *    celebration. A table at a major club must not feel like a form submit.
 *
 * Tier 0 rules this file still enforces: no emoji as iconography, and heat is
 * *glow only* — never a number, never a word.
 */

// ---------------------------------------------------------------------------
// Blank canvas — reversible visual reset (2026-08-12)
// ---------------------------------------------------------------------------

/**
 * Re-exported from `colour.ts`, which is the single source of truth (it has
 * no dependency on this file, so it can't create an import cycle). See that
 * file's comment for what flipping it back to `false` restores.
 */
export { BLANK_CANVAS } from './colour';
import { BLANK_CANVAS } from './colour';

/**
 * 0 in blank-canvas mode, 1 otherwise. Multiplies purely ambient/decorative
 * motion amplitude — idle marker "breathing", pulses — that live as hardcoded
 * numbers at their call sites rather than as a theme token. Zeroing this
 * removes the oscillation without touching how any of it is wired up.
 */
export const motionScale = BLANK_CANVAS ? 0 : 1;

// ---------------------------------------------------------------------------
// The shell — achromatic
// ---------------------------------------------------------------------------

const COLOUR_FULL = {
  /** True black. The base the whole product sits on. */
  void: '#000000',
  ink: '#000000',
  /** Soft matte black surfaces, lifted just enough to separate. */
  ink2: '#08080A',
  surface: '#0C0C0F',
  surface2: '#141418',
  surface3: '#1C1C21',

  /** Hairlines. `hairline` is the flat fallback; real edges use `chromeEdge`. */
  hairline: 'rgba(255,255,255,0.10)',
  hairlineHi: 'rgba(255,255,255,0.20)',

  fg: '#F4F6F8',
  fg2: '#AEB6BE',
  fg3: '#767E86',
  fg4: '#454B52',

  /**
   * Life. **People only** — presence, friends, DTF, a live story.
   * Never heat, never a button, never decoration.
   */
  life: '#00E27A',
  lifeHi: '#5CFFB4',
  lifeDim: 'rgba(0,226,122,0.14)',

  /** Back-compat aliases. Older screens still read `em`/`emHi`/`emDim`. */
  em: '#00E27A',
  emHi: '#5CFFB4',
  emDim: 'rgba(0,226,122,0.14)',

  /** Out, but not sharing. */
  amber: '#FFB020',
  /** Premium — the disco ball. */
  disco: '#C8A2FF',
  gold: '#FFD479',
  danger: '#FF5A6E',

  /** After-parties. Deep violet bloom, never a badge colour. */
  after: '#9A5CFF',
  afterHi: '#D9BCFF',
} as const;

/**
 * Blank canvas: every hue-carrying token collapses onto the existing
 * achromatic `fg`/`fg3` ramp already used for text, so relative
 * distinguishability (people brightest, secondary states dimmer) survives
 * even though hue doesn't. `void`/`ink`/`surface*`/`fg*`/`hairline*` are
 * untouched — they were already black/white/grey.
 */
const COLOUR_BLANK = {
  ...COLOUR_FULL,
  life: '#FFFFFF',
  lifeHi: '#FFFFFF',
  lifeDim: 'rgba(255,255,255,0.14)',
  em: '#FFFFFF',
  emHi: '#FFFFFF',
  emDim: 'rgba(255,255,255,0.14)',
  amber: COLOUR_FULL.fg2,
  disco: COLOUR_FULL.fg3,
  gold: COLOUR_FULL.fg2,
  /** Pure white — the one tone nothing else in the blank palette uses — so an
   *  error still reads as the loudest thing on screen without a hue. */
  danger: '#FFFFFF',
  after: COLOUR_FULL.fg3,
  afterHi: COLOUR_FULL.fg2,
} as const;

export const colour = BLANK_CANVAS ? COLOUR_BLANK : COLOUR_FULL;

/**
 * Liquid chrome. A polished-metal sweep, not a grey.
 *
 * The stop pattern is what sells metal: highlight, falloff, a hard dark band,
 * a blown specular, another falloff. A linear two-stop grey reads as plastic.
 * Used by `<ChromeText>`, the mark, and every raised edge.
 */
const CHROME_FULL = {
  stops: [
    { offset: '0%', color: '#FFFFFF' },
    { offset: '14%', color: '#DFE4EA' },
    { offset: '31%', color: '#7C848C' },
    { offset: '47%', color: '#FCFEFF' },
    { offset: '63%', color: '#8B939B' },
    { offset: '80%', color: '#E9EDF1' },
    { offset: '100%', color: '#9BA3AB' },
  ],
  /** A dimmer sweep for edges and hairlines that must not out-shout content. */
  edgeStops: [
    { offset: '0%', color: 'rgba(255,255,255,0.34)' },
    { offset: '38%', color: 'rgba(255,255,255,0.08)' },
    { offset: '62%', color: 'rgba(255,255,255,0.03)' },
    { offset: '100%', color: 'rgba(255,255,255,0.16)' },
  ],
} as const;

/** Blank canvas: the sweep degenerates to a flat, uniform grey — same stop
 *  colour at both ends — which removes the "polished metal" material read
 *  entirely while every consumer (`FuncMark`, `PassCard`) keeps working
 *  unmodified, since they just map over whatever stops this exports. */
const CHROME_BLANK = {
  stops: [
    { offset: '0%', color: '#9BA3AB' },
    { offset: '100%', color: '#9BA3AB' },
  ],
  edgeStops: [
    { offset: '0%', color: 'rgba(255,255,255,0.12)' },
    { offset: '100%', color: 'rgba(255,255,255,0.12)' },
  ],
} as const;

export const chrome = BLANK_CANVAS ? CHROME_BLANK : CHROME_FULL;

// ---------------------------------------------------------------------------
// The world — heat as real temperature
// ---------------------------------------------------------------------------

/**
 * The heat ramp. `t` is 0 (dead) → 1 (going off).
 *
 * Deliberately *not* a single hue at varying opacity — that was the original
 * build's failure, where a dive bar and a peak-hour club were the same green
 * blur at different radii. Temperature is a hue journey, so the eye reads
 * "hotter" without a legend and without a number.
 *
 * The ramp itself lives in `./colour`, authored and interpolated in **OKLCH**
 * rather than sRGB. That is not a refinement — interpolating these hues
 * channel-wise in sRGB routes the midpoints through a desaturated purple-grey,
 * so a *moderately busy* venue rendered duller than both a dead one and a
 * rammed one. See that file for the full reasoning.
 */
export { heatColour as heat, heatStops, addLight, shiftLightness } from './colour';

/**
 * Venue kind → silhouette.
 *
 * Shape, not hue, is what makes the map legible in one glance — colour is
 * already fully committed to temperature and presence. Each is distinguishable
 * at 26px, which is roughly a marker at city zoom.
 */
export type MarkerShape = 'hex' | 'square' | 'circle' | 'diamond' | 'capsule';

export function shapeForKind(kind: string): MarkerShape {
  switch (kind) {
    case 'club':
      return 'hex'; // a faceted monolith — speaker cab, mirrorball facet
    case 'bar':
      return 'square'; // a coaster
    case 'dinner':
    case 'restaurant':
      return 'circle'; // a plate
    case 'after':
      return 'capsule'; // the only chrome-on-violet form
    default:
      return 'diamond'; // local spots, beaches, outdoor — a landmark
  }
}

// ---------------------------------------------------------------------------
// Geometry
// ---------------------------------------------------------------------------

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 10,
  md: 14,
  lg: 22,
  xl: 28,
  pill: 999,
} as const;

export const type = {
  display: { fontSize: 34, fontWeight: '800', letterSpacing: -0.8 },
  h1: { fontSize: 25, fontWeight: '800', letterSpacing: -0.5 },
  h2: { fontSize: 17.5, fontWeight: '700', letterSpacing: -0.2 },
  body: { fontSize: 15, fontWeight: '400' },
  small: { fontSize: 12.5, fontWeight: '400' },
  /** Condensed uppercase label, per the identity notes. */
  label: { fontSize: 10.5, fontWeight: '800', letterSpacing: 1.6 },
} as const;

// ---------------------------------------------------------------------------
// Motion — the animation hierarchy
// ---------------------------------------------------------------------------

/**
 * Springs, designed from physics rather than tuned by feel.
 *
 * Reanimated's `withSpring` integrates a damped harmonic oscillator:
 *
 *     m·ẍ + c·ẋ + k·x = 0
 *
 * which is fully described by two intuitive quantities:
 *
 *     ω₀ = √(k/m)              natural frequency — *how fast*
 *     ζ  = c / (2·√(k·m))      damping ratio     — *how much it overshoots*
 *
 * ζ is the one that carries meaning. ζ = 1 is critically damped (fastest
 * approach with no overshoot); ζ < 1 overshoots and rings; ζ > 1 crawls in.
 * Specifying `damping`/`stiffness`/`mass` directly means choosing ζ by
 * accident, so these are derived from the ζ and ω₀ the interaction actually
 * wants — the numbers are an output, not an input.
 */
function springFrom(zeta: number, omega0: number, mass: number) {
  return {
    mass,
    stiffness: mass * omega0 * omega0, // k = m·ω₀²
    damping: 2 * zeta * mass * omega0, // c = 2ζ·√(k·m) = 2ζ·m·ω₀
  };
}

const SPRING_FULL = {
  /**
   * A button under a finger. ζ = 1 — critically damped, so it never wobbles.
   * A control that rings after you touch it reads as flimsy; hardware doesn't
   * bounce. High ω₀ because response latency is the whole point.
   */
  press: springFrom(1.0, 26, 0.5),

  /** A chip or filter snapping into place. A trace of overshoot, no more. */
  snap: springFrom(0.85, 20, 0.6),

  /**
   * A card or sheet arriving. ζ = 0.62 gives exactly one visible overshoot,
   * which is what reads as *an object with mass landing* rather than a view
   * being faded in.
   */
  arrive: springFrom(0.62, 14, 0.9),

  /**
   * Status elevation — a pass, an acceptance. ζ = 0.42 and a low ω₀ give two
   * perceptible oscillations before it settles. This is the only place in the
   * product allowed to ring like that, and it is what makes getting into
   * somewhere feel different from a form succeeding.
   */
  elevate: springFrom(0.42, 11, 1.0),

  /**
   * Anything leaving. ζ = 1.25 — overdamped on purpose. A dismissal that
   * bounces on the way out reads as indecision, as though the app is not sure
   * you meant it.
   */
  dismiss: springFrom(1.25, 24, 0.6),
} as const;

/**
 * Blank canvas: one fast, critically-damped spring (ζ = 1, high ω₀) stands in
 * for all five. It still uses the same physics-derived architecture — this is
 * a plain, instant-feeling settle with no ringing, not a hardcoded duration —
 * which is what "minimal functional transition" means for anything that still
 * needs to move (a button under a finger still has to respond).
 */
const FAST = springFrom(1.0, 34, 0.4);
const SPRING_BLANK = {
  press: FAST,
  snap: FAST,
  arrive: FAST,
  elevate: FAST,
  dismiss: FAST,
} as const;

export const spring = BLANK_CANVAS ? SPRING_BLANK : SPRING_FULL;

export const timing = {
  /** A marker's breath. Slow enough to feel alive, not busy. */
  breath: 2600,
  quick: 180,
  /** The cold open, beat by beat. Total ≈ 4.6s. */
  coldOpen: {
    hold: 420, // black
    mark: 900, // the chrome lockup resolves
    retract: 720, // letters retract into the pupil
    blink: 520, // the eye tightens
    become: 700, // pupil → Earth
    grow: 720, // Earth expands toward the viewer
    dive: 620, // handed to the MapLibre camera
  },
} as const;

/** Presence → colour. The only place the traffic light is given a value. */
export function presenceColour(kind: 'dtf' | 'casual' | 'off'): string {
  if (kind === 'dtf') return colour.life;
  if (kind === 'casual') return colour.amber;
  return colour.fg4;
}
