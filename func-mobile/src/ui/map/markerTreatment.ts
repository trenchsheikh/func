import type { PersonDisclosure } from '@/domain/visibility';

export interface PersonMarkerTreatment {
  showPhoto: true;
  showHeartbeat: boolean;
  showPremiumRing: boolean;
}

/**
 * Takes only 'self' | 'exact' -- the two `PersonDisclosure` kinds that ever
 * back a `person` map pin (see `content.ts`). 'business' disclosures never
 * reach this function: they resolve to a `business` pin instead, which
 * renders the fixed silver treatment in `Pins.tsx` and never derives
 * anything from the operator's identity.
 */
export function personMarkerTreatment(disclosure: Extract<PersonDisclosure, { kind: 'self' | 'exact' }>): PersonMarkerTreatment {
  return {
    showPhoto: true,
    showHeartbeat: disclosure.status === 'dtf',
    showPremiumRing: disclosure.premium,
  };
}
