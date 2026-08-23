import type { ChatThread, MessageRequest, PoolInvite, PoolRequest, Story } from '@/domain/types';
import { ME, groupIdFor } from './users';

const g = groupIdFor;

type InviteSeed = Omit<PoolInvite, 'requests' | 'attendeeGroupIds' | 'groupChatId' | 'createdAt'> & {
  agoMinutes: number;
  /** Attendee groups beyond the host. Party size recorded as an accepted request. */
  attending?: Array<{ group: string; size: number }>;
  pending?: Array<{ group: string; size: number; message?: string }>;
  chat?: Array<{ from: string; text: string; agoMinutes: number }>;
};

const SEEDS: InviteSeed[] = [
  // --- hosted by the current user ------------------------------------------
  {
    id: 'inv_afters',
    hostGroupId: g(ME),
    description: 'Afters at mine after Audiowave — rooftop, bring a jacket 🧥',
    location: { lat: 37.7605, lng: -122.4212 },
    capacity: { mode: 'capped', max: 12 },
    access: { mode: 'private' },
    createdByAccountType: 'personal',
    agoMinutes: 95,
    attending: [{ group: g('u_sasha'), size: 2 }],
    pending: [
      { group: g('u_theo'), size: 2, message: "we're bringing drinks 🍾" },
      { group: g('u_noor'), size: 3 },
      { group: g('u_dev'), size: 1, message: 'know Priya from work, promise we are chill' },
    ],
    chat: [
      { from: ME, text: 'Door code is 4412. Roof is up the back stairs.', agoMinutes: 60 },
      { from: 'u_sasha', text: 'omw after Halo, saving us a corner?', agoMinutes: 31 },
    ],
  },
  {
    id: 'inv_dolores',
    hostGroupId: g(ME),
    description: 'Sunday day-drinking on the Dolores hill, low key ☀️',
    location: { lat: 37.7598, lng: -122.4271 },
    venueId: 'v_dolores',
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
    createdByAccountType: 'personal',
    agoMinutes: 400,
    pending: [
      { group: g('u_rosa'), size: 2 },
      { group: g('u_jun'), size: 1 },
    ],
    chat: [{ from: ME, text: 'Top of the hill by the palm trees.', agoMinutes: 390 }],
  },

  // --- hosted by others ------------------------------------------------------
  {
    id: 'inv_warehouse',
    hostGroupId: g('u_theo'),
    description: 'Warehouse afters in Dogpatch 🪩 going till late',
    location: { lat: 37.7583, lng: -122.3901 },
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
    createdByAccountType: 'personal',
    agoMinutes: 40,
    attending: [
      { group: g('u_priya'), size: 1 },
      { group: g('u_kai'), size: 1 },
      { group: g('u_amara'), size: 1 },
    ],
    chat: [
      { from: 'u_theo', text: 'Sound system is absurd. Come through.', agoMinutes: 38 },
      { from: 'u_kai', text: 'on the way 🏃', agoMinutes: 12 },
    ],
  },
  {
    id: 'inv_karaoke',
    hostGroupId: g('u_priya'),
    description: 'Private karaoke room on Nob Hill, 8 spots, we sing badly',
    location: { lat: 37.7919, lng: -122.4141 },
    venueId: 'v_grotto',
    capacity: { mode: 'capped', max: 8 },
    access: { mode: 'public' },
    createdByAccountType: 'personal',
    agoMinutes: 120,
    attending: [
      { group: g('u_luca'), size: 2 },
      { group: g('u_noor'), size: 3 },
    ],
    chat: [{ from: 'u_priya', text: 'Room B, ask for Priya at the desk.', agoMinutes: 110 }],
  },
  {
    id: 'inv_dinner',
    hostGroupId: g('u_luca'),
    description: 'Dinner at Kaimuki then Halo — table for 6',
    location: { lat: 37.7860, lng: -122.4179 },
    venueId: 'v_kaimuki',
    capacity: { mode: 'capped', max: 6 },
    access: { mode: 'private' },
    createdByAccountType: 'personal',
    agoMinutes: 200,
    attending: [{ group: g('u_rosa'), size: 2 }],
    chat: [{ from: 'u_luca', text: 'Reservation is under Luca, 8:30.', agoMinutes: 190 }],
  },
  {
    id: 'inv_sunrise',
    hostGroupId: g('u_amara'),
    description: 'Sunrise walk + coffee at Ocean Beach after the night 🌅',
    location: { lat: 37.7598, lng: -122.5100 },
    venueId: 'v_oceanbeach',
    capacity: { mode: 'uncapped' },
    access: { mode: 'private' },
    createdByAccountType: 'personal',
    agoMinutes: 300,
    chat: [{ from: 'u_amara', text: 'Meet at the Trouble Brew side, 6:15ish.', agoMinutes: 290 }],
  },
  {
    id: 'inv_audiowave',
    hostGroupId: g('u_wren'),
    description: 'Late set at Audiowave — guestlist open till 1am, no cover',
    location: { lat: 37.7716, lng: -122.4126 },
    venueId: 'v_audiowave',
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
    createdByAccountType: 'business',
    agoMinutes: 180,
    attending: [{ group: g('u_kai'), size: 1 }],
    chat: [{ from: 'u_wren', text: 'Doors 10. Say "func" at the door for the list.', agoMinutes: 170 }],
  },
  {
    id: 'inv_kickback',
    hostGroupId: g('u_kai'),
    description: 'Tiny kickback at Kai’s, 4 max, vinyl only',
    location: { lat: 37.7733, lng: -122.4110 },
    capacity: { mode: 'capped', max: 4 },
    access: { mode: 'public' },
    createdByAccountType: 'personal',
    agoMinutes: 70,
    attending: [
      { group: g('u_theo'), size: 2 },
      { group: g('u_priya'), size: 2 },
    ],
    chat: [{ from: 'u_kai', text: 'full house! thanks all', agoMinutes: 20 }],
  },
  {
    id: 'inv_crawl',
    hostGroupId: g('u_noor'),
    description: 'Castro crawl — starting at Castro Corner, ending who knows',
    location: { lat: 37.7620, lng: -122.4348 },
    venueId: 'v_castrocorner',
    capacity: { mode: 'uncapped' },
    access: { mode: 'public' },
    createdByAccountType: 'personal',
    agoMinutes: 150,
    attending: [
      { group: g(ME), size: 2 },
      { group: g('u_sasha'), size: 2 },
    ],
    chat: [
      { from: 'u_noor', text: 'First stop 9pm. Wear shoes you can walk in.', agoMinutes: 140 },
      { from: ME, text: 'bringing Inès, see you there', agoMinutes: 100 },
      { from: 'u_sasha', text: 'yesss', agoMinutes: 98 },
    ],
  },
];

