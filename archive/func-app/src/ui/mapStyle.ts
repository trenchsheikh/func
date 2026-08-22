/**
 * The func map style.
 *
 * Standing orders commit to "MapLibre + a custom func style". The previous
 * build delivered MapLibre but pointed it at OpenFreeMap's stock **Liberty**
 * style — a *light* daytime map. The product's Tier 0 centrepiece was beige
 * blocks and yellow motorways with green dots on top. This is that custom
 * style, authored rather than borrowed.
 *
 * ## What it is doing
 *
 * The city is drawn as a **dark instrument panel**, not a map: near-black
 * ground, water darker still, and roads rendered as a faint silver circuitry
 * that gets brighter as it gets more major. Nothing in the base layer is
 * allowed to be saturated, because every drop of colour in this product is
 * spoken for — temperature and presence. The base map's whole job is to
 * recede and let func's own layers be the only bright things on screen.
 *
 * Buildings extrude at street zoom (the specific reason the PRD chose
 * OpenFreeMap at all) in a near-black with a barely-there top face, so the
 * skyline reads as silhouette and depth rather than as blocks of colour.
 *
 * ## Why hand-written and not a tweak of Liberty
 *
 * Liberty is 111 layers of daytime cartography. Restyling it means fighting
 * every one. This selects only the layers a nightlife map actually needs —
 * ground, water, parks, roads, buildings, and a deliberately sparse label set
 * — which is also why it renders fewer things and reads calmer.
 *
 * Source and glyphs are OpenFreeMap's own (keyless, no billing account); only
 * the styling is ours.
 */

import { BLANK_CANVAS } from './colour';

const SOURCE = 'openmaptiles';

/** OpenFreeMap's planet vector tiles — the same source Liberty uses. */
const TILE_SOURCE_URL = 'https://tiles.openfreemap.org/planet';
const GLYPHS = 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf';

/**
 * Blank canvas: this style has no dependency on `theme.ts`/`colour.ts` (it's
 * raw MapLibre JSON), so its handful of colour-cast values — the park's
 * green, the roads'/labels' blue-grey tint — are desaturated to true grey
 * here, at the same lightness, rather than through the shared token system.
 * Reversible the same way as everywhere else: flip `BLANK_CANVAS` in
 * `colour.ts` back to `false`.
 */

// The ground the whole city sits on. Not pure black — the map must still read
// as *ground* against the true-black UI chrome sitting on top of it, or the
// screen edges dissolve and the map stops feeling like a surface.
const GROUND = BLANK_CANVAS ? '#080808' : '#080809';
const GROUND_HI = BLANK_CANVAS ? '#0F0F0F' : '#0E0E11';
const WATER = BLANK_CANVAS ? '#030303' : '#030305';
const PARK = BLANK_CANVAS ? '#0E0E0E' : '#0B120E';

// Roads as silver circuitry. Opacity does the hierarchy work, not hue.
const ROAD_MINOR = BLANK_CANVAS ? 'rgba(162,162,162,0.13)' : 'rgba(150,162,175,0.13)';
const ROAD_MAJOR = BLANK_CANVAS ? 'rgba(185,185,185,0.22)' : 'rgba(172,185,199,0.22)';
const ROAD_TRUNK = BLANK_CANVAS ? 'rgba(212,212,212,0.30)' : 'rgba(198,212,226,0.30)';
const ROAD_MOTORWAY = BLANK_CANVAS ? 'rgba(226,226,226,0.34)' : 'rgba(214,226,238,0.34)';
const WATER_EDGE = BLANK_CANVAS ? 'rgba(150,150,150,0.22)' : 'rgba(120,150,180,0.22)';

const BUILDING = BLANK_CANVAS ? '#121212' : '#101015';
const BUILDING_TOP = BLANK_CANVAS ? '#181818' : '#16161C';
const BUILDING_HIGH = BLANK_CANVAS ? '#1F1F1F' : '#1D1D24';

const LABEL = BLANK_CANVAS ? '#929292' : '#8A929B';
const LABEL_HALO = '#000000';
const LABEL_PLACE = BLANK_CANVAS ? '#D2D2D2' : '#C9D2DA';
const LABEL_WATER = BLANK_CANVAS ? 'rgba(155,155,155,0.7)' : 'rgba(130,155,180,0.7)';
const LABEL_NEIGHBOURHOOD = BLANK_CANVAS ? 'rgba(162,162,162,0.62)' : 'rgba(150,162,175,0.62)';

/**
 * The style object handed to MapLibre.
 *
 * Typed loosely on purpose: MapLibre's style spec is a large structural union
 * and the native module takes it as JSON. Getting a compile-time guarantee
 * here would mean vendoring the whole spec's types for no runtime benefit.
 */
