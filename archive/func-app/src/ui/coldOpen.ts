/**
 * Cold-open coordination.
 *
 * The last beat of the opening film is a dive from orbit into the launch city.
 * That dive is not faked inside the overlay and then cut to a static map —
 * cutting is exactly what makes an opening feel like a splash screen handing
 * over. Instead the overlay hands the move to **MapLibre's own camera**: the
 * film fades out mid-flight while the real map is already flying from orbit
 * zoom down to the city. The user never sees a seam because there isn't one.
 *
 * That needs two independently-mounted components (`ColdOpen`, rendered above
 * the navigator in `app/_layout.tsx`, and `FuncMap`, rendered inside a tab) to
 * agree on a moment. They have no parent-child relationship and no shared
 * React state, so this module is the smallest thing that works: a
 * module-scoped flag plus a one-shot signal.
 *
 * Module scope is deliberate, and it is the same reasoning as `FuncMap`'s
 * `lastKnownCamera`: the navigator tears views down and rebuilds them, so
 * anything stored in component state would replay the film on a remount. One
 * process = one cold open.
 *
 * Founder call (2026-08-12): the film plays on **every cold start**, not once
 * per night and not once per install.
 */

let played = false;
let playing = false;

/**
 * Whether the film should run. True exactly once per process — a JS reload in
 * development counts as a fresh process, which is what you want while
 * iterating on the sequence.
 */
export function shouldPlayColdOpen(): boolean {
  if (played) return false;
  played = true;
  playing = true;
  return true;
}

/**
 * Whether a film is on screen right now.
 *
 * The map reads this to decide whether to open at orbit zoom and wait to be
 * told to fly in, or to just show the city. Without it, a map mounted with no
 * film above it would sit at orbit zoom waiting for a signal that is never
 * coming.
 */
export function isColdOpenPlaying(): boolean {
  return playing;
}

/** The film has finished (or was torn down). */
export function endColdOpen(): void {
  playing = false;
  arrivalListener = null;
  arrivalPending = false;
}

type Listener = () => void;

let arrivalListener: Listener | null = null;
/**
 * Set when the film reaches its dive before the map has finished loading its
 * style. Without this the signal can be emitted into a void — the map's style
 * load and the film's timeline are genuinely racing — and the arrival shot
 * would silently never fire.
 */
let arrivalPending = false;

/**
 * Register interest in the arrival moment. Returns an unsubscribe.
 *
 * If the film already reached its dive, the callback fires immediately rather
 * than waiting for a signal that has been and gone.
 */
export function onArrival(listener: Listener): () => void {
  if (arrivalPending) {
    arrivalPending = false;
    listener();
    return () => {};
  }
  arrivalListener = listener;
  return () => {
    if (arrivalListener === listener) arrivalListener = null;
  };
}

/** The film has reached the dive — the map should start flying in now. */
export function signalArrival(): void {
  if (arrivalListener) {
    const l = arrivalListener;
    arrivalListener = null;
    l();
    return;
  }
  arrivalPending = true;
}
