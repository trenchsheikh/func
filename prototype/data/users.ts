import { Standing, StatusRibbon, User } from './types';

// "You" — fixed demo persona (19, out with 3 mates), per spec.
export const YOU_ID = 'you';

type RawUser = Omit<User, 'standing' | 'nightsClosed' | 'earnedFriendIds' | 'roles' | 'status'>;

const rawUsers: RawUser[] = [
  { id: 'you', name: 'Jordan', age: 19, gender: 'M', bio: 'Out most weekends with the boys. Arches regular, terrible at pool, great at karaoke.', interests: ['House music', 'Five-a-side', 'Karaoke'], district: 'arches', groupId: 'g-you', verified: true },
  { id: 'u-theo', name: 'Theo', age: 19, gender: 'M', bio: 'The one who books the table. And loses it.', interests: ['DJing', 'Football', 'Street food'], district: 'arches', groupId: 'g-you', verified: true },
  { id: 'u-marcus', name: 'Marcus', age: 20, gender: 'M', bio: 'Gym at 7, Arches at 11.', interests: ['Gym', 'Techno', 'Poker'], district: 'arches', groupId: 'g-you', verified: true },
  { id: 'u-ollie', name: 'Ollie', age: 19, gender: 'M', bio: 'Designated navigator of the night. Never lost a kebab.', interests: ['Film', 'Indie', 'Kebabs'], district: 'oldquarter', groupId: 'g-you', verified: true },

  { id: 'u-maya', name: 'Maya', age: 20, gender: 'F', bio: 'Velmont born and raised. If the bassline is good, we are there.', interests: ['Bassline', 'Brunch', 'Netball'], district: 'arches', groupId: 'g-maya', verified: true },
  { id: 'u-zara', name: 'Zara', age: 19, gender: 'F', bio: 'Chief playlist officer of the group.', interests: ['R&B', 'Photography', 'Thrifting'], district: 'arches', groupId: 'g-maya', verified: true },
  { id: 'u-elle', name: 'Elle', age: 20, gender: 'F', bio: 'Will beat you at darts and be nice about it.', interests: ['Darts', 'Comedy nights', 'Running'], district: 'oldquarter', groupId: 'g-maya', verified: true },
  { id: 'u-nia', name: 'Nia', age: 19, gender: 'F', bio: 'Here for rooftop sunsets and questionable dance moves.', interests: ['Afrobeats', 'Baking', 'Yoga'], district: 'harbourside', groupId: 'g-maya', verified: true },

  { id: 'u-sofia', name: 'Sofia', age: 21, gender: 'F', bio: 'Harbourside is home. Boat parties > house parties.', interests: ['Sailing', 'Cocktails', 'Salsa'], district: 'harbourside', groupId: 'g-rooftop', verified: true },
  { id: 'u-james', name: 'James', age: 22, gender: 'M', bio: 'Knows every doorman in Velmont by first name.', interests: ['Craft beer', 'Rugby', 'Trivia'], district: 'harbourside', groupId: 'g-rooftop', verified: true },
  { id: 'u-priya', name: 'Priya', age: 21, gender: 'F', bio: 'Sunset chaser, rooftop researcher.', interests: ['Photography', 'Wine', 'Hiking'], district: 'harbourside', groupId: 'g-rooftop', verified: true },

  { id: 'u-dan', name: 'Dan', age: 24, gender: 'M', bio: 'Old Quarter since before it was cool.', interests: ['Vinyl', 'Whisky', 'Quiz nights'], district: 'oldquarter', groupId: 'g-locals', verified: true },
  { id: 'u-grace', name: 'Grace', age: 23, gender: 'F', bio: 'Knows which bar has the good jukebox.', interests: ['Jazz', 'Pottery', 'Pub quizzes'], district: 'oldquarter', groupId: 'g-locals', verified: true },
  { id: 'u-leon', name: 'Leon', age: 25, gender: 'M', bio: 'Will explain natural wine to you. Sorry in advance.', interests: ['Natural wine', 'Cycling', 'Chess'], district: 'oldquarter', groupId: 'g-locals', verified: true },

  { id: 'u-kofi', name: 'Kofi', age: 20, gender: 'M', bio: 'Bassline missionary. The Vault is my church.', interests: ['Bassline', 'Sneakers', 'FIFA'], district: 'arches', groupId: 'g-bassline', verified: true },
  { id: 'u-ryan', name: 'Ryan', age: 21, gender: 'M', bio: 'Front left, every time.', interests: ['DnB', 'Skating', 'Energy drinks'], district: 'arches', groupId: 'g-bassline', verified: true },
  { id: 'u-tomas', name: 'Tomás', age: 20, gender: 'M', bio: 'Imported from Lisbon, stayed for the arches.', interests: ['Techno', 'Surfing', 'Espresso'], district: 'arches', groupId: 'g-bassline', verified: true },

  { id: 'u-amara', name: 'Amara', age: 19, gender: 'F', bio: 'Uni Hill fresher surviving on meal deals and good vibes.', interests: ['Pop punk', 'Netflix', 'Bowling'], district: 'unihill', groupId: 'g-unihill', verified: true },
  { id: 'u-becca', name: 'Becca', age: 18, gender: 'F', bio: 'First year, first city, first name on the guest list.', interests: ['Cheerleading', 'TikTok', 'Iced coffee'], district: 'unihill', groupId: 'g-unihill', verified: true },
  { id: 'u-sam', name: 'Sam', age: 19, gender: 'NB', bio: 'Philosophy student, dancefloor philosopher.', interests: ['Disco', 'Debate soc', 'Vintage shirts'], district: 'unihill', groupId: 'g-unihill', verified: true },
  { id: 'u-josh', name: 'Josh', age: 19, gender: 'M', bio: 'The Keg on Wednesdays is non-negotiable.', interests: ['Football', 'Pool', 'Guitar'], district: 'unihill', groupId: 'g-unihill', verified: true },
  { id: 'u-tilly', name: 'Tilly', age: 18, gender: 'F', bio: 'Study hard Monday–Thursday. Then Velmont happens.', interests: ['Musical theatre', 'Gym', 'Brunch'], district: 'unihill', groupId: 'g-unihill', verified: true },

  { id: 'u-freya', name: 'Freya', age: 22, gender: 'F', bio: 'Run club by day, salsa by night.', interests: ['Running', 'Salsa', 'Smoothies'], district: 'harbourside', groupId: 'g-runners', verified: true },
  { id: 'u-noah', name: 'Noah', age: 23, gender: 'M', bio: 'Training for a marathon, tapering at the pub.', interests: ['Running', 'Podcasts', 'Ramen'], district: 'harbourside', groupId: 'g-runners', verified: true },

  { id: 'u-isla', name: 'Isla', age: 21, gender: 'F', bio: 'Docks studio by day, anywhere with live music by night.', interests: ['Painting', 'Live music', 'Markets'], district: 'docks', groupId: 'g-docks', verified: true },
  { id: 'u-felix', name: 'Felix', age: 24, gender: 'M', bio: 'Brewing beer at Dockside, opinions available on request.', interests: ['Homebrew', 'Vinyl', 'Dogs'], district: 'docks', groupId: 'g-docks', verified: true },

  { id: 'u-lena', name: 'Lena', age: 22, gender: 'F', bio: 'New in Velmont via Berlin. Show me the good nights.', interests: ['Techno', 'Art galleries', 'Klezmer'], district: 'oldquarter', groupId: 'g-nomads', verified: true },
  { id: 'u-arun', name: 'Arun', age: 23, gender: 'M', bio: 'Six cities in four years. Velmont might be the one.', interests: ['Travel', 'Street photography', 'Chai'], district: 'harbourside', groupId: 'g-nomads', verified: true },

  { id: 'u-carmen', name: 'Carmen', age: 24, gender: 'F', bio: 'Salsa instructor. Yes I will get you dancing. No refunds.', interests: ['Salsa', 'Bachata', 'Tapas'], district: 'oldquarter', groupId: 'g-salsa', verified: true },
  { id: 'u-mateo', name: 'Mateo', age: 25, gender: 'M', bio: 'Two left feet, one great attitude.', interests: ['Salsa', 'Cooking', 'Padel'], district: 'oldquarter', groupId: 'g-salsa', verified: true },
];

