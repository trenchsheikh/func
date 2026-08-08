/* ==========================================================================
   Func. — core: icons, projection, map, camera, cold open, pet, router
   ========================================================================== */
window.FUNC = (function () {
'use strict';

const M = window.SFMAP, S = window.SEED;
const $ = (s, r) => (r || document).querySelector(s);
const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const lerp = (a, b, t) => a + (b - a) * t;

function h(tag, attrs, kids) {
  const ns = /^(svg|g|path|circle|rect|line|text|defs|radialGradient|linearGradient|stop|ellipse|polygon|clipPath|use|filter|feGaussianBlur|feMerge|feMergeNode|mask|tspan)$/.test(tag);
  const e = ns ? document.createElementNS('http://www.w3.org/2000/svg', tag)
               : document.createElement(tag);
  for (const k in (attrs || {})) {
    const v = attrs[k];
    if (v == null || v === false) continue;
    if (k === 'class') e.setAttribute('class', v);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'text') e.textContent = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v);
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v);
  }
  (kids || []).forEach(k => k && e.appendChild(k));
  return e;
}
const frag = (kids) => { const f = document.createDocumentFragment(); kids.forEach(k => k && f.appendChild(k)); return f; };

/* ---- Haptics (real on supporting phones, harmless elsewhere) ------------ */
const buzz = (p) => { try { navigator.vibrate && navigator.vibrate(p); } catch (e) {} };

/* ---- Icons — custom set, zero emoji ------------------------------------ */
const I = {
  eye:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M1.8 12S5.6 5.2 12 5.2 22.2 12 22.2 12 18.4 18.8 12 18.8 1.8 12 1.8 12Z"/><circle cx="12" cy="12" r="3.1"/></svg>',
  cards:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="6" width="12" height="15" rx="2.6"/><path d="M8.5 3.4h8A2.6 2.6 0 0 1 19 6v11"/></svg>',
  plans:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><rect x="3.2" y="5" width="17.6" height="16" rx="3"/><path d="M3.2 10h17.6M8 3v4M16 3v4"/></svg>',
  inbox:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 7.5 12 13l9-5.5"/><rect x="3" y="5" width="18" height="14" rx="2.8"/></svg>',
  me:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8.2" r="3.7"/><path d="M4.6 20.2a7.6 7.6 0 0 1 14.8 0"/></svg>',
  search:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="11" cy="11" r="6.4"/><path d="m16 16 4.4 4.4"/></svg>',
  sliders:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 8h10M18 8h2M4 16h4M12 16h8"/><circle cx="16" cy="8" r="2.2"/><circle cx="10" cy="16" r="2.2"/></svg>',
  close:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="m6 6 12 12M18 6 6 18"/></svg>',
  check:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="m4.5 12.5 5 5 10-11"/></svg>',
  verified:'<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 1.8 2.6 2.1 3.3-.4 1.2 3.1 2.9 1.7-1.2 3.1 1.2 3.1-2.9 1.7-1.2 3.1-3.3-.4L12 22.2l-2.6-2.1-3.3.4-1.2-3.1L2 15.7l1.2-3.1L2 9.5l2.9-1.7 1.2-3.1 3.3.4Z"/><path d="m8.4 12.3 2.5 2.5 4.7-5" stroke="#04120C" stroke-width="2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  pin:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.5s7-6.1 7-11.2a7 7 0 1 0-14 0c0 5.1 7 11.2 7 11.2Z"/><circle cx="12" cy="10" r="2.6"/></svg>',
  money:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3.2v17.6M16.2 7.1c-.8-1.3-2.4-2-4.2-2-2.4 0-4 1.3-4 3.1 0 4.3 8.4 2.3 8.4 6.6 0 1.9-1.8 3.2-4.4 3.2-2 0-3.6-.8-4.4-2.1"/></svg>',
  people:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8.4" r="3.4"/><path d="M2.8 19.6a6.4 6.4 0 0 1 12.4 0"/><path d="M16.2 5.4a3.4 3.4 0 0 1 0 6.5M17.6 19.6a6.5 6.5 0 0 0-1.6-4.2"/></svg>',
  camera:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M3 8.6h3.2l1.6-2.4h8.4l1.6 2.4H21v10.2H3Z"/><circle cx="12" cy="13.4" r="3.5"/></svg>',
  qr:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9"><rect x="3" y="3" width="7" height="7" rx="1.4"/><rect x="14" y="3" width="7" height="7" rx="1.4"/><rect x="3" y="14" width="7" height="7" rx="1.4"/><path d="M14 14h3v3h-3zM19.5 14h1.5M14 19.5h3M19.5 17.5V21"/></svg>',
  star: '<svg viewBox="0 0 24 24" fill="currentColor"><path d="m12 2.6 2.9 6 6.6.9-4.8 4.6 1.2 6.5L12 17.5 6.1 20.6l1.2-6.5L2.5 9.5l6.6-.9Z"/></svg>',
  back: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 5 8 12l6.5 7"/></svg>',
  globe:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.6 2.6 15.4 0 18M12 3c-2.6 2.6-2.6 15.4 0 18"/></svg>',
  loc:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.4v3M12 18.6v3M21.6 12h-3M5.4 12h-3"/><circle cx="12" cy="12" r="5.2"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/></svg>',
  token:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="4.4"/><path d="M12 3.4v3.9M12 16.7v3.9M20.6 12h-3.9M7.3 12H3.4"/></svg>',
};
const icon = (n, cls) => h('span', { class: cls || '', html: I[n] });

/* ---- Projection: real lat/lon into map units --------------------------- */
const BB = M.bbox; // [lon0, lat0, lon1, lat1]
function mx(lon) { return (lon + 180) / 360; }
function my(lat) { const s = Math.sin(lat * Math.PI / 180); return 0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI); }
const PX0 = mx(BB[0]), PY0 = my(BB[3]);
const PSC = M.w / (mx(BB[2]) - mx(BB[0]));
const proj = (lon, lat) => ({ x: (mx(lon) - PX0) * PSC, y: (my(lat) - PY0) * PSC });

/* ---- App state ---------------------------------------------------------- */
const st = {
  screen: 'map',
  cam: { x: 0, y: 0, z: 1 },
  filters: new Set(),      // venue kind — shared between the top-bar chips and the filter sheet
  filterVibe: new Set(),   // vibe words, e.g. 'Techno', 'Dive'
  filterCost: null,        // max entry price in dollars, or null = any
  filterDistance: null,    // max miles from YOU, or null = any
  filterGreenOnly: false,  // only venues with a green person currently there
  searchQuery: '',
  afters: false,
  petName: 'Bubble',
};
// Requests, passes, chat threads and traffic-light status live in
// window.Engine (backed by window.STORE in real mode) — never in st.
// See data/engine-demo.js and data/engine-real.js.
const byId = (arr, id) => arr.find(o => o.id === id);
S.venues.forEach(v => { const p = proj(v.lon, v.lat); v.x = p.x; v.y = p.y; });
S.spots.forEach(v => { const p = proj(v.lon, v.lat); v.x = p.x; v.y = p.y; });
S.afters.forEach(a => { const p = proj(a.lon, a.lat); a.x = p.x; a.y = p.y; });
const YOU_LL = { lon: -122.4207, lat: 37.7665 }; // Mission, near 18th & Valencia
const YOU = proj(YOU_LL.lon, YOU_LL.lat);

