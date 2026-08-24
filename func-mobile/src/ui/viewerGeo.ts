import type { ViewerSnapshot } from '@/data/views';
import type { LatLng } from '@/domain/types';

/**
 * The viewer's own live location -- disclosed only while their own presence
 * is live (see `personDisclosure`'s 'self' branch). Never another user's
 * location, and never available at all when the viewer is off/stale, since
 * `ViewerSnapshot` simply does not carry a raw location field otherwise.
 */
export function viewerLocation(view: ViewerSnapshot): LatLng | null {
  const mine = view.presence.find((p) => p.person.id === view.self.id);
  return mine && mine.disclosure.kind === 'self' ? mine.disclosure.location : null;
}
