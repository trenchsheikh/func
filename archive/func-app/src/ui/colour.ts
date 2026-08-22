/**
 * Colour science.
 *
 * ## The problem this exists to solve
 *
 * func's heat ramp is the product's core signal: it has to say *how hot a room
 * is* without a number and without a legend, purely by colour. The first pass
 * interpolated it channel-wise in sRGB, which is wrong in a way that is
 * visible rather than academic — between cold blue `rgb(43,76,155)` and hot red
 * `rgb(245,56,76)` a naive lerp passes through a desaturated purple-grey around
 * the midpoint. So a *moderately busy* venue rendered muddier and duller than
 * both a dead one and a rammed one, which inverts the signal exactly where the
 * map is most often read.
 *
 * The cause is that sRGB is neither linear in light nor uniform in perception.
 * Mixing two saturated hues by averaging their encoded channel values passes
 * through the interior of the RGB cube, which is grey.
 *
 * ## The fix
 *
 * Interpolate in **OKLCH** (Björn Ottosson's OKLab, expressed cylindrically).
 * OKLab is designed so that Euclidean distance approximates perceived
 * difference, which gives two properties this ramp needs:
 *
 * 1. **Chroma survives the journey.** Interpolating C directly keeps the
 *    midpoints saturated instead of routing through grey.
 * 2. **Lightness is controllable.** The stops below have strictly increasing
 *    `L`, so *hotter is always brighter* — which is the entire semantic job of
 *    the ramp, and is not something sRGB interpolation can promise.
 *
 * Hue is interpolated along an **unwrapped** path (264° → 455°), so the sweep
 * deliberately travels blue → indigo → violet → magenta → red → orange → gold
 * the long way round the wheel, rather than taking the shorter arc and cutting
 * straight from blue to gold through green.
 *
 * ## Gamut
 *
 * OKLCH is larger than sRGB, so an interpolated (L, C, h) can be
 * unrepresentable. Clipping the resulting RGB channels independently would
 * shift hue and flatten the top of the ramp. Instead each sample is
 * **gamut-mapped by binary-searching chroma down** until it fits, holding L and
 * h fixed — the standard approach, and the one that preserves the hue sweep.
 *
 * ## Cost
 *
 * `heat()` is called per marker per render, and a cube root plus a binary
 * search per call is far too much for that. Everything above is therefore
 * evaluated **once at module load** into a lookup table; `heat()` itself is a
 * table read plus a cheap sRGB lerp between neighbours, which at this table
 * size is visually indistinguishable from evaluating exactly.
 */

// ---------------------------------------------------------------------------
// Blank canvas — reversible visual reset (2026-08-12)
// ---------------------------------------------------------------------------

/**
 * A temporary, reversible switch to a plain black/white/grey baseline while
 * Phoenix rebuilds the visual language detail by detail from a clean slate.
 *
 * Every colour/chrome/spring token this module and `theme.ts` export is
 * derived from this single flag rather than deleted — flip it back to
 * `false` and the OKLCH heat ramp, liquid chrome and physics-tuned springs
 * documented throughout both files return exactly as authored. Nothing about
 * the *mechanism* (the LUT, the gamut mapping, the spring derivation) is
 * touched; only the inputs it runs on.
 */
export const BLANK_CANVAS = true;

// ---------------------------------------------------------------------------
// sRGB transfer function
// ---------------------------------------------------------------------------

/** sRGB (0–1, encoded) → linear light. */
function toLinear(c: number): number {
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
}

/** Linear light → sRGB (0–1, encoded). */
function toGamma(c: number): number {
  return c <= 0.0031308 ? 12.92 * c : 1.055 * Math.pow(c, 1 / 2.4) - 0.055;
}

// ---------------------------------------------------------------------------
// OKLab — Ottosson's published matrices
// ---------------------------------------------------------------------------

interface Lab {
  readonly L: number;
  readonly a: number;
  readonly b: number;
}

/** Linear-light sRGB → OKLab. */
function linearToOklab(r: number, g: number, bl: number): Lab {
  const l = 0.4122214708 * r + 0.5363325363 * g + 0.0514459929 * bl;
  const m = 0.2119034982 * r + 0.6806995451 * g + 0.1073969566 * bl;
  const s = 0.0883024619 * r + 0.2817188376 * g + 0.6299787005 * bl;

  const l_ = Math.cbrt(l);
  const m_ = Math.cbrt(m);
  const s_ = Math.cbrt(s);

  return {
    L: 0.2104542553 * l_ + 0.793617785 * m_ - 0.0040720468 * s_,
    a: 1.9779984951 * l_ - 2.428592205 * m_ + 0.4505937099 * s_,
    b: 0.0259040371 * l_ + 0.7827717662 * m_ - 0.808675766 * s_,
  };
}

