import { Night } from './types';

// Closed nights — the unfakeable receipt behind Standing, earned friends, and
// Backing eligibility (Map v3 spec §4.3). Seeded history for the demo's featured users.
export const nights: Night[] = [
  { id: 'n1', date: '3 weeks ago', venueId: 'v-lantern', crewIds: ['g-you', 'g-locals'], attendeeIds: ['you', 'u-theo', 'u-marcus', 'u-ollie', 'u-dan', 'u-grace', 'u-leon'] },
  { id: 'n2', date: '2 weeks ago', venueId: 'v-archive9', crewIds: ['g-you', 'g-maya'], attendeeIds: ['you', 'u-theo', 'u-marcus', 'u-ollie', 'u-maya', 'u-zara', 'u-elle', 'u-nia'] },
  { id: 'n3', date: 'Last Saturday', venueId: 'v-archive9', crewIds: ['g-you'], attendeeIds: ['you', 'u-theo', 'u-marcus', 'u-ollie'] },
];

export const nightById = (id: string): Night => {
  const n = nights.find((x) => x.id === id);
  if (!n) throw new Error(`Unknown night: ${id}`);
  return n;
};
