import { WorldCity } from './types';

// World view geometry (Decision 006): a stylised night-globe, not real geography —
// deliberate, so it always looks intentional. Coordinates are SVG-space on the globe.
export const WORLD_W = 390;
export const WORLD_H = 640;
export const GLOBE_CX = 195;
export const GLOBE_CY = 300;
export const GLOBE_R = 168;

export const worldCities: WorldCity[] = [
  { id: 'velmont', name: 'Velmont', x: 195, y: 295, size: 3, out: 214, live: true },
  { id: 'london', name: 'London', x: 148, y: 218, size: 2, out: 48212, live: false },
  { id: 'nyc', name: 'New York', x: 86, y: 240, size: 2, out: 63554, live: false },
  { id: 'berlin', name: 'Berlin', x: 238, y: 204, size: 2, out: 31940, live: false },
  { id: 'tokyo', name: 'Tokyo', x: 302, y: 252, size: 2, out: 71210, live: false },
  { id: 'ibiza', name: 'Ibiza', x: 160, y: 352, size: 2, out: 12402, live: false },
  { id: 'miami', name: 'Miami', x: 96, y: 305, size: 2, out: 27881, live: false },
  { id: 'saopaulo', name: 'São Paulo', x: 112, y: 398, size: 1, out: 22300, live: false },
  { id: 'sydney', name: 'Sydney', x: 286, y: 372, size: 1, out: 18009, live: false },
];

// Faint arcs from Velmont outward — the network the company intends to build.
export const worldArcs: { to: string; via: [number, number] }[] = [
  { to: 'london', via: [150, 260] },
  { to: 'nyc', via: [120, 280] },
  { to: 'tokyo', via: [270, 260] },
  { to: 'ibiza', via: [200, 330] },
];

export const WORLD_OUT_BASE = 2_147_203;

export const tickerItems: string[] = [
  '🌀 84 tickets left for Neon Fridays',
  '🍸 2-for-1 at Skyline Rooftop until 21:00',
  '🔥 The Arches just hit "On fire"',
  '💸 avg night in Uni Hill right now: £15',
  '👯 6 groups in the Archive 9 pool',
  '🌍 Ibiza joins Func in 2027',
  '🎧 Warehouse Wax is 80% sold out',
  '🥟 Harbour Food Market: bao queue 10 min',
];