export const FUNC_MAP_STYLE: Record<string, unknown> = {
  version: 8,
  name: 'func night',
  glyphs: GLYPHS,
  sources: {
    [SOURCE]: { type: 'vector', url: TILE_SOURCE_URL },
  },
  layers: [
    // --- Ground -----------------------------------------------------------
    { id: 'bg', type: 'background', paint: { 'background-color': GROUND } },

    {
      id: 'landcover',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'landcover',
      paint: { 'fill-color': GROUND_HI, 'fill-opacity': 0.5 },
    },
    {
      id: 'park',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'park',
      paint: { 'fill-color': PARK, 'fill-opacity': 0.7 },
    },
    {
      id: 'water',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'water',
      filter: ['!=', ['get', 'brunnel'], 'tunnel'],
      paint: { 'fill-color': WATER },
    },
    {
      // A cold rim on the shoreline. The bay should read as an edge you could
      // cut yourself on, which is most of what makes the city feel like an
      // object rather than a texture.
      id: 'water-edge',
      type: 'line',
      source: SOURCE,
      'source-layer': 'water',
      paint: {
        'line-color': WATER_EDGE,
        'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.4, 14, 1.1],
      },
    },

    // --- Roads ------------------------------------------------------------
    {
      id: 'road-minor',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      minzoom: 12,
      filter: ['match', ['get', 'class'], ['minor', 'service', 'track', 'path'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD_MINOR,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 12, 0.4, 18, 6],
      },
    },
    {
      id: 'road-secondary',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['secondary', 'tertiary'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD_MAJOR,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 9, 0.5, 18, 10],
      },
    },
    {
      id: 'road-primary',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      filter: ['match', ['get', 'class'], ['primary', 'trunk'], true, false],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD_TRUNK,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 8, 0.7, 18, 14],
      },
    },
    {
      id: 'road-motorway',
      type: 'line',
      source: SOURCE,
      'source-layer': 'transportation',
      filter: ['==', ['get', 'class'], 'motorway'],
      layout: { 'line-cap': 'round', 'line-join': 'round' },
      paint: {
        'line-color': ROAD_MOTORWAY,
        'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 7, 0.8, 18, 18],
      },
    },

    // --- Buildings --------------------------------------------------------
    {
      // Flat footprints below the extrusion zoom, so the city still has grain
      // when you are looking at the whole bay.
      id: 'building-flat',
      type: 'fill',
      source: SOURCE,
      'source-layer': 'building',
      minzoom: 13,
      maxzoom: 15,
      paint: { 'fill-color': BUILDING, 'fill-opacity': 0.7 },
    },
    {
      id: 'building-3d',
      type: 'fill-extrusion',
      source: SOURCE,
      'source-layer': 'building',
      minzoom: 15,
      paint: {
        'fill-extrusion-color': [
          'interpolate',
          ['linear'],
          ['get', 'render_height'],
          0,
          BUILDING,
          60,
          BUILDING_TOP,
          200,
          BUILDING_HIGH,
        ],
        'fill-extrusion-height': ['get', 'render_height'],
        'fill-extrusion-base': ['get', 'render_min_height'],
        // Fades in across one zoom level so buildings grow out of the ground
        // rather than popping into existence.
        'fill-extrusion-opacity': ['interpolate', ['linear'], ['zoom'], 15, 0, 16, 0.9],
      },
    },

    // --- Labels -----------------------------------------------------------
    // Deliberately sparse. The old style's street labels collided with func's
    // own venue names; the fix is fewer labels, not smaller ones.
    {
      id: 'label-water',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'water_name',
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Italic'],
        'text-size': 11,
        'text-letter-spacing': 0.18,
      },
      paint: {
        'text-color': LABEL_WATER,
        'text-halo-color': LABEL_HALO,
        'text-halo-width': 1.1,
      },
    },
    {
      id: 'label-road',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'transportation_name',
      minzoom: 15,
      filter: ['match', ['get', 'class'], ['primary', 'secondary', 'trunk', 'motorway'], true, false],
      layout: {
        'text-field': ['get', 'name'],
        'text-font': ['Noto Sans Regular'],
        'text-size': 10.5,
        'symbol-placement': 'line',
        'text-letter-spacing': 0.12,
      },
      paint: {
        'text-color': LABEL,
        'text-opacity': 0.55,
        'text-halo-color': LABEL_HALO,
        'text-halo-width': 1.4,
      },
    },
    {
      // Neighbourhoods only — the unit a night out is actually planned in.
      id: 'label-neighbourhood',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      filter: ['match', ['get', 'class'], ['suburb', 'neighbourhood', 'quarter'], true, false],
      layout: {
        'text-field': ['upcase', ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9.5, 16, 12],
        'text-letter-spacing': 0.3,
        'text-max-width': 8,
      },
      paint: {
        'text-color': LABEL_NEIGHBOURHOOD,
        'text-halo-color': LABEL_HALO,
        'text-halo-width': 1.6,
      },
    },
    {
      id: 'label-city',
      type: 'symbol',
      source: SOURCE,
      'source-layer': 'place',
      maxzoom: 12,
      filter: ['match', ['get', 'class'], ['city', 'town'], true, false],
      layout: {
        'text-field': ['upcase', ['get', 'name']],
        'text-font': ['Noto Sans Bold'],
        'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 11, 15],
        'text-letter-spacing': 0.34,
      },
      paint: {
        'text-color': LABEL_PLACE,
        'text-halo-color': LABEL_HALO,
        'text-halo-width': 1.8,
      },
    },
  ],
};