const storiesFor = (vid) => S.stories.filter(s => s.venue === vid).sort((a, b) => a.mins - b.mins);
const peopleAt = (vid) => S.people.filter(p => p.venue === vid && p.id !== (window.Engine ? window.Engine.getActivePersonaId() : 'you'));
const tablesFor = (vid) => S.tables.filter(t => t.venue === vid);

/* ---- Map ---------------------------------------------------------------- */
let mapG, mapSvg, marksG, bldG, vw = 390, vh = 844;
const bldRoofs = [];
// Zoom range: out to the whole bay, in to individual buildings.
const MINZ = 0.09, MAXZ = 5.0;

function buildMap() {
  const wrap = h('div', { id: 'mapwrap' });
  mapSvg = h('svg', { id: 'mapsvg', width: vw, height: vh, viewBox: `0 0 ${vw} ${vh}` });

  const defs = h('defs', {}, [
    (() => {
      const g = h('radialGradient', { id: 'heat' });
      g.appendChild(h('stop', { offset: '0%',   'stop-color': 'var(--em)', 'stop-opacity': '.72' }));
      g.appendChild(h('stop', { offset: '45%',  'stop-color': 'var(--em)', 'stop-opacity': '.24' }));
      g.appendChild(h('stop', { offset: '100%', 'stop-color': 'var(--em)', 'stop-opacity': '0' }));
      return g;
    })(),
    (() => {
      const g = h('radialGradient', { id: 'youg' });
      g.appendChild(h('stop', { offset: '0%',   'stop-color': '#fff', 'stop-opacity': '.9' }));
      g.appendChild(h('stop', { offset: '100%', 'stop-color': '#fff', 'stop-opacity': '0' }));
      return g;
    })(),
    (() => {
      const f = h('filter', { id: 'soft', x: '-60%', y: '-60%', width: '220%', height: '220%' });
      f.appendChild(h('feGaussianBlur', { stdDeviation: '5' }));
      return f;
    })(),
  ]);
  mapSvg.appendChild(defs);

  mapG = h('g', { id: 'cam' });
  // ground
  mapG.appendChild(h('rect', { x: -400, y: -400, width: M.w + 800, height: M.h + 800, fill: 'var(--ink-2)' }));
  mapG.appendChild(h('path', { d: M.water, fill: '#050D16' }));
  mapG.appendChild(h('path', { d: M.parks, fill: '#0A1410' }));
  // streets, thinnest first — neutral silver, not teal. Brighter, more air.
  mapG.appendChild(h('path', { class: 'st-res', d: M.res, fill: 'none', stroke: '#2B353E', 'stroke-width': 1.7, 'stroke-linecap': 'round' }));
  mapG.appendChild(h('path', { class: 'st-ter', d: M.ter, fill: 'none', stroke: '#37444F', 'stroke-width': 2.3, 'stroke-linecap': 'round' }));
  mapG.appendChild(h('path', { class: 'st-sec', d: M.sec, fill: 'none', stroke: '#465562', 'stroke-width': 3.1, 'stroke-linecap': 'round' }));
  mapG.appendChild(h('path', { class: 'st-pri', d: M.pri, fill: 'none', stroke: '#5E7180', 'stroke-width': 4.5, 'stroke-linecap': 'round' }));
  mapG.appendChild(h('path', { class: 'st-hw',  d: M.hw,  fill: 'none', stroke: '#748A9A', 'stroke-width': 6.3, 'stroke-linecap': 'round' }));

  // buildings — real footprints, real heights. They extrude as you zoom in,
  // so the city physically rises out of the map.
  bldG = h('g', { class: 'blds', opacity: 0 });
  (M.bld || []).forEach(b => {
    const wall = h('path', { d: b.d, fill: '#0A0E13', stroke: 'none' });
    const roof = h('path', { d: b.d, fill: '#1A222B', stroke: 'rgba(206,222,236,.22)',
                             'stroke-width': .5, 'vector-effect': 'non-scaling-stroke' });
    bldG.appendChild(wall);
    bldG.appendChild(roof);
    bldRoofs.push({ el: roof, h: b.h });
  });
  mapG.appendChild(bldG);

  // street labels (real names)
  const lg = h('g', { class: 'st-labels' });
  (M.labels || []).forEach(l => {
    if (/Freeway|Highway|Route/.test(l.n)) return;
    lg.appendChild(h('text', {
      x: l.x, y: l.y, fill: '#3E6C7A', 'font-size': 11, 'font-family': 'var(--ui)',
      'text-anchor': 'middle', transform: `rotate(${l.a} ${l.x} ${l.y})`, 'letter-spacing': '.06em',
    }, [document.createTextNode(l.n.toUpperCase())]));
  });
  mapG.appendChild(lg);

  marksG = h('g', { class: 'marks' });
  mapG.appendChild(marksG);
  mapSvg.appendChild(mapG);
  wrap.appendChild(mapSvg);
  drawMarks();
  return wrap;
}

function heatRadius(v) { return 52 + v.heat * 96; }

// Marks keep a constant screen size as you zoom — the heat wash does not,
// because heat is a real geographic footprint and a mark is a label.
const pins = [];
function scalePins() {
  const k = 1 / st.cam.z;
  for (let i = 0; i < pins.length; i++) {
    const p = pins[i];
    p.g.setAttribute('transform', `translate(${p.x} ${p.y}) scale(${k})`);
  }
}

