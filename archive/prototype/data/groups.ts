import { Group } from './types';

export const groups: Group[] = [
  { id: 'g-you', name: 'You + 3', memberIds: ['you', 'u-theo', 'u-marcus', 'u-ollie'], vibe: 'Four mates, big energy, average dancing', lookingFor: 'People to join forces with on a night out', district: 'arches', night: 'Saturday' },
  { id: 'g-maya', name: 'Maya + 3', memberIds: ['u-maya', 'u-zara', 'u-elle', 'u-nia'], vibe: 'Bassline girls, pre-drinks playlist elite', lookingFor: 'Another group for Saturday in The Arches', district: 'arches', night: 'Saturday' },
  { id: 'g-rooftop', name: 'Rooftop Crew', memberIds: ['u-sofia', 'u-james', 'u-priya'], vibe: 'Golden hour cocktails, harbour views', lookingFor: 'Chill people for rooftop socials', district: 'harbourside', night: 'Friday' },
  { id: 'g-locals', name: 'The Locals', memberIds: ['u-dan', 'u-grace', 'u-leon'], vibe: 'Old Quarter veterans, quality over queues', lookingFor: 'A team for the Thursday quiz', district: 'oldquarter', night: 'Thursday' },
  { id: 'g-bassline', name: 'Bassline Gang', memberIds: ['u-kofi', 'u-ryan', 'u-tomas'], vibe: 'Front left until the lights come on', lookingFor: 'Ravers for Warehouse Wax', district: 'arches', night: 'Saturday' },
  { id: 'g-unihill', name: 'Uni Hill Five', memberIds: ['u-amara', 'u-becca', 'u-sam', 'u-josh', 'u-tilly'], vibe: 'Freshers with a group chat that never sleeps', lookingFor: 'More people for Student Night', district: 'unihill', night: 'Wednesday' },
  { id: 'g-runners', name: 'Harbour Runners', memberIds: ['u-freya', 'u-noah'], vibe: '5k then flat whites', lookingFor: 'Runners for Sunday sunrise club', district: 'harbourside', night: 'Sunday' },
  { id: 'g-docks', name: 'Docks Collective', memberIds: ['u-isla', 'u-felix'], vibe: 'Art, ale and acoustic sets', lookingFor: 'People who want the quiet-cool side of Velmont', district: 'docks', night: 'Friday' },
  { id: 'g-nomads', name: 'Neon Nomads', memberIds: ['u-lena', 'u-arun'], vibe: 'New in town, zero local knowledge, full enthusiasm', lookingFor: 'Locals to show us a proper Velmont night', district: 'oldquarter', night: 'Friday' },
  { id: 'g-salsa', name: 'Salsa Six', memberIds: ['u-carmen', 'u-mateo'], vibe: 'We dance. You can too. Honestly.', lookingFor: 'Beginners for Friday social', district: 'oldquarter', night: 'Friday' },
];

export const groupById = (id: string): Group => {
  const g = groups.find((x) => x.id === id);
  if (!g) throw new Error(`Unknown group: ${id}`);
  return g;
};
