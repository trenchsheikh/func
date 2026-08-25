const pptxgen = require('pptxgenjs');
const path = require('path');

const OUT = path.resolve(__dirname);
const C = {
  black: '080809',
  black2: '0F1013',
  glass: '17191E',
  glass2: '20232A',
  silver: 'C9CBD4',
  silverBright: 'F2F3F6',
  muted: '8B8E99',
  faint: '535762',
  emerald: '35E67B',
  red: 'F05B66',
  cobalt: '5E82FF',
  violet: '9D75FF',
  pink: 'FF6BAE',
  cyan: '46D8EE',
  lime: 'C5F46E',
  white: 'FFFFFF',
};

const W = 13.333;
const H = 7.5;
const FONT = 'Arial';
const DISPLAY = 'Arial';
const SHAPE = { rect: 'rect', roundRect: 'roundRect', ellipse: 'ellipse', line: 'line' };

function makeDeck(title, subject) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE';
  pptx.author = 'Func';
  pptx.company = 'Func';
  pptx.subject = subject;
  pptx.title = title;
  pptx.lang = 'en-US';
  pptx.theme = {
    headFontFace: DISPLAY,
    bodyFontFace: FONT,
    lang: 'en-US',
  };
  pptx.defineSlideMaster({
    title: 'FUNC',
    background: { color: C.black },
    objects: [],
    slideNumber: { x: 12.7, y: 7.12, color: C.faint, fontFace: FONT, fontSize: 8 },
  });
  return pptx;
}

function bg(slide, color = C.black) {
  slide.background = { color };
}

function text(slide, value, x, y, w, h, opts = {}) {
  slide.addText(value, {
    x, y, w, h, margin: 0, fontFace: opts.fontFace || FONT,
    fontSize: opts.fontSize || 16, color: opts.color || C.silverBright,
    bold: opts.bold || false, italic: opts.italic || false,
    breakLine: false, fit: 'shrink', valign: opts.valign || 'mid',
    align: opts.align || 'left', charSpacing: opts.charSpacing || 0,
    paraSpaceAfterPt: opts.paraSpaceAfterPt || 0,
    bullet: opts.bullet, transparency: opts.transparency,
  });
}

function box(slide, x, y, w, h, fill, radius = false, line = null, transparency = 0) {
  slide.addShape(radius ? SHAPE.roundRect : SHAPE.rect, {
    x, y, w, h, rectRadius: radius ? 0.12 : undefined,
    fill: { color: fill, transparency },
    line: line ? { color: line, transparency: 35, width: 0.7 } : { color: fill, transparency: 100 },
  });
}

function line(slide, x1, y1, x2, y2, color = C.faint, width = 1, transparency = 0) {
  slide.addShape(SHAPE.line, {
    x: x1, y: y1, w: x2 - x1, h: y2 - y1,
    line: { color, width, transparency, beginArrowType: 'none', endArrowType: 'none' },
  });
}

function dot(slide, x, y, r, color, transparency = 0, lineColor = color) {
  slide.addShape(SHAPE.ellipse, {
    x: x - r, y: y - r, w: r * 2, h: r * 2,
    fill: { color, transparency }, line: { color: lineColor, transparency: 100 },
  });
}

function footer(slide, label = 'FUNC / CONFIDENTIAL — VISION PACKAGE / 25 AUG 2026') {
  text(slide, label, 0.65, 7.08, 7.5, 0.16, { fontSize: 7.5, color: C.faint, charSpacing: 1.1 });
}

function title(slide, kicker, headline, sub = '') {
  text(slide, kicker.toUpperCase(), 0.68, 0.52, 5.5, 0.22, { fontSize: 9, color: C.emerald, bold: true, charSpacing: 2.4 });
  text(slide, headline, 0.68, 0.83, 11.8, 0.7, { fontSize: 30, color: C.silverBright, bold: true });
  if (sub) text(slide, sub, 0.7, 1.61, 10.7, 0.34, { fontSize: 13, color: C.muted });
}

function eye(slide, x, y, scale = 1, chrome = C.silverBright) {
  slide.addShape(SHAPE.ellipse, {
    x, y, w: 1.3 * scale, h: 0.68 * scale,
    fill: { color: C.black, transparency: 100 },
    line: { color: chrome, width: 1.6 * scale },
  });
  dot(slide, x + 0.65 * scale, y + 0.34 * scale, 0.19 * scale, chrome);
  dot(slide, x + 0.65 * scale, y + 0.34 * scale, 0.075 * scale, C.black);
}

function brand(slide, x = 0.7, y = 0.45, scale = 1) {
  eye(slide, x, y + 0.08 * scale, 0.45 * scale, C.silver);
  text(slide, 'func.', x + 0.68 * scale, y, 1.2 * scale, 0.35 * scale, { fontSize: 18 * scale, bold: true, color: C.silverBright, charSpacing: -0.3 });
}