function drawMarks() {
  marksG.innerHTML = '';
  pins.length = 0;

  // heat wash — glow only, never a number or a word.
  // Held to a constant screen size so it always reads as a pool of light over
  // a few blocks, rather than swallowing the phone when you zoom in.
  S.venues.forEach(v => {
    if (!passesFilter(v)) return;
    const g = h('g', {});
    g.appendChild(h('circle', {
      r: heatRadius(v), fill: 'url(#heat)',
      opacity: 0.2 + v.heat * 0.55, class: 'heat',
    }));
    pins.push({ g, x: v.x, y: v.y });
    marksG.appendChild(g);
  });

  // you — constant size, like every map app
  const yg = h('g', {});
  yg.appendChild(h('circle', { r: 30, fill: 'url(#youg)', opacity: .55 }));
  yg.appendChild(h('circle', { r: 7.5, fill: '#fff' }));
  yg.appendChild(h('circle', { r: 7.5, fill: 'none', stroke: '#04070A', 'stroke-width': 2 }));
  pins.push({ g: yg, x: YOU.x, y: YOU.y });
  marksG.appendChild(yg);

  // local spots
  S.spots.forEach(sp => {
    if (st.filters.size && !st.filters.has('spot')) return;
    const g = h('g', { class: 'mk', onclick: () => Screens.spot(sp) });
    g.appendChild(h('circle', { r: 9, fill: 'none', stroke: 'var(--gold)', 'stroke-width': 2, 'stroke-dasharray': '3 3' }));
    g.appendChild(h('circle', { r: 3, fill: 'var(--gold)' }));
    pins.push({ g, x: sp.x, y: sp.y });
    marksG.appendChild(g);
  });

  // after-parties (only in afters mode)
  if (st.afters) S.afters.forEach(a => {
    const g = h('g', { class: 'mk', onclick: () => Screens.after(a) });
    g.appendChild(h('circle', { r: 26, fill: 'var(--em)', opacity: .16 }));
    g.appendChild(h('circle', { r: 13, fill: '#0A0710' }));
    g.appendChild(h('circle', { r: 13, fill: 'none', stroke: 'var(--em-hi)', 'stroke-width': 2.4 }));
    g.appendChild(h('text', { y: 4.2, 'text-anchor': 'middle', fill: 'var(--em-hi)', 'font-size': 11.5, 'font-weight': 700, 'font-family': 'var(--ui)' }, [document.createTextNode(String(window.Engine.afterGoingCount(a)))]));
    g.appendChild(h('text', {
      y: 30, 'text-anchor': 'middle', fill: '#E4D0FF', 'font-size': 11.5, 'font-weight': 700,
      'font-family': 'var(--ui)', class: 'vlabel', 'paint-order': 'stroke',
      stroke: '#0A0710', 'stroke-width': 3.5, 'stroke-linejoin': 'round',
    }, [document.createTextNode(a.host + '’s')]));
    pins.push({ g, x: a.x, y: a.y });
    marksG.appendChild(g);
  });

  // venues
  S.venues.forEach(v => {
    if (!passesFilter(v)) return;
    const g = h('g', { class: 'mk', onclick: () => Screens.venue(v) });
    const stories = storiesFor(v.id);
    const r = 10 + v.heat * 8;

    // story ring — one segment per live story, freshest brightest
    if (stories.length) {
      const n = Math.min(stories.length, 8), rr = r + 6;
      const circ = 2 * Math.PI * rr, seg = circ / n;
      stories.slice(0, n).forEach((s, i) => {
        const fresh = clamp(1 - s.mins / 90, .18, 1);
        g.appendChild(h('circle', {
          r: rr, fill: 'none',
          stroke: s.mins < 20 ? 'var(--em-hi)' : 'var(--em)',
          'stroke-opacity': fresh, 'stroke-width': 2.6,
          'stroke-dasharray': `${seg * .68} ${seg * .32}`,
          'stroke-dashoffset': -i * seg,
          transform: 'rotate(-90)',
        }));
      });
    }

    g.appendChild(h('circle', { r: r, fill: '#04120C', opacity: .9 }));
    g.appendChild(h('circle', {
      r: r, fill: 'none',
      stroke: 'var(--em)', 'stroke-width': 1.6 + v.heat * 2.4, 'stroke-opacity': .38 + v.heat * .62,
    }));
    g.appendChild(h('circle', { r: 2.6 + v.heat * 2.6, fill: 'var(--em-hi)', opacity: .5 + v.heat * .5 }));

    // friends & mutuals here (opt-in, per night)
    const pp = peopleAt(v.id).filter(p => p.friend || p.mutual);
    if (pp.length) {
      g.appendChild(h('circle', { cx: r + 6, cy: -r - 2, r: 8, fill: '#04120C', stroke: 'var(--em-hi)', 'stroke-width': 1.4 }));
      g.appendChild(h('text', {
        x: r + 6, y: -r + 1.6, 'text-anchor': 'middle', fill: 'var(--em-hi)',
        'font-size': 9.5, 'font-weight': 800, 'font-family': 'var(--ui)',
      }, [document.createTextNode(String(pp.length))]));
    }

    g.appendChild(h('text', {
      y: r + 16, 'text-anchor': 'middle', fill: '#E6F1F7',
      'font-size': 11.5, 'font-weight': 700, 'font-family': 'var(--ui)',
      class: 'vlabel', 'paint-order': 'stroke', stroke: '#04070A', 'stroke-width': 3.5,
      'stroke-linejoin': 'round',
    }, [document.createTextNode(v.name)]));
    pins.push({ g, x: v.x, y: v.y });
    marksG.appendChild(g);
  });

  scalePins();
}

function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8, toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function passesFilter(v) {
  if (st.searchQuery) {
    const q = st.searchQuery.toLowerCase();
    if (!v.name.toLowerCase().includes(q) && !v.district.toLowerCase().includes(q)) return false;
  }
  if (st.filters.size && !st.filters.has(v.kind)) return false;
  if (st.filterVibe.size) {
    const vibeLower = v.vibe.map((x) => x.toLowerCase());
    const hit = Array.from(st.filterVibe).some((f) => vibeLower.some((x) => x.includes(f.toLowerCase())));
    if (!hit) return false;
  }
  if (st.filterCost != null && v.entry[0] > st.filterCost) return false;
  if (st.filterDistance != null && haversineMiles(YOU_LL.lat, YOU_LL.lon, v.lat, v.lon) > st.filterDistance) return false;
  if (st.filterGreenOnly && !peopleAt(v.id).some((p) => p.status === 'green')) return false;
  return true;
}

/* ---- Camera ------------------------------------------------------------- */
function applyCam() {
  const { x, y, z } = st.cam;
  mapG.setAttribute('transform', `translate(${vw / 2 - x * z} ${vh / 2 - y * z}) scale(${z})`);
  // labels fade in with zoom
  scalePins();

  // buildings rise out of the ground as you come down into the city
  if (bldG) {
    const t = clamp((z - 0.34) / 0.85, 0, 1);
    bldG.setAttribute('opacity', String(t));
    const lift = t * t * 0.42;                 // eases in, so the pop is felt
    for (let i = 0; i < bldRoofs.length; i++) {
      const b = bldRoofs[i];
      b.el.setAttribute('transform', `translate(0 ${-b.h * lift})`);
    }
  }

  const showLabels = z > 0.22 ? 1 : 0;
  $$('.vlabel', mapSvg).forEach(t => t.style.opacity = showLabels);
  const sl = $('.st-labels', mapSvg); if (sl) sl.style.opacity = z > 1.15 ? .85 : 0;
  if (Pet.el) Pet.follow();
}

