/**
 * Branded identifiers.
 *
 * The prototype used bare strings for every id, and let a business id double as
 * an account id and a host id. That worked, but it is exactly where the two
 * identity bugs found during the bug hunt came from — nothing stopped a venue
 * id being passed where a person id was expected.
 *
 * Branding makes those mistakes compile errors. The runtime representation is
 * still just a string, so persistence and wire formats are unchanged.
 */

declare const brand: unique symbol;

type Brand<T, B extends string> = T & { readonly [brand]: B };

export type PersonId = Brand<string, 'PersonId'>;
export type BusinessId = Brand<string, 'BusinessId'>;
export type VenueId = Brand<string, 'VenueId'>;
export type TableId = Brand<string, 'TableId'>;
export type AfterPartyId = Brand<string, 'AfterPartyId'>;
export type SpotId = Brand<string, 'SpotId'>;
export type StoryId = Brand<string, 'StoryId'>;
export type RequestId = Brand<string, 'RequestId'>;
export type PassId = Brand<string, 'PassId'>;
export type ThreadId = Brand<string, 'ThreadId'>;
export type MessageId = Brand<string, 'MessageId'>;
export type CityId = Brand<string, 'CityId'>;
export type DistrictId = Brand<string, 'DistrictId'>;
export type RegionId = Brand<string, 'RegionId'>;
export type CountryId = Brand<string, 'CountryId'>;

/**
 * Anyone who can act: a person or a business.
 *
 * The prototype deliberately let a business be its own actor rather than a
 * roster of users, and that decision is preserved — it is what keeps "groups as
 * objects" from creeping back in under another name. What changes is that the
 * union is now explicit rather than implied by two id schemes sharing a field.
 */
export type ActorId = PersonId | BusinessId;

export const asPersonId = (raw: string): PersonId => raw as PersonId;
export const asBusinessId = (raw: string): BusinessId => raw as BusinessId;
export const asVenueId = (raw: string): VenueId => raw as VenueId;
export const asTableId = (raw: string): TableId => raw as TableId;
export const asAfterPartyId = (raw: string): AfterPartyId => raw as AfterPartyId;
export const asSpotId = (raw: string): SpotId => raw as SpotId;
export const asStoryId = (raw: string): StoryId => raw as StoryId;
export const asRequestId = (raw: string): RequestId => raw as RequestId;
export const asPassId = (raw: string): PassId => raw as PassId;
export const asThreadId = (raw: string): ThreadId => raw as ThreadId;
export const asMessageId = (raw: string): MessageId => raw as MessageId;
export const asCityId = (raw: string): CityId => raw as CityId;
export const asDistrictId = (raw: string): DistrictId => raw as DistrictId;
