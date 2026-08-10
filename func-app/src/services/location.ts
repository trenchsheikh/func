/**
 * Location, as an interface.
 *
 * The riskiest capability in the product, so it gets the narrowest surface. The
 * app asks for permission, subscribes to fixes, and stops. It cannot ask for
 * anyone else's position, and it cannot read history — the domain decides who
 * may see what, and this layer only reports where *this* device is.
 *
 * Background updates matter here in a way they do not for most apps: the whole
 * point of the new presence model is that a friend stays visible while their
 * phone is in their pocket. That is also exactly why the permission states are
 * modelled properly rather than collapsed into a boolean — "while using the
 * app" and "always" produce very different products, and the difference has to
 * be legible to the code that depends on it.
 */

import type { Coordinates } from '../domain/geography';
import type { LocationFix } from '../domain/presence';

export type LocationPermission =
  | 'undetermined'
  | 'denied'
  /** Foreground only. Presence will lapse whenever the app is not open. */
  | 'while_in_use'
  /** What persistent presence actually needs. */
  | 'always'
  /** OS-level services are off entirely; not the app's to fix. */
  | 'services_disabled';

export interface LocationService {
  getPermission(): Promise<LocationPermission>;
  /**
   * Prompt for permission.
   *
   * `desired` says which level the feature needs, so the caller can ask for
   * 'always' only when the user has actually turned DTF on — asking on first
   * launch is how apps get denied permanently.
   */
  requestPermission(desired: 'while_in_use' | 'always'): Promise<LocationPermission>;

  /** One reading, or null if unavailable. */
  getCurrentFix(): Promise<LocationFix | null>;

  /**
   * Subscribe to fixes. Returns an unsubscribe function.
   *
   * Implementations should honour `minIntervalMs` and `minDistanceMetres` —
   * continuous presence is a battery commitment, and a nightlife app that
   * flattens a phone by midnight has failed at its own use case.
   */
  watch(
    options: WatchOptions,
    onFix: (fix: LocationFix) => void,
  ): () => void;
}

export interface WatchOptions {
  readonly minIntervalMs: number;
  readonly minDistanceMetres: number;
  /** Whether updates should continue with the app backgrounded. */
  readonly background: boolean;
}

/**
 * Sensible defaults.
 *
 * Judgment call, flagged: two minutes and fifty metres is frequent enough that
 * a friend's dot is not visibly wrong, and coarse enough not to be a tracker.
 * It also sits inside the domain's 20-minute freshness window with room for
 * several missed readings. Wants measuring on a real device.
 */
export const DEFAULT_WATCH: WatchOptions = {
  minIntervalMs: 2 * 60 * 1000,
  minDistanceMetres: 50,
  background: true,
};

/** Scripted implementation for tests and for running the app without a device. */
export class FakeLocationService implements LocationService {
  private permission: LocationPermission;
  private fix: LocationFix | null = null;
  private readonly watchers = new Set<(fix: LocationFix) => void>();

  constructor(permission: LocationPermission = 'undetermined') {
    this.permission = permission;
  }

  async getPermission(): Promise<LocationPermission> {
    return this.permission;
  }

  async requestPermission(desired: 'while_in_use' | 'always'): Promise<LocationPermission> {
    // A denial is sticky, the same way it is on a real device — the OS will not
    // re-prompt, and code that assumes otherwise loops forever.
    if (this.permission === 'denied' || this.permission === 'services_disabled') {
      return this.permission;
    }
    this.permission = desired;
    return this.permission;
  }

  async getCurrentFix(): Promise<LocationFix | null> {
    if (!this.canRead()) return null;
    return this.fix;
  }

  watch(_options: WatchOptions, onFix: (fix: LocationFix) => void): () => void {
    this.watchers.add(onFix);
    return () => this.watchers.delete(onFix);
  }

  private canRead(): boolean {
    return this.permission === 'always' || this.permission === 'while_in_use';
  }

  // ---- test controls ------------------------------------------------------

  setPermission(permission: LocationPermission): void {
    this.permission = permission;
  }

  /** Push a reading to every watcher, as the OS would. */
  emit(at: Coordinates, recordedAt: number, accuracyMetres: number | null = 10): void {
    this.fix = { at, recordedAt, accuracyMetres };
    if (!this.canRead()) return;
    for (const watcher of [...this.watchers]) watcher(this.fix);
  }

  watcherCount(): number {
    return this.watchers.size;
  }
}
