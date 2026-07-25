import { InboxItem, PoolInvite } from './types';

// Open invites shown in Pool → Browse.
export const poolInvites: PoolInvite[] = [
  { id: 'p-maya', groupId: 'g-maya', note: 'Pres at ours then Archive 9. Bring the energy.' },
  { id: 'p-bassline', groupId: 'g-bassline', note: 'Warehouse Wax Saturday. Front left. No tourists.' },
  { id: 'p-rooftop', groupId: 'g-rooftop', note: 'Skyline Rooftop, Friday golden hour. Dress nice-ish.' },
  { id: 'p-locals', groupId: 'g-locals', note: 'Quiz at The Lantern needs two more brains.' },
  { id: 'p-unihill', groupId: 'g-unihill', note: 'The Keg Wednesday. £4 entry, priceless memories.' },
  { id: 'p-nomads', groupId: 'g-nomads', note: 'Adopt us. We are new and very keen.' },
  { id: 'p-salsa', groupId: 'g-salsa', note: 'Friday salsa social — total beginners welcome.' },
  { id: 'p-docks', groupId: 'g-docks', note: 'Tap takeover + acoustic set at Dockside Brew.' },
];

// Pre-seeded Inbox: demonstrates every state without any user action (spec §Mock data).
export const seedInbox: InboxItem[] = [
  { id: 'i-incoming', direction: 'incoming', groupId: 'g-maya', status: 'pending', note: 'Maya + 3 invited your group to join Saturday in The Arches' },
  { id: 'i-outgoing', direction: 'outgoing', groupId: 'g-rooftop', status: 'pending', note: 'You invited Rooftop Crew to Friday drinks' },
  { id: 'i-accepted', direction: 'outgoing', groupId: 'g-locals', status: 'accepted', note: 'The Locals accepted your quiz night invite' },
  { id: 'i-denied', direction: 'outgoing', groupId: 'g-bassline', status: 'denied', note: 'Bassline Gang passed on Friday — "strictly Saturdays"' },
];