function cityMap(slide, x, y, w, h, variant = 0) {
  box(slide, x, y, w, h, C.black2, true, C.glass2);
  // A hand-authored, deliberately non-geographic concept map: visual art, not fake map data.
  const roads = [
    [0.05, 0.78, 0.28, 0.28, 0.33, 0.05, 0.55, 0.2, 0.96, 0.08],
    [0.02, 0.22, 0.25, 0.4, 0.48, 0.32, 0.72, 0.52, 0.98, 0.4],
    [0.2, 0.04, 0.27, 0.25, 0.5, 0.45, 0.62, 0.78, 0.84, 0.96],
    [0.12, 0.98, 0.33, 0.7, 0.48, 0.52, 0.76, 0.28, 0.95, 0.17],
  ];
  roads.forEach((r, idx) => {
    for (let i = 0; i < 8; i += 2) line(slide, x + r[i] * w, y + r[i + 1] * h, x + r[i + 2] * w, y + r[i + 3] * h, idx === 1 ? C.silver : C.faint, idx === 1 ? 1.2 : 0.7, idx === 1 ? 38 : 25);
  });
  for (let i = 0; i < 18; i++) {
    const px = x + (0.08 + ((i * 37 + variant * 11) % 84) / 100) * w;
    const py = y + (0.1 + ((i * 19 + variant * 17) % 78) / 100) * h;
    line(slide, px, py, px + w * 0.04, py + h * 0.02, C.faint, 0.45, 38);
  }
  const pins = [
    [0.28, 0.34, C.emerald, 0.12], [0.58, 0.47, C.cobalt, 0.1], [0.72, 0.25, C.violet, 0.1], [0.42, 0.72, C.pink, 0.085], [0.78, 0.7, C.cyan, 0.09],
  ];
  pins.forEach(([px, py, col, r]) => {
    dot(slide, x + px * w, y + py * h, r * w, col, 75);
    dot(slide, x + px * w, y + py * h, r * w * 0.45, col, 0);
  });
  dot(slide, x + 0.29 * w, y + 0.35 * h, 0.19 * w, C.emerald, 93);
  dot(slide, x + 0.29 * w, y + 0.35 * h, 0.12 * w, C.emerald, 89);
  box(slide, x + 0.09 * w, y + 0.07 * h, 0.27 * w, 0.11 * h, C.glass, true, C.glass2);
  text(slide, 'LIVE CITY', x + 0.115 * w, y + 0.085 * h, 0.2 * w, 0.07 * h, { fontSize: 8, color: C.emerald, bold: true, charSpacing: 1.5 });
}

function phone(slide, x, y, w, h, screen = 'map', label = 'FUTURE VISION') {
  box(slide, x, y, w, h, '050506', true, C.silver, 0);
  box(slide, x + 0.07, y + 0.14, w - 0.14, h - 0.22, C.black2, true, C.glass2);
  box(slide, x + w * 0.38, y + 0.05, w * 0.24, 0.04, C.glass2, true, C.glass2);
  if (screen === 'map') {
    cityMap(slide, x + 0.08, y + 0.16, w - 0.16, h * 0.57, 2);
    box(slide, x + 0.2, y + h * 0.69, w - 0.4, h * 0.17, C.glass, true, C.glass2);
    text(slide, 'LATE SHIFT / MISSION', x + 0.32, y + h * 0.73, w - 0.64, 0.12, { fontSize: 7, color: C.emerald, bold: true, charSpacing: 1.2 });
    text(slide, 'Find something alive nearby.', x + 0.32, y + h * 0.78, w - 0.64, 0.16, { fontSize: 10.5, color: C.silverBright, bold: true });
  } else if (screen === 'invite') {
    box(slide, x + 0.08, y + 0.16, w - 0.16, h * 0.25, C.violet, true, C.violet, 32);
    text(slide, 'AFTER / PRIVATE PLAN', x + 0.23, y + 0.28, w - 0.46, 0.14, { fontSize: 7.5, color: C.white, bold: true, charSpacing: 1.1 });
    text(slide, 'A place worth getting to.', x + 0.23, y + 0.51, w - 0.46, 0.22, { fontSize: 15, color: C.white, bold: true });
    text(slide, 'AREA SHOWN UNTIL ACCEPTED', x + 0.2, y + h * 0.5, w - 0.4, 0.12, { fontSize: 7.5, color: C.emerald, bold: true, charSpacing: 1.05 });
    box(slide, x + 0.2, y + h * 0.57, w - 0.4, 0.42, C.glass, true, C.glass2);
    text(slide, 'REQUEST ACCESS', x + 0.2, y + h * 0.59, w - 0.4, 0.18, { fontSize: 11, color: C.silverBright, bold: true, align: 'center' });
  } else {
    box(slide, x + 0.08, y + 0.16, w - 0.16, h * 0.27, C.glass2, true, C.glass2);
    eye(slide, x + w * 0.34, y + 0.27, 0.75, C.silverBright);
    text(slide, 'PHOENIX', x + 0.2, y + h * 0.49, w - 0.4, 0.18, { fontSize: 14, color: C.silverBright, bold: true, align: 'center' });
    text(slide, 'DTF / TONIGHT', x + 0.2, y + h * 0.55, w - 0.4, 0.12, { fontSize: 7.5, color: C.emerald, bold: true, charSpacing: 1.2, align: 'center' });
    text(slide, 'A nightlife identity, not a popularity score.', x + 0.22, y + h * 0.68, w - 0.44, 0.32, { fontSize: 10, color: C.muted, align: 'center' });
  }
  text(slide, label, x + 0.1, y + h + 0.08, w - 0.2, 0.12, { fontSize: 7, color: C.faint, bold: true, charSpacing: 1.25, align: 'center' });
}

function addNotes(slide, note) {
  slide.addNotes(note);
}

