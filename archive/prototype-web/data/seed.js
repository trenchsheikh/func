// Func. demo seed — San Francisco.
// Real venues at real coordinates; all activity is authored for the demo.
window.SEED = (function () {

  // ---- People -------------------------------------------------------------
  // status: green (DTF) / amber (casually looking) / red (not out) / disco (premium)
  const people = [
    { id: 'you', name: 'Phoenix', initial: 'P', status: 'green', age: 20, verified: true,
      bio: 'SF. Down for most things. Ask me about the taqueria on 24th.', ig: '@phoenixk',
      tokens: 340, spots: 6, nights: 23 },

    { id: 'p1', name: 'Maya',   initial: 'M', status: 'green', age: 22, friend: true,  venue: 'zeitgeist' },
    { id: 'p2', name: 'Theo',   initial: 'T', status: 'green', age: 21, friend: true,  venue: 'zeitgeist' },
    { id: 'p3', name: 'Jules',  initial: 'J', status: 'amber', age: 23, friend: true,  venue: null },
    { id: 'p4', name: 'Sana',   initial: 'S', status: 'green', age: 22, friend: true,  venue: 'trickdog' },
    { id: 'p5', name: 'Dre',    initial: 'D', status: 'red',   age: 24, friend: true,  venue: null },
    { id: 'p6', name: 'Kit',    initial: 'K', status: 'disco', age: 25, friend: true,  venue: 'monarch' },

    { id: 'm1', name: 'Nia',    initial: 'N', status: 'green', age: 21, mutual: 2, venue: 'monarch' },
    { id: 'm2', name: 'Léo',    initial: 'L', status: 'green', age: 23, mutual: 1, venue: 'audio' },
    { id: 'm3', name: 'Priya',  initial: 'P', status: 'green', age: 22, mutual: 3, venue: 'chapel' },
    { id: 'm4', name: 'Owen',   initial: 'O', status: 'amber', age: 24, mutual: 1, venue: 'greatnorthern' },
    { id: 'm5', name: 'Tasha',  initial: 'T', status: 'green', age: 20, mutual: 2, venue: null },
    { id: 'm6', name: 'Marco',  initial: 'M', status: 'disco', age: 26, mutual: 1, venue: '1015' },
  ];

  // ---- Venues -------------------------------------------------------------
  // heat 0..1 drives glow only — never a number or word on the map itself.
  const venues = [
    // dinner / early
    { id: 'foreign', name: 'Foreign Cinema', kind: 'dinner', lat: 37.7563, lon: -122.4189,
      district: 'Mission', heat: 0.42, entry: [0, 0], spend: [45, 80], verified: true,
      vibe: ['Courtyard', 'Date night', 'Films on the wall'], word: 'Steady',
      blurb: 'Films projected on the courtyard wall. Book it or queue at the bar.' },
    { id: 'richtable', name: 'Rich Table', kind: 'dinner', lat: 37.7745, lon: -122.4227,
      district: 'Hayes Valley', heat: 0.36, entry: [0, 0], spend: [55, 95], verified: true,
      vibe: ['Small plates', 'Loud', 'Worth it'], word: 'Filling up',
      blurb: 'Sardine chips and porcini doughnuts. Walk-ins at the counter.' },
    { id: 'nopa', name: 'Nopa', kind: 'dinner', lat: 37.7748, lon: -122.4376,
      district: 'Divisadero', heat: 0.55, entry: [0, 0], spend: [40, 75], verified: true,
      vibe: ['Late kitchen', 'Buzzing', 'Big room'], word: 'Busy',
      blurb: 'Kitchen runs to 1am. The reason people eat late in this city.' },

    // bars
    { id: 'zeitgeist', name: 'Zeitgeist', kind: 'bar', lat: 37.7699, lon: -122.4222,
      district: 'Mission', heat: 0.78, entry: [0, 0], spend: [18, 30], verified: true,
      vibe: ['Beer garden', 'Loud', 'No frills'], word: 'Rammed',
      blurb: 'Big yard, cash-friendly, tamales guy usually out front by ten.' },
    { id: 'trickdog', name: 'Trick Dog', kind: 'bar', lat: 37.7592, lon: -122.4108,
      district: 'Mission', heat: 0.66, entry: [0, 0], spend: [26, 44], verified: true,
      vibe: ['Cocktails', 'Design-y', 'Upstairs'], word: 'Filling up',
      blurb: 'Menu changes theme every six months. Upstairs is quieter.' },
    { id: 'marlena', name: 'Marlena', kind: 'bar', lat: 37.7765, lon: -122.4238,
      district: 'Hayes Valley', heat: 0.51, entry: [0, 0], spend: [22, 38], verified: true,
      vibe: ['Queer', 'Warm', 'Good playlist'], word: 'Steady',
      blurb: 'Neighbourhood bar that actually feels like one.' },
    { id: 'abv', name: 'ABV', kind: 'bar', lat: 37.7648, lon: -122.4213,
      district: 'Mission', heat: 0.58, entry: [0, 0], spend: [20, 36], verified: true,
      vibe: ['Bartenders', 'Late food', 'Standing'], word: 'Busy',
      blurb: 'Where the industry drinks after their own shifts.' },

    // clubs
    { id: 'monarch', name: 'Monarch', kind: 'club', lat: 37.7797, lon: -122.4090,
      district: 'SoMa', heat: 0.92, entry: [15, 30], spend: [45, 90], verified: true,
      vibe: ['House', 'Two floors', 'Dress up'], word: 'Going off',
      blurb: 'Upstairs cocktails, downstairs sweat. Sound system is the point.' },
    { id: 'audio', name: 'Audio', kind: 'club', lat: 37.7714, lon: -122.4131,
      district: 'SoMa', heat: 0.83, entry: [20, 35], spend: [50, 95], verified: true,
      vibe: ['Techno', 'Funktion-One', 'Late'], word: 'Rammed',
      blurb: 'Built around the rig. Go for the sound, stay because you cannot leave.' },
    { id: '1015', name: '1015 Folsom', kind: 'club', lat: 37.7784, lon: -122.4062,
      district: 'SoMa', heat: 0.71, entry: [25, 40], spend: [55, 110], verified: true,
      vibe: ['Five rooms', 'Big night', 'Bottle service'], word: 'Busy',
      blurb: 'Five rooms, five completely different nights happening at once.' },
    { id: 'greatnorthern', name: 'The Great Northern', kind: 'club', lat: 37.7676, lon: -122.4063,
      district: 'Potrero', heat: 0.64, entry: [20, 35], spend: [45, 85], verified: true,
      vibe: ['Warehouse', 'Disco', 'High ceilings'], word: 'Filling up',
      blurb: 'Old warehouse, proper disco ball, room to actually dance.' },
    { id: 'chapel', name: 'The Chapel', kind: 'club', lat: 37.7597, lon: -122.4215,
      district: 'Mission', heat: 0.69, entry: [18, 32], spend: [38, 70], verified: true,
      vibe: ['Live', 'Balcony', 'Beautiful room'], word: 'Busy',
      blurb: 'Former mortuary, 40-foot ceilings. Balcony is the best seat in the Mission.' },
    // Halcyon is genuinely next door to Audio on 11th; nudged apart so both are tappable
    { id: 'halcyon', name: 'Halcyon', kind: 'club', lat: 37.7735, lon: -122.4155,
      district: 'SoMa', heat: 0.48, entry: [10, 25], spend: [35, 65], verified: true,
      vibe: ['Intimate', 'House', 'No phones on the floor'], word: 'Warming up',
      blurb: 'Small, dark, serious about the music. Gets going after one.' },
  ];

  // ---- Local spots (community-dropped, earn tokens when people go) --------
  const spots = [
    { id: 's1', name: 'La Torta Gorda', lat: 37.7521, lon: -122.4186, by: 'Maya', byId: 'p1',
      note: 'Open till 3. Get the cemita. Cash only.', tokens: 128, kind: 'spot' },
    { id: 's2', name: 'The bench at Dolores + 19th', lat: 37.7601, lon: -122.4269, by: 'Theo', byId: 'p2',
      note: 'Best view of the city at 2am when everything shuts.', tokens: 64, kind: 'spot' },
    { id: 's3', name: 'Yamo', lat: 37.7639, lon: -122.4222, by: 'Sana', byId: 'p4',
      note: 'Six seats, Burmese, ten minutes. Perfect before Valencia.', tokens: 91, kind: 'spot' },
  ];

  // ---- Stories ------------------------------------------------------------
  // atVenue = posted from inside the geofence, gets the verified mark.
  const stories = [
    { id: 'st1', venue: 'monarch', by: 'm1', mins: 6,  atVenue: true,  g: ['#12E08A', '#0B7A5B'] },
    { id: 'st2', venue: 'monarch', by: 'p6', mins: 14, atVenue: true,  g: ['#1BF5A0', '#0E4F6B'] },
    { id: 'st3', venue: 'monarch', by: 'm6', mins: 41, atVenue: true,  g: ['#7A5BF5', '#12E08A'] },
    { id: 'st4', venue: 'zeitgeist', by: 'p1', mins: 9, atVenue: true, g: ['#12E08A', '#134A3A'] },
    { id: 'st5', venue: 'zeitgeist', by: 'p2', mins: 22, atVenue: true, g: ['#F5C542', '#0B7A5B'] },
    { id: 'st6', venue: 'audio', by: 'm2', mins: 3,  atVenue: true,  g: ['#0EF0C0', '#0A3A55'] },
    { id: 'st7', venue: 'audio', by: 'm4', mins: 31, atVenue: false, g: ['#8892A0', '#2A3038'] },
    { id: 'st8', venue: 'chapel', by: 'm3', mins: 17, atVenue: true, g: ['#F55B8A', '#12E08A'] },
    { id: 'st9', venue: 'trickdog', by: 'p4', mins: 12, atVenue: true, g: ['#12E08A', '#0B5F7A'] },
    { id: 'st10', venue: 'greatnorthern', by: 'm4', mins: 48, atVenue: true, g: ['#C8A2FF', '#12E08A'] },
  ];

  // ---- Business accounts (promoters/venues who post tables and accept
  // requests) — a business is a single actor, exactly like a person, never
  // a roster of users. That distinction keeps this from re-introducing
  // "groups as objects" under a different name.
  const businesses = [
    { id: 'biz-nightform', name: 'Nightform', kind: 'promoter', venueIds: ['monarch', 'audio'],
      verified: true, tier: 'gold', bio: 'Runs the door and the tables at Monarch and Audio.',
      avatarInitial: 'N' },
    { id: 'biz-folsom', name: 'Folsom Collective', kind: 'promoter', venueIds: ['1015'],
      verified: true, tier: 'standard', bio: 'Bottle service and mezzanine tables at 1015 Folsom.',
      avatarInitial: 'F' },
    { id: 'biz-disco', name: 'Disco Committee', kind: 'promoter', venueIds: ['greatnorthern'],
      verified: true, tier: 'standard', bio: 'The corner banquette at The Great Northern.',
      avatarInitial: 'D' },
  ];

  // ---- Table offers (posted by promoters with business accounts) ---------
  const tables = [
    { id: 't1', venue: 'monarch', name: 'Booth 5, upstairs', seats: 6, left: 2, perHead: 40,
      host: 'Nightform', hostKind: 'promoter', businessId: 'biz-nightform', vibe: 'House · dress up' },
    { id: 't2', venue: 'audio', name: 'Rail table', seats: 4, left: 4, perHead: 55,
      host: 'Nightform', hostKind: 'promoter', businessId: 'biz-nightform', vibe: 'Techno · right by the rig' },
    { id: 't3', venue: '1015', name: 'Mezzanine table', seats: 8, left: 3, perHead: 65,
      host: 'Folsom Collective', hostKind: 'promoter', businessId: 'biz-folsom', vibe: 'Bottle service · big night' },
    { id: 't4', venue: 'greatnorthern', name: 'Corner banquette', seats: 6, left: 5, perHead: 35,
      host: 'Disco Committee', hostKind: 'promoter', businessId: 'biz-disco', vibe: 'Disco · room to dance' },
  ];

  // ---- After-parties (address revealed only on accept) -------------------
  const afters = [
    { id: 'a1', host: 'Kit', hostId: 'p6', area: 'Potrero Hill', capacity: 20, going: 14,
      vibe: ['Rooftop', 'House', 'BYO'], mutual: 4, verified: true,
      address: '1180 Rhode Island St, Apt 4 — buzzer 4, go straight up',
      lat: 37.7597, lon: -122.4013,
      note: 'Roof is open till the sun comes up. Bring something, do not bring twelve people.' },
    { id: 'a2', host: 'Nia', hostId: 'm1', area: 'Mission', capacity: 12, going: 9,
      vibe: ['Flat', 'Garage', 'Chilled'], mutual: 2, verified: true,
      address: '3312 22nd St, ground floor — knock, do not buzz',
      lat: 37.7551, lon: -122.4204,
      note: 'Neighbours are sound but keep it inside after 3.' },
    { id: 'a3', host: 'Léo', hostId: 'm2', area: 'SoMa', capacity: 30, going: 27,
      vibe: ['Warehouse', 'Techno', 'Late'], mutual: 1, verified: true,
      address: '55 Bluxome St — side door, text on arrival',
      lat: 37.7768, lon: -122.3968,
      note: 'Proper rig. Runs till it runs out.' },
  ];

  return { people, venues, spots, stories, tables, afters, businesses };
})();
