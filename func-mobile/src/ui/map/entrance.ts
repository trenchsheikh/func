/** Tiny pub/sub: the Eye tab button asks the Map screen to replay its entrance. */
type Listener = () => void;
const listeners = new Set<Listener>();

export function entranceAnimation(reduceMotion: boolean) {
  return reduceMotion
    ? { initialScale: 1, initialOpacity: 1, duration: 0 }
    : { initialScale: 0.92, initialOpacity: 0, duration: 420 };
}

export const mapEntrance = {
  trigger() {
    listeners.forEach((l) => l());
  },
  subscribe(l: Listener) {
    listeners.add(l);
    return () => {
      listeners.delete(l);
    };
  },
};