function investorDeck() {
  const pptx = makeDeck('Func — Investor Vision', 'Investor presentation generated from Func source-of-truth pack v1.0 draft');
  let s;
  s = pptx.addSlide('FUNC'); bg(s); brand(s, 0.7, 0.62, 1.15); text(s, 'THE LIVE LAYER\nFOR GOING OUT', 0.72, 1.75, 7.4, 1.5, { fontSize: 38, bold: true, color: C.silverBright }); text(s, 'Func turns a fragmented night into one clear, living opportunity.', 0.75, 3.5, 5.4, 0.6, { fontSize: 17, color: C.muted }); cityMap(s, 7.1, 0.95, 5.45, 5.4, 1); text(s, 'VISION PACKAGE / PROTOTYPE + FUTURE DIRECTION', 0.75, 6.45, 6.5, 0.18, { fontSize: 8, color: C.emerald, bold: true, charSpacing: 1.4 }); footer(s); addNotes(s, 'Open with the product in one sentence. This is a vision package, not a claim that every future visual or production capability exists today.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '01 / THE PROBLEM', 'The night is fragmented.', 'The information exists. The decision still does not.');
  const apps = [['INSTAGRAM', C.pink], ['GROUP CHAT', C.silver], ['MAPS', C.cobalt], ['EVENT PAGE', C.violet], ['PROMOTER DM', C.cyan]];
  apps.forEach(([label, col], i) => { const x = 0.9 + i * 2.35; box(s, x, 2.45 + (i % 2) * 0.32, 1.85, 0.75, C.glass, true, C.glass2); dot(s, x + 0.25, 2.82 + (i % 2) * 0.32, 0.08, col); text(s, label, x + 0.45, 2.66 + (i % 2) * 0.32, 1.2, 0.18, { fontSize: 9, color: C.silverBright, bold: true, charSpacing: 0.8 }); });
  line(s, 1.05, 4.25, 12.15, 4.25, C.faint, 1, 20); text(s, 'What is happening?', 1.0, 4.65, 2.5, 0.3, { fontSize: 21, color: C.silverBright, bold: true }); text(s, 'Who is open?', 4.25, 4.65, 2.5, 0.3, { fontSize: 21, color: C.silverBright, bold: true }); text(s, 'Can I participate?', 7.4, 4.65, 2.8, 0.3, { fontSize: 21, color: C.silverBright, bold: true }); text(s, 'Is it trustworthy?', 10.25, 4.65, 2.3, 0.3, { fontSize: 21, color: C.silverBright, bold: true }); footer(s); addNotes(s, 'Describe a real decision journey rather than attacking competitors. The problem is fragmented context and access, not a lack of social content.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '02 / THE PRODUCT', 'A living map, not another feed.', 'Func is the bridge between discovery and a real night out.'); cityMap(s, 0.8, 2.3, 5.9, 4.25, 4); phone(s, 7.55, 1.85, 2.1, 4.35, 'map', 'MAP / FUTURE VISION'); text(s, 'OPPORTUNITIES', 10.25, 2.12, 2, 0.15, { fontSize: 9, color: C.emerald, bold: true, charSpacing: 1.8 }); text(s, 'Places, events, and access first.', 10.25, 2.42, 2.1, 0.55, { fontSize: 20, color: C.silverBright, bold: true }); text(s, 'People only when they choose to be visible. Live energy without unsupported precision.', 10.25, 3.35, 2.15, 0.95, { fontSize: 13, color: C.muted }); footer(s); addNotes(s, 'The map is the interface. It is not a heatmap product or a social feed with a map attached.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '03 / THE CORE LOOP', 'Five deliberate steps from uncertainty to a night out.', 'The product is the loop, not the feature count.');
  const steps = [['01', 'DISCOVER', 'See what is actually on.'], ['02', 'UNDERSTAND', 'Read the context, cost, and trust.'], ['03', 'REQUEST', 'Choose a safe next step.'], ['04', 'ACCEPT', 'The host decides.'], ['05', 'GO OUT', 'Func gets out of the way.']];
  steps.forEach(([num, head, body], i) => { const x = 0.8 + i * 2.42; dot(s, x + 0.18, 3.08, 0.18, i === 4 ? C.emerald : C.silver); text(s, num, x + 0.08, 2.74, 0.25, 0.15, { fontSize: 8, color: C.black, bold: true, align: 'center' }); text(s, head, x, 3.52, 1.9, 0.22, { fontSize: 12, color: C.silverBright, bold: true, charSpacing: 1.1 }); text(s, body, x, 3.92, 1.85, 0.62, { fontSize: 12, color: C.muted }); if (i < 4) line(s, x + 0.45, 3.08, x + 2.2, 3.08, C.faint, 1, 10); });
  box(s, 0.8, 5.45, 11.75, 0.7, C.glass, true, C.glass2); text(s, 'NORTH-STAR OUTCOME', 1.05, 5.67, 2.4, 0.16, { fontSize: 8.5, color: C.emerald, bold: true, charSpacing: 1.3 }); text(s, 'A successful night enabled — not minutes spent in the app.', 3.4, 5.6, 7.9, 0.28, { fontSize: 18, color: C.silverBright, bold: true }); footer(s); addNotes(s, 'This is the cleanest investor explanation of the product. It also keeps Func from sounding like a generic social network.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '04 / THE MAP', 'The city becomes the interface.', 'A premium instrument around a bright, living city.'); cityMap(s, 0.75, 2.05, 7.25, 4.55, 5); box(s, 8.55, 2.25, 3.6, 0.78, C.glass, true, C.glass2); text(s, 'LIVE ENERGY', 8.85, 2.5, 1.2, 0.13, { fontSize: 8, color: C.emerald, bold: true, charSpacing: 1.4 }); text(s, 'Glow, never false precision.', 8.85, 2.72, 2.8, 0.18, { fontSize: 12, color: C.silverBright, bold: true }); box(s, 8.55, 3.3, 3.6, 0.78, C.glass, true, C.glass2); text(s, 'PRESENCE', 8.85, 3.55, 1.2, 0.13, { fontSize: 8, color: C.emerald, bold: true, charSpacing: 1.4 }); text(s, 'Opt-in, nightly, self-expiring.', 8.85, 3.77, 2.8, 0.18, { fontSize: 12, color: C.silverBright, bold: true }); box(s, 8.55, 4.35, 3.6, 0.78, C.glass, true, C.glass2); text(s, 'ACCESS', 8.85, 4.6, 1.2, 0.13, { fontSize: 8, color: C.emerald, bold: true, charSpacing: 1.4 }); text(s, 'Opportunity becomes actionable.', 8.85, 4.82, 2.8, 0.18, { fontSize: 12, color: C.silverBright, bold: true }); footer(s); addNotes(s, 'Explain that the finished map is a visual north star. The active build already demonstrates the behavioural and privacy foundation, but the custom map treatment is future work.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '05 / ACCESS', 'Pool makes “maybe” actionable.', 'A host decides. The user gets a clear, safe state.'); phone(s, 0.85, 1.9, 2.6, 4.45, 'invite', 'PRIVATE PLAN / FUTURE VISION'); box(s, 4.1, 2.25, 3.35, 2.95, C.glass, true, C.glass2); text(s, 'THE ACCESS MODEL', 4.42, 2.58, 2.6, 0.16, { fontSize: 8.5, color: C.emerald, bold: true, charSpacing: 1.5 }); text(s, 'Request → accept → coordinate.', 4.42, 3.0, 2.7, 0.62, { fontSize: 23, color: C.silverBright, bold: true }); text(s, 'Party size is information on a request, not a permanent group to administer.', 4.42, 4.02, 2.55, 0.7, { fontSize: 12.5, color: C.muted }); line(s, 8.1, 2.4, 8.1, 5.45, C.faint, 1, 30); text(s, 'PRIVATE PLACE', 8.7, 2.62, 2.3, 0.14, { fontSize: 8.5, color: C.emerald, bold: true, charSpacing: 1.5 }); text(s, 'The exact address stays protected until the correct acceptance state.', 8.7, 3.05, 3.1, 0.75, { fontSize: 18, color: C.silverBright, bold: true }); text(s, 'The prototype demonstrates this flow with seeded data. Production requires server-side enforcement, verification, moderation, and auditability.', 8.7, 4.35, 3.0, 0.72, { fontSize: 11.5, color: C.muted }); footer(s); addNotes(s, 'Do not say Func guarantees entry. The current meaning is a host-issued acceptance state; the technical meaning of “pass” remains an open decision.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '06 / TRUST', 'Trust is part of the product, not a settings page.', 'The visual promise only matters if the operating system underneath it is real.');
  const trust = [['OPT-IN', 'No person appears without choosing tonight.', C.emerald], ['PROJECTED', 'Every viewer receives only the permitted view.', C.cobalt], ['ACCOUNTABLE', 'Hosts and businesses have real identity paths.', C.violet], ['RESPONSIVE', 'Report, block, moderate, escalate.', C.red]];
  trust.forEach(([head, body, col], i) => { const x = 0.8 + (i % 2) * 6.05; const y = 2.25 + Math.floor(i / 2) * 1.75; box(s, x, y, 5.35, 1.28, C.glass, true, C.glass2); dot(s, x + 0.38, y + 0.42, 0.12, col); text(s, head, x + 0.72, y + 0.24, 1.5, 0.18, { fontSize: 10, color: col, bold: true, charSpacing: 1.25 }); text(s, body, x + 0.72, y + 0.58, 4.1, 0.28, { fontSize: 15, color: C.silverBright, bold: true }); });
  text(s, 'The current prototype models the privacy behaviour. It does not yet provide production security.', 0.85, 6.0, 9.8, 0.25, { fontSize: 14, color: C.muted, italic: true }); footer(s); addNotes(s, 'This slide builds credibility by naming the gap. Investors will trust the team more if the prototype boundary is explicit.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '07 / POSITION', 'The wedge is the specialised nightlife graph.', 'Competitors can copy individual features. The system becomes defensible through density and trust.');
  const rows = [['Instagram', 'content + social graph', 'night-specific intent + access'], ['Google Maps', 'places + navigation', 'people, atmosphere + participation'], ['Partiful', 'event coordination', 'discovery before the invitation'], ['Snap Map', 'friend/place map', 'actionable, safety-led nightlife context']];
  rows.forEach(([a, b, c], i) => { const y = 2.2 + i * 0.8; box(s, 0.85, y, 3.0, 0.55, C.glass, true, C.glass2); text(s, a, 1.1, y + 0.17, 2.5, 0.16, { fontSize: 11, color: C.silverBright, bold: true }); text(s, b, 4.35, y + 0.17, 3.1, 0.16, { fontSize: 11, color: C.muted }); text(s, c, 8.1, y + 0.17, 4.2, 0.16, { fontSize: 11, color: C.emerald, bold: true }); });
  text(s, 'Working hypothesis — not yet a proven moat.', 0.9, 6.0, 4.8, 0.24, { fontSize: 15, color: C.silverBright, bold: true }); footer(s); addNotes(s, 'Be honest: the map alone is not the moat. The plausible moat is the intent + supply + trust graph built through repeated successful nights.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '08 / EVIDENCE', 'There is a real product to build on.', 'The prototype proves behaviour and architecture — not yet demand or production readiness.');
  const evidence = [['MAP', 'Mapbox globe, local map, discovery, pins and clustering', C.emerald], ['POOL', 'Create, request, review, accept, reveal and chat flows', C.emerald], ['PRIVACY', 'Viewer-relative projections for people, venues and private plans', C.emerald], ['HONEST LIMIT', 'No backend, auth, persistence, moderation or server security', C.red]];
  evidence.forEach(([head, body, col], i) => { const y = 2.15 + i * 0.77; text(s, head, 1.0, y, 1.5, 0.18, { fontSize: 9, color: col, bold: true, charSpacing: 1.4 }); text(s, body, 2.8, y - 0.02, 7.7, 0.23, { fontSize: 15, color: C.silverBright, bold: true }); line(s, 2.8, y + 0.38, 11.9, y + 0.38, C.faint, 0.7, 30); });
  box(s, 0.95, 5.65, 3.5, 0.48, C.glass, true, C.glass2); text(s, '147 CASES / 144 PASSING / 3 KNOWN RESIDUALS', 1.15, 5.81, 3.1, 0.13, { fontSize: 8, color: C.muted, bold: true, charSpacing: 0.8 }); footer(s); addNotes(s, 'The test count is engineering evidence only. Do not use it as traction. The three known residuals are documented and the removed livePinFor API must not be restored.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '09 / THE BUILD', 'The next milestone is trust infrastructure.', 'Professional production work starts behind the screens.');
  const phases = [['01', 'TRUTH + DEMAND', 'User sessions, core-loop evidence, final launch slice'], ['02', 'PRODUCTION FOUNDATION', 'Auth, verification, server privacy, Pool state, messaging, moderation'], ['03', 'CONTROLLED ALPHA', 'One city, adult cohort, trusted supply, manual safety operations'], ['04', 'DENSITY + EXPANSION', 'Media, business tools, premium and more cities only when earned']];
  phases.forEach(([n, h, b], i) => { const x = 0.85 + i * 3.05; box(s, x, 2.35, 2.52, 2.6, i === 1 ? C.glass2 : C.glass, true, i === 1 ? C.emerald : C.glass2); text(s, n, x + 0.25, 2.65, 0.42, 0.3, { fontSize: 20, color: i === 1 ? C.emerald : C.silver, bold: true }); text(s, h, x + 0.25, 3.32, 1.95, 0.35, { fontSize: 12, color: C.silverBright, bold: true }); text(s, b, x + 0.25, 4.05, 1.95, 0.55, { fontSize: 10.5, color: C.muted }); }); footer(s); addNotes(s, 'This is where the professional developer conversation begins. The AI workflow remains useful for product iteration, but production authority needs senior backend, security, safety, and operations ownership.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '10 / CITY STRATEGY', 'Start dense, not everywhere.', 'San Francisco is the prototype/pilot world. Los Angeles is the next intended market.');
  box(s, 0.9, 2.25, 4.2, 2.4, C.glass2, true, C.emerald); text(s, 'PILOT', 1.25, 2.65, 1.2, 0.18, { fontSize: 9, color: C.emerald, bold: true, charSpacing: 1.6 }); text(s, 'SAN\nFRANCISCO', 1.25, 3.12, 2.8, 0.75, { fontSize: 28, color: C.silverBright, bold: true }); text(s, 'One concentrated nightlife graph, observed closely.', 1.25, 4.15, 2.8, 0.3, { fontSize: 11.5, color: C.muted }); line(s, 5.55, 3.45, 7.5, 3.45, C.faint, 1.3); dot(s, 7.5, 3.45, 0.14, C.emerald); box(s, 8.0, 2.25, 4.2, 2.4, C.glass, true, C.glass2); text(s, 'NEXT', 8.35, 2.65, 1.2, 0.18, { fontSize: 9, color: C.silver, bold: true, charSpacing: 1.6 }); text(s, 'LOS\nANGELES', 8.35, 3.12, 2.8, 0.75, { fontSize: 28, color: C.silverBright, bold: true }); text(s, 'Expansion after the loop earns density and trust.', 8.35, 4.15, 2.8, 0.3, { fontSize: 11.5, color: C.muted }); footer(s); addNotes(s, 'Do not claim both cities are ready. This is a sequencing hypothesis designed to make the cold-start problem concrete.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '11 / BUSINESS MODEL', 'Free for people. Valuable to accountable venues.', 'The business model is a hypothesis to validate after consumer utility is real.');
  text(s, 'CONSUMERS', 0.95, 2.35, 2.3, 0.18, { fontSize: 9, color: C.emerald, bold: true, charSpacing: 1.5 }); text(s, 'A free map and access layer for the night.', 0.95, 2.75, 3.0, 0.6, { fontSize: 22, color: C.silverBright, bold: true }); line(s, 4.6, 2.25, 4.6, 5.15, C.faint, 1, 25); text(s, 'BUSINESSES', 5.25, 2.35, 2.3, 0.18, { fontSize: 9, color: C.violet, bold: true, charSpacing: 1.5 }); text(s, 'Verified identity, event publishing, request handling and future visibility tools.', 5.25, 2.75, 3.0, 0.9, { fontSize: 22, color: C.silverBright, bold: true }); line(s, 8.9, 2.25, 8.9, 5.15, C.faint, 1, 25); text(s, 'BOUNDARY', 9.55, 2.35, 2.3, 0.18, { fontSize: 9, color: C.silver, bold: true, charSpacing: 1.5 }); text(s, 'Func promotes and connects. It does not take ticket money in the current direction.', 9.55, 2.75, 2.55, 1.1, { fontSize: 18, color: C.silverBright, bold: true }); text(s, 'Willingness to pay remains unvalidated.', 0.95, 5.8, 4.5, 0.22, { fontSize: 14, color: C.muted, italic: true }); footer(s); addNotes(s, 'Do not overstate this as a proven revenue model. The deck should show the direction and exactly what must be validated.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '12 / THE ASK', 'Capital buys the production foundation and the first honest test.', 'The amount should be set after professional technical scoping, not invented for the slide.');
  const ask = [['01', 'MAKE IT SAFE', 'Auth, ID/business verification, server privacy, moderation and auditability'], ['02', 'MAKE IT USABLE', 'Complete the visual system and production-quality core loop'], ['03', 'MAKE IT OBSERVABLE', 'Controlled alpha, evidence, support and incident response']];
  ask.forEach(([n, h, b], i) => { const y = 2.25 + i * 1.08; dot(s, 1.1, y + 0.2, 0.18, i === 0 ? C.emerald : C.silver); text(s, n, 0.94, y + 0.1, 0.32, 0.16, { fontSize: 8, color: C.black, bold: true, align: 'center' }); text(s, h, 1.65, y, 2.3, 0.2, { fontSize: 12, color: C.silverBright, bold: true, charSpacing: 1.1 }); text(s, b, 4.3, y - 0.02, 7.7, 0.27, { fontSize: 15, color: C.muted }); });
  box(s, 0.9, 5.8, 5.2, 0.45, C.glass, true, C.glass2); text(s, 'ASK AMOUNT / RUNWAY: TO BE COSTED WITH TECHNICAL LEAD', 1.15, 5.95, 4.7, 0.13, { fontSize: 8, color: C.emerald, bold: true, charSpacing: 0.9 }); footer(s); addNotes(s, 'This deck deliberately does not invent a funding number. The next professional step is to cost the production plan with a senior technical lead and safety/operations requirements.');

  s = pptx.addSlide('FUNC'); bg(s); brand(s, 0.72, 0.65, 1.15); text(s, 'A REAL NIGHT OUT\nIS THE PRODUCT.', 0.75, 2.05, 7.5, 1.2, { fontSize: 38, color: C.silverBright, bold: true }); text(s, 'Func makes the city legible — then gets out of the way.', 0.78, 3.75, 5.8, 0.42, { fontSize: 17, color: C.muted }); cityMap(s, 8.0, 1.3, 4.2, 4.55, 7); footer(s, 'FUNC / CONFIDENTIAL — GENERATED FROM BIBLE 1.0 + PRD 1.0 DRAFT'); addNotes(s, 'Close on the north-star outcome. Invite discussion about the wedge, the evidence plan, and the production team required to earn trust.');
  return pptx;
}

function developerDeck() {
  const pptx = makeDeck('Func — Developer Vision and Handoff', 'Developer presentation generated from Func source-of-truth pack v1.0 draft');
  let s;
  s = pptx.addSlide('FUNC'); bg(s); brand(s, 0.7, 0.62, 1.15); text(s, 'BUILD THE BRIDGE\nTO THE NIGHT.', 0.72, 1.75, 7.2, 1.35, { fontSize: 38, color: C.silverBright, bold: true }); text(s, 'An implementation guide for the product we are actually building — and the production gates still ahead.', 0.75, 3.55, 5.4, 0.62, { fontSize: 16, color: C.muted }); phone(s, 8.35, 1.25, 2.55, 4.95, 'map', 'PROTOTYPE + FUTURE VISION'); footer(s); addNotes(s, 'This deck is for developers and technical partners. It separates current prototype behaviour from production requirements.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '01 / CURRENT TRUTH', 'A credible prototype — not a production app.', 'The distinction is a requirement, not a disclaimer to hide.');
  const truth = [['WORKING', 'Map, globe, presence, privacy projections, Pool, requests, acceptance, chat, venue personas', C.emerald], ['SIMULATED', 'People, friendships, locations, verification and all data are seeded on-device', C.violet], ['ABSENT', 'Auth, backend, persistence, server redaction, moderation, rate limits, auditability', C.red]];
  truth.forEach(([h, b, col], i) => { const y = 2.25 + i * 1.05; text(s, h, 0.95, y, 1.4, 0.18, { fontSize: 9, color: col, bold: true, charSpacing: 1.5 }); text(s, b, 2.75, y - 0.03, 9.2, 0.32, { fontSize: 17, color: C.silverBright, bold: true }); line(s, 2.75, y + 0.5, 11.95, y + 0.5, C.faint, 0.7, 30); }); footer(s); addNotes(s, 'This slide should be shown before architecture. It prevents a developer from assuming the current in-memory model is safe to expose.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '02 / ARCHITECTURE', 'The current seams are worth preserving.', 'Pure rules, safe projections, and a swappable repository give the prototype a professional centre.');
  const layers = [['APP', 'Expo Router screens render permitted views', C.silver], ['UI', 'Shared primitives, map renderers, visual tokens', C.cobalt], ['DATA', 'Repository, seed state, viewer projections', C.violet], ['DOMAIN', 'Presence, Pool, geo and privacy rules without IO', C.emerald], ['BACKEND NEXT', 'Server authority, persistence, audit and real-time events', C.red]];
  layers.forEach(([h, b, col], i) => { const y = 1.95 + i * 0.78; box(s, 1.0 + i * 0.35, y, 8.4 - i * 0.7, 0.5, C.glass, true, col); text(s, h, 1.25 + i * 0.35, y + 0.16, 1.55, 0.15, { fontSize: 8.5, color: col, bold: true, charSpacing: 1.3 }); text(s, b, 2.95 + i * 0.35, y + 0.14, 5.2, 0.18, { fontSize: 12, color: C.silverBright, bold: true }); }); text(s, 'Guardrail: screens never reach past the viewer projection.', 1.0, 6.1, 6.7, 0.22, { fontSize: 15, color: C.muted, italic: true }); footer(s); addNotes(s, 'The repository seam is useful, but production should return viewer-scoped read models rather than the entire world as a snapshot.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '03 / PRODUCT SURFACE', 'Every feature has a status, not just a name.', 'The feature matrix separates current prototype behaviour from launch gates and future exploration.');
  const matrix = [['MAP', 'map, pins, globe, discovery', 'PROTOTYPE BUILT'], ['PRESENCE', 'DTF / Casual / Off, friend disclosure', 'PROTOTYPE BUILT'], ['POOL', 'create → request → accept → chat', 'PROTOTYPE BUILT'], ['BUSINESS', 'opaque venue persona + verified event', 'SIMULATED'], ['SAFETY', 'auth, verification, report, block, moderation', 'LAUNCH BLOCKER']];
  matrix.forEach(([a, b, c], i) => { const y = 2.05 + i * 0.72; box(s, 0.9, y, 1.7, 0.44, C.glass2, true, C.glass2); text(s, a, 1.12, y + 0.14, 1.25, 0.13, { fontSize: 8.5, color: i === 4 ? C.red : C.emerald, bold: true, charSpacing: 1.1, align: 'center' }); text(s, b, 3.0, y + 0.13, 5.5, 0.15, { fontSize: 13, color: C.silverBright, bold: true }); text(s, c, 9.6, y + 0.14, 2.3, 0.13, { fontSize: 8, color: i === 4 ? C.red : C.muted, bold: true, charSpacing: 0.8, align: 'right' }); }); footer(s); addNotes(s, 'Use the feature matrix as the developer’s index. The full records live in docs/FEATURE_MATRIX.md.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '04 / PRIVACY', 'Disclosure is calculated for the viewer.', 'The visual system cannot be allowed to invent a more revealing view.');
  const privacy = [['SELF', 'exact current fix', C.emerald], ['QUALIFYING FRIEND', 'exact fix under DTF rules', C.cobalt], ['MUTUAL', 'anonymous venue glow only', C.violet], ['UNRELATED', 'no person disclosure', C.red], ['PRIVATE PLAN OUTSIDER', 'safe area / neutral absence', C.red]];
  privacy.forEach(([a, b, col], i) => { const y = 2.0 + i * 0.66; dot(s, 1.08, y + 0.17, 0.09, col); text(s, a, 1.45, y + 0.08, 2.5, 0.16, { fontSize: 9, color: col, bold: true, charSpacing: 1.2 }); text(s, b, 4.35, y + 0.06, 4.7, 0.18, { fontSize: 15, color: C.silverBright, bold: true }); }); box(s, 9.45, 2.0, 2.65, 2.95, C.glass, true, C.glass2); text(s, 'SERVER RULE', 9.78, 2.35, 1.8, 0.15, { fontSize: 8.5, color: C.emerald, bold: true, charSpacing: 1.4 }); text(s, 'Raw locations never arrive in a generic payload to be filtered later.', 9.78, 2.8, 1.9, 1.0, { fontSize: 16, color: C.silverBright, bold: true }); footer(s); addNotes(s, 'This is the canonical projected-location design. Do not add a blanket .location ban; the rule is viewer-relative safe projection.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '05 / POOL', 'A small state machine with real safety consequences.', 'Pool is not a permanent group product. It is bounded access and coordination.');
  const states = [['CREATE', C.silver], ['DISCOVER', C.cobalt], ['REQUEST', C.violet], ['REVIEW', C.pink], ['ACCEPT', C.emerald], ['COORDINATE', C.silver]];
  states.forEach(([h, col], i) => { const x = 0.72 + i * 2.05; dot(s, x + 0.22, 3.1, 0.2, col); text(s, h, x, 3.62, 1.6, 0.16, { fontSize: 9, color: col, bold: true, charSpacing: 1.1, align: 'center' }); if (i < states.length - 1) line(s, x + 0.47, 3.1, x + 1.83, 3.1, C.faint, 1, 10); });
  text(s, 'Atomic acceptance • capacity re-check • private reveal only after authorisation • idempotent commands', 1.0, 5.15, 11.2, 0.3, { fontSize: 14, color: C.muted, align: 'center' }); footer(s); addNotes(s, 'Developers should treat acceptance as a server-authoritative transition, not a collection of UI toggles.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '06 / MESSAGING', 'Identity persists through the conversation.', 'Personal and venue identities must never collapse into one another.'); phone(s, 0.85, 1.85, 2.4, 4.55, 'profile', 'PERSONAL IDENTITY'); phone(s, 4.25, 1.85, 2.4, 4.55, 'invite', 'VENUE PERSONA'); line(s, 7.6, 3.15, 9.55, 3.15, C.faint, 1.2); dot(s, 9.55, 3.15, 0.16, C.emerald); text(s, 'THREAD', 10.05, 2.72, 1.3, 0.15, { fontSize: 8.5, color: C.emerald, bold: true, charSpacing: 1.4 }); text(s, 'Only authorised participants can read it.', 10.05, 3.1, 2.15, 0.55, { fontSize: 17, color: C.silverBright, bold: true }); text(s, 'Unknown or malformed access returns neutral absence.', 10.05, 4.12, 2.1, 0.5, { fontSize: 12, color: C.muted }); footer(s); addNotes(s, 'The mock prototype already covers persona-scoped messages and fail-closed thread reads. Production adds real transport, moderation, reports, blocks, retention and notifications.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '07 / BUSINESS', 'A verified business is a separate accountable identity.', 'Business is a supply-side extension of Pool, not a secret operator profile.'); box(s, 0.9, 2.15, 4.1, 2.75, C.glass2, true, C.violet); text(s, 'VERIFIED VENUE', 1.25, 2.55, 1.9, 0.15, { fontSize: 9, color: C.violet, bold: true, charSpacing: 1.5 }); text(s, 'Publish a known-venue opportunity.', 1.25, 3.0, 3.0, 0.55, { fontSize: 23, color: C.silverBright, bold: true }); text(s, 'The operator remains private behind the venue persona.', 1.25, 4.08, 2.9, 0.38, { fontSize: 12, color: C.muted }); box(s, 5.65, 2.15, 6.55, 2.75, C.glass, true, C.glass2); const bItems = ['verification authority', 'operator roles', 'venue ownership', 'publishing rules', 'appeals + revocation', 'business moderation']; bItems.forEach((v, i) => { dot(s, 6.1 + (i % 2) * 2.95, 2.72 + Math.floor(i / 2) * 0.57, 0.05, C.silver); text(s, v.toUpperCase(), 6.28 + (i % 2) * 2.95, 2.65 + Math.floor(i / 2) * 0.57, 2.3, 0.14, { fontSize: 8, color: C.silver, bold: true, charSpacing: 0.9 }); }); footer(s); addNotes(s, 'The current business persona implementation is a strong privacy seed. The professional team must design the actual verification and operations model.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '08 / SAFETY', 'Real users are blocked until the operating system exists.', 'Safety gates are product requirements, not post-launch polish.');
  const safety = ['18+ identity verification', 'server-side redaction', 'report + block', 'moderation queue', 'rate limits', 'audit trail', 'appeals + incident response'];
  safety.forEach((v, i) => { const x = 0.9 + (i % 3) * 4.05; const y = 2.25 + Math.floor(i / 3) * 0.95; box(s, x, y, 3.35, 0.55, C.glass, true, C.glass2); dot(s, x + 0.28, y + 0.28, 0.07, i === 0 ? C.emerald : C.red); text(s, v.toUpperCase(), x + 0.52, y + 0.2, 2.55, 0.15, { fontSize: 8.5, color: C.silverBright, bold: true, charSpacing: 0.75 }); }); text(s, 'No real people. No real locations. No public pilot until Gate 1 is independently reviewed.', 0.95, 5.55, 10.8, 0.3, { fontSize: 16, color: C.red, bold: true }); footer(s); addNotes(s, 'This slide is intentionally direct. It is the standard a professional developer and safety lead should accept before launch planning.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '09 / VISUAL SYSTEM', 'The visual target is a product world, not a skin.', 'Bright living map inside a premium black-and-silver instrument.'); cityMap(s, 0.8, 2.0, 4.4, 3.65, 8); phone(s, 6.0, 1.75, 2.1, 4.35, 'map', 'MAP / FUTURE VISION'); phone(s, 9.2, 1.75, 2.1, 4.35, 'profile', 'IDENTITY / FUTURE VISION'); text(s, 'BLACK / GLASS / CHROME / LIVE EMERALD', 0.85, 6.15, 5.5, 0.16, { fontSize: 8.5, color: C.emerald, bold: true, charSpacing: 1.25 }); footer(s); addNotes(s, 'Concept visuals are labelled. Use real app code for hierarchy, privacy, states and factual copy; use concept art for atmosphere and future materials.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '10 / MOTION', 'Motion should make the city physical, not the user captive.', 'Spring-like interaction, quiet ambient energy, clear reduced-motion equivalents.');
  const beats = [['01', 'LOGO'], ['02', 'EYE'], ['03', 'EARTH'], ['04', 'DIVE'], ['05', 'CITY'], ['06', 'MAP']];
  beats.forEach(([n, h], i) => { const x = 0.75 + i * 2.05; box(s, x, 2.25, 1.55, 1.75, i === 5 ? C.glass2 : C.glass, true, i === 5 ? C.emerald : C.glass2); text(s, n, x + 0.16, 2.5, 0.35, 0.2, { fontSize: 10, color: i === 5 ? C.emerald : C.silver, bold: true }); if (h === 'EYE') eye(s, x + 0.42, 3.1, 0.53, C.silverBright); else if (h === 'EARTH') { dot(s, x + 0.78, 3.28, 0.3, C.cobalt, 15); line(s, x + 0.52, 3.28, x + 1.05, 3.28, C.silver, 1, 25); } else if (h === 'MAP') { dot(s, x + 0.78, 3.28, 0.2, C.emerald, 30); dot(s, x + 0.78, 3.28, 0.08, C.emerald); } text(s, h, x + 0.16, 3.72, 1.15, 0.16, { fontSize: 9, color: C.silverBright, bold: true, charSpacing: 1.1, align: 'center' }); }); text(s, '120–180ms micro • 240–420ms component • 600–900ms spatial • 1.8–2.8s hero', 1.05, 5.25, 11.0, 0.24, { fontSize: 14, color: C.muted, align: 'center' }); footer(s); addNotes(s, 'The opening storyboard is an approved direction, but the final asset and animation implementation still require a bounded design/engineering slice.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '11 / DELIVERY', 'One bounded slice, one evidence gate.', 'Do not combine design ambition, backend risk, and product uncertainty into one context.');
  const stages = [['01', 'TRUTH LOCK', 'Bible, PRD, tracker, open decisions'], ['02', 'USER EVIDENCE', '10–15 moderated core-loop sessions'], ['03', 'FOUNDATION', 'Auth, privacy, Pool, messaging, safety'], ['04', 'ALPHA', 'One city, trusted supply, manual support'], ['05', 'EXPAND', 'Only evidence-led features']];
  stages.forEach(([n, h, b], i) => { const x = 0.72 + i * 2.48; dot(s, x + 0.22, 2.85, 0.18, i < 2 ? C.emerald : C.silver); text(s, n, x + 0.08, 2.74, 0.28, 0.15, { fontSize: 8, color: C.black, bold: true, align: 'center' }); text(s, h, x, 3.45, 1.9, 0.16, { fontSize: 9, color: C.silverBright, bold: true, charSpacing: 0.9 }); text(s, b, x, 3.85, 1.85, 0.48, { fontSize: 11, color: C.muted }); if (i < 4) line(s, x + 0.48, 2.85, x + 2.15, 2.85, C.faint, 1, 15); }); footer(s); addNotes(s, 'This is the intended handoff cadence. Each stage has its own acceptance checks, fresh context, and written handover.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '12 / OPEN DECISIONS', 'The unresolved questions are named, not hidden.', 'A professional team can work quickly when the boundaries are honest.');
  const ods = [['NAV', 'final navigation names'], ['PASS', 'confirmation or credential?'], ['BUSINESS', 'first business capability'], ['STORIES', 'text scaffolding or media product?'], ['PET', 'future idea or retire?'], ['VISUAL', 'type, black, colour, opening asset']];
  ods.forEach(([a, b], i) => { const x = 0.9 + (i % 3) * 4.05; const y = 2.25 + Math.floor(i / 3) * 1.15; box(s, x, y, 3.35, 0.7, C.glass, true, C.glass2); text(s, a, x + 0.25, y + 0.2, 0.8, 0.15, { fontSize: 8.5, color: C.emerald, bold: true, charSpacing: 1.1 }); text(s, b, x + 1.2, y + 0.18, 1.85, 0.22, { fontSize: 12, color: C.silverBright, bold: true }); }); footer(s); addNotes(s, 'These questions are in docs/OPEN_DECISIONS.md. The PRD does not silently resolve them.');

  s = pptx.addSlide('FUNC'); bg(s); title(s, '13 / HANDOFF', 'A developer should not need hidden chat history.', 'The source-of-truth pack is the product contract around the code.');
  const hand = ['Bible — why Func exists', 'PRD — what each feature does', 'Feature matrix — status and gates', 'Privacy + safety — what can be seen', 'Design system — how it should feel', 'API contract — production seams', 'Open decisions — what Phoenix must choose'];
  hand.forEach((v, i) => { const y = 2.1 + i * 0.55; dot(s, 1.05, y + 0.12, 0.06, i < 4 ? C.emerald : C.silver); text(s, v.toUpperCase(), 1.4, y + 0.04, 7.5, 0.16, { fontSize: 9, color: C.silverBright, bold: true, charSpacing: 0.9 }); }); footer(s); addNotes(s, 'Close by giving the developer the exact document set and the expectation that conflicts stop work until reconciled.');

  s = pptx.addSlide('FUNC'); bg(s); brand(s, 0.72, 0.65, 1.15); text(s, 'MAKE THE CITY\nLEGIBLE.', 0.75, 2.0, 6.5, 1.05, { fontSize: 38, color: C.silverBright, bold: true }); text(s, 'Then make it safe enough to trust.', 0.78, 3.65, 5.7, 0.35, { fontSize: 18, color: C.muted }); cityMap(s, 8.05, 1.3, 4.1, 4.6, 10); footer(s, 'FUNC / CONFIDENTIAL — GENERATED FROM BIBLE 1.0 + PRD 1.0 DRAFT'); addNotes(s, 'End with the product standard: clarity, safety, and a real night out.');
  return pptx;
}

async function main() {
  await investorDeck().writeFile({ fileName: path.join(OUT, 'func-investor-vision-v1.0-2026-08-25.pptx') });
  await developerDeck().writeFile({ fileName: path.join(OUT, 'func-developer-vision-v1.0-2026-08-25.pptx') });
}

main().catch((err) => { console.error(err); process.exitCode = 1; });
