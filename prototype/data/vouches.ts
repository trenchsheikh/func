import { Vouch } from './types';

// "Backings" — stake-based vouches, gated by shared attendance (Map v3 spec §3.2).
// Typed, 4-verb vocabulary only; every entry references a real night in nights.ts.
export const vouches: Vouch[] = [
  { fromId: 'you', toId: 'u-theo', type: 'great_host', nightId: 'n2' },
  { fromId: 'u-marcus', toId: 'u-theo', type: 'shows_up', nightId: 'n3' },
  { fromId: 'u-ollie', toId: 'u-theo', type: 'shows_up', nightId: 'n1' },
  { fromId: 'u-theo', toId: 'you', type: 'shows_up', nightId: 'n3' },
  { fromId: 'u-maya', toId: 'you', type: 'good_with_new_people', nightId: 'n2' },
  { fromId: 'u-dan', toId: 'you', type: 'shows_up', nightId: 'n1' },
  { fromId: 'you', toId: 'u-maya', type: 'great_host', nightId: 'n2' },
  { fromId: 'u-zara', toId: 'u-maya', type: 'looks_out', nightId: 'n2' },
  { fromId: 'u-grace', toId: 'u-dan', type: 'great_host', nightId: 'n1' },
  { fromId: 'u-leon', toId: 'u-dan', type: 'shows_up', nightId: 'n1' },
  { fromId: 'you', toId: 'u-dan', type: 'good_with_new_people', nightId: 'n1' },
];

export const vouchesFor = (userId: string): Vouch[] => vouches.filter((v) => v.toId === userId);
export const vouchesFrom = (userId: string): Vouch[] => vouches.filter((v) => v.fromId === userId);

export const VOUCH_LABEL: Record<Vouch['type'], string> = {
  shows_up: 'Shows up',
  great_host: 'Great host',
  good_with_new_people: 'Good with new people',
  looks_out: 'Looks out for people',
};