// Func ID fields (Map v3 spec §4): identity is earned, not authored. Most users get
// generated defaults below; a few featured demo users get hand-set standing/history
// so the Night Card, Backing, and earned-friends screens have something to show.
const FEATURED: Record<string, { standing: Standing; nightsClosed: number; earnedFriendIds: string[]; roles: string[]; status: StatusRibbon }> = {
  you: { standing: 'building', nightsClosed: 7, earnedFriendIds: ['u-dan', 'u-grace', 'u-leon'], roles: [], status: 'out' },
  'u-theo': { standing: 'solid', nightsClosed: 12, earnedFriendIds: ['u-dan', 'u-grace', 'u-leon'], roles: ['Reliable host'], status: 'out' },
  'u-marcus': { standing: 'building', nightsClosed: 9, earnedFriendIds: ['u-dan', 'u-grace', 'u-leon'], roles: [], status: 'out' },
  'u-ollie': { standing: 'building', nightsClosed: 6, earnedFriendIds: ['u-dan', 'u-grace', 'u-leon'], roles: [], status: 'out' },
  'u-maya': { standing: 'high', nightsClosed: 24, earnedFriendIds: ['you', 'u-theo', 'u-marcus', 'u-ollie'], roles: ['Reliable host', 'Good with new people'], status: 'out' },
  'u-dan': { standing: 'high', nightsClosed: 31, earnedFriendIds: ['you', 'u-theo', 'u-marcus', 'u-ollie'], roles: ['Reliable host'], status: 'home' },
};

export const users: User[] = rawUsers.map((u) => {
  const featured = FEATURED[u.id];
  if (featured) return { ...u, ...featured };
  // Generated defaults: a light deterministic spread so Standing/Nights vary sensibly.
  let h = 0;
  for (let i = 0; i < u.id.length; i++) h = (h * 31 + u.id.charCodeAt(i)) >>> 0;
  const nightsClosed = 1 + (h % 15);
  const standing: Standing = nightsClosed >= 10 ? 'solid' : nightsClosed >= 4 ? 'building' : 'new';
  return { ...u, standing, nightsClosed, earnedFriendIds: [], roles: [], status: 'home' as StatusRibbon };
});

export const userById = (id: string): User => {
  const u = users.find((x) => x.id === id);
  if (!u) throw new Error(`Unknown user: ${id}`);
  return u;
};
