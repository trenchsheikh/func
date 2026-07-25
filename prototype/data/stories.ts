import { Story } from './types';

// "Flares" — venue-anchored ephemeral stories (Map v3 spec §2). Never person-anchored.
// minutesAgo spans the full decay range so the demo shows hot / ember / gone states.
// Weighted toward The Arches so its burn rings read as the hottest in the city.
export const stories: Story[] = [
  { id: 's1', venueId: 'v-archive9', groupId: 'g-maya', authorId: 'u-maya', minutesAgo: 8, audience: 'city', gradient: ['#A855F7', '#EC4899'], caption: 'Rooftop room is UNREAL right now' },
  { id: 's2', venueId: 'v-archive9', groupId: 'g-bassline', authorId: 'u-kofi', minutesAgo: 22, audience: 'city', gradient: ['#22D3EE', '#A855F7'], caption: 'Front left, bassline just dropped' },
  { id: 's3', venueId: 'v-archive9', groupId: 'g-maya', authorId: 'u-zara', minutesAgo: 55, audience: 'circles', gradient: ['#EC4899', '#F97316'], caption: 'Queue is nothing, come through' },
  { id: 's4', venueId: 'v-archive9', groupId: 'g-bassline', authorId: 'u-ryan', minutesAgo: 140, audience: 'city', gradient: ['#6366F1', '#22D3EE'], caption: 'Been rammed since 11' },
  { id: 's5', venueId: 'v-vault', groupId: 'g-bassline', authorId: 'u-tomas', minutesAgo: 15, audience: 'city', gradient: ['#F43F5E', '#A855F7'], caption: 'Techno room going off' },
  { id: 's6', venueId: 'v-vault', groupId: 'g-bassline', authorId: 'u-ryan', minutesAgo: 90, audience: 'circles', gradient: ['#10B981', '#22D3EE'], caption: 'Warehouse Wax lineup is unreal tonight' },
  { id: 's7', venueId: 'v-skyline', groupId: 'g-rooftop', authorId: 'u-sofia', minutesAgo: 35, audience: 'city', gradient: ['#F59E0B', '#EC4899'], caption: 'Golden hour up here, come up' },
  { id: 's8', venueId: 'v-skyline', groupId: 'g-rooftop', authorId: 'u-james', minutesAgo: 200, audience: 'city', gradient: ['#8B5CF6', '#3B82F6'], caption: '2-for-1 finishing soon' },
  { id: 's9', venueId: 'v-lantern', groupId: 'g-locals', authorId: 'u-dan', minutesAgo: 50, audience: 'circles', gradient: ['#A855F7', '#EC4899'], caption: 'Quiz is brutal tonight, send help' },
  { id: 's10', venueId: 'v-keg', groupId: 'g-unihill', authorId: 'u-amara', minutesAgo: 18, audience: 'city', gradient: ['#22D3EE', '#A855F7'], caption: '£4 entry, worth every penny' },
  { id: 's11', venueId: 'v-keg', groupId: 'g-unihill', authorId: 'u-josh', minutesAgo: 260, audience: 'city', gradient: ['#EC4899', '#F97316'], caption: 'Karaoke just started' },
  { id: 's12', venueId: 'v-barrel', groupId: 'g-nomads', authorId: 'u-lena', minutesAgo: 70, audience: 'circles', gradient: ['#6366F1', '#22D3EE'], caption: 'Orange wine flight, no regrets' },
  { id: 's13', venueId: 'v-dockside', groupId: 'g-docks', authorId: 'u-isla', minutesAgo: 100, audience: 'city', gradient: ['#F43F5E', '#A855F7'], caption: 'Acoustic set starting, chill one tonight' },
  { id: 's14', venueId: 'v-brickhouse', groupId: 'g-maya', authorId: 'u-nia', minutesAgo: 45, audience: 'city', gradient: ['#10B981', '#22D3EE'], caption: 'Overflow from Archive 9, still good energy' },
  { id: 's15', venueId: 'v-archive9', groupId: 'g-maya', authorId: 'u-maya', minutesAgo: 3, audience: 'city', gradient: ['#F59E0B', '#EC4899'], caption: 'okay this is the one, get down here' },
];

export const storiesForVenue = (venueId: string): Story[] =>
  stories.filter((s) => s.venueId === venueId).sort((a, b) => a.minutesAgo - b.minutesAgo);

// Freshness tiers matching the Beacon burn-ring spec: hot < 2h, ember < 6h, else gone.
export type FlareTier = 'hot' | 'ember' | 'gone';
export const flareTier = (minutesAgo: number): FlareTier =>
  minutesAgo < 120 ? 'hot' : minutesAgo < 360 ? 'ember' : 'gone';
