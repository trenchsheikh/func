/**
 * Mapbox wiring. The token is read from EXPO_PUBLIC_MAPBOX_TOKEN (see .env.example).
 * Without it the app still runs — the map falls back to a schematic renderer
 * so every other flow can be demoed — but the true globe needs a real token.
 */
export const MAPBOX_TOKEN: string | null =
  (process.env.EXPO_PUBLIC_MAPBOX_TOKEN ?? '').trim() || null;

export const hasMapboxToken = MAPBOX_TOKEN != null && MAPBOX_TOKEN.startsWith('pk.');

/** Maintained daylight basemap selected for M2's bright map foundation. */
export const MAP_STYLE_URL = 'mapbox://styles/mapbox/standard';
export const MAP_STYLE_CONFIG = {
  lightPreset: 'day',
  theme: 'faded',
  show3dObjects: true,
  show3dBuildings: true,
} as const;

/** Where the camera starts. Demo content lives in SF; nothing else assumes it. */
export const DEFAULT_CENTER = { lat: 37.7749, lng: -122.4194 };
export const LOCAL_ZOOM = 12.4;
export const GLOBE_ZOOM = 1.2;
