/** Tiny pub/sub: the Eye tab button asks the Map screen to replay its entrance. */
type Listener = () => void;
const listeners = new Set<Listener>();

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