function iso(now: Date, agoMinutes: number): string {
  return new Date(now.getTime() - agoMinutes * 60_000).toISOString();
}

export function buildInvites(now: Date): { invites: PoolInvite[]; threads: ChatThread[] } {
  const invites: PoolInvite[] = [];
  const threads: ChatThread[] = [];
  let n = 0;

  for (const s of SEEDS) {
    const chatId = `thr_${s.id}`;
    const requests: PoolRequest[] = [
      ...(s.attending ?? []).map<PoolRequest>((a) => ({
        requestingGroupId: a.group,
        partySize: a.size,
        status: 'accepted',
      })),
      ...(s.pending ?? []).map<PoolRequest>((p) => ({
        requestingGroupId: p.group,
        partySize: p.size,
        status: 'pending',
        ...(p.message
          ? { preAcceptMessage: { text: p.message, messageRequestStatus: 'pending' } }
          : {}),
      })),
    ];
    const attendeeGroupIds = [s.hostGroupId, ...(s.attending ?? []).map((a) => a.group)];

    invites.push({
      id: s.id,
      hostGroupId: s.hostGroupId,
      description: s.description,
      location: s.location,
      ...(s.venueId ? { venueId: s.venueId } : {}),
      capacity: s.capacity,
      access: s.access,
      requests,
      attendeeGroupIds,
      groupChatId: chatId,
      createdByAccountType: s.createdByAccountType,
      createdAt: iso(now, s.agoMinutes),
    });

    // Every invite gets its group chat. Private → accepted groups only; public → whoever joined.
    threads.push({
      id: chatId,
      kind: 'pool',
      title: s.description.length > 40 ? `${s.description.slice(0, 40)}…` : s.description,
      participantGroupIds: attendeeGroupIds,
      poolInviteId: s.id,
      messages: (s.chat ?? []).map((m) => ({
        id: `msg_${s.id}_${n++}`,
        senderUserId: m.from,
        text: m.text,
        sentAt: iso(now, m.agoMinutes),
      })),
    });
  }

  return { invites, threads };
}

export function buildMessaging(now: Date): { threads: ChatThread[]; messageRequests: MessageRequest[] } {
  const messageRequests: MessageRequest[] = [
    {
      id: 'mr_jun',
      fromUserId: 'u_jun',
      toUserId: ME,
      text: 'hey! saw you at the Lantern last week — you heading to Audiowave tonight?',
      status: 'pending',
      createdAt: iso(now, 55),
    },
    {
      id: 'mr_felix',
      fromUserId: 'u_felix',
      toUserId: ME,
      text: 'your afters look fun, any chance of a +1 later?',
      status: 'pending',
      createdAt: iso(now, 25),
    },
    {
      id: 'mr_priya',
      fromUserId: 'u_priya',
      toUserId: ME,
      text: 'are you going to Theo’s thing?',
      status: 'accepted',
      createdAt: iso(now, 600),
    },
  ];

  const threads: ChatThread[] = [
    {
      id: 'thr_dm_priya',
      kind: 'dm',
      title: 'Priya',
      participantGroupIds: [g('u_priya'), g(ME)],
      messages: [
        { id: 'msg_dm_1', senderUserId: 'u_priya', text: 'are you going to Theo’s thing?', sentAt: iso(now, 600) },
        { id: 'msg_dm_2', senderUserId: ME, text: 'maybe after the crawl, you?', sentAt: iso(now, 580) },
        { id: 'msg_dm_3', senderUserId: 'u_priya', text: 'yeah, karaoke first though 🎤', sentAt: iso(now, 575) },
      ],
    },
  ];

  return { threads, messageRequests };
}

export function buildStories(now: Date): Story[] {
  return [
    { id: 'sty_1', authorUserId: 'u_theo', text: 'soundcheck done. tonight is going to be stupid.', createdAt: iso(now, 200) },
    { id: 'sty_2', authorUserId: ME, text: 'rooftop is ready 🧹', createdAt: iso(now, 100) },
  ];
}
