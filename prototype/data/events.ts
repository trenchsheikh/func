import { FuncEvent } from './types';

export const events: FuncEvent[] = [
  {
    id: 'e-neon', title: 'Neon Fridays', venue: 'Archive 9', district: 'arches',
    when: 'Tonight · 23:00', price: '£8',
    description: 'The flagship night in The Arches. Three rooms under the railway: house, bassline, and a smoking yard with a toastie hatch. Ends when the trains start.',
    attendeeIds: ['u-maya', 'u-zara', 'u-kofi', 'u-ryan', 'u-tomas', 'u-lena', 'u-sam'], emoji: '🌀',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 8, max: 8 },
      { label: 'Drinks', emoji: '🍹', min: 12, max: 25 },
      { label: 'Yard toastie', emoji: '🥪', min: 0, max: 6 },
      { label: 'Taxi home', emoji: '🚕', min: 0, max: 8 },
    ],
  },
  {
    id: 'e-wax', title: 'Warehouse Wax', venue: 'The Vault', district: 'arches',
    when: 'Sat · 23:30', price: '£12',
    description: 'Vinyl-only warehouse session. Phones away, hands up. Bassline Gang have claimed front left — come say hi.',
    attendeeIds: ['u-kofi', 'u-ryan', 'u-tomas', 'u-marcus'], emoji: '📀',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 12, max: 12 },
      { label: 'Drinks', emoji: '🍺', min: 15, max: 30 },
      { label: 'Cloakroom', emoji: '🧥', min: 2, max: 2 },
      { label: 'Taxi home', emoji: '🚕', min: 4, max: 10 },
    ],
  },
  {
    id: 'e-rooftop', title: 'Skyline Rooftop Social', venue: 'Skyline Rooftop', district: 'harbourside',
    when: 'Fri · 19:00', price: '£5',
    description: 'Golden hour over the harbour, DJ until midnight. First drink on the house before 8. The easiest place in Velmont to meet another group.',
    attendeeIds: ['u-sofia', 'u-james', 'u-priya', 'u-arun', 'u-nia'], emoji: '🌇',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 5, max: 5 },
      { label: 'First drink', emoji: '🍸', min: 0, max: 0 },
      { label: 'More drinks', emoji: '🍹', min: 8, max: 22 },
      { label: 'Harbour snacks', emoji: '🍤', min: 0, max: 9 },
    ],
  },
  {
    id: 'e-market', title: 'Harbour Food Market', venue: 'West Quay', district: 'harbourside',
    when: 'Sat · 12:00', price: 'Free',
    description: 'Forty stalls along the waterfront. The bao queue is worth it. Daytime Func — bring anyone.',
    attendeeIds: ['u-grace', 'u-isla', 'u-freya', 'u-ollie'], emoji: '🥟',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 0, max: 0 },
      { label: 'The bao', emoji: '🥟', min: 6, max: 9 },
      { label: 'Second lap', emoji: '🍜', min: 0, max: 12 },
      { label: 'Coffee', emoji: '☕', min: 3, max: 4 },
    ],
  },
  {
    id: 'e-fives', title: 'Five-a-side Fridays', venue: 'Uni Hill Rec', district: 'unihill',
    when: 'Fri · 18:00', price: '£3',
    description: 'Turn up, get picked, play three games. Winners stay on, losers buy the post-match chips.',
    attendeeIds: ['u-josh', 'u-theo', 'u-noah'], emoji: '⚽',
    costBreakdown: [
      { label: 'Pitch fee', emoji: '🎟', min: 3, max: 3 },
      { label: 'Post-match chips', emoji: '🍟', min: 0, max: 5 },
      { label: 'Winner stays free', emoji: '🏆', min: 0, max: 0 },
    ],
  },
  {
    id: 'e-quiz', title: 'Lantern Quiz Night', venue: 'The Lantern', district: 'oldquarter',
    when: 'Thu · 20:00', price: 'Free',
    description: 'Eight rounds, one music round, one very contested picture round. The Locals have won three weeks straight — someone stop them.',
    attendeeIds: ['u-dan', 'u-grace', 'u-leon', 'u-elle'], emoji: '🧠',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 0, max: 0 },
      { label: 'Pints', emoji: '🍺', min: 5, max: 14 },
      { label: 'Chips for the table', emoji: '🍟', min: 0, max: 4 },
    ],
  },
  {
    id: 'e-student', title: 'Student Night', venue: 'The Keg', district: 'unihill',
    when: 'Wed · 22:00', price: '£4',
    description: 'The Wednesday institution of Uni Hill. Cheap doubles, questionable karaoke, guaranteed stories.',
    attendeeIds: ['u-amara', 'u-becca', 'u-sam', 'u-josh', 'u-tilly'], emoji: '🎤',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 4, max: 4 },
      { label: 'Doubles', emoji: '🥃', min: 6, max: 15 },
      { label: 'Cheesy chips', emoji: '🧀', min: 0, max: 4 },
      { label: 'Walk home', emoji: '🚶', min: 0, max: 0 },
    ],
  },
  {
    id: 'e-run', title: 'Sunrise Run Club', venue: 'Harbour Loop', district: 'harbourside',
    when: 'Sun · 07:30', price: 'Free',
    description: '5k along the water, all paces, ends at a bakery. The healthiest thing on Func by a mile.',
    attendeeIds: ['u-freya', 'u-noah', 'u-priya'], emoji: '🌅',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 0, max: 0 },
      { label: 'Bakery finish', emoji: '🥐', min: 3, max: 7 },
    ],
  },
  {
    id: 'e-vinyl', title: 'Vinyl & Vinho', venue: 'Barrel House', district: 'oldquarter',
    when: 'Fri · 20:00', price: '£6',
    description: 'Bring a record, drink orange wine, argue about B-sides. Leon will be there. You have been warned.',
    attendeeIds: ['u-leon', 'u-dan', 'u-lena'], emoji: '🍷',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 6, max: 6 },
      { label: 'Orange wine', emoji: '🍷', min: 7, max: 18 },
      { label: 'Cheese board', emoji: '🧀', min: 0, max: 9 },
    ],
  },
  {
    id: 'e-tap', title: 'Dockside Tap Takeover', venue: 'Dockside Brew', district: 'docks',
    when: 'Fri · 18:00', price: 'Free entry',
    description: 'Six guest breweries, one acoustic set, zero queues. The Docks before everyone finds out about the Docks.',
    attendeeIds: ['u-isla', 'u-felix', 'u-carmen'], emoji: '🍺',
    costBreakdown: [
      { label: 'Entry', emoji: '🎟', min: 0, max: 0 },
      { label: 'Guest taps', emoji: '🍺', min: 6, max: 16 },
      { label: 'Dock dogs', emoji: '🌭', min: 0, max: 7 },
    ],
  },
];

export const eventById = (id: string): FuncEvent => {
  const e = events.find((x) => x.id === id);
  if (!e) throw new Error(`Unknown event: ${id}`);
  return e;
};
