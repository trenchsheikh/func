import { DistrictId, HeatPoint, Venue } from './types';

// All coordinates live in the map's SVG space (Decision 004: illustrated city, not tiles).
export const MAP_W = 390;
export const MAP_H = 640;

// Coastline: sea sweeps up from bottom-left to mid-right, with a harbour bite.
export const seaPath =
  'M 0 545 C 70 535 110 555 160 540 C 210 525 225 480 265 470 C 300 462 330 435 390 415 L 390 640 L 0 640 Z';

export const coastStroke =
  'M 0 545 C 70 535 110 555 160 540 C 210 525 225 480 265 470 C 300 462 330 435 390 415';

export interface District {
  id: DistrictId;
  name: string;
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  blurb: string;
}

export const districts: District[] = [
  { id: 'arches', name: 'The Arches', cx: 118, cy: 318, rx: 78, ry: 60, blurb: 'Railway-arch clubland' },
  { id: 'oldquarter', name: 'Old Quarter', cx: 198, cy: 182, rx: 80, ry: 58, blurb: 'Bars & late food' },
  { id: 'unihill', name: 'Uni Hill', cx: 308, cy: 128, rx: 62, ry: 50, blurb: 'Student stronghold' },
  { id: 'harbourside', name: 'Harbourside', cx: 268, cy: 408, rx: 74, ry: 46, blurb: 'Waterfront & events' },
  { id: 'docks', name: 'The Docks', cx: 76, cy: 488, rx: 54, ry: 38, blurb: 'Quiet, emerging' },
];

export const districtName = (id: DistrictId): string =>
  districts.find((d) => d.id === id)?.name ?? id;

// A few faint street strokes for texture.
export const streets: string[] = [
  'M 118 260 C 140 230 170 210 198 196',
  'M 196 240 C 210 290 240 330 262 372',
  'M 258 160 C 240 168 222 174 206 178',
  'M 150 350 C 170 400 200 440 236 452',
  'M 96 376 C 88 412 82 446 78 462',
  'M 310 178 C 300 240 286 310 272 366',
];

export const venues: Venue[] = [
  { id: 'v-archive9', name: 'Archive 9', emoji: '🌀', x: 104, y: 300, district: 'arches', level: 3, groupsTonight: 6, avgSpend: 34, eventId: 'e-neon' },
  { id: 'v-vault', name: 'The Vault', emoji: '📀', x: 142, y: 338, district: 'arches', level: 3, groupsTonight: 4, avgSpend: 40, eventId: 'e-wax' },
  { id: 'v-brickhouse', name: 'Brickhouse', emoji: '🧱', x: 92, y: 348, district: 'arches', level: 2, groupsTonight: 2, avgSpend: 22 },
  { id: 'v-lantern', name: 'The Lantern', emoji: '🏮', x: 182, y: 198, district: 'oldquarter', level: 2, groupsTonight: 2, avgSpend: 18, eventId: 'e-quiz' },
  { id: 'v-barrel', name: 'Barrel House', emoji: '🍷', x: 222, y: 168, district: 'oldquarter', level: 2, groupsTonight: 1, avgSpend: 26, eventId: 'e-vinyl' },
  { id: 'v-skyline', name: 'Skyline Rooftop', emoji: '🌇', x: 246, y: 396, district: 'harbourside', level: 2, groupsTonight: 3, avgSpend: 31, eventId: 'e-rooftop' },
  { id: 'v-keg', name: 'The Keg', emoji: '🍺', x: 304, y: 142, district: 'unihill', level: 2, groupsTonight: 3, avgSpend: 15, eventId: 'e-student' },
  { id: 'v-dockside', name: 'Dockside Brew', emoji: '🎸', x: 82, y: 486, district: 'docks', level: 1, groupsTonight: 1, avgSpend: 20, eventId: 'e-tap' },
];

// ~60 weighted points telling the district story:
// Arches hottest → Old Quarter mid/spread → Harbourside event spikes →
// Uni Hill clustered → Docks near-cold (contrast sells realism).
export const heatPoints: HeatPoint[] = [
  // The Arches — dense, hot core
  { x: 104, y: 300, w: 3 }, { x: 112, y: 312, w: 3 }, { x: 96, y: 316, w: 3 },
  { x: 120, y: 296, w: 3 }, { x: 132, y: 322, w: 3 }, { x: 142, y: 338, w: 3 },
  { x: 128, y: 344, w: 2 }, { x: 92, y: 348, w: 2 }, { x: 84, y: 330, w: 2 },
  { x: 148, y: 310, w: 2 }, { x: 110, y: 336, w: 3 }, { x: 124, y: 308, w: 3 },
  { x: 138, y: 292, w: 2 }, { x: 100, y: 284, w: 2 }, { x: 156, y: 330, w: 1 },
  { x: 76, y: 306, w: 1 }, { x: 118, y: 358, w: 1 }, { x: 146, y: 352, w: 1 },
  // Old Quarter — many smaller points, spread wide
  { x: 182, y: 198, w: 2 }, { x: 196, y: 176, w: 2 }, { x: 222, y: 168, w: 2 },
  { x: 168, y: 172, w: 1 }, { x: 210, y: 196, w: 1 }, { x: 236, y: 186, w: 1 },
  { x: 188, y: 152, w: 1 }, { x: 214, y: 148, w: 1 }, { x: 246, y: 164, w: 1 },
  { x: 172, y: 214, w: 1 }, { x: 202, y: 218, w: 1 }, { x: 230, y: 206, w: 1 },
  { x: 158, y: 192, w: 1 }, { x: 240, y: 146, w: 1 },
  // Harbourside — spikes at event venues, quieter between
  { x: 246, y: 396, w: 3 }, { x: 254, y: 408, w: 2 }, { x: 238, y: 414, w: 2 },
  { x: 276, y: 402, w: 2 }, { x: 290, y: 416, w: 1 }, { x: 262, y: 386, w: 2 },
  { x: 302, y: 402, w: 1 }, { x: 314, y: 418, w: 1 }, { x: 228, y: 430, w: 1 },
  { x: 288, y: 388, w: 1 },
  // Uni Hill — tight clusters around the cheap bars
  { x: 304, y: 142, w: 2 }, { x: 312, y: 130, w: 2 }, { x: 296, y: 126, w: 2 },
  { x: 320, y: 146, w: 2 }, { x: 288, y: 142, w: 1 }, { x: 308, y: 112, w: 1 },
  { x: 330, y: 124, w: 1 }, { x: 296, y: 156, w: 1 }, { x: 338, y: 140, w: 1 },
  { x: 322, y: 108, w: 1 },
  // The Docks — deliberately near-cold
  { x: 82, y: 486, w: 1 }, { x: 96, y: 498, w: 1 }, { x: 66, y: 500, w: 1 },
  { x: 88, y: 470, w: 1 },
];

export const PEOPLE_OUT_TONIGHT = 214;