// The opening shot: your neighbourhood at a zoom where the streets still read
// as streets. SF's venues really are spread over a couple of miles — no zoom
// shows them all and still looks like a map, so we open where you are and let
// the live strip fly you anywhere in one tap.
function fitVenues() {
  return { x: YOU.x + 55, y: YOU.y - 165, z: 0.46 };
}

function flyTo(x, y, z, ms) {
  const s = { ...st.cam }, t0 = performance.now(), dur = ms || 900;
  const tgt = { x, y, z: z || st.cam.z };
  function step(now) {
    const p = clamp((now - t0) / dur, 0, 1);
    const e = 1 - Math.pow(1 - p, 3);
    st.cam.x = lerp(s.x, tgt.x, e);
    st.cam.y = lerp(s.y, tgt.y, e);
    st.cam.z = lerp(s.z, tgt.z, e);
    applyCam();
    if (p < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

function bindGestures(wrap) {
  let pts = new Map(), last = null, vx = 0, vy = 0, raf = null, pinch0 = null;

  let captured = false, downAt = null;
  wrap.addEventListener('pointerdown', e => {
    // never hijack taps meant for the UI floating above the map
    if (e.target.closest && e.target.closest('#mapui')) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    last = { x: e.clientX, y: e.clientY, t: performance.now() };
    downAt = { x: e.clientX, y: e.clientY };
    captured = false;
    if (raf) cancelAnimationFrame(raf), raf = null;
    if (pts.size === 2) pinch0 = pinchState();
  });
  wrap.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId)) return;
    // only start capturing once it is clearly a drag, so taps still land
    if (!captured && downAt && pts.size === 1) {
      if (Math.hypot(e.clientX - downAt.x, e.clientY - downAt.y) < 5) return;
      captured = true;
      try { wrap.setPointerCapture(e.pointerId); } catch (_) {}
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2 && pinch0) {
      const p = pinchState();
      // pinching out just shows more city, like any normal map.
      // The globe is somewhere you choose to go, not somewhere you fall into.
      st.cam.z = clamp(pinch0.z * (p.d / pinch0.d), MINZ, MAXZ);
      applyCam();
      return;
    }
    const now = performance.now(), dt = Math.max(now - last.t, 1);
    const dx = (e.clientX - last.x) / st.cam.z, dy = (e.clientY - last.y) / st.cam.z;
    st.cam.x -= dx; st.cam.y -= dy;
    vx = dx / dt * 16; vy = dy / dt * 16;
    last = { x: e.clientX, y: e.clientY, t: now };
    applyCam();
  });
  const up = e => {
    pts.delete(e.pointerId); pinch0 = pts.size === 2 ? pinchState() : null;
    if (pts.size) return;
    const decay = () => {
      vx *= .93; vy *= .93;
      st.cam.x -= vx; st.cam.y -= vy;
      applyCam();
      if (Math.abs(vx) > .05 || Math.abs(vy) > .05) raf = requestAnimationFrame(decay);
    };
    if (Math.abs(vx) > .4 || Math.abs(vy) > .4) raf = requestAnimationFrame(decay);
  };
  wrap.addEventListener('pointerup', up);
  wrap.addEventListener('pointercancel', up);
  wrap.addEventListener('wheel', e => {
    e.preventDefault();
    st.cam.z = clamp(st.cam.z * (1 - e.deltaY * 0.0016), MINZ, MAXZ);
    applyCam();
  }, { passive: false });

  function pinchState() {
    const a = Array.from(pts.values());
    return { d: Math.hypot(a[0].x - a[1].x, a[0].y - a[1].y), z: st.cam.z };
  }
}

