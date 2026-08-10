/**
 * The one place the layers are wired together.
 *
 * Screens talk to this and nothing else. They never import the store, never
 * touch a service directly, and — critically — never decide visibility for
 * themselves. Everything they render comes from a domain function that has
 * already applied the rules.
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

import {
  systemClock,
  type Clock,
  type LocationFix,
  type PersonId,
} from '../../domain';
import { InMemoryPlaceRepository } from '../../data/places';
import { socialGraph } from '../../data/graph';
import type { PersistedState } from '../../data/schema';
import { FuncStore, type LoadOutcome } from '../../data/store';
import type { StorageAdapter } from '../../data/storage';
import { buildDemoWorld } from '../../data/seed/demo-world';
import { SEED_CITIES, SF_DISTRICTS, SF_VENUES } from '../../data/seed/san-francisco';
import {
  FakeLocationService,
  type LocationService,
} from '../../services/location';
import {
  FakeNotificationService,
  type NotificationService,
} from '../../services/notifications';

/** AsyncStorage already matches the adapter shape; no wrapper logic needed. */
const asyncStorageAdapter: StorageAdapter = {
  getItem: (key) => AsyncStorage.getItem(key),
  setItem: (key, value) => AsyncStorage.setItem(key, value),
  removeItem: (key) => AsyncStorage.removeItem(key),
};

export interface AppServices {
  readonly clock: Clock;
  readonly location: LocationService;
  readonly notifications: NotificationService;
  readonly places: InMemoryPlaceRepository;
}

export interface AppContextValue extends AppServices {
  readonly ready: boolean;
  readonly loadOutcome: LoadOutcome | null;
  readonly state: PersistedState;
  /** Who this device is acting as. Null before sign-in. */
  readonly meId: PersonId | null;
  /** Latest known device position for each person we can see. */
  readonly fixes: Readonly<Record<string, LocationFix>>;
  readonly graph: ReturnType<typeof socialGraph>;
  update(fn: (state: PersistedState) => PersistedState | void): void;
  setFix(personId: PersonId, fix: LocationFix): void;
  reload(): Promise<void>;
}

const AppContext = createContext<AppContextValue | null>(null);

export interface AppProviderProps {
  readonly children: ReactNode;
  /** Overridable for tests and for driving the app deterministically. */
  readonly storage?: StorageAdapter;
  readonly clock?: Clock;
  readonly location?: LocationService;
  readonly notifications?: NotificationService;
  /** Populate an empty device with the demo world. Off in production. */
  readonly seedWhenEmpty?: boolean;
}

export function AppProvider({
  children,
  storage = asyncStorageAdapter,
  clock = systemClock,
  location,
  notifications,
  seedWhenEmpty = true,
}: AppProviderProps): React.JSX.Element {
  const services = useRef<AppServices | null>(null);
  services.current ??= {
    clock,
    location: location ?? new FakeLocationService('undetermined'),
    notifications: notifications ?? new FakeNotificationService('granted'),
    places: new InMemoryPlaceRepository({
      cities: SEED_CITIES,
      districts: SF_DISTRICTS,
      venues: SF_VENUES,
    }),
  };

  const storeRef = useRef<FuncStore | null>(null);
  storeRef.current ??= new FuncStore({
    storage,
    now: () => clock.now(),
    writeDebounceMs: 300,
  });

  const [ready, setReady] = useState(false);
  const [outcome, setOutcome] = useState<LoadOutcome | null>(null);
  const [state, setState] = useState<PersistedState>(() => ({}) as PersistedState);

  const load = useCallback(async () => {
    const store = storeRef.current!;
    const result = await store.load();

    let next = store.getState();
    const isEmpty = Object.keys(next.profiles).length === 0 && next.requests.length === 0;

    if (seedWhenEmpty && isEmpty && result.kind === 'fresh') {
      // The reviewer's device clock, not the seed city's. Seeding expiry in
      // SF time and rendering it in the device's zone made a midday expiry
      // read as "Ends 8:00pm" on a London phone — correct arithmetic,
      // nonsense on screen.
      const demo = buildDemoWorld(clock.now(), clock.timeZone());
      store.mutate(() => demo.state);
      next = store.getState();
    }

    setState({ ...next });
    setOutcome(result);
    setReady(true);
  }, [clock, seedWhenEmpty]);

  useEffect(() => {
    void load();
    const store = storeRef.current!;
    // Copy the reference so React re-renders; the store mutates in place.
    return store.subscribe((next) => setState({ ...next }));
  }, [load]);

  const update = useCallback((fn: (s: PersistedState) => PersistedState | void) => {
    storeRef.current!.mutate(fn);
  }, []);

  const setFix = useCallback((personId: PersonId, fix: LocationFix) => {
    storeRef.current!.mutate((s) => {
      s.fixes[personId as string] = fix;
    });
  }, []);

  const graph = useMemo(
    () => socialGraph(state.friendships ?? []),
    [state.friendships],
  );

  const meId = (state.session?.personId ?? null) as PersonId | null;
  const fixes = state.fixes ?? {};

  const value = useMemo<AppContextValue>(
    () => ({
      ...services.current!,
      ready,
      loadOutcome: outcome,
      state,
      meId,
      fixes,
      graph,
      update,
      setFix,
      reload: load,
    }),
    [ready, outcome, state, meId, fixes, graph, update, setFix, load],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppContextValue {
  const value = useContext(AppContext);
  if (!value) throw new Error('useApp() outside AppProvider');
  return value;
}