/** OKLab → linear-light sRGB. May fall outside [0,1] — see `fitToGamut`. */
function oklabToLinear({ L, a, b }: Lab): [number, number, number] {
  const l_ = L + 0.3963377774 * a + 0.2158037573 * b;
  const m_ = L - 0.1055613458 * a - 0.0638541728 * b;
  const s_ = L - 0.0894841775 * a - 1.291485548 * b;

  const l = l_ * l_ * l_;
  const m = m_ * m_ * m_;
  const s = s_ * s_ * s_;

  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const EPS = 1e-4;
const inGamut = ([r, g, b]: [number, number, number]): boolean =>
  r >= -EPS && r <= 1 + EPS && g >= -EPS && g <= 1 + EPS && b >= -EPS && b <= 1 + EPS;

const lchToLab = (L: number, C: number, hDeg: number): Lab => {
  const h = (hDeg * Math.PI) / 180;
  return { L, a: C * Math.cos(h), b: C * Math.sin(h) };
};

/**
 * Reduce chroma until the colour fits sRGB, holding lightness and hue.
 *
 * Binary search rather than a closed form: the sRGB gamut boundary in OKLab is
 * not analytic, and 24 bisections lands well inside a 1/255 quantisation step.
 */
function fitToGamut(L: number, C: number, h: number): [number, number, number] {
  let rgb = oklabToLinear(lchToLab(L, C, h));
  if (inGamut(rgb)) return rgb;

  let lo = 0;
  let hi = C;
  for (let i = 0; i < 24; i += 1) {
    const mid = (lo + hi) / 2;
    rgb = oklabToLinear(lchToLab(L, mid, h));
    if (inGamut(rgb)) lo = mid;
    else hi = mid;
  }
  return oklabToLinear(lchToLab(L, lo, h));
}

// ---------------------------------------------------------------------------
// The heat ramp
// ---------------------------------------------------------------------------

interface Stop {
  readonly t: number;
  readonly L: number;
  readonly C: number;
  /** Degrees, deliberately **unwrapped** past 360 so the sweep is monotonic. */
  readonly h: number;
}

/**
 * Cold → going off.
 *
 * Authored directly in OKLCH rather than as hex, because the two invariants
 * that make the ramp readable are properties of L and h, and stating them in
 * hex would mean asserting them by luck:
 *
 * - **L strictly increases** (0.42 → 0.95): hotter is always brighter.
 * - **h strictly increases** (264° → 455°): a single continuous sweep through
 *   indigo, violet, magenta, red and orange. Values past 360 are intentional.
 *
 * Chroma arcs — it climbs into the saturated middle of the ramp and falls away
 * at the top, because the hottest state should read as *blown out toward
 * white*, not as maximally saturated yellow.
 */
const HEAT_STOPS_FULL: readonly Stop[] = [
  { t: 0.0, L: 0.42, C: 0.135, h: 264 }, // cold deep blue — open, empty
  { t: 0.2, L: 0.48, C: 0.18, h: 292 }, // indigo — a few people
  { t: 0.4, L: 0.55, C: 0.215, h: 320 }, // violet — filling
  { t: 0.58, L: 0.62, C: 0.23, h: 353 }, // magenta — busy
  { t: 0.72, L: 0.68, C: 0.215, h: 385 }, // red (25°) — hot
  { t: 0.86, L: 0.79, C: 0.175, h: 420 }, // orange (60°) — very hot
  { t: 1.0, L: 0.95, C: 0.075, h: 455 }, // gold-white (95°) — going off
];

/**
 * Blank canvas: the same L (lightness) journey with chroma zeroed, so heat
 * still reads — dead is dark, going-off is bright — purely as a grayscale
 * intensity, with no hue at all. This is what keeps the map's busyness signal
 * functional (Tier 3 per `team/func-identity.md`: colour is a detail, not a
 * constitutional item) while dropping every drop of colour.
 */
const HEAT_STOPS: readonly Stop[] = BLANK_CANVAS
  ? HEAT_STOPS_FULL.map((s) => ({ ...s, C: 0 }))
  : HEAT_STOPS_FULL;

const clamp01 = (n: number): number => (n < 0 ? 0 : n > 1 ? 1 : n);

/** Sample the ramp exactly, in OKLCH, with gamut mapping. Expensive. */
function sampleExact(t: number): [number, number, number] {
  const x = clamp01(t);

  let lo = HEAT_STOPS[0]!;
  let hi = HEAT_STOPS[HEAT_STOPS.length - 1]!;
  for (let i = 0; i < HEAT_STOPS.length - 1; i += 1) {
    const a = HEAT_STOPS[i]!;
    const b = HEAT_STOPS[i + 1]!;
    if (x >= a.t && x <= b.t) {
      lo = a;
      hi = b;
      break;
    }
  }

  const span = hi.t - lo.t;
  const k = span === 0 ? 0 : (x - lo.t) / span;

  const L = lo.L + (hi.L - lo.L) * k;
  const C = lo.C + (hi.C - lo.C) * k;
  const h = lo.h + (hi.h - lo.h) * k;

  const linear = fitToGamut(L, C, h);
  return [
    Math.round(clamp01(toGamma(linear[0])) * 255),
    Math.round(clamp01(toGamma(linear[1])) * 255),
    Math.round(clamp01(toGamma(linear[2])) * 255),
  ];
}

/**
 * Precomputed ramp.
 *
 * 129 entries: fine enough that lerping between neighbours in sRGB is below the
 * quantisation floor, small enough to build at import in well under a
 * millisecond.
 */
const LUT_SIZE = 129;
const HEAT_LUT: readonly [number, number, number][] = Array.from({ length: LUT_SIZE }, (_, i) =>
  sampleExact(i / (LUT_SIZE - 1)),
);

/**
 * The heat ramp at `t` (0 = dead, 1 = going off), as a CSS colour string.
 *
 * Cheap: one table lookup plus a short lerp. Safe to call per marker per frame.
 */
export function heatColour(t: number, alpha = 1): string {
  const x = clamp01(t) * (LUT_SIZE - 1);
  const i = Math.floor(x);
  const f = x - i;

  const a = HEAT_LUT[i]!;
  const b = HEAT_LUT[Math.min(LUT_SIZE - 1, i + 1)]!;

  const r = Math.round(a[0] + (b[0] - a[0]) * f);
  const g = Math.round(a[1] + (b[1] - a[1]) * f);
  const bl = Math.round(a[2] + (b[2] - a[2]) * f);

  return alpha >= 1 ? `rgb(${r},${g},${bl})` : `rgba(${r},${g},${bl},${alpha})`;
}

/** The ramp as `n` evenly spaced hex stops — for SVG gradients. */
export function heatStops(n: number): string[] {
  return Array.from({ length: n }, (_, i) => {
    const [r, g, b] = HEAT_LUT[Math.round((i / (n - 1)) * (LUT_SIZE - 1))]!;
    return `#${[r, g, b].map((c) => c.toString(16).padStart(2, '0')).join('')}`;
  });
}

// ---------------------------------------------------------------------------
// Glow
// ---------------------------------------------------------------------------

export interface GlowStop {
  readonly offset: string;
  readonly color: string;
  readonly opacity: number;
}

/**
 * Gradient stops for a venue's heat bloom.
 *
 * ## The bug this replaces
 *
 * The first pass drew three stops with opacity 0.55 → 0.18 → 0 and let SVG
 * interpolate. Two things were wrong with that, and the second is severe:
 *
 * 1. A near-linear opacity ramp has almost constant gradient magnitude, so it
 *    terminates at a visible edge. The eye reads that as a translucent disc
 *    stuck onto the map, not as light coming off a building.
 *
 * 2. **Opacity was being ramped in sRGB.** Light falls off in *linear* space,
 *    and sRGB is a ~2.2-power encoding of it, so the two disagree most exactly
 *    where a glow spends most of its area. 2% of full linear intensity should
 *    encode to sRGB code ~38; ramping the encoded value directly writes code 5
 *    — indistinguishable from black on an OLED. The outer ~80% of every bloom
 *    in the app was therefore invisible, which is why they looked small and
 *    hard-edged no matter how large the radius got.
 *
 * ## The kernel
 *
 * An airlight/scattering approximation rather than a Gaussian:
 *
 *     core(r)   = ε²·exp(−σr) / (r² + ε²)      inverse-square, ε-softened
 *     halo(r)   = exp(−r / s_h)                forward-scattered skirt
 *     window(r) = (1 − r⁴)²                    smooth compact support
 *     L(r)      = norm · window(r) · (core(r) + w_h·halo(r))
 *
 * The `r² + ε²` denominator is what gives a real light source its blown core
 * without dividing by zero; the halo lobe is what gives it the long faint
 * skirt that a Gaussian cannot; `window` takes it to exactly zero at the
 * marker's edge so there is no clipped rectangle.
 *
 * Near the core the colour is mixed toward white **in linear light**, so a
 * venue that is going off desaturates upward rather than clipping to a flat
 * disc of saturated gold — the same thing an overexposed light does on film.
 */
export function glowStops(t: number, steps = 10): GlowStop[] {
  const EPSILON = 0.06; // core softening, as a fraction of radius
  const SIGMA = 1.6; // extinction — how fast the core falls away
  const HALO_WEIGHT = 0.15;
  const HALO_SCALE = 0.45;

  const kernel = (r: number): number => {
    const core = (EPSILON * EPSILON * Math.exp(-SIGMA * r)) / (r * r + EPSILON * EPSILON);
    const halo = Math.exp(-r / HALO_SCALE);
    const w = 1 - r * r * r * r;
    const window = w <= 0 ? 0 : w * w;
    return window * (core + HALO_WEIGHT * halo);
  };

  const peak = kernel(0) || 1;

  // The hue this bloom is made of, in linear light.
  const base = parseRgb(heatColour(t)) ?? [255, 255, 255];
  const baseLin = base.map((c) => toLinear(c / 255)) as [number, number, number];

  return Array.from({ length: steps + 1 }, (_, i) => {
    const r = i / steps;
    const L = clamp01(kernel(r) / peak);

    // Blow the core toward white. Only the innermost fifth is affected.
    const white = clamp01(L * 1.7 - 0.7);
    const lin = baseLin.map((c) => c + (1 - c) * white) as [number, number, number];
    const [rr, gg, bb] = lin.map((c) => Math.round(clamp01(toGamma(c)) * 255));

    return {
      offset: `${(r * 100).toFixed(1)}%`,
      color: `rgb(${rr},${gg},${bb})`,
      // **The fix**: encode the linear falloff before handing it to SVG, which
      // composites in sRGB. Passing `L` raw is what crushed the skirt.
      opacity: Number(toGamma(L).toFixed(4)),
    };
  });
}

// ---------------------------------------------------------------------------
// Light-linear compositing
// ---------------------------------------------------------------------------

/**
 * Add two colours **in linear light**, then re-encode.
 *
 * Overlapping glows must accumulate the way photons do. Adding sRGB-encoded
 * values directly (which is what naive alpha compositing of two additive layers
 * amounts to) over-brightens the low end and produces the grey-brown wash you
 * get where two venue blooms overlap on a dense part of the map.
 */
export function addLight(a: string, b: string): string {
  const pa = parseRgb(a);
  const pb = parseRgb(b);
  if (!pa || !pb) return a;

  const mix = (x: number, y: number): number =>
    Math.round(clamp01(toGamma(clamp01(toLinear(x / 255) + toLinear(y / 255)))) * 255);

  return `rgb(${mix(pa[0], pb[0])},${mix(pa[1], pb[1])},${mix(pa[2], pb[2])})`;
}

function parseRgb(s: string): [number, number, number] | null {
  const m = /rgba?\((\d+),\s*(\d+),\s*(\d+)/.exec(s);
  if (m) return [Number(m[1]), Number(m[2]), Number(m[3])];

  const hex = /^#([0-9a-f]{6})$/i.exec(s.trim());
  if (hex) {
    const v = parseInt(hex[1]!, 16);
    return [(v >> 16) & 255, (v >> 8) & 255, v & 255];
  }
  return null;
}

/**
 * Lighten or darken a colour by a perceptual amount, in OKLab.
 *
 * `amount` is a delta on OKLab's L, so +0.1 is the *same perceived step* on a
 * deep blue as on a gold — which is not true of any RGB-space equivalent, and
 * is what makes a single hover/pressed treatment work across the whole ramp.
 */
export function shiftLightness(colour: string, amount: number): string {
  const p = parseRgb(colour);
  if (!p) return colour;

  const lab = linearToOklab(toLinear(p[0] / 255), toLinear(p[1] / 255), toLinear(p[2] / 255));
  const C = Math.sqrt(lab.a * lab.a + lab.b * lab.b);
  const h = (Math.atan2(lab.b, lab.a) * 180) / Math.PI;

  const linear = fitToGamut(clamp01(lab.L + amount), C, h);
  const [r, g, b] = linear.map((c) => Math.round(clamp01(toGamma(c)) * 255));
  return `rgb(${r},${g},${b})`;
}