/* ---- The pet: a very cute, friendly disco creature ---------------------- */
const Pet = {
  el: null, x: 0, y: 0, tx: 0, ty: 0, t: 0, msg: null,
  build() {
    const w = h('div', {
      style: { position: 'absolute', width: '54px', height: '62px', zIndex: 24,
               pointerEvents: 'auto', cursor: 'pointer', willChange: 'transform' },
      onclick: () => Pet.speak(Pet.tip(), 4200),
    });
    w.innerHTML = `
      <svg viewBox="0 0 54 62" width="54" height="62">
        <defs>
          <radialGradient id="ball" cx="35%" cy="28%">
            <stop offset="0%" stop-color="#EAFFF6"/>
            <stop offset="42%" stop-color="#46FFB4"/>
            <stop offset="100%" stop-color="#0B7A5B"/>
          </radialGradient>
          <clipPath id="bclip"><circle cx="27" cy="26" r="18"/></clipPath>
        </defs>
        <ellipse cx="27" cy="57" rx="13" ry="3.4" fill="#000" opacity=".45"/>
        <g class="pbody">
          <path d="M20 42 L18 53" stroke="#0B7A5B" stroke-width="3.4" stroke-linecap="round"/>
          <path d="M34 42 L36 53" stroke="#0B7A5B" stroke-width="3.4" stroke-linecap="round"/>
          <ellipse cx="17" cy="54.5" rx="5" ry="3.1" fill="#46FFB4"/>
          <ellipse cx="37" cy="54.5" rx="5" ry="3.1" fill="#46FFB4"/>
          <circle cx="27" cy="26" r="18" fill="url(#ball)"/>
          <g clip-path="url(#bclip)" opacity=".33" stroke="#04120C" stroke-width="1.1">
            <path d="M9 17h36M9 26h36M9 35h36M16 8v36M27 8v36M38 8v36"/>
          </g>
          <ellipse cx="20" cy="17" rx="5.5" ry="3.6" fill="#fff" opacity=".55" transform="rotate(-24 20 17)"/>
          <circle cx="21" cy="27" r="3.5" fill="#04120C"/>
          <circle cx="34" cy="27" r="3.5" fill="#04120C"/>
          <circle cx="22.2" cy="25.8" r="1.25" fill="#fff"/>
          <circle cx="35.2" cy="25.8" r="1.25" fill="#fff"/>
          <path d="M23 34.5q4 3.4 8 0" stroke="#04120C" stroke-width="2" fill="none" stroke-linecap="round"/>
          <circle cx="15.5" cy="32" r="2.4" fill="#F55B8A" opacity=".5"/>
          <circle cx="39" cy="32" r="2.4" fill="#F55B8A" opacity=".5"/>
        </g>
      </svg>`;
    this.el = w;
    this.bubble = h('div', {
      style: {
        position: 'absolute', zIndex: 25, maxWidth: '210px', padding: '10px 13px',
        borderRadius: '15px', background: 'rgba(12,19,26,.96)', color: 'var(--fg)',
        fontSize: '13px', lineHeight: '1.35', boxShadow: '0 0 0 1px rgba(18,224,138,.35), 0 14px 30px -10px rgba(0,0,0,.9)',
        opacity: '0', transform: 'translateY(6px) scale(.95)', transition: 'all .3s cubic-bezier(.22,1.2,.36,1)',
        pointerEvents: 'none', fontWeight: '500',
      },
    });
    this.loop();
    return frag([this.bubble, w]);
  },
  follow() {
    const { x, y, z } = st.cam;
    // sits next to you on the map, but never wanders off screen
    this.tx = clamp(vw / 2 + (YOU.x - x) * z + 26, 42, vw - 42);
    this.ty = clamp(vh / 2 + (YOU.y - y) * z - 46, 150, vh - 210);
  },
  loop() {
    const step = () => {
      this.t += 0.045;
      this.x = lerp(this.x || this.tx, this.tx, 0.09);
      this.y = lerp(this.y || this.ty, this.ty, 0.09);
      const bob = Math.sin(this.t) * 3.4;
      const sq = 1 + Math.sin(this.t * 2) * 0.022;
      if (this.el) {
        this.el.style.transform = `translate(${this.x - 27}px, ${this.y - 31 + bob}px)`;
        const b = this.el.querySelector('.pbody');
        if (b) b.style.transform = `scaleY(${sq}) scaleX(${2 - sq})`, b.style.transformOrigin = '27px 44px';
        this.bubble.style.left = (this.x + 24) + 'px';
        this.bubble.style.top = (this.y - 26 + bob) + 'px';
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  },
  speak(txt, ms) {
    if (!this.bubble) return;
    this.bubble.textContent = txt;
    this.bubble.style.opacity = '1';
    this.bubble.style.transform = 'translateY(0) scale(1)';
    clearTimeout(this._t);
    this._t = setTimeout(() => {
      this.bubble.style.opacity = '0';
      this.bubble.style.transform = 'translateY(6px) scale(.95)';
    }, ms || 3600);
  },
  // Delegates to PetBrain (data/pet-brain.js) — the architectural seam for
  // the assistant's intelligence. See that file for why this isn't a fixed
  // script: every line it can say is checked against live state first.
  tip() {
    if (!window.PetBrain) return 'Evening.';
    const personId = window.Engine ? window.Engine.getActivePersonaId() : 'you';
    return window.PetBrain.getMessage({ personId, S, Engine: window.Engine, byId });
  },
};

/* ---- The mark: func. with the eye-person as the "n" --------------------- */
// Chrome line-art. The letters retract into the pupil; the pupil becomes Earth.
const LOGO = {
  defs: `
    <linearGradient id="chrome" x1="0" y1="0" x2="0.35" y2="1">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="16%"  stop-color="#D8DEE4"/>
      <stop offset="34%"  stop-color="#828A92"/>
      <stop offset="52%"  stop-color="#FBFDFF"/>
      <stop offset="70%"  stop-color="#949CA4"/>
      <stop offset="86%"  stop-color="#EAEEF2"/>
      <stop offset="100%" stop-color="#A8B0B8"/>
    </linearGradient>
    <radialGradient id="pearl" cx="34%" cy="28%">
      <stop offset="0%"   stop-color="#FFFFFF"/>
      <stop offset="38%"  stop-color="#DCE3E9"/>
      <stop offset="72%"  stop-color="#8E979F"/>
      <stop offset="100%" stop-color="#5A636B"/>
    </radialGradient>
    <radialGradient id="earth" cx="36%" cy="30%">
      <stop offset="0%"   stop-color="#8FD8FF"/>
      <stop offset="35%"  stop-color="#2E86C8"/>
      <stop offset="78%"  stop-color="#10406E"/>
      <stop offset="100%" stop-color="#04182E"/>
    </radialGradient>
    <radialGradient id="atmo" cx="50%" cy="50%">
      <stop offset="72%"  stop-color="#7FD4FF" stop-opacity="0"/>
      <stop offset="92%"  stop-color="#7FD4FF" stop-opacity=".42"/>
      <stop offset="100%" stop-color="#7FD4FF" stop-opacity="0"/>
    </radialGradient>`,
  // Everything lives in one 400x170 space with the eye centred at (210,72),
  // so the letters, the eye and the pupil all line up.
  letters: `
    <g fill="none" stroke="url(#chrome)" stroke-width="7.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M94 126V58c0-14 10-21 22-18"/>
      <path d="M74 86h40"/>
      <path d="M134 86v22c0 11 8 18 18 18s18-7 18-18V86"/>
      <path d="M170 86v40"/>
      <path d="M300 98c-5-9-13-14-23-14-15 0-25 11-25 24s10 24 25 24c10 0 18-5 23-14"/>
    </g>
    <circle cx="329" cy="120" r="7.5" fill="url(#chrome)"/>`,
  eye: `
    <g class="eyeshape" fill="none" stroke="url(#chrome)" stroke-width="7.5"
       stroke-linecap="round" stroke-linejoin="round">
      <path class="lidTop" d="M166 70q44-48 88 0"/>
      <path class="lidBot" d="M166 70q44 48 88 0"/>
    </g>`,
  // the little person: the head IS the pupil, arms raised into the eye,
  // legs coming down to form the stem of the "n"
  person: `
    <g class="person">
      <g fill="none" stroke="url(#chrome)" stroke-width="7" stroke-linecap="round">
        <path d="M210 84v20"/>
        <path d="M210 103l-13 23"/>
        <path d="M210 103l13 23"/>
        <path d="M210 88l-24-18"/>
        <path d="M210 88l24-18"/>
      </g>
      <circle class="pupil" cx="210" cy="70" r="15" fill="url(#pearl)"/>
    </g>`,
};

function logoSVG(cls) {
  const s = h('svg', { class: cls || '', viewBox: '0 0 400 170' });
  s.innerHTML = `<defs>${LOGO.defs}</defs>
    <g class="letters">${LOGO.letters}</g>${LOGO.eye}${LOGO.person}`;
  return s;
}

/* ---- Cold open v2: logo → into the eye → blink → Earth → dive ----------- */
// Follows the storyboard: logo appears, the letters retract into the pupil,
// the eye blinks, the pupil becomes Earth, Earth fills the screen, we dive in.
function coldOpenV2(done) {
  const o = h('div', { style: {
    position: 'absolute', inset: '0', zIndex: '100', background: '#000',
    overflow: 'hidden',
  }});
  o.innerHTML = `
  <svg viewBox="0 0 390 844" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <defs>${LOGO.defs}
      <linearGradient id="wall" x1="0" y1="0" x2=".6" y2="1">
        <stop offset="0%" stop-color="#0B0D10"/><stop offset="55%" stop-color="#050607"/>
        <stop offset="100%" stop-color="#000000"/>
      </linearGradient>
    </defs>
    <rect id="bg" width="390" height="844" fill="#000"/>

    <!-- 1 — Home Screen. Placeholder tiles only; we never imitate other
         companies' icons. -->
    <g id="home">
      <rect width="390" height="844" fill="url(#wall)"/>
      <text x="34" y="44" fill="#E8ECF0" font-family="var(--ui)" font-size="14" font-weight="600">9:41</text>
      <g fill="#171A1E" opacity=".9">
        <rect x="34"  y="96"  width="62" height="62" rx="16"/>
        <rect x="118" y="96"  width="62" height="62" rx="16"/>
        <rect x="202" y="96"  width="62" height="62" rx="16"/>
        <rect x="286" y="96"  width="62" height="62" rx="16"/>
        <rect x="34"  y="184" width="62" height="62" rx="16"/>
        <rect x="118" y="184" width="62" height="62" rx="16"/>
        <rect x="202" y="184" width="62" height="62" rx="16"/>
        <rect x="34"  y="712" width="62" height="62" rx="16"/>
        <rect x="118" y="712" width="62" height="62" rx="16"/>
        <rect x="202" y="712" width="62" height="62" rx="16"/>
        <rect x="286" y="712" width="62" height="62" rx="16"/>
      </g>
      <g id="appicon">
        <rect id="iconplate" x="286" y="184" width="62" height="62" rx="16" fill="#0A0B0D"
              stroke="rgba(255,255,255,.14)" stroke-width="1"/>
        <g id="iconmark" opacity=".95"></g>
      </g>
    </g>

    <g id="logo" transform="translate(-10 250)" opacity="0">
      <g class="letters" id="letters">${LOGO.letters}</g>
      ${LOGO.eye}
      ${LOGO.person}
    </g>

    <g id="world" opacity="0">
      <g id="globe">
        <circle id="atmo" cx="100" cy="100" r="122" fill="url(#atmo)"/>
        <circle id="ball" cx="100" cy="100" r="100" fill="url(#earth)"/>
        <g id="land" opacity=".92" fill="#2F6B4A">
          <path d="M52 44C62 33 79 31 89 39c8 7 6 19 0 25c-5 6-3 14-9 18c-8 5-17-2-21-10C53 64 45 54 52 44Z"/>
          <path d="M86 96c9-5 15 2 13 12c-2 12-8 24-12 32c-4 6-11 2-9-8c3-13 2-29 8-36Z"/>
          <path d="M128 50c9-2 15 6 11 15c-5 11-9 25-13 36c-4 10-11 6-9-6c3-15 5-38 11-45Z"/>
          <path d="M64 26c7-3 14 0 12 6c-2 5-10 6-14 3c-3-3-2-8 2-9Z"/>
        </g>
        <g id="grid" fill="none" stroke="#BFE6FF" stroke-opacity=".18" stroke-width=".7">
          <circle cx="100" cy="100" r="100"/>
          <ellipse cx="100" cy="100" rx="100" ry="34"/>
          <ellipse cx="100" cy="100" rx="100" ry="68"/>
          <ellipse cx="100" cy="100" rx="34" ry="100"/>
          <ellipse cx="100" cy="100" rx="68" ry="100"/>
        </g>
        <g id="beacons">
          <circle cx="58" cy="70" r="3" fill="#EAFBFF"/>
          <circle cx="58" cy="70" r="8" fill="#8FD8FF" opacity=".35"/>
          <circle cx="64" cy="86" r="2.2" fill="#EAFBFF"/>
        </g>
      </g>
    </g>

    <g id="wm" opacity="0">
      <text x="195" y="742" text-anchor="middle" fill="#C9D2DA" font-family="var(--ui)"
            font-size="11.5" letter-spacing=".34em">SAN FRANCISCO</text>
    </g>
  </svg>`;

  const q = s => o.querySelector(s);
  const logo = q('#logo'), letters = q('#letters'), world = q('#world');
  const globe = q('#globe'), ball = q('#ball'), atmo = q('#atmo');
  const land = q('#land'), grid = q('#grid'), beacons = q('#beacons');
  const lidT = q('.lidTop'), lidB = q('.lidBot'), person = q('.person');
  const wm = q('#wm'), bg = q('#bg');

  // the mark, shrunk into the app icon
  const home = q('#home'), appicon = q('#appicon'), iconmark = q('#iconmark');
  iconmark.innerHTML = LOGO.letters + LOGO.eye + LOGO.person;
  (function fitIcon() {
    const s = 0.185, cx = 317, cy = 215;   // icon centre on the home screen
    iconmark.setAttribute('transform',
      `translate(${cx - 205.5 * s} ${cy - 80 * s}) scale(${s})`);
  })();

  const K = 1;
  const P = { home: 1050, in: 950, retract: 780, blink: 620, become: 700, grow: 950, dive: 900 };
  const T = [];
  let acc = 0;
  for (const k in P) { acc += P[k] * K; T.push(acc); }
  const [t0h, t1, t2, t3, t4, t5, t6] = T;
  const t0 = performance.now();

  // The globe is authored in a 200x200 box centred at (100,100). Everything in
  // it — ocean, land, grid, city lights — scales as one object.
  const EYE = { x: 200, y: 322 };
  function placeGlobe(r, spin) {
    const s = r / 100;
    globe.setAttribute('transform',
      `translate(${EYE.x - 100 * s} ${EYE.y - 100 * s}) scale(${s})`
      + (spin ? ` rotate(${spin} 100 100)` : ''));
  }

  // logo-space coords: the eye lives at (210,70) inside #logo
  function lid(k) { // k=1 open, k=0 shut
    const a = 48 * k;
    lidT.setAttribute('d', `M166 70q44 ${-a} 88 0`);
    lidB.setAttribute('d', `M166 70q44 ${a} 88 0`);
  }

  function step(now) {
    const t = now - t0;

    if (t < t0h) {                         // 1 — home screen, then the icon opens
      const p = t / t0h;
      lid(1);
      if (p < .5) {                        // sit on the home screen a beat
        home.setAttribute('opacity', '1');
        appicon.setAttribute('transform', 'translate(0 0) scale(1)');
      } else {                             // the icon expands into the app
        const e = (p - .5) / .5, s = 1 + e * e * 15;
        appicon.setAttribute('transform',
          `translate(${317 - 317 * s} ${215 - 215 * s}) scale(${s})`);
        iconmark.setAttribute('opacity', String(clamp(.95 - e * 3, 0, 1)));
        q('#iconplate').setAttribute('stroke-opacity', String(clamp(1 - e * 3, 0, 1)));
        home.setAttribute('opacity', String(clamp(1 - (e - .35) * 2.2, 0, 1)));
      }

    } else if (t < t1) {                   // 2 — logo appears
      home.setAttribute('opacity', '0');
      const p = (t - t0h) / P.in, e = 1 - Math.pow(1 - p, 3);
      logo.setAttribute('opacity', String(e));
      logo.setAttribute('transform', `translate(-10 ${262 - 12 * e})`);
      lid(1);
      wm.setAttribute('opacity', String(clamp((p - .45) * 2, 0, 1)));

    } else if (t < t2) {                   // 3 — letters retract into the pupil
      const p = (t - t1) / P.retract, e = p * p * (3 - 2 * p);
      letters.setAttribute('opacity', String(1 - e));
      letters.setAttribute('transform',
        `translate(${210 * e} ${72 * e}) scale(${1 - e})`);
      person.setAttribute('opacity', String(1 - e * .15));

    } else if (t < t3) {                   // 4a — the blink
      const p = (t - t2) / P.blink;
      const k = p < .5 ? 1 - p * 2 : (p - .5) * 2;
      lid(k);
      person.setAttribute('opacity', String(clamp(1 - p * 2.4, 0, 1)));
      letters.setAttribute('opacity', '0');

    } else if (t < t4) {                   // 4b — the pupil becomes Earth
      const p = (t - t3) / P.become, e = 1 - Math.pow(1 - p, 3);
      lid(1);
      world.setAttribute('opacity', '1');
      placeGlobe(15 + e * 63);
      land.setAttribute('opacity', String(.1 + e * .82));
      grid.setAttribute('opacity', String(e));
      beacons.setAttribute('opacity', String(e));
      q('.pupil').setAttribute('opacity', String(clamp(1 - e * 2.2, 0, 1)));
      q('.eyeshape').setAttribute('opacity', String(clamp(1 - e * 1.15, 0, 1)));
      q('.person').setAttribute('opacity', '0');

    } else if (t < t5) {                   // 5 — Earth expands to fill the screen
      const p = (t - t4) / P.grow, e = p * p * (3 - 2 * p);
      placeGlobe(78 + e * 320, -10 * e);
      q('.eyeshape').setAttribute('opacity', '0');
      logo.setAttribute('opacity', '0');
      wm.setAttribute('opacity', String(1 - e));

    } else if (t < t6) {                   // 6 — dive through the atmosphere
      const p = (t - t5) / P.dive, e = p * p;
      placeGlobe(398 + e * 2600, -10 - 6 * e);
      world.setAttribute('opacity', String(clamp(1 - e * 1.15, 0, 1)));
      bg.setAttribute('opacity', String(clamp(1 - e * 1.4, 0, 1)));
      o.style.pointerEvents = 'none';

    } else { o.remove(); done && done(); return; }
    requestAnimationFrame(step);
  }
  lid(1);
  requestAnimationFrame(step);
  return o;
}

/* ---- Cold open (v1, kept for reference): eye → globe → dive ------------- */
function coldOpen(done) {
  const o = h('div', { style: {
    position: 'absolute', inset: '0', zIndex: '100', background: '#04070A',
    display: 'grid', placeItems: 'center', overflow: 'hidden',
  }});
  o.innerHTML = `
  <svg viewBox="0 0 390 844" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <defs>
      <radialGradient id="iris" cx="50%" cy="50%">
        <stop offset="0%"  stop-color="#EAFFF6"/>
        <stop offset="35%" stop-color="#46FFB4"/>
        <stop offset="75%" stop-color="#0B7A5B"/>
        <stop offset="100%" stop-color="#03211A"/>
      </radialGradient>
      <clipPath id="lid"><path id="lidpath" d="M195 422 Q195 422 195 422 Q195 422 195 422Z"/></clipPath>
      <radialGradient id="glow2"><stop offset="0%" stop-color="#12E08A" stop-opacity=".5"/><stop offset="100%" stop-color="#12E08A" stop-opacity="0"/></radialGradient>
    </defs>
    <rect width="390" height="844" fill="#04070A"/>
    <g id="eyeg" opacity="0">
      <ellipse cx="195" cy="422" rx="150" ry="150" fill="url(#glow2)" opacity=".55"/>
      <g clip-path="url(#lid)">
        <circle cx="195" cy="422" r="72" fill="#031A14"/>
        <circle id="irisc" cx="195" cy="422" r="46" fill="url(#iris)"/>
        <circle cx="195" cy="422" r="17" fill="#020D0A"/>
        <ellipse cx="178" cy="404" rx="13" ry="9" fill="#fff" opacity=".75" transform="rotate(-25 178 404)"/>
      </g>
      <path id="lidline" d="M105 422 Q195 422 285 422" stroke="#46FFB4" stroke-width="3" fill="none" stroke-linecap="round" opacity=".9"/>
    </g>
    <g id="globeg" opacity="0">
      <circle cx="195" cy="422" r="120" fill="#03150F" stroke="#12E08A" stroke-opacity=".35" stroke-width="1.2"/>
      <g stroke="#12E08A" stroke-opacity=".28" fill="none" stroke-width="1">
        <ellipse cx="195" cy="422" rx="120" ry="40"/>
        <ellipse cx="195" cy="422" rx="120" ry="80"/>
        <ellipse cx="195" cy="422" rx="40" ry="120"/>
        <ellipse cx="195" cy="422" rx="80" ry="120"/>
        <line x1="75" y1="422" x2="315" y2="422"/>
      </g>
      <g id="cities">
        <circle cx="150" cy="398" r="6" fill="#46FFB4"/>
        <circle cx="150" cy="398" r="14" fill="#46FFB4" opacity=".22"/>
        <circle cx="163" cy="425" r="4.5" fill="#46FFB4"/>
        <circle cx="163" cy="425" r="11" fill="#46FFB4" opacity=".18"/>
        <circle cx="236" cy="392" r="2.4" fill="#2A6B7E"/>
        <circle cx="258" cy="440" r="2.4" fill="#2A6B7E"/>
        <circle cx="212" cy="470" r="2.4" fill="#2A6B7E"/>
        <circle cx="196" cy="356" r="2.4" fill="#2A6B7E"/>
      </g>
    </g>
    <g id="wordmark" opacity="0">
      <text x="195" y="700" text-anchor="middle" fill="#fff" font-family="var(--display)"
            font-size="46" font-weight="700" letter-spacing="1">FUNC.</text>
      <text id="tagline" x="195" y="726" text-anchor="middle" fill="#6D7C89" font-family="var(--ui)"
            font-size="12.5" letter-spacing=".22em">SAN FRANCISCO</text>
    </g>
  </svg>`;

  const svg = o.querySelector('svg');
  const lid = o.querySelector('#lidpath');
  const eyeg = o.querySelector('#eyeg');
  const lidline = o.querySelector('#lidline');
  const globeg = o.querySelector('#globeg');
  const wm = o.querySelector('#wordmark');
  const irisc = o.querySelector('#irisc');

  const t0 = performance.now();
  // ?slow=4 plays the open in slow motion — useful when presenting it
  const K = Math.max(1, +(new URLSearchParams(location.search).get('slow') || 1));
  const dur = { open: 900 * K, hold: 260 * K, morph: 620 * K, spin: 900 * K, dive: 820 * K };
  const openEnd = dur.open, holdEnd = openEnd + dur.hold,
        morphEnd = holdEnd + dur.morph, spinEnd = morphEnd + dur.spin,
        diveEnd = spinEnd + dur.dive;

  eyeg.style.opacity = 1;
  wm.style.opacity = 0;

  function lidAt(k) { // k 0..1 how open
    const r = 92, o1 = 118 * k;
    return `M${195 - r} 422 Q195 ${422 - o1 * 1.55} ${195 + r} 422 Q195 ${422 + o1 * 1.55} ${195 - r} 422Z`;
  }

  function step(now) {
    const t = now - t0;
    if (t < openEnd) {
      const p = t / openEnd, e = 1 - Math.pow(1 - p, 2.6);
      lid.setAttribute('d', lidAt(e));
      lidline.style.opacity = Math.max(0, 1 - p * 2.2);
      wm.style.opacity = clamp((p - .45) * 2, 0, 1);
    } else if (t < holdEnd) {
      lid.setAttribute('d', lidAt(1));
    } else if (t < morphEnd) {
      const p = (t - holdEnd) / dur.morph, e = p * p * (3 - 2 * p);
      lid.setAttribute('d', lidAt(1 + e * .9));
      irisc.setAttribute('r', 46 + e * 78);
      irisc.style.opacity = 1 - e * .9;
      globeg.style.opacity = e;
      eyeg.style.opacity = 1 - e * .85;
    } else if (t < spinEnd) {
      const p = (t - morphEnd) / dur.spin, e = 1 - Math.pow(1 - p, 3);
      eyeg.style.opacity = Math.max(0, .15 - e);
      globeg.style.opacity = 1;
      globeg.setAttribute('transform',
        `translate(${195 - (195 + (150 - 195) * e)} ${422 - (422 + (398 - 422) * e)}) scale(${1 + e * .35}) `
        + `translate(${(195) * 0} 0)`);
      globeg.style.transformOrigin = '195px 422px';
      globeg.setAttribute('transform', `rotate(${-18 * e} 195 422) scale(${1 + e * .4})`);
      globeg.style.transformBox = 'view-box';
      o.querySelector('#tagline').textContent = 'SAN FRANCISCO';
    } else if (t < diveEnd) {
      const p = (t - spinEnd) / dur.dive, e = p * p;
      globeg.setAttribute('transform', `rotate(-18 195 422) scale(${1.4 + e * 11}) `);
      globeg.style.transformOrigin = '150px 398px';
      globeg.style.opacity = 1 - e * 1.05;
      o.style.background = 'transparent';
      svg.querySelector('rect').setAttribute('opacity', String(1 - e));
      wm.style.opacity = 1 - e * 1.6;
      o.style.pointerEvents = 'none';
    } else {
      o.remove();
      done && done();
      return;
    }
    requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
  return o;
}

/* ---- Tab bar ------------------------------------------------------------ */
function buildTabs() {
  const mk = (id, ic, label, centre) => {
    const t = h('div', { class: 'tab', id: 'tab-' + id, onclick: () => go(id) });
    if (centre) {
      t.appendChild(h('div', { class: 'eye', html: I[ic] }));
    } else {
      t.appendChild(h('span', { html: I[ic] }));
      t.appendChild(h('span', { class: 'tlab', text: label }));
    }
    return t;
  };
  const bar = h('div', { id: 'tabs' }, [
    mk('browse', 'cards', 'Browse'),
    mk('plans', 'plans', 'Plans'),
    mk('map', 'eye', '', true),
    mk('inbox', 'inbox', 'Inbox'),
    mk('me', 'me', 'Profile'),
  ]);
  return bar;
}

function go(id) {
  st.screen = id;
  $$('.screen').forEach(s => s.classList.toggle('on', s.dataset.id === id));
  $$('.tab').forEach(t => t.classList.toggle('on', t.id === 'tab-' + id));
  if (Screens.onShow[id]) Screens.onShow[id]();
  buzz(6);
}

/* ---- Boot --------------------------------------------------------------- */
let Screens = null;

// Demo mode's one account is pre-verified (see engine-demo.js) — it never
// needs the gate. Real mode requires a session whose account has cleared
// verification, profile and onboarding before the map is reachable, exactly
// the way a signed-out or half-onboarded user shouldn't see the product.
function sessionReady() {
  if (!window.Engine || window.Engine.mode !== 'real') return true;
  const id = window.Engine.getSessionPersonId();
  if (!id) return false;
  const acc = window.Engine.getAccount(id);
  return !!(acc && acc.verification.status === 'verified' && acc.profileComplete && acc.onboardingComplete);
}

function boot() {
  if (window.STORE) window.STORE.init();

  const phone = $('#phone');
  const rect = phone.getBoundingClientRect();
  vw = Math.round(rect.width); vh = Math.round(rect.height);

  Screens = window.SCREENS(ctx());

  if (!sessionReady()) {
    Screens.authFlow(phone, () => bootMain(phone));
  } else {
    bootMain(phone);
  }
}

function bootMain(phone) {
  const mapWrap = buildMap();
  const mapScreen = h('div', { class: 'screen on', 'data-id': 'map' }, [mapWrap]);

  // frame every venue, with room for the top bar and the live strip
  const fit = fitVenues();
  st.cam = { x: fit.x, y: fit.y, z: fit.z * 0.82 };

  phone.appendChild(mapScreen);
  Screens.mount(phone);
  phone.appendChild(buildTabs());
  if (window.PersonaSwitcher) window.PersonaSwitcher.mount(phone, ctx(), Screens);

  mapWrap.appendChild(Pet.build());
  mapWrap.appendChild(Screens.mapUI());
  bindGestures(mapWrap);
  applyCam();
  go('map');

  const co = coldOpenV2(() => {
    flyTo(fit.x, fit.y, fit.z, 1500);
    setTimeout(() => Pet.speak('Evening. The Mission is warming up — Zeitgeist is already going.', 5200), 700);
  });
  phone.appendChild(co);

  window.addEventListener('resize', () => {
    const r = phone.getBoundingClientRect();
    vw = Math.round(r.width); vh = Math.round(r.height);
    mapSvg.setAttribute('width', vw); mapSvg.setAttribute('height', vh);
    mapSvg.setAttribute('viewBox', `0 0 ${vw} ${vh}`);
    applyCam();
  });
}

function ctx() {
  return { h, frag, $, $$, I, icon, st, S, M, clamp, lerp, buzz,
           flyTo, applyCam, drawMarks, go, Pet, storiesFor, peopleAt, tablesFor,
           byId, proj, YOU, YOU_LL, passesFilter, Engine: window.Engine, Store: window.STORE,
           get vw() { return vw; }, get vh() { return vh; } };
}

// FUNC.replayOpen() re-runs the opening sequence — handy in a pitch, and the
// only way to inspect individual frames of it.
function replayOpen() {
  const phone = $('#phone');
  phone.appendChild(coldOpenV2(() => {}));
}

return { boot, go, st, replayOpen, coldOpenV2 };
})();
