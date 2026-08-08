/* ==========================================================================
   Func. — screens
   ========================================================================== */
window.SCREENS = function (C) {
'use strict';
const { h, frag, $, $$, I, st, S, clamp, lerp, buzz, flyTo, drawMarks, go,
        Pet, storiesFor, peopleAt, tablesFor, byId, Engine, passesFilter } = C;

const money = (a, b) => a === b ? `$${a}` : `$${a}–${b}`;
// Real distance from a haversine on actual lat/lon (not the fixed "11
// minutes" the venue sheet used to say regardless of which venue it was).
function haversineMiles(lat1, lon1, lat2, lon2) {
  const R = 3958.8, toRad = (d) => d * Math.PI / 180;
  const dLat = toRad(lat2 - lat1), dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
function walkMinutes(v) { return Math.max(1, Math.round(haversineMiles(C.YOU_LL.lat, C.YOU_LL.lon, v.lat, v.lon) / 3 * 60)); }
const person = (id) => byId(S.people, id) || { name: '?', initial: '?', status: 'green' };
const KINDS = [
  { id: 'dinner', label: 'Dinner' }, { id: 'bar', label: 'Bars' },
  { id: 'club', label: 'Clubs' }, { id: 'spot', label: 'Spots' },
];

/* ---- Status + persona display helpers ----------------------------------- */
const STATUS_META = {
  green: { dot: 'green', label: 'DTF' },
  amber: { dot: 'amber', label: 'Looking' },
  red:   { dot: 'red',   label: 'Not out' },
  disco: { dot: 'disco', label: 'Disco' },
};
function statusMeta(id) { return STATUS_META[id] || STATUS_META.green; }
function hostLabel(id) {
  const b = byId(S.businesses || [], id); if (b) return b.name;
  const p = byId(S.people, id); return p ? p.name : id;
}
// Every status chip on screen (map top bar, Profile) carries this class, so
// one repaint fixes both instead of patching a single DOM node — that
// mismatch was the original status-desync bug.
function paintStatusChips() {
  const meta = statusMeta(Engine.getStatus(Engine.getActivePersonaId()));
  $$('.statuschip').forEach((c) => {
    const dot = c.querySelector('.tl'); if (dot) dot.className = 'tl ' + meta.dot;
    const label = c.querySelector('.statuslabel'); if (label) label.textContent = meta.label;
  });
}

/* ---- Reusable sheet ----------------------------------------------------- */
let scrim, sheet, sheetBody;
function openSheet(node, opts) {
  sheetBody.innerHTML = '';
  sheetBody.appendChild(node);
  sheet.style.maxHeight = (opts && opts.tall) ? '92%' : '88%';
  scrim.classList.add('on'); sheet.classList.add('on');
  buzz(8);
}
function closeSheet() { scrim.classList.remove('on'); sheet.classList.remove('on'); }

/* ---- Avatar helper ------------------------------------------------------ */
const av = (p, cls) => h('div', { class: 'av ' + (cls || ''), 'data-s': p.status, text: p.initial });

/* ---- Map overlay UI ----------------------------------------------------- */
function mapUI() {
  const ui = h('div', { id: 'mapui' });

  // ---- top bar
  const chips = h('div', { class: 'chiprow', style: { paddingBottom: '2px' } });
  KINDS.forEach(k => {
    const c = h('div', { class: 'chip', text: k.label, onclick: () => {
      st.filters.has(k.id) ? st.filters.delete(k.id) : st.filters.add(k.id);
      c.classList.toggle('on', st.filters.has(k.id));
      drawMarks(); buzz(5);
    }});
    chips.appendChild(c);
  });

  const statusChip = h('div', { class: 'chip on statuschip', onclick: statusSheet }, [
    h('span', { class: 'tl ' + statusMeta(Engine.getStatus(Engine.getActivePersonaId())).dot }),
    h('span', { class: 'statuslabel', text: statusMeta(Engine.getStatus(Engine.getActivePersonaId())).label }),
  ]);

  const searchInput = h('input', {
    placeholder: 'Search San Francisco', value: st.searchQuery,
    style: { flex: '1', background: 'transparent', border: 'none', outline: 'none',
      color: 'var(--fg)', fontSize: '14px', fontFamily: 'var(--ui)' },
    oninput: (e) => { st.searchQuery = e.target.value; drawMarks(); },
  });
  const top = h('div', { class: 'topbar' }, [
    h('div', { class: 'searchrow' }, [
      h('div', { class: 'search' }, [ h('span', { html: I.search, style: { width: '17px', display: 'flex', flex: 'none' } }),
                                      searchInput ]),
      h('div', { class: 'iconbtn', html: I.sliders, onclick: filterSheet }),
    ]),
    h('div', { class: 'chiprow' }, [statusChip, ...Array.from(chips.children)]),
  ]);
  ui.appendChild(top);

  // ---- right rail
  ui.appendChild(h('div', { style: { position: 'absolute', right: '14px',
      bottom: 'calc(190px + env(safe-area-inset-bottom))',
      display: 'flex', flexDirection: 'column', gap: '10px' } }, [
    h('div', { class: 'iconbtn', html: I.globe, onclick: globe }),
    h('div', { class: 'iconbtn', html: I.loc, onclick: () => flyTo(C.YOU.x, C.YOU.y, 1.35, 700) }),
    h('div', { class: 'iconbtn', html: I.camera, onclick: cameraTap }),
    h('div', { class: 'iconbtn', html: I.pin, onclick: dropSpotSheet }),
  ]));

  // ---- live-now strip
  const strip = h('div', { style: {
    position: 'absolute', left: '0', right: '0',
    bottom: 'calc(74px + env(safe-area-inset-bottom))',
    display: 'flex', gap: '10px', overflowX: 'auto', padding: '0 14px',
  }});
  strip.style.scrollbarWidth = 'none';
  function fillStrip() {
    strip.innerHTML = '';
    const list = S.venues.slice().sort((a, b) => b.heat - a.heat).slice(0, 6);
    list.forEach(v => {
      const stories = storiesFor(v.id);
      const card = h('div', {
        style: { flex: 'none', width: '158px', padding: '11px 12px', borderRadius: '18px',
                 background: 'rgba(10,16,21,.86)', backdropFilter: 'blur(18px)',
                 boxShadow: 'inset 0 0 0 1px var(--hairline)', cursor: 'pointer' },
        onclick: () => { flyTo(v.x, v.y - 60, 1.5, 650); setTimeout(() => venue(v), 380); },
      }, [
        h('div', { class: 'between', style: { marginBottom: '5px' } }, [
          h('div', { class: 'd3 trunc', text: v.name, style: { fontSize: '15px' } }),
          stories.length ? h('span', { style: { width: '7px', height: '7px', borderRadius: '50%',
            background: 'var(--em-hi)', boxShadow: '0 0 8px var(--em-hi)', flex: 'none' } }) : null,
        ]),
        h('div', { class: 'small trunc', text: v.district + ' · ' + v.vibe[0] }),
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '6px', marginTop: '8px' } }, [
          h('div', { style: { flex: '1', height: '3px', borderRadius: '2px', background: 'rgba(255,255,255,.1)' } }, [
            h('div', { style: { width: (v.heat * 100) + '%', height: '100%', borderRadius: '2px',
                                background: 'linear-gradient(90deg,var(--em-lo),var(--em-hi))' } }),
          ]),
          h('span', { class: 'small num', text: v.entry[1] ? `$${v.entry[0]}–${v.entry[1]}` : 'Free' }),
        ]),
      ]);
      strip.appendChild(card);
    });
  }
  fillStrip();
  ui.appendChild(strip);

  // ---- afters toggle — nudges based on the real device clock, not a fixed
  // demo timer with a hardcoded "1:40am" that was true regardless of when
  // you actually opened the app. Manual access lives on Profile too, since
  // gating the only entry point behind real late-night hours would make the
  // feature unreachable the rest of the day.
  const isLateNight = () => { const h = new Date().getHours(); return h >= 23 || h < 5; };
  const timeLabel = () => {
    const d = new Date(), h = d.getHours(), m = String(d.getMinutes()).padStart(2, '0');
    const h12 = h % 12 === 0 ? 12 : h % 12;
    return `${h12}:${m}${h >= 12 ? 'pm' : 'am'}`;
  };
  const aft = h('div', {
    style: { position: 'absolute', left: '50%', transform: 'translateX(-50%)',
             bottom: 'calc(196px + env(safe-area-inset-bottom))', display: 'none' },
  }, [
    h('div', { class: 'chip', style: { height: '38px', padding: '0 16px', background: 'rgba(200,162,255,.16)',
        boxShadow: 'inset 0 0 0 1px rgba(200,162,255,.5)', color: '#E4D0FF', fontWeight: '700' },
      onclick: () => { setAfters(true); aft.style.display = 'none'; } }),
  ]);
  ui.appendChild(aft);
  function checkLateNight() {
    if (st.afters) { aft.style.display = 'none'; return; }
    if (isLateNight()) {
      aft.firstChild.textContent = `It is ${timeLabel()} — switch to Afters`;
      aft.style.display = 'block';
    } else {
      aft.style.display = 'none';
    }
  }
  checkLateNight();
  setInterval(checkLateNight, 5 * 60 * 1000);
  ui._showAfters = () => aft.style.display = 'block';

  return ui;
}

/* ---- Status sheet ------------------------------------------------------- */
function statusSheet() {
  const opts = [
    { id: 'green', t: 'Green — DTF', d: 'Down to func. Up for anything, out to have fun.' },
    { id: 'amber', t: 'Amber — Looking', d: 'Checking things out, not committing to anything yet.' },
    { id: 'red',   t: 'Red — Not out', d: 'Inactive. You will not show up to anyone tonight.' },
    { id: 'disco', t: 'Disco — Super DTF', d: 'Premium. You surface higher and requests are unlimited.', prem: true },
  ];
  const wrap = h('div', { class: 'pad' }, [
    h('h2', { class: 'd2', text: 'Tonight you are' }),
    h('p', { class: 'body', style: { marginTop: '6px' }, text: 'Everyone sees this. Nobody wastes anybody’s time.' }),
    h('div', { class: 'gap', style: { marginTop: '16px' } },
      opts.map(o => h('div', {
        class: 'card', style: { padding: '14px', display: 'flex', gap: '12px', alignItems: 'flex-start',
          boxShadow: Engine.getStatus(Engine.getActivePersonaId()) === o.id ? 'inset 0 0 0 1.5px var(--em)' : 'inset 0 0 0 1px var(--hairline-2)' },
        onclick: () => { Engine.setStatus(Engine.getActivePersonaId(), o.id); closeSheet(); buzz(10); },
      }, [
        h('span', { class: 'tl ' + o.id, style: { marginTop: '5px', width: '11px', height: '11px' } }),
        h('div', { class: 'grow' }, [
          h('div', { style: { fontWeight: '700', fontSize: '15px' }, text: o.t }),
          h('div', { class: 'small', style: { marginTop: '3px' }, text: o.d }),
        ]),
        o.prem ? h('span', { class: 'small', style: { color: 'var(--disco)', fontWeight: '700' }, text: 'PRO' }) : null,
      ]))),
  ]);
  openSheet(wrap);
}

/* ---- Filter sheet --------------------------------------------------------
   Shares real state with the top-bar chips (st.filters) rather than running
   a second, disconnected filter model — every group here actually narrows
   what drawMarks() puts on the map. Trimmed to only what the data can back:
   no "party size" (nothing on the map is party-size-aware) and "Who" is
   just "green only", since there's no per-viewer friend graph to filter on. */
// Filter state lives on st (not Engine), so it never fires 'store:change' —
// the map redraws itself via the drawMarks() calls beside every toggle, but
// Browse needs the same nudge or its deck stays stale until the tab is
// next revisited, even though the same sheet just told you it applied.
function refreshBrowseIfOpen() {
  if (st.screen === 'browse' && screensList.browse) screensList.browse._reset();
}

const VIBE_WORDS = ['Big night', 'Chilled', 'Dressy', 'Dive', 'Queer', 'Techno', 'House', 'Disco', 'Live'];
const COST_OPTS = [{ l: 'Free entry', v: 0 }, { l: 'Under $20', v: 20 }, { l: 'Under $40', v: 40 }, { l: 'Anything', v: null }];
const DIST_OPTS = [{ l: 'Walking', v: 0.5 }, { l: 'Under 2 mi', v: 2 }, { l: 'Anywhere in SF', v: null }];

function filterSheet() {
  function multiChip(label, on, toggle) {
    const c = h('div', { class: 'chip' + (on ? ' on' : ''), text: label, onclick: () => {
      toggle(); c.classList.toggle('on'); drawMarks(); refreshBrowseIfOpen();
    } });
    return c;
  }
  function exclusiveRow(opts, current, set) {
    const row = h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } });
    opts.forEach(o => {
      const chip = h('div', { class: 'chip' + (current() === o.v ? ' on' : ''), text: o.l, onclick: () => {
        set(o.v);
        Array.from(row.children).forEach(c => c.classList.remove('on'));
        chip.classList.add('on');
        drawMarks(); refreshBrowseIfOpen();
      } });
      row.appendChild(chip);
    });
    return row;
  }
  const group = (title, node) => h('div', { style: { marginBottom: '18px' } }, [
    h('div', { class: 'lab', style: { marginBottom: '9px' }, text: title }), node]);

  const wrap = h('div', { class: 'pad' }, [
    h('div', { class: 'between' }, [
      h('h2', { class: 'd2', text: 'Filter' }),
      h('div', { class: 'btn quiet sm', text: 'Clear all', style: { width: 'auto' }, onclick: () => {
        st.filters.clear(); st.filterVibe.clear(); st.filterCost = null; st.filterDistance = null; st.filterGreenOnly = false;
        drawMarks(); refreshBrowseIfOpen(); filterSheet();
      } }),
    ]),
    h('p', { class: 'body', style: { margin: '6px 0 18px' }, text: 'All optional. Add as much or as little as you want.' }),
    group('What', h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
      KINDS.map(k => multiChip(k.label, st.filters.has(k.id), () => { st.filters.has(k.id) ? st.filters.delete(k.id) : st.filters.add(k.id); })))),
    group('Vibe', h('div', { style: { display: 'flex', flexWrap: 'wrap', gap: '8px' } },
      VIBE_WORDS.map(v => multiChip(v, st.filterVibe.has(v), () => { st.filterVibe.has(v) ? st.filterVibe.delete(v) : st.filterVibe.add(v); })))),
    group('Cost', exclusiveRow(COST_OPTS, () => st.filterCost, (v) => { st.filterCost = v; })),
    group('Distance', exclusiveRow(DIST_OPTS, () => st.filterDistance, (v) => { st.filterDistance = v; })),
    group('Who', h('div', { style: { display: 'flex', gap: '8px' } }, [
      multiChip('Green only', st.filterGreenOnly, () => { st.filterGreenOnly = !st.filterGreenOnly; })])),
    h('div', { style: { height: '8px' } }),
    h('button', { class: 'btn', text: 'Show me', onclick: () => {
      closeSheet(); buzz(10); refreshBrowseIfOpen();
      const n = S.venues.filter(passesFilter).length;
      Pet.speak(n ? n + ' place' + (n === 1 ? '' : 's') + ' match on the map right now.' : 'Nothing matches that combination — try loosening one.', 4600);
    } }),
  ]);
  openSheet(wrap, { tall: true });
}

/* ---- Story reel --------------------------------------------------------- */
function reel(v, i) {
  const list = storiesFor(v.id);
  if (!list.length) return;
  let idx = i || 0;
  const ov = h('div', { style: { position: 'absolute', inset: '0', zIndex: '80', background: '#000',
    display: 'flex', flexDirection: 'column' } });

  function render() {
    const s = list[idx], p = person(s.by);
    ov.innerHTML = '';
    ov.appendChild(h('div', { style: { position: 'absolute', inset: '0',
      background: `linear-gradient(160deg, ${s.g[0]}, ${s.g[1]})` } }));
    ov.appendChild(h('div', { style: { position: 'absolute', inset: '0',
      background: 'radial-gradient(120% 60% at 50% 100%, rgba(0,0,0,.75), transparent 60%)' } }));
    // progress
    ov.appendChild(h('div', { style: { position: 'relative', display: 'flex', gap: '4px',
      padding: 'calc(env(safe-area-inset-top) + 14px) 14px 0' } },
      list.map((_, k) => h('div', { style: { flex: '1', height: '2.5px', borderRadius: '2px',
        background: k <= idx ? '#fff' : 'rgba(255,255,255,.32)' } }))));
    // header
    ov.appendChild(h('div', { style: { position: 'relative', display: 'flex', alignItems: 'center',
      gap: '10px', padding: '12px 14px' } }, [
      av(p, 'sm'),
      h('div', { class: 'grow' }, [
        h('div', { style: { fontWeight: '700', fontSize: '14px' }, text: p.name }),
        h('div', { style: { fontSize: '11.5px', opacity: '.85' }, text: s.mins + 'm ago · ' + v.name }),
      ]),
      s.atVenue ? h('div', { class: 'chip', style: { height: '26px', background: 'rgba(0,0,0,.45)',
        color: '#fff', fontSize: '11px' } }, [
        h('span', { html: I.pin, style: { width: '13px', display: 'flex' } }),
        h('span', { text: 'At the venue' }) ]) : null,
      h('div', { style: { cursor: 'pointer', opacity: '.9' }, html: I.close, onclick: () => ov.remove() }),
    ]));
    // spacer + footer
    ov.appendChild(h('div', { class: 'grow', style: { position: 'relative' },
      onclick: () => { idx = (idx + 1) % list.length; render(); } }));
    ov.appendChild(h('div', { style: { position: 'relative', padding: '0 14px calc(env(safe-area-inset-bottom) + 20px)' } }, [
      h('div', { class: 'between', style: { marginBottom: '12px' } }, [
        h('div', {}, [
          h('div', { class: 'd2', text: v.name }),
          h('div', { class: 'small', style: { color: 'rgba(255,255,255,.8)' },
            text: v.district + ' · ' + (v.entry[1] ? money(v.entry[0], v.entry[1]) + ' in' : 'Free entry') }),
        ]),
      ]),
      h('button', { class: 'btn', text: 'See the place', onclick: () => { ov.remove(); venue(v); } }),
    ]));
  }
  render();
  $('#phone').appendChild(ov);
}

/* ---- Venue sheet -------------------------------------------------------- */
function venue(v) {
  const stories = storiesFor(v.id);
  const pp = peopleAt(v.id);
  const tabs = tablesFor(v.id);

  const wrap = h('div', {}, [
    // hero
    h('div', { style: { position: 'relative', height: '132px', margin: '0 0 -22px',
      background: 'linear-gradient(150deg,#1C222A,#06080B 70%)', overflow: 'hidden' } }, [
      // the only colour is how alive the place is right now
      h('div', { style: { position: 'absolute', inset: '0',
        background: `radial-gradient(85% 125% at 22% -10%, rgba(18,224,138,${.14 + v.heat * .34}), transparent 62%)` } }),
      h('div', { style: { position: 'absolute', inset: '0',
        background: 'radial-gradient(70% 90% at 88% 0%, rgba(226,234,242,.10), transparent 60%)' } }),
      h('div', { style: { position: 'absolute', left: '16px', bottom: '32px', right: '16px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '7px' } }, [
          h('h2', { class: 'd1', text: v.name, style: { fontSize: '34px' } }),
          v.verified ? h('span', { html: I.verified, style: { width: '17px', color: 'var(--em-hi)', display: 'flex' } }) : null,
        ]),
        h('div', { class: 'small', style: { color: 'rgba(255,255,255,.75)', marginTop: '4px' },
          text: v.district + ' · ' + v.vibe.join(' · ') }),
      ]),
    ]),
    h('div', { class: 'pad', style: { paddingTop: '26px' } }, [
      // the words live here — never on the map
      h('div', { style: { display: 'flex', gap: '10px', marginBottom: '14px' } }, [
        statCard('Right now', v.word, 'var(--em-hi)'),
        statCard('In', v.entry[1] ? money(v.entry[0], v.entry[1]) : 'Free', '#fff'),
        statCard('A night', money(v.spend[0], v.spend[1]), '#fff'),
      ]),
      h('p', { class: 'body', style: { marginBottom: '16px' }, text: v.blurb }),

      // stories
      stories.length ? h('div', { style: { marginBottom: '18px' } }, [
        h('div', { class: 'lab', style: { marginBottom: '9px' },
          text: 'Live from inside · ' + stories.length }),
        h('div', { style: { display: 'flex', gap: '9px', overflowX: 'auto' } },
          stories.map((s, i) => h('div', {
            style: { flex: 'none', width: '74px', height: '104px', borderRadius: '14px', cursor: 'pointer',
              background: `linear-gradient(160deg, ${s.g[0]}, ${s.g[1]})`, position: 'relative',
              boxShadow: s.mins < 20 ? '0 0 0 2px var(--em-hi)' : '0 0 0 1px var(--hairline)' },
            onclick: () => { closeSheet(); setTimeout(() => reel(v, i), 260); },
          }, [
            h('div', { style: { position: 'absolute', left: '6px', bottom: '6px', right: '6px',
              fontSize: '10px', fontWeight: '700', textShadow: '0 1px 3px rgba(0,0,0,.6)' },
              text: s.mins + 'm' }),
            s.atVenue ? h('div', { style: { position: 'absolute', top: '6px', right: '6px', width: '13px',
              display: 'flex', color: '#fff', opacity: '.95' }, html: I.pin }) : null,
          ]))),
      ]) : null,

      // who
      pp.length ? h('div', { class: 'card', style: { padding: '13px', marginBottom: '14px',
        display: 'flex', alignItems: 'center', gap: '11px' } }, [
        h('div', { class: 'avstack' }, pp.slice(0, 4).map(p => av(p, 'sm'))),
        h('div', { class: 'grow small', style: { color: 'var(--fg-2)' },
          text: describeWho(pp) }),
      ]) : null,

      // tables
      tabs.length ? h('div', { style: { marginBottom: '16px' } }, [
        h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Tables tonight' }),
        h('div', { class: 'gap' }, tabs.map(t => {
          const left = Engine.tableSpotsLeft(t);
          return h('div', { class: 'card', style: { padding: '14px' } }, [
            h('div', { class: 'between' }, [
              h('div', { class: 'grow' }, [
                h('div', { style: { fontWeight: '700', fontSize: '15px' }, text: t.name }),
                h('div', { class: 'small', style: { marginTop: '2px' }, text: t.vibe }),
              ]),
              h('div', { style: { textAlign: 'right' } }, [
                h('div', { class: 'd3', style: { color: 'var(--em-hi)' }, text: '$' + t.perHead }),
                h('div', { class: 'small', text: 'per head' }),
              ]),
            ]),
            h('div', { class: 'between', style: { marginTop: '11px' } }, [
              h('div', { class: 'small' }, [
                h('span', { html: I.verified, style: { width: '12px', display: 'inline-flex',
                  verticalAlign: '-2px', color: 'var(--gold)', marginRight: '4px' } }),
                h('span', { text: t.host + ' · ' + (left > 0 ? left + ' of ' + t.seats + ' spots left' : 'Full tonight') }),
              ]),
              h('button', { class: 'btn sm', text: 'Request', disabled: left <= 0,
                style: left <= 0 ? { opacity: '.4', pointerEvents: 'none' } : {}, onclick: () => requestFlow(v, t) }),
            ]),
          ]);
        })),
      ]) : null,

      h('div', { style: { display: 'flex', gap: '9px' } }, [
        h('button', { class: 'btn ghost', text: 'Directions', onclick: () => Pet.speak(walkMinutes(v) + ' minutes walking from where you are.', 4200) }),
        h('button', { class: 'btn', text: tabs.length ? 'Request a table' : 'I’m going',
          onclick: () => tabs.length ? requestFlow(v, tabs[0]) : goingTo(v) }),
      ]),
    ]),
  ]);
  openSheet(wrap, { tall: true });
}

function describeWho(pp) {
  const f = pp.filter(p => p.friend).length, m = pp.filter(p => p.mutual).length;
  const bits = [];
  if (f) bits.push(f === 1 ? '1 friend here' : f + ' friends here');
  if (m) bits.push(m === 1 ? '1 mutual' : m + ' mutuals');
  return bits.join(' · ') + ' · all showing green';
}

function statCard(lab, val, col) {
  return h('div', { class: 'card grow', style: { padding: '11px 12px' } }, [
    h('div', { class: 'lab', style: { fontSize: '9.5px' }, text: lab }),
    h('div', { class: 'd3', style: { marginTop: '5px', color: col, fontSize: '17px' }, text: val }),
  ]);
}

/* ---- Local spot: drop, discover, visit, earn tokens ---------------------
   No real GPS in a browser prototype, so a dropped spot anchors to YOU's
   fixed location (same stand-in the rest of the map already uses) rather
   than faking a location the user never actually gave. ------------------- */
function dropSpotSheet() {
  const nameInput = h('input', { placeholder: 'What is it called?', style: {
    background: 'var(--surface-2)', border: 'none', borderRadius: '10px', padding: '12px',
    color: 'var(--fg)', width: '100%', marginBottom: '10px', fontSize: '14px' } });
  const noteInput = h('textarea', { placeholder: 'Why it is worth knowing about.', style: {
    background: 'var(--surface-2)', border: 'none', borderRadius: '10px', padding: '12px',
    color: 'var(--fg)', width: '100%', minHeight: '76px', fontFamily: 'var(--ui)', fontSize: '14px', resize: 'vertical' } });
  openSheet(h('div', { class: 'pad' }, [
    h('div', { class: 'chip on', style: { marginBottom: '12px' } }, [
      h('span', { html: I.token, style: { width: '14px', display: 'flex' } }),
      h('span', { text: 'Drop a local spot' }) ]),
    h('h2', { class: 'd2', text: 'Somewhere worth knowing' }),
    h('p', { class: 'body', style: { margin: '8px 0 16px' },
      text: 'Anyone can drop one. You earn tokens when people actually go.' }),
    nameInput, noteInput,
    h('div', { style: { height: '14px' } }),
    h('button', { class: 'btn', text: 'Drop it', onclick: () => {
      if (!nameInput.value.trim()) return;
      const p = C.proj(C.YOU_LL.lon, C.YOU_LL.lat);
      Engine.dropSpot(Engine.getActivePersonaId(), {
        name: nameInput.value.trim(), note: noteInput.value.trim(),
        lat: C.YOU_LL.lat, lon: C.YOU_LL.lon, x: p.x, y: p.y,
      });
      closeSheet(); buzz(10); drawMarks();
      toast('Dropped — it is live on the map now');
    } }),
  ]));
}

/* ---- Local spot --------------------------------------------------------- */
function spot(sp) {
  openSheet(h('div', { class: 'pad' }, [
    h('div', { class: 'chip on', style: { marginBottom: '12px' } }, [
      h('span', { html: I.token, style: { width: '14px', display: 'flex' } }),
      h('span', { text: 'Local spot' }) ]),
    h('h2', { class: 'd2', text: sp.name }),
    h('p', { class: 'body', style: { margin: '10px 0 16px' }, text: '“' + sp.note + '”' }),
    h('div', { class: 'card', style: { padding: '13px', display: 'flex', gap: '11px', alignItems: 'center' } }, [
      av({ initial: sp.by[0], status: 'green' }, 'sm'),
      h('div', { class: 'grow' }, [
        h('div', { style: { fontWeight: '650', fontSize: '14px' }, text: 'Dropped by ' + sp.by }),
        h('div', { class: 'small', text: sp.tokens + ' tokens earned from people going' }),
      ]),
    ]),
    h('div', { style: { height: '14px' } }),
    h('button', { class: 'btn', text: 'Take me there', onclick: () => {
      closeSheet(); buzz(10);
      const me = Engine.getActivePersonaId();
      const res = Engine.visitSpot(me, sp.id);
      if (!res.ok && res.reason === 'own_spot') Pet.speak('This is your own spot — send it to people, tokens come from them turning up.', 4600);
      else if (res.alreadyCounted) Pet.speak('Already counted your visit here. Still a good pick.', 4000);
      else Pet.speak('Nice pick. ' + sp.by + ' just earned a token.', 4600);
    } }),
  ]));
}

/* ---- Request → accepted → pass (dopamine #2) --------------------------- */
function requestFlow(v, t) {
  let size = 4;
  const sizeRow = h('div', { style: { display: 'flex', gap: '8px', marginTop: '10px' } });
  [1, 2, 3, 4, 5, 6].forEach(n => {
    const c = h('div', { class: 'chip' + (n === size ? ' on' : ''), text: n === 6 ? '6+' : String(n),
      style: { flex: '1', justifyContent: 'center' },
      onclick: () => { size = n; $$('.chip', sizeRow).forEach((x, i) => x.classList.toggle('on', i === n - 1)); buzz(5); } });
    sizeRow.appendChild(c);
  });

  openSheet(h('div', { class: 'pad' }, [
    h('div', { class: 'lab', text: 'Request' }),
    h('h2', { class: 'd2', style: { marginTop: '6px' }, text: t.name }),
    h('div', { class: 'small', style: { marginTop: '5px' }, text: v.name + ' · ' + t.host + ' · $' + t.perHead + ' per head' }),

    h('div', { style: { marginTop: '20px' } }, [
      h('div', { class: 'lab', text: 'How many of you?' }),
      sizeRow,
      h('p', { class: 'small', style: { marginTop: '10px' },
        text: 'Just a number — like booking a restaurant. Nothing to set up.' }),
    ]),

    h('div', { class: 'card', style: { padding: '13px', marginTop: '18px' } }, [
      h('div', { class: 'small', text: 'Func does not take payment. You sort the money with '
        + t.host + ' at the door — we just get you the spot and the pass.' }),
    ]),

    h('div', { style: { height: '18px' } }),
    h('button', { class: 'btn', text: 'Send request', onclick: () => { closeSheet(); sendRequest(v, t, size); } }),
  ]), { tall: true });
}

function sendRequest(v, t, size) {
  buzz(12);
  const r = Engine.sendRequest({ kind: 'table', venueId: v.id, tableId: t.id, partySize: size });
  if (r && r.ok === false) {
    if (r.reason === 'request_cap') Pet.speak('You have a few requests still out. Go Disco for unlimited, or wait on one to resolve.', 4600);
    else if (r.reason === 'duplicate') Pet.speak('Already sent — check Plans, no need to ask twice.', 3800);
    return;
  }
}

// Fires from Engine.on('request:sent', ...) registered once in mount() —
// covers both table/door requests and after-party asks. In demo mode the
// engine supplies etaCopy (its scripted line); in real mode it's null and
// we show a neutral waiting line instead, since there's no timer to promise.
function handleRequestSent({ request, host, etaCopy }) {
  if (request.kind === 'after') toast('Asked ' + host + ' · ' + request.partySize + ' of you');
  else toast('Request sent to ' + host + ' · ' + request.partySize + ' of you');
  Pet.speak(etaCopy || ('Sent. Waiting on ' + host + '.'), 4200);
}

// Fires from Engine.on('request:accepted', ...) — a real decision (host tap,
// or demo timer) rather than a function called directly, so it fires
// correctly no matter which screen is open when it happens.
function handleRequestAccepted({ request, pass, venue, table, after }) {
  buzz([14, 60, 26]);
  bump('inbox');
  if (request.kind === 'after') showAfterAcceptedOverlay(after);
  else showPassAcceptedOverlay(venue, table, pass);
}

function handleRequestDeclined({ request }) {
  toast(hostLabel(request.hostId) + ' said no this time');
  Pet.speak('No luck there. Plenty else on tonight.', 4000);
}

function showPassAcceptedOverlay(v, t, pass) {
  const ov = h('div', { style: { position: 'absolute', inset: '0', zIndex: '82',
    background: 'rgba(2,6,4,.82)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center',
    opacity: '0', transition: 'opacity .3s' } });
  const card = h('div', { style: { width: '84%', transform: 'scale(.86) translateY(14px)',
    transition: 'transform .55s cubic-bezier(.22,1.4,.36,1)' } }, [passCard(v, t, pass)]);
  ov.appendChild(h('div', {}, [
    h('div', { class: 'center', style: { marginBottom: '18px' } }, [
      h('div', { class: 'd1', style: { color: 'var(--em-hi)' }, text: 'You’re in' }),
      h('div', { class: 'small', style: { marginTop: '5px' }, text: t.host + ' accepted · ' + pass.partySize + ' of you' }),
    ]),
    card,
    h('div', { style: { padding: '20px 8% 0' } }, [
      h('button', { class: 'btn ghost', text: 'Done', onclick: () => ov.remove() }),
    ]),
  ]));
  $('#phone').appendChild(ov);
  requestAnimationFrame(() => { ov.style.opacity = '1'; card.style.transform = 'scale(1) translateY(0)'; });
  Pet.speak(t.name + '. I put it in your plans.', 4600);
}

function passCard(v, t, pass) {
  return h('div', { class: 'pass', style: { padding: '20px' } }, [
    h('div', { style: { position: 'relative' } }, [
      h('div', { class: 'lab', style: { color: 'var(--em-hi)' }, text: 'Func pass' }),
      h('div', { class: 'd1', style: { marginTop: '8px', fontSize: '32px' }, text: v.name }),
      h('div', { class: 'small', style: { marginTop: '4px' }, text: t.name + ' · ' + pass.partySize + ' people · tonight' }),
      h('div', { style: { display: 'grid', placeItems: 'center', margin: '18px 0 12px' } }, [qr(pass.code)]),
      h('div', { class: 'center' }, [
        h('div', { class: 'd3 num', style: { letterSpacing: '.14em' }, text: pass.code }),
        h('div', { class: 'small', style: { marginTop: '5px' }, text: 'Show this on the door · ' + t.host }),
      ]),
    ]),
  ]);
}

function qr(seed) {
  // deterministic pseudo-QR — a real one is a backend job, this is the demo
  const n = 21, cell = 6;
  let s = 0; for (let i = 0; i < seed.length; i++) s = (s * 31 + seed.charCodeAt(i)) >>> 0;
  const rnd = () => ((s = (s * 1103515245 + 12345) >>> 0) / 4294967296);
  const svg = h('svg', { width: n * cell, height: n * cell, viewBox: `0 0 ${n * cell} ${n * cell}` });
  svg.appendChild(h('rect', { width: n * cell, height: n * cell, rx: 6, fill: '#04120C' }));
  const finder = (cx, cy) => {
    svg.appendChild(h('rect', { x: cx * cell, y: cy * cell, width: 7 * cell, height: 7 * cell, rx: 4, fill: 'var(--em-hi)' }));
    svg.appendChild(h('rect', { x: (cx + 1) * cell, y: (cy + 1) * cell, width: 5 * cell, height: 5 * cell, rx: 3, fill: '#04120C' }));
    svg.appendChild(h('rect', { x: (cx + 2) * cell, y: (cy + 2) * cell, width: 3 * cell, height: 3 * cell, rx: 1.5, fill: 'var(--em-hi)' }));
  };
  for (let y = 0; y < n; y++) for (let x = 0; x < n; x++) {
    const inF = (x < 8 && y < 8) || (x > n - 9 && y < 8) || (x < 8 && y > n - 9);
    if (inF) continue;
    if (rnd() > .54) svg.appendChild(h('rect', { x: x * cell, y: y * cell, width: cell, height: cell, fill: 'var(--em-hi)' }));
  }
  finder(0, 0); finder(n - 7, 0); finder(0, n - 7);
  return svg;
}

function goingTo(v) {
  closeSheet(); buzz(10);
  Engine.checkIn(Engine.getActivePersonaId(), v.id);
  toast('You’re going to ' + v.name);
  Pet.speak('Got it — the camera opens now. Post from inside and it gets the verified mark.', 4400);
}

/* ---- Story creation — real, and only carries the verified mark when the --
   poster is genuinely checked in at the venue right now ------------------- */
const STORY_COLORS = [
  ['#12E08A', '#0B7A5B'], ['#1BF5A0', '#0E4F6B'], ['#F5C542', '#0B7A5B'],
  ['#7A5BF5', '#12E08A'], ['#F55B8A', '#12E08A'], ['#0EF0C0', '#0A3A55'],
];

function cameraTap() {
  const me = Engine.getActivePersonaId();
  const ci = Engine.activeCheckin(me);
  if (!ci) { Pet.speak('Camera opens when you are at a place — tap "I’m going" on a venue first.', 4400); return; }
  storyComposer(byId(S.venues, ci.venueId));
}

function storyComposer(v) {
  let idx = 0;
  const preview = h('div', { style: { height: '150px', borderRadius: '16px', marginTop: '14px',
    background: `linear-gradient(160deg, ${STORY_COLORS[0][0]}, ${STORY_COLORS[0][1]})` } });
  const swatches = h('div', { style: { display: 'flex', gap: '9px', marginTop: '12px' } });
  STORY_COLORS.forEach((g, i) => {
    const sw = h('div', { style: { width: '30px', height: '30px', borderRadius: '50%', cursor: 'pointer',
      background: `linear-gradient(160deg, ${g[0]}, ${g[1]})`,
      boxShadow: i === 0 ? 'inset 0 0 0 2px #fff' : 'inset 0 0 0 1px var(--hairline)' },
      onclick: () => {
        idx = i;
        preview.style.background = `linear-gradient(160deg, ${g[0]}, ${g[1]})`;
        Array.from(swatches.children).forEach((x, k) => { x.style.boxShadow = k === i ? 'inset 0 0 0 2px #fff' : 'inset 0 0 0 1px var(--hairline)'; });
      } });
    swatches.appendChild(sw);
  });
  openSheet(h('div', { class: 'pad' }, [
    h('div', { class: 'chip on', style: { marginBottom: '12px' } }, [
      h('span', { html: I.pin, style: { width: '13px', display: 'flex' } }),
      h('span', { text: 'Live from ' + v.name }) ]),
    h('h2', { class: 'd2', text: 'Post a story' }),
    h('p', { class: 'body', style: { margin: '8px 0' },
      text: 'No camera in this prototype — pick a look. It posts as a genuine, verified story from inside ' + v.name + '.' }),
    preview, swatches,
    h('div', { style: { height: '18px' } }),
    h('button', { class: 'btn', text: 'Post', onclick: () => {
      closeSheet(); buzz(10);
      Engine.postStory(Engine.getActivePersonaId(), { colorIdx: idx });
      drawMarks();
      toast('Posted — live on the map now');
    } }),
  ]));
}

/* ---- Toast -------------------------------------------------------------- */
function toast(msg) {
  const t = h('div', { style: {
    position: 'absolute', left: '50%', bottom: '86px', transform: 'translate(-50%, 12px)',
    zIndex: '78', padding: '12px 18px', borderRadius: '999px', maxWidth: '86%',
    background: 'rgba(12,19,26,.96)', boxShadow: '0 0 0 1px rgba(18,224,138,.3), 0 16px 34px -12px rgba(0,0,0,.9)',
    fontSize: '13.5px', fontWeight: '600', opacity: '0', transition: 'all .32s cubic-bezier(.22,1.2,.36,1)',
    textAlign: 'center',
  }, text: msg });
  $('#phone').appendChild(t);
  requestAnimationFrame(() => { t.style.opacity = '1'; t.style.transform = 'translate(-50%,0)'; });
  setTimeout(() => { t.style.opacity = '0'; t.style.transform = 'translate(-50%,12px)';
    setTimeout(() => t.remove(), 340); }, 2600);
}

/* ---- Browse: swipe anything (dopamine #3) ------------------------------- */
// Same passesFilter() the map uses — the sliders icon on this screen opens
// the identical sheet, so it has to actually change this deck too, not
// just look like it does because it opens the same UI.
function browseItems() {
  const items = [];
  S.venues.forEach(v => {
    if (!passesFilter(v)) return;
    items.push({ kind: v.kind, title: v.name, sub: v.district + ' · ' + v.vibe.join(' · '),
      meta: v.entry[1] ? money(v.entry[0], v.entry[1]) + ' in' : 'Free entry', heat: v.heat, v, g: ['#0E3D2E', '#061118'] });
  });
  S.tables.forEach(t => { const v = byId(S.venues, t.venue);
    if (!v || !passesFilter(v)) return;
    items.push({ kind: 'table', title: t.name, sub: v.name + ' · ' + t.vibe, meta: '$' + t.perHead + ' per head',
      heat: .8, v, t, g: ['#123A52', '#06131C'] }); });
  S.afters.forEach(a => items.push({ kind: 'after', title: a.host + '’s after-party', sub: a.area + ' · ' + a.vibe.join(' · '),
    meta: Engine.afterGoingCount(a) + ' going', heat: .9, a, g: ['#2A1A46', '#0B0715'] }));
  S.spots.forEach(sp => items.push({ kind: 'spot', title: sp.name, sub: 'Local spot · by ' + sp.by,
    meta: sp.tokens + ' tokens', heat: .4, sp, g: ['#3A2E0E', '#141005'] }));
  S.people.filter(p => p.id !== Engine.getActivePersonaId() && p.status === 'green' && (p.mutual)).forEach(p =>
    items.push({ kind: 'person', title: p.name + ', ' + p.age, sub: p.mutual + ' mutual' + (p.mutual > 1 ? 's' : '') + ' · out tonight',
      meta: 'Green', heat: .7, p, g: ['#0E3D2E', '#0A1A24'] }));
  // shuffle deterministically for a good demo order
  return items.sort((a, b) => (b.heat + (b.kind === 'after' ? .3 : 0)) - (a.heat + (a.kind === 'after' ? .3 : 0)));
}

function buildBrowse() {
  const scr = h('div', { class: 'screen', 'data-id': 'browse' });
  const head = h('div', { style: { padding: 'calc(env(safe-area-inset-top) + 14px) 16px 10px', flex: 'none' } }, [
    h('div', { class: 'between' }, [
      h('div', {}, [
        h('h1', { class: 'd2', text: 'Browse' }),
        h('div', { class: 'small', style: { marginTop: '3px' }, text: 'Anything that is on. Swipe.' }),
      ]),
      h('div', { class: 'iconbtn', html: I.sliders, onclick: filterSheet }),
    ]),
  ]);
  const deck = h('div', { class: 'deck', style: { position: 'relative', flex: '1' } });
  scr.appendChild(head); scr.appendChild(deck);
  scr.appendChild(h('div', { style: { flex: 'none', display: 'flex', justifyContent: 'center',
    gap: '22px', padding: '4px 0 calc(78px + env(safe-area-inset-bottom))' } }, [
    circleBtn(I.close, 'var(--red)', () => swipeTop(-1)),
    circleBtn(I.check, 'var(--em)', () => swipeTop(1)),
  ]));

  let items = [], top = null;
  function circleBtn(ic, col, fn) {
    return h('div', { style: { width: '62px', height: '62px', borderRadius: '50%', display: 'grid',
      placeItems: 'center', cursor: 'pointer', color: col, background: 'var(--surface)',
      boxShadow: 'inset 0 0 0 1.5px ' + col + '55, 0 10px 24px -10px rgba(0,0,0,.9)',
      transition: 'transform .18s cubic-bezier(.22,1.2,.36,1)' },
      onpointerdown: e => e.currentTarget.style.transform = 'scale(.88)',
      onpointerup: e => e.currentTarget.style.transform = 'scale(1)',
      onclick: fn, html: ic.replace('width="24"', '') });
  }

  function render() {
    deck.innerHTML = '';
    const show = items.slice(0, 3).reverse();
    show.forEach((it, i) => {
      const depth = show.length - 1 - i;
      const c = card(it);
      c.style.transform = `translateY(${depth * -9}px) scale(${1 - depth * .045})`;
      c.style.zIndex = String(10 - depth);
      c.style.opacity = depth > 1 ? '.5' : '1';
      deck.appendChild(c);
      if (depth === 0) { top = c; bind(c, it); }
    });
    if (!items.length) deck.appendChild(h('div', { class: 'center small', text: 'That is everything on tonight.' }));
  }

  function card(it) {
    const c = h('div', { class: 'swipecard' });
    c.appendChild(h('div', { style: { position: 'absolute', inset: '0',
      background: `linear-gradient(165deg, ${it.g[0]}, ${it.g[1]})` } }));
    c.appendChild(h('div', { style: { position: 'absolute', inset: '0',
      background: `radial-gradient(90% 55% at 30% 8%, rgba(18,224,138,${.1 + it.heat * .34}), transparent 62%)` } }));
    c.appendChild(h('div', { style: { position: 'absolute', inset: '0',
      background: 'linear-gradient(0deg, rgba(0,0,0,.82) 0%, transparent 52%)' } }));
    // middle: give every card something real to look at
    const mid = h('div', { style: { position: 'absolute', top: '15%', left: '0', right: '0',
      display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '14px' } });
    if (it.kind === 'person') {
      mid.appendChild(av(it.p, 'lg'));
      mid.appendChild(h('div', { style: { display: 'flex', gap: '7px' } },
        ['Out now', it.p.mutual + ' mutual' + (it.p.mutual > 1 ? 's' : '')]
          .map(t => h('div', { class: 'chip', style: { background: 'rgba(0,0,0,.35)' }, text: t }))));
    } else if (it.kind === 'after') {
      mid.appendChild(av({ initial: it.a.host[0], status: 'disco' }, 'lg'));
      mid.appendChild(h('div', { style: { textAlign: 'center', maxWidth: '78%', fontSize: '13.5px',
        lineHeight: '1.45', color: 'rgba(255,255,255,.86)' }, text: '“' + it.a.note + '”' }));
      mid.appendChild(h('div', { class: 'chip', style: { background: 'rgba(0,0,0,.35)' },
        text: it.a.mutual + ' mutuals · address on accept' }));
    } else if (it.kind === 'table') {
      mid.appendChild(h('div', { style: { width: '84px', height: '84px', borderRadius: '22px',
        display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.32)',
        boxShadow: 'inset 0 0 0 1px rgba(255,255,255,.16)', color: 'var(--em-hi)' },
        html: I.qr.replace('viewBox', 'width="40" height="40" viewBox') }));
      mid.appendChild(h('div', { style: { display: 'flex', gap: '7px' } },
        [Engine.tableSpotsLeft(it.t) + ' of ' + it.t.seats + ' left', it.t.host]
          .map(t => h('div', { class: 'chip', style: { background: 'rgba(0,0,0,.35)' }, text: t }))));
    } else if (it.kind === 'spot') {
      mid.appendChild(h('div', { style: { width: '84px', height: '84px', borderRadius: '50%',
        display: 'grid', placeItems: 'center', background: 'rgba(0,0,0,.3)',
        boxShadow: 'inset 0 0 0 1px rgba(245,197,66,.4)', color: 'var(--gold)' },
        html: I.token.replace('viewBox', 'width="38" height="38" viewBox') }));
      mid.appendChild(h('div', { style: { textAlign: 'center', maxWidth: '78%', fontSize: '13.5px',
        lineHeight: '1.45', color: 'rgba(255,255,255,.86)' }, text: '“' + it.sp.note + '”' }));
    } else if (it.v) {
      const stn = storiesFor(it.v.id).length;
      mid.appendChild(h('div', { style: { textAlign: 'center', maxWidth: '80%', fontSize: '14px',
        lineHeight: '1.45', color: 'rgba(255,255,255,.88)' }, text: it.v.blurb }));
      mid.appendChild(h('div', { style: { width: '62%' } }, [
        h('div', { class: 'lab', style: { marginBottom: '7px', textAlign: 'center' }, text: 'How busy' }),
        h('div', { style: { height: '5px', borderRadius: '3px', background: 'rgba(255,255,255,.14)' } }, [
          h('div', { style: { width: (it.v.heat * 100) + '%', height: '100%', borderRadius: '3px',
            background: 'linear-gradient(90deg,var(--em-lo),var(--em-hi))' } }),
        ]),
      ]));
      if (stn) mid.appendChild(h('div', { class: 'chip', style: { background: 'rgba(0,0,0,.35)' },
        text: stn + ' live from inside' }));
    }
    c.appendChild(mid);
    const kindLabel = { dinner: 'Dinner', bar: 'Bar', club: 'Club', table: 'Table',
                        after: 'After-party', spot: 'Local spot', person: 'Out tonight' }[it.kind];
    c.appendChild(h('div', { style: { position: 'absolute', top: '16px', left: '16px' } }, [
      h('div', { class: 'chip on', text: kindLabel }),
    ]));
    c.appendChild(h('div', { style: { position: 'absolute', left: '18px', right: '18px', bottom: '20px' } }, [
      h('div', { class: 'd1', style: { fontSize: '30px' }, text: it.title }),
      h('div', { class: 'small', style: { color: 'rgba(255,255,255,.82)', marginTop: '6px' }, text: it.sub }),
      h('div', { style: { display: 'flex', gap: '8px', marginTop: '12px' } }, [
        h('div', { class: 'chip', style: { background: 'rgba(0,0,0,.4)' }, text: it.meta }),
      ]),
    ]));
    c.appendChild(h('div', { class: 'stamp yes', text: 'Func' }));
    c.appendChild(h('div', { class: 'stamp no', text: 'Nah' }));
    return c;
  }

  function bind(c, it) {
    let sx = 0, sy = 0, dx = 0, dy = 0, down = false;
    const yes = c.querySelector('.stamp.yes'), no = c.querySelector('.stamp.no');
    c.addEventListener('pointerdown', e => { down = true; sx = e.clientX; sy = e.clientY;
      c.setPointerCapture(e.pointerId); c.style.transition = 'none'; });
    c.addEventListener('pointermove', e => {
      if (!down) return;
      dx = e.clientX - sx; dy = e.clientY - sy;
      c.style.transform = `translate(${dx}px, ${dy}px) rotate(${dx * .055}deg)`;
      yes.style.opacity = clamp(dx / 90, 0, 1);
      no.style.opacity = clamp(-dx / 90, 0, 1);
    });
    const end = () => {
      if (!down) return; down = false;
      c.style.transition = 'transform .42s cubic-bezier(.22,1.2,.36,1), opacity .3s';
      if (Math.abs(dx) > 84) { fling(c, it, dx > 0 ? 1 : -1); }
      else { c.style.transform = 'translate(0,0)'; yes.style.opacity = 0; no.style.opacity = 0; }
      dx = dy = 0;
    };
    c.addEventListener('pointerup', end); c.addEventListener('pointercancel', end);
  }

  function fling(c, it, dir) {
    buzz(dir > 0 ? 12 : 6);
    c.style.transform = `translate(${dir * 620}px, 90px) rotate(${dir * 26}deg)`;
    c.style.opacity = '0';
    setTimeout(() => { items.shift(); render(); if (dir > 0) liked(it); }, 190);
  }
  function swipeTop(dir) { if (top && items.length) fling(top, items[0], dir); }

  function liked(it) {
    if (it.kind === 'table') { requestFlow(it.v, it.t); }
    else if (it.kind === 'after') { after(it.a); }
    else if (it.kind === 'person') {
      Engine.expressInterest(Engine.getActivePersonaId(), it.p.id);
      toast('Let ' + it.p.name + ' know you are interested');
    }
    else if (it.kind === 'spot') {
      Engine.saveItem(Engine.getActivePersonaId(), 'spot', it.sp.id);
      toast('Saved ' + it.title + ' — see it in Plans');
    }
    else {
      Engine.saveItem(Engine.getActivePersonaId(), 'venue', it.v.id);
      toast('Saved ' + it.title + ' — see it in Plans');
    }
  }

  scr._reset = () => { items = browseItems(); render(); };
  return scr;
}

/* ---- After-party: address revealed only on accept ---------------------- */
function after(a) {
  const revealed = Engine.getRequestsForGuest(Engine.getActivePersonaId())
    .some((r) => r.afterId === a.id && r.status === 'accepted');
  const wrap = h('div', { class: 'pad' }, [
    h('div', { class: 'chip on', style: { marginBottom: '12px' } }, [h('span', { text: 'After-party' })]),
    h('h2', { class: 'd2', text: a.host + '’s place' }),
    h('div', { class: 'small', style: { marginTop: '6px' },
      text: a.area + ' · ' + Engine.afterGoingCount(a) + ' of ' + a.capacity + ' going · ' + a.mutual + ' mutuals' }),
    h('div', { style: { display: 'flex', gap: '7px', flexWrap: 'wrap', margin: '14px 0' } },
      a.vibe.map(v => h('div', { class: 'chip', text: v }))),
    h('p', { class: 'body', text: '“' + a.note + '”' }),

    h('div', { class: 'card', style: { padding: '15px', margin: '16px 0' } }, [
      revealed
        ? frag([
            h('div', { class: 'lab', style: { color: 'var(--em-hi)' }, text: 'Address' }),
            h('div', { style: { marginTop: '8px', fontSize: '15px', fontWeight: '650', lineHeight: '1.4' },
              text: a.address }),
          ])
        : frag([
            h('div', { class: 'between' }, [
              h('div', { class: 'lab', text: 'Address' }),
              h('span', { class: 'small', style: { color: 'var(--fg-3)' }, text: 'Hidden' }),
            ]),
            h('div', { style: { marginTop: '10px', filter: 'blur(6px)', opacity: '.55',
              fontSize: '15px', fontWeight: '650', userSelect: 'none' }, text: '1180 Rhode Island St, Apt 4' }),
            h('div', { class: 'small', style: { marginTop: '10px' },
              text: 'You get the address the moment ' + a.host + ' accepts you. Not before.' }),
          ]),
    ]),

    revealed
      ? h('button', { class: 'btn', text: 'Open in maps', onclick: () => { closeSheet();
          Pet.speak('Nine minutes. I will keep the address on your lock screen.', 4200); } })
      : h('button', { class: 'btn', text: 'Ask to come', onclick: () => askAfter(a) }),
  ]);
  openSheet(wrap, { tall: true });
}

function askAfter(a) {
  closeSheet(); buzz(10);
  const r = Engine.sendRequest({ kind: 'after', afterId: a.id, hostId: a.hostId, partySize: 4 });
  if (r && r.ok === false) {
    if (r.reason === 'request_cap') Pet.speak('You have a few requests still out. Go Disco for unlimited, or wait on one to resolve.', 4600);
    else if (r.reason === 'duplicate') Pet.speak('You already asked — sit tight for an answer.', 3800);
  }
}

function showAfterAcceptedOverlay(a) {
  const ov = h('div', { style: { position: 'absolute', inset: '0', zIndex: '82',
    background: 'rgba(6,4,10,.86)', backdropFilter: 'blur(10px)', display: 'grid', placeItems: 'center',
    opacity: '0', transition: 'opacity .3s' } }, [
    h('div', { style: { width: '84%' } }, [
      h('div', { class: 'center', style: { marginBottom: '20px' } }, [
        h('div', { class: 'd1', style: { color: 'var(--em-hi)' }, text: a.host + ' said yes' }),
        h('div', { class: 'small', style: { marginTop: '6px' }, text: 'Here is where it is.' }),
      ]),
      h('div', { class: 'pass', style: { padding: '22px' } }, [
        h('div', { style: { position: 'relative' } }, [
          h('div', { class: 'lab', style: { color: 'var(--em-hi)' }, text: 'Address' }),
          h('div', { style: { marginTop: '10px', fontSize: '17px', fontWeight: '700', lineHeight: '1.4' },
            text: a.address }),
          h('div', { class: 'small', style: { marginTop: '12px' }, text: a.area + ' · 9 min from you' }),
        ]),
      ]),
      h('div', { style: { paddingTop: '18px' } }, [
        h('button', { class: 'btn ghost', text: 'Got it', onclick: () => ov.remove() }),
      ]),
    ]),
  ]);
  $('#phone').appendChild(ov);
  requestAnimationFrame(() => ov.style.opacity = '1');
  ov.addEventListener('click', e => { if (e.target === ov) ov.remove(); });
}

/* ---- Afters mode -------------------------------------------------------- */
function setAfters(on) {
  st.afters = on;
  $('#phone').classList.toggle('afters', on);
  drawMarks(); buzz([10, 40, 16]);
  if (on) {
    toast('Afters mode');
    Pet.speak('Everything still open is on the map. Three after-parties near you.', 5200);
    flyTo(C.YOU.x, C.YOU.y, 1.0, 900);
  }
}

/* ---- Plans -------------------------------------------------------------- */
function buildPlans() {
  const scr = h('div', { class: 'screen', 'data-id': 'plans' });
  const body = h('div', { class: 'scroll' });
  scr.appendChild(h('div', { style: { padding: 'calc(env(safe-area-inset-top) + 14px) 16px 8px', flex: 'none' } }, [
    h('h1', { class: 'd2', text: 'Tonight' }),
    h('div', { class: 'small', style: { marginTop: '3px' }, text: 'What is already happening.' }),
  ]));
  scr.appendChild(body);

  function requestLabel(r) {
    if (r.kind === 'after') { const a = byId(S.afters, r.afterId); return a ? a.host + '’s place · ' + a.area : 'After-party'; }
    const v = byId(S.venues, r.venueId), t = byId(S.tables, r.tableId);
    return (v ? v.name : '') + (t ? ' · ' + t.name : '');
  }

  function pendingRow(r) {
    return h('div', { class: 'card', style: { padding: '13px', display: 'flex', alignItems: 'center', gap: '11px' } }, [
      h('div', { class: 'grow' }, [
        h('div', { style: { fontWeight: '650', fontSize: '14px' }, text: requestLabel(r) }),
        h('div', { class: 'small', text: 'Waiting on ' + hostLabel(r.hostId) }),
      ]),
      h('button', { class: 'btn sm ghost', text: 'Cancel', onclick: () => {
        Engine.cancelRequest(r.id, Engine.getActivePersonaId()); scr._reset();
      } }),
    ]);
  }

  function declinedRow(r) {
    return h('div', { class: 'card', style: { padding: '13px' } }, [
      h('div', { style: { fontWeight: '650', fontSize: '14px' }, text: requestLabel(r) }),
      h('div', { class: 'small', style: { marginTop: '2px' },
        text: hostLabel(r.hostId) + ' said no' + (r.declineReason ? ' — ' + r.declineReason : '') }),
    ]);
  }

  function savedRow(s) {
    const target = s.kind === 'venue' ? byId(S.venues, s.refId) : byId(S.spots, s.refId);
    if (!target) return null;
    const remove = (e) => { e.stopPropagation(); Engine.unsaveItem(Engine.getActivePersonaId(), s.kind, s.refId); scr._reset(); };
    return h('div', { class: 'card', style: { padding: '13px', display: 'flex', alignItems: 'center', gap: '11px' },
      onclick: () => (s.kind === 'venue' ? venue(target) : spot(target)) }, [
      h('div', { class: 'grow' }, [
        h('div', { style: { fontWeight: '650', fontSize: '14px' }, text: target.name }),
        h('div', { class: 'small', text: s.kind === 'venue' ? target.district + ' · ' + target.kind : 'Local spot · by ' + target.by }),
      ]),
      h('button', { class: 'btn sm ghost', text: 'Remove', onclick: remove }),
    ]);
  }

  scr._reset = () => {
    body.innerHTML = '';
    const me = Engine.getActivePersonaId();
    const myRequests = Engine.getRequestsForGuest(me);
    const pending = myRequests.filter((r) => r.status === 'pending');
    const declined = myRequests.filter((r) => r.status === 'declined');
    const passes = Engine.getPassesForGuest(me);
    const threads = Engine.getThreadsForPersona(me);
    const saved = Engine.getSavedItems(me);

    if (!pending.length && !declined.length && !passes.length && !saved.length) {
      body.appendChild(h('div', { class: 'pad center', style: { paddingTop: '70px', opacity: '.85' } }, [
        h('div', { style: { display: 'grid', placeItems: 'center', marginBottom: '14px', color: 'var(--fg-4)' } }, [
          h('span', { html: I.plans, style: { width: '42px', display: 'flex' } })]),
        h('div', { class: 'd3', text: 'Nothing locked in yet' }),
        h('p', { class: 'small', style: { marginTop: '8px', maxWidth: '230px', margin: '8px auto 0' },
          text: 'When someone accepts you, the pass lands here. No rush — nothing expires.' }),
      ]));
      return;
    }

    if (pending.length) body.appendChild(h('div', { class: 'pad', style: { paddingBottom: '4px' } }, [
      h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Waiting' }),
      h('div', { class: 'gap' }, pending.map(pendingRow)),
    ]));

    if (declined.length) body.appendChild(h('div', { class: 'pad', style: { paddingBottom: '4px' } }, [
      h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Declined' }),
      h('div', { class: 'gap' }, declined.map(declinedRow)),
    ]));

    if (passes.length) body.appendChild(h('div', { class: 'pad', style: { paddingBottom: '4px' } },
      passes.map(p => {
        const v = byId(S.venues, p.venueId), t = byId(S.tables, p.tableId);
        return h('div', { style: { marginBottom: '16px' } }, [passCard(v, t, p)]);
      })));

    if (saved.length) body.appendChild(h('div', { class: 'pad', style: { paddingBottom: '4px' } }, [
      h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Saved' }),
      h('div', { class: 'gap' }, saved.map(savedRow).filter(Boolean)),
    ]));

    body.appendChild(h('div', { class: 'pad' }, [
      h('div', { class: 'lab', style: { marginBottom: '10px' }, text: 'Chats' }),
      threads.length
        ? h('div', { class: 'card' }, threads.map(t => threadRow(t)))
        : h('p', { class: 'small', text: 'Nothing yet — a chat opens as soon as you request something.' }),
      h('div', { style: { height: '16px' } }),
      passes.length ? h('button', { class: 'btn ghost', text: 'Rate last night', onclick: rateNight }) : null,
    ]));
  };
  return scr;
}

/* ---- Real chat, scoped to one request's thread — not a general inbox ---- */
function threadRow(t) {
  const me = Engine.getActivePersonaId();
  const otherId = t.participantIds.find(id => id !== me) || t.participantIds[0];
  const msgs = Engine.getMessages(t.id);
  const last = msgs[msgs.length - 1];
  const req = Engine.getRequest(t.requestId);
  const sub = req && req.status === 'accepted' ? 'You’re in' : req && req.status === 'declined' ? 'Declined' : 'Waiting';
  return h('div', { class: 'row', onclick: () => openThread(t) }, [
    h('div', { class: 'av', text: hostLabel(otherId)[0] }),
    h('div', { class: 'grow' }, [
      h('div', { class: 'between' }, [
        h('div', { style: { fontWeight: '700', fontSize: '14.5px' }, text: hostLabel(otherId) }),
        h('span', { class: 'small', text: sub }),
      ]),
      h('div', { class: 'small trunc', style: { marginTop: '2px' }, text: last ? last.body : 'No messages yet' }),
    ]),
  ]);
}

function openThread(t) {
  const me = Engine.getActivePersonaId();
  const otherId = t.participantIds.find(id => id !== me) || t.participantIds[0];
  const listEl = h('div', { style: { display: 'flex', flexDirection: 'column', gap: '8px', padding: '4px 0 16px' } });
  function paint() {
    listEl.innerHTML = '';
    Engine.getMessages(t.id).forEach(m => {
      const mine = m.senderId === me;
      listEl.appendChild(h('div', { style: {
        alignSelf: mine ? 'flex-end' : 'flex-start', maxWidth: '78%', padding: '9px 12px', borderRadius: '14px',
        background: mine ? 'var(--em)' : 'var(--surface)', color: mine ? '#04120C' : 'var(--fg)',
        fontSize: '13.5px', fontWeight: mine ? '650' : '500',
      }, text: m.body }));
    });
  }
  paint();
  const input = h('input', { placeholder: 'Message', style: { flex: '1', background: 'var(--surface)',
    border: 'none', borderRadius: '999px', padding: '11px 14px', color: 'var(--fg)', fontSize: '14px' } });
  const send = () => {
    const body = input.value.trim(); if (!body) return;
    Engine.sendMessage(t.id, me, body);
    input.value = ''; paint();
  };
  input.addEventListener('keydown', e => { if (e.key === 'Enter') send(); });
  openSheet(h('div', { class: 'pad', style: { display: 'flex', flexDirection: 'column', minHeight: '60vh' } }, [
    h('h2', { class: 'd2', text: hostLabel(otherId) }),
    listEl,
    h('div', { style: { display: 'flex', gap: '8px', marginTop: 'auto', paddingTop: '10px' } }, [
      input,
      h('button', { class: 'btn sm', text: 'Send', style: { width: 'auto', padding: '0 16px' }, onclick: send }),
    ]),
  ]), { tall: true });
}

/* ---- Business dashboard — surfaces inside Inbox when acting as a business.
   No sixth tab: the PRD's five-tab structure (Browse/Plans/Map/Inbox/Profile)
   is a committed decision, and Inbox is already the host-facing surface, so
   this extends it rather than adding a new one. Claim a venue (Func's venues
   are pre-mapped real places, not user-fabricated ones), then post real
   table offers against it — this is what makes "business account creates an
   event/table offer" in the PRD's feature list an actual, connected flow
   rather than a screen with nothing behind it. Re-rendered whenever Inbox's
   own scr._reset() runs (the existing 'store:change' subscription in mount()
   already covers that), so no separate repaint plumbing is needed here. --- */
function businessDashboard(biz) {
  const wrap = h('div', { class: 'pad' });
  wrap.appendChild(h('div', { class: 'between', style: { marginBottom: '10px' } }, [
    h('h2', { class: 'd2', text: biz.name }),
    biz.verified
      ? h('span', { html: I.verified, style: { width: '18px', color: 'var(--gold)', display: 'flex' } })
      : h('span', { class: 'small', text: 'Verification pending' }),
  ]));

  if (!biz.venueIds.length) {
    const claimed = new Set();
    (S.businesses || []).forEach(b => b.venueIds.forEach(id => claimed.add(id)));
    const avail = S.venues.filter(v => !claimed.has(v.id));
    wrap.appendChild(h('p', { class: 'body', style: { margin: '4px 0 14px' }, text: 'Claim the venue you run to start posting tables.' }));
    wrap.appendChild(h('div', { class: 'gap' }, avail.map(v => h('div', { class: 'card', style: { padding: '13px', display: 'flex', alignItems: 'center', gap: '11px' } }, [
      h('div', { class: 'grow' }, [
        h('div', { style: { fontWeight: '700', fontSize: '14.5px' }, text: v.name }),
        h('div', { class: 'small', text: v.district + ' · ' + v.kind }),
      ]),
      h('button', { class: 'btn sm', text: 'Claim', onclick: () => {
        const r = Engine.claimVenue(biz.id, v.id);
        if (r && r.ok === false && r.reason === 'already_claimed') toast(v.name + ' is already run by ' + r.by);
      } }),
    ]))));
    return wrap;
  }

  const venueSel = h('select', { style: { background: 'var(--surface-2)', border: 'none', borderRadius: '10px',
    padding: '11px', color: 'var(--fg)', width: '100%', marginBottom: '8px' } },
    biz.venueIds.map(id => { const v = byId(S.venues, id); return h('option', { value: id, text: v ? v.name : id }); }));
  const inputStyle = { background: 'var(--surface-2)', border: 'none', borderRadius: '10px', padding: '11px',
    color: 'var(--fg)', width: '100%', marginBottom: '8px', fontSize: '14px' };
  const nameInput = h('input', Object.assign({ placeholder: 'Table name (e.g. Booth 3)' }, { style: inputStyle }));
  const seatsInput = h('input', Object.assign({ placeholder: 'Seats', type: 'number', min: '1' }, { style: inputStyle }));
  const perHeadInput = h('input', Object.assign({ placeholder: 'Per head ($)', type: 'number', min: '0' }, { style: inputStyle }));
  const vibeInput = h('input', Object.assign({ placeholder: 'Vibe (e.g. House · dress up)' }, { style: inputStyle }));

  wrap.appendChild(h('div', { class: 'card', style: { padding: '14px', marginBottom: '16px' } }, [
    h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Post a table' }),
    venueSel, nameInput, seatsInput, perHeadInput, vibeInput,
    h('button', { class: 'btn sm', text: 'Post', onclick: () => {
      if (!seatsInput.value || +seatsInput.value < 1) return;
      Engine.postTable(biz.id, {
        venueId: venueSel.value, name: nameInput.value.trim() || 'Table',
        seats: +seatsInput.value, perHead: +perHeadInput.value || 0, vibe: vibeInput.value.trim(),
      });
    } }),
  ]));

  const myTables = S.tables.filter(t => t.businessId === biz.id);
  if (myTables.length) {
    wrap.appendChild(h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Your tables tonight' }));
    wrap.appendChild(h('div', { class: 'gap', style: { marginBottom: '16px' } }, myTables.map(t => {
      const v = byId(S.venues, t.venue), left = Engine.tableSpotsLeft(t);
      return h('div', { class: 'card', style: { padding: '12px' } }, [
        h('div', { style: { fontWeight: '700', fontSize: '14px' }, text: t.name + (v ? ' · ' + v.name : '') }),
        h('div', { class: 'small', style: { marginTop: '2px' }, text: left + ' of ' + t.seats + ' left · $' + t.perHead + ' per head' }),
      ]);
    })));
  }
  return wrap;
}

/* ---- Inbox -------------------------------------------------------------- */
function buildInbox() {
  const scr = h('div', { class: 'screen', 'data-id': 'inbox' });
  const body = h('div', { class: 'scroll' });
  scr.appendChild(h('div', { style: { padding: 'calc(env(safe-area-inset-top) + 14px) 16px 8px', flex: 'none' } }, [
    h('h1', { class: 'd2', text: 'Inbox' }),
    h('div', { class: 'small', style: { marginTop: '3px' }, text: 'Anything that needs you.' }),
  ]));
  scr.appendChild(body);

  function requestLabel(r) {
    if (r.kind === 'after') { const a = byId(S.afters, r.afterId); return a ? a.area : 'After-party'; }
    const v = byId(S.venues, r.venueId), t = byId(S.tables, r.tableId);
    return (v ? v.name : '') + (t ? ' · ' + t.name : '');
  }

  function hostRequestRow(r) {
    const guest = byId(S.people, r.guestId);
    return h('div', { class: 'card', style: { padding: '13px' } }, [
      h('div', { style: { fontWeight: '700', fontSize: '14.5px' }, text: requestLabel(r) }),
      h('div', { class: 'small', style: { marginTop: '2px' },
        text: (guest ? guest.name : r.guestId) + ' · ' + r.partySize + ' of them' }),
      h('div', { style: { display: 'flex', gap: '8px', marginTop: '11px' } }, [
        h('button', { class: 'btn sm ghost', text: 'Decline', onclick: () => {
          Engine.declineRequest(r.id, Engine.getActivePersonaId(), 'Not tonight'); scr._reset();
        } }),
        h('button', { class: 'btn sm', text: 'Accept', onclick: () => {
          const res = Engine.acceptRequest(r.id, Engine.getActivePersonaId());
          if (res && res.ok === false && res.reason === 'at_capacity') toast('Full — decline or wait for a spot to free up');
          scr._reset();
        } }),
      ]),
    ]);
  }

  function jumpToVenue(v) {
    go('map');
    setTimeout(() => { flyTo(v.x, v.y - 60, 1.5, 650); setTimeout(() => venue(v), 380); }, 60);
  }

  scr._reset = () => {
    body.innerHTML = '';
    const me = Engine.getActivePersonaId();

    // Acting as a business or an after-party host: this is the accept/decline
    // queue, not the guest inbox below. A business account can now BE the
    // real logged-in identity (not just something reached via the QA persona
    // switcher), so this can't just check "am I acting as someone other than
    // home" — a business who *is* home must still land here, not in the
    // guest inbox below.
    const actingBiz = byId(S.businesses, me);
    if (actingBiz || me !== Engine.getHomePersonaId()) {
      const biz = actingBiz;
      if (biz) body.appendChild(businessDashboard(biz));

      const pending = Engine.getPendingRequestsForHost(me);
      const threads = Engine.getThreadsForPersona(me);
      if (!biz && !pending.length && !threads.length) {
        body.appendChild(h('div', { class: 'pad center', style: { paddingTop: '70px', opacity: '.85' } }, [
          h('div', { class: 'd3', text: 'Nothing needs you yet' }),
        ]));
        return;
      }
      if (pending.length) body.appendChild(h('div', { class: 'pad' }, [
        h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Pending requests' }),
        h('div', { class: 'gap' }, pending.map(hostRequestRow)),
      ]));
      if (threads.length) body.appendChild(h('div', { class: 'pad' }, [
        h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Chats' }),
        h('div', { class: 'card' }, threads.map(t => threadRow(t))),
      ]));
      return;
    }

    const items = [];
    Engine.getPassesForGuest(me).forEach(p => { const v = byId(S.venues, p.venueId), t = byId(S.tables, p.tableId);
      items.push({ t: t.host + ' accepted you', s: v.name + ' · ' + t.name + ' · ' + p.partySize + ' people',
        a: 'Pass ready', hot: true, onclick: () => go('plans') }); });
    Engine.getRequestsForGuest(me).filter(r => r.kind === 'after' && r.status === 'accepted').forEach(r => {
      const a = byId(S.afters, r.afterId);
      items.push({ t: a.host + ' let you in', s: 'After-party · ' + a.area + ' · address unlocked', a: 'Open', hot: true,
        onclick: () => go('plans') });
    });
    // Real, derived — not scripted placeholders: businesses with tables
    // genuinely open right now, and token earnings from spots this persona
    // actually dropped. Omitted entirely rather than shown empty/fake.
    (S.businesses || []).forEach(biz => {
      const openTables = S.tables.filter(t => biz.venueIds.includes(t.venue) && Engine.tableSpotsLeft(t) > 0);
      if (!openTables.length) return;
      const v = byId(S.venues, openTables[0].venue);
      items.push({ t: biz.name + ' has ' + openTables.length + ' table' + (openTables.length > 1 ? 's' : '') + ' open',
        s: v.name + ' · tonight · from $' + Math.min(...openTables.map(t => t.perHead)) + ' a head',
        a: 'See', onclick: () => jumpToVenue(v) });
    });
    const mySpots = S.spots.filter(sp => sp.byId === me);
    if (mySpots.length) {
      const tokens = mySpots.reduce((sum, sp) => sum + sp.tokens, 0);
      items.push({ t: 'Your spot' + (mySpots.length > 1 ? 's' : '') + ' earned tokens', s: mySpots.map(sp => sp.name).join(', ') + ' · ' + tokens + ' tokens total', a: '' });
    }

    if (!items.length) {
      body.appendChild(h('div', { class: 'pad center', style: { paddingTop: '70px', opacity: '.85' } }, [
        h('div', { class: 'd3', text: 'Nothing needs you yet' }),
      ]));
      return;
    }

    body.appendChild(h('div', {}, items.map(it => h('div', { class: 'row' }, [
      h('div', { style: { width: '9px', height: '9px', borderRadius: '50%', flex: 'none',
        background: it.hot ? 'var(--em)' : 'transparent',
        boxShadow: it.hot ? '0 0 8px var(--em)' : 'none' } }),
      h('div', { class: 'grow' }, [
        h('div', { style: { fontWeight: '650', fontSize: '14.5px' }, text: it.t }),
        h('div', { class: 'small trunc', style: { marginTop: '2px' }, text: it.s }),
      ]),
      it.a ? h('button', { class: 'btn sm ghost', text: it.a, onclick: it.onclick || (() => {}) }) : null,
    ]))));
  };
  return scr;
}

// Real capability, not a toast: toggling premium actually flips the
// account's cap-bypass (see engine-real.js's FREE_PENDING_CAP) and unlocks
// a genuine "who's interested" list built from Browse swipes-on-people.
function premiumCard(meId, acc) {
  const received = Engine.getInterestReceived(meId);
  return h('div', { class: 'card', style: { padding: '16px', marginBottom: '16px', position: 'relative', overflow: 'hidden' } }, [
    h('div', { style: { position: 'absolute', inset: '0', opacity: '.16',
      background: 'conic-gradient(#C8A2FF,#46FFB4,#F5C542,#F55B8A,#C8A2FF)' } }),
    h('div', { style: { position: 'relative' } }, [
      h('div', { class: 'd3', style: { color: 'var(--disco)' }, text: acc.premium ? 'Disco — active' : 'Go Disco' }),
      h('p', { class: 'small', style: { margin: '8px 0 13px' },
        text: 'Be seen more · unlimited requests · see who wants you · early access to tables and afters.' }),
      acc.premium
        ? h('button', { class: 'btn sm ghost', text: 'Cancel Disco', onclick: () => Engine.setPremium(meId, false) })
        : h('button', { class: 'btn sm', style: { background: 'linear-gradient(90deg,#C8A2FF,#46FFB4)' },
            text: 'Try it free', onclick: () => Engine.setPremium(meId, true) }),
      h('div', { style: { marginTop: '14px' } }, [
        acc.premium
          ? (received.length
              ? h('div', { class: 'gap' }, received.map(i => {
                  const p = byId(S.people, i.fromId);
                  return h('div', { style: { display: 'flex', alignItems: 'center', gap: '9px' } }, [
                    av(p || { initial: '?', status: 'green' }, 'sm'),
                    h('div', { class: 'small', text: (p ? p.name : i.fromId) + ' is interested' }),
                  ]);
                }))
              : h('p', { class: 'small', text: 'Nobody has shown interest yet — swipe on people in Browse and it works both ways.' }))
          : (received.length
              ? h('p', { class: 'small', style: { color: 'var(--disco)' },
                  text: received.length + (received.length === 1 ? ' person is' : ' people are') + ' interested — go Disco to see who.' })
              : null),
      ]),
    ]),
  ]);
}

// Real upload via the browser's native file picker + FileReader — no backend
// needed for this to be genuine (as opposed to the fixed gradient tiles this
// replaced, which could never become an actual photo no matter what you did).
// Downscaled to a 480px square JPEG client-side so a phone photo doesn't
// blow past localStorage's quota.
function photoSlot(meId, index, gradient, photo) {
  const fileInput = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
  fileInput.addEventListener('change', () => {
    const file = fileInput.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const size = 480, s = Math.min(img.width, img.height);
        const sx = (img.width - s) / 2, sy = (img.height - s) / 2;
        const canvas = document.createElement('canvas');
        canvas.width = size; canvas.height = size;
        canvas.getContext('2d').drawImage(img, sx, sy, s, s, 0, 0, size, size);
        Engine.uploadPhoto(meId, index, canvas.toDataURL('image/jpeg', 0.82));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
  return h('div', { style: { aspectRatio: '1', borderRadius: '12px', cursor: 'pointer',
      background: photo ? `url(${photo}) center/cover` : `linear-gradient(150deg, ${gradient[0]}, ${gradient[1]})`,
      boxShadow: 'inset 0 0 0 1px var(--hairline-2)' },
    onclick: () => fileInput.click() }, [fileInput]);
}

/* ---- Profile ------------------------------------------------------------ */
function buildMe() {
  const scr = h('div', { class: 'screen', 'data-id': 'me' });
  const body = h('div', { class: 'scroll' });
  scr.appendChild(body);
  scr._reset = () => {
    body.innerHTML = '';
    // Resolved fresh on every repaint — Profile shows whoever is currently
    // active (your own account normally; a QA-switched persona while testing).
    const meId = Engine.getActivePersonaId();
    const me = byId(S.people, meId) || { name: '?', initial: '?', ig: '', bio: '', nights: 0, spots: 0, tokens: 0 };
    const acc = Engine.getAccount(meId);
    const idVerified = acc ? acc.verification.status === 'verified' : !!me.verified;

    body.appendChild(h('div', { style: { position: 'relative', height: '190px',
      background: 'linear-gradient(160deg, var(--em-lo), #04070A)' } }, [
      h('div', { style: { position: 'absolute', inset: '0',
        background: 'radial-gradient(80% 100% at 20% 0%, rgba(18,224,138,.4), transparent 60%)' } }),
      h('div', { style: { position: 'absolute', left: '16px', bottom: '16px', right: '16px' } }, [
        h('div', { style: { display: 'flex', alignItems: 'center', gap: '8px' } }, [
          h('h1', { class: 'd1', text: me.name }),
          idVerified ? h('span', { html: I.verified, style: { width: '19px', color: 'var(--em-hi)', display: 'flex' } }) : null,
        ]),
        h('div', { class: 'small', style: { marginTop: '4px', color: 'rgba(255,255,255,.8)' },
          text: [me.age, 'San Francisco', me.ig].filter(Boolean).join(' · ') }),
      ]),
      h('div', { style: { position: 'absolute', top: 'calc(env(safe-area-inset-top) + 14px)', right: '16px' } }, [
        h('div', { class: 'chip on statuschip', onclick: statusSheet }, [
          h('span', { class: 'tl ' + statusMeta(Engine.getStatus(meId)).dot }),
          h('span', { class: 'statuslabel', text: statusMeta(Engine.getStatus(meId)).label }),
        ]),
      ]),
    ]));
    body.appendChild(h('div', { class: 'pad' }, [
      h('div', { class: 'card', style: { padding: '14px', display: 'flex', alignItems: 'center', gap: '11px' } }, [
        h('span', { html: I.verified, style: { width: '20px', color: idVerified ? 'var(--em)' : 'var(--fg-4)', display: 'flex', flex: 'none' } }),
        h('div', { class: 'grow' }, [
          h('div', { style: { fontWeight: '700', fontSize: '14.5px' }, text: idVerified ? 'ID verified' : 'Not yet verified' }),
          h('div', { class: 'small', style: { marginTop: '2px' },
            text: idVerified ? 'Government ID checked. This is a real person.' : 'This persona has no ID verification on record.' }),
        ]),
      ]),
      me.bio ? h('p', { class: 'body', style: { margin: '16px 0' }, text: me.bio }) : null,

      // photos
      h('div', { class: 'lab', style: { marginBottom: '9px' }, text: 'Photos — tap a slot to upload' }),
      h('div', { style: { display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '7px', marginBottom: '18px' } },
        [['#0E3D2E', '#061118'], ['#123A52', '#06131C'], ['#2A1A46', '#0B0715'],
         ['#3A2E0E', '#141005'], ['#0B3A44', '#04141A'], ['#3A1226', '#140610']]
          .map((g, i) => photoSlot(meId, i, g, me.photos && me.photos[i]))),

      h('div', { style: { display: 'flex', gap: '10px', marginBottom: '18px' } }, [
        statCard('Nights out', String(me.nights || 0), '#fff'),
        statCard('Spots dropped', String(me.spots || 0), '#fff'),
        statCard('Tokens', String(me.tokens || 0), 'var(--gold)'),
      ]),

      acc && acc.role === 'consumer' ? premiumCard(meId, acc) : null,
      h('div', { class: 'card', style: { padding: '13px', display: 'flex', alignItems: 'center', gap: '11px', marginBottom: '12px' } }, [
        h('div', { class: 'grow' }, [
          h('div', { style: { fontWeight: '700', fontSize: '14.5px' }, text: 'Afters mode' }),
          h('div', { class: 'small', style: { marginTop: '2px' },
            text: 'Darker, looser, camera-first. Suggested late — switch anytime.' }),
        ]),
        h('button', { class: 'btn sm' + (st.afters ? '' : ' ghost'), text: st.afters ? 'On' : 'Off',
          onclick: () => { setAfters(!st.afters); scr._reset(); } }),
      ]),
      h('button', { class: 'btn ghost', text: 'Customise ' + st.petName, onclick: () => toast(st.petName + ' has 40 looks. Scripted here.') }),
    ]));
  };
  return scr;
}

/* ---- Rate the night ----------------------------------------------------- */
function rateNight() {
  const me = Engine.getActivePersonaId();
  const passes = Engine.getPassesForGuest(me).slice().sort((a, b) => b.issuedAt - a.issuedAt);
  const venue = passes.length ? byId(S.venues, passes[0].venueId) : null;
  let val = 0;
  const stars = h('div', { style: { display: 'flex', gap: '10px', justifyContent: 'center', margin: '20px 0' } });
  for (let i = 1; i <= 5; i++) {
    const s = h('div', { style: { width: '40px', color: 'var(--fg-4)', cursor: 'pointer',
      transition: 'transform .18s cubic-bezier(.22,1.4,.36,1)' }, html: I.star,
      onclick: () => { val = i; buzz(8);
        Array.from(stars.children).forEach((c, k) => {
          c.style.color = k < i ? 'var(--em-hi)' : 'var(--fg-4)';
          c.style.transform = k < i ? 'scale(1.14)' : 'scale(1)';
        }); } });
    stars.appendChild(s);
  }
  openSheet(h('div', { class: 'pad center' }, [
    h('div', { class: 'lab', text: 'Last night' }),
    h('h2', { class: 'd2', style: { marginTop: '8px' }, text: (venue ? venue.name : 'Your night') + ' — was it worth it?' }),
    h('p', { class: 'small', style: { marginTop: '8px' }, text: 'Nobody reads this. It just makes the map more honest.' }),
    stars,
    h('button', { class: 'btn', text: 'Send it', onclick: () => {
      closeSheet(); buzz(10);
      Engine.rateNight(me, val);
      drawMarks();
      toast('Thanks — the map just got a bit more honest');
    } }),
  ]));
}

/* ---- Globe -------------------------------------------------------------- */
function globe() {
  // "Out" is a real count of people who have opted their status on tonight
  // (anything but red) — not a fabricated number. Only SF has real seed
  // data in this prototype, so it is the only city that gets one; LA is
  // product-live per the PRD but has no map/venue data built yet here, so
  // it says so honestly instead of showing a number that isn't real.
  const sfOut = S.people.filter(p => p.status !== 'red').length;
  const cities = [
    { n: 'San Francisco', x: 150, y: 398, r: 7, live: true, hasData: true, out: sfOut + ' out' },
    { n: 'Los Angeles', x: 163, y: 428, r: 5.5, live: true, hasData: false },
    { n: 'New York', x: 238, y: 392, r: 3, live: false },
    { n: 'London', x: 262, y: 372, r: 3, live: false },
    { n: 'Berlin', x: 282, y: 366, r: 3, live: false },
    { n: 'Mexico City', x: 176, y: 462, r: 3, live: false },
  ];
  const ov = h('div', { style: { position: 'absolute', inset: '0', zIndex: '75', background: '#04070A',
    opacity: '0', transition: 'opacity .4s' } });
  ov.innerHTML = `<svg viewBox="0 0 390 844" width="100%" height="100%" preserveAspectRatio="xMidYMid slice">
    <defs><radialGradient id="gg"><stop offset="60%" stop-color="#12E08A" stop-opacity="0"/><stop offset="100%" stop-color="#12E08A" stop-opacity=".18"/></radialGradient></defs>
    <circle cx="195" cy="420" r="175" fill="url(#gg)"/>
    <circle cx="195" cy="420" r="140" fill="#03150F" stroke="#12E08A" stroke-opacity=".3"/>
    <g stroke="#12E08A" stroke-opacity=".22" fill="none">
      <ellipse cx="195" cy="420" rx="140" ry="47"/><ellipse cx="195" cy="420" rx="140" ry="94"/>
      <ellipse cx="195" cy="420" rx="47" ry="140"/><ellipse cx="195" cy="420" rx="94" ry="140"/>
      <line x1="55" y1="420" x2="335" y2="420"/>
    </g>
  </svg>`;
  const svg = ov.querySelector('svg');
  function tapCity(c) {
    buzz(8);
    if (c.n === 'San Francisco') { closeGlobe(); return; }
    if (c.live) toast(c.n + ' is live, but this prototype only has map data for San Francisco.');
    else toast(c.n + ' is on the waitlist — not live yet.');
  }
  cities.forEach(c => {
    const g = h('g', { style: { cursor: 'pointer' }, onclick: () => tapCity(c) });
    if (c.live) {
      g.appendChild(h('circle', { cx: c.x, cy: c.y, r: c.r * 2.8, fill: '#46FFB4', opacity: .2 }));
      g.appendChild(h('circle', { cx: c.x, cy: c.y, r: c.r, fill: '#46FFB4' }));
      g.appendChild(h('text', { x: c.x, y: c.y - c.r - 9, 'text-anchor': 'middle', fill: '#fff',
        'font-size': 11.5, 'font-weight': 700, 'font-family': 'var(--ui)' }, [document.createTextNode(c.n)]));
      g.appendChild(h('text', { x: c.x, y: c.y - c.r + 3, 'text-anchor': 'middle', fill: '#46FFB4',
        'font-size': 9.5, 'font-family': 'var(--ui)', dy: 0 }, [document.createTextNode(c.hasData ? c.out : 'map coming soon')]));
    } else {
      g.appendChild(h('circle', { cx: c.x, cy: c.y, r: c.r, fill: '#2A6B7E', opacity: .8 }));
      g.appendChild(h('text', { x: c.x, y: c.y - 8, 'text-anchor': 'middle', fill: '#3E6C7A',
        'font-size': 9.5, 'font-family': 'var(--ui)' }, [document.createTextNode(c.n)]));
    }
    svg.appendChild(g);
  });
  ov.appendChild(h('div', { style: { position: 'absolute', left: '0', right: '0',
    top: 'calc(env(safe-area-inset-top) + 20px)', textAlign: 'center' } }, [
    h('div', { class: 'd2', text: 'Func is live in ' + cities.filter(c => c.live).length + ' cities' }),
    h('div', { class: 'small', style: { marginTop: '6px' },
      text: cities.filter(c => !c.live).length + ' more with waitlists open' }),
  ]));
  function closeGlobe() {
    ov.style.opacity = '0'; setTimeout(() => ov.remove(), 400);
    st.cam.z = 1.0; flyTo(C.YOU.x, C.YOU.y - 60, 1.2, 900);
  }
  ov.appendChild(h('div', { style: { position: 'absolute', left: '16px', right: '16px', bottom: '96px' } }, [
    h('button', { class: 'btn', text: 'Back to San Francisco', onclick: closeGlobe }),
  ]));
  $('#phone').appendChild(ov);
  requestAnimationFrame(() => ov.style.opacity = '1');
}

/* ---- Auth: signup -> 18+ ID verification -> profile -> onboarding ------- */
// Real mode only (app.js gates this on Engine.mode === 'real'). Demo mode's
// single account is pre-verified, so it never reaches this flow. Resumes
// from wherever an existing session's account actually is, so a reload
// mid-signup doesn't restart the whole thing.
function resumeAuthStep(acc) {
  if (!acc) return 'welcome';
  if (acc.verification.status === 'rejected') return 'blocked';
  if (acc.verification.status === 'verified') {
    if (!acc.profileComplete) return 'profile';
    if (!acc.onboardingComplete) return 'tips';
    return 'done';
  }
  return acc.verification.status === 'pending' ? 'verifying' : 'verify-intro';
}

function authFlow(phone, onDone) {
  const wrap = h('div', { style: { position: 'absolute', inset: '0', zIndex: '95', background: '#04070A',
    display: 'flex', flexDirection: 'column', padding: 'calc(env(safe-area-inset-top) + 22px) 22px calc(env(safe-area-inset-bottom) + 22px)',
    overflowY: 'auto' } });
  phone.appendChild(wrap);

  const existingId = Engine.getSessionPersonId();
  const existingAcc = existingId ? Engine.getAccount(existingId) : null;
  const state = {
    step: existingId ? resumeAuthStep(existingAcc) : 'welcome',
    role: existingAcc ? existingAcc.role : 'consumer',
    actorId: existingId || null,
    error: null,
  };

  function input(attrs) {
    return h('input', Object.assign({
      style: { background: 'var(--surface-2)', border: 'none', borderRadius: '12px', padding: '13px 14px',
        color: 'var(--fg)', fontSize: '15px', width: '100%' },
    }, attrs));
  }
  function labeled(label, node) {
    return h('div', { style: { marginBottom: '14px' } }, [
      h('div', { class: 'lab', style: { marginBottom: '7px' }, text: label }), node]);
  }

  function render() {
    wrap.innerHTML = '';
    wrap.appendChild(screenFor[state.step]());
  }

  const screenFor = {
    welcome: () => h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center', gap: '28px' } }, [
      h('div', {}, [
        h('h1', { class: 'd1', text: 'Func.' }),
        h('p', { class: 'body', style: { marginTop: '10px' }, text: 'The bridge between you and what is on tonight. San Francisco.' }),
      ]),
      h('div', { class: 'gap' }, [
        h('button', { class: 'btn', text: 'I am here to go out', onclick: () => { state.role = 'consumer'; state.step = 'basics'; render(); } }),
        h('button', { class: 'btn ghost', text: 'I run a venue or promote nights', onclick: () => { state.role = 'business'; state.step = 'basics'; render(); } }),
      ]),
    ]),

    basics: () => {
      const isBiz = state.role === 'business';
      const name = input({ placeholder: isBiz ? 'Business name' : 'Your name' });
      const dob = input({ type: 'date' });
      const email = input({ type: 'email', placeholder: 'Email' });
      return h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center' } }, [
        h('h2', { class: 'd2', text: isBiz ? 'Your business' : 'The basics' }),
        h('p', { class: 'body', style: { margin: '8px 0 22px' },
          text: isBiz ? 'Who is posting tables and events.' : 'Func is 18+, ID-verified. No commitment beyond that.' }),
        labeled(isBiz ? 'Business name' : 'Name', name),
        isBiz ? null : labeled('Date of birth', dob),
        labeled('Email', email),
        state.error ? h('p', { class: 'small', style: { color: 'var(--red)', marginBottom: '10px' }, text: state.error }) : null,
        h('button', { class: 'btn', text: 'Continue', onclick: () => {
          if (!name.value.trim()) { state.error = 'Add a name.'; render(); return; }
          if (!isBiz && !dob.value) { state.error = 'Add your date of birth.'; render(); return; }
          const { personId } = Engine.createAccount({
            role: state.role, name: name.value.trim(), dob: isBiz ? null : dob.value, email: email.value.trim() || null,
          });
          state.actorId = personId; state.error = null; state.step = 'verify-intro'; render();
        } }),
      ]);
    },

    'verify-intro': () => h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center' } }, [
      h('h2', { class: 'd2', text: state.role === 'business' ? 'Verify your business' : 'Verify you are 18+' }),
      h('p', { class: 'body', style: { margin: '10px 0 22px' },
        text: state.role === 'business'
          ? 'A quick check so guests know a real business is on the other end of every accept.'
          : 'Government ID, checked once. This is what makes every profile on Func a real person.' }),
      h('button', { class: 'btn', text: 'Upload ID', onclick: () => {
        Engine.submitVerification(state.actorId, 'id_upload');
        state.step = 'verifying'; render();
      } }),
    ]),

    verifying: () => {
      const node = h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center' }, class: 'center' }, [
        h('h2', { class: 'd2', text: 'Checking…' }),
        h('p', { class: 'body', style: { marginTop: '10px' }, text: 'Usually just a few seconds.' }),
      ]);
      const onResolved = ({ actorId, status }) => {
        if (actorId !== state.actorId) return;
        Engine.off('verification:resolved', onResolved);
        state.step = status === 'verified' ? 'profile' : 'blocked';
        render();
      };
      Engine.on('verification:resolved', onResolved);
      return node;
    },

    blocked: () => h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center' } }, [
      h('h2', { class: 'd2', text: 'Func is 18+' }),
      h('p', { class: 'body', style: { margin: '10px 0 22px' }, text: 'Your ID did not clear the age check, so this account cannot use Func.' }),
      h('button', { class: 'btn ghost', text: 'Start over', onclick: () => {
        Engine.logout(); state.actorId = null; state.role = 'consumer'; state.step = 'welcome'; render();
      } }),
    ]),

    profile: () => {
      const isBiz = state.role === 'business';
      const bio = h('textarea', { placeholder: isBiz ? 'What you run, in a line.' : 'A line about you.',
        style: { background: 'var(--surface-2)', border: 'none', borderRadius: '12px', padding: '13px 14px',
          color: 'var(--fg)', fontSize: '15px', width: '100%', minHeight: '80px', fontFamily: 'var(--ui)', resize: 'vertical' } });
      const ig = input({ placeholder: '@instagram (optional)' });
      return h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center' } }, [
        h('h2', { class: 'd2', text: 'Your profile' }),
        h('p', { class: 'body', style: { margin: '8px 0 22px' }, text: 'Keep it simple. This is what people see.' }),
        labeled('Bio', bio),
        isBiz ? null : labeled('Instagram', ig),
        h('button', { class: 'btn', text: 'Continue', onclick: () => {
          Engine.completeProfile(state.actorId, { bio: bio.value.trim(), ig: ig.value.trim() });
          state.step = 'tips'; render();
        } }),
      ]);
    },

    tips: () => h('div', { style: { display: 'flex', flexDirection: 'column', flex: '1', justifyContent: 'center' } }, [
      h('h2', { class: 'd2', text: 'Three things' }),
      h('div', { class: 'gap', style: { margin: '18px 0 26px' } }, [
        'Nothing rushes you — no timers, no schedule.',
        'You only show up on the map if you turn it on tonight.',
        '"Out with 4" is just a number on a request. Nothing to set up.',
      ].map(t => h('p', { class: 'body', text: t }))),
      h('button', { class: 'btn', text: 'Enter Func', onclick: () => {
        Engine.completeOnboarding(state.actorId);
        wrap.remove();
        onDone();
      } }),
    ]),

    done: () => { wrap.remove(); onDone(); return h('div', {}); },
  };

  render();
}

/* ---- Badge bump --------------------------------------------------------- */
function bump(tab) {
  const t = $('#tab-' + tab); if (!t) return;
  let b = t.querySelector('.badge');
  if (!b) { b = h('div', { class: 'badge', text: '1' }); t.appendChild(b); }
  else b.textContent = String(+b.textContent + 1);
  b.animate([{ transform: 'scale(.4)' }, { transform: 'scale(1.25)' }, { transform: 'scale(1)' }],
    { duration: 420, easing: 'cubic-bezier(.22,1.4,.36,1)' });
}

/* ---- Mount -------------------------------------------------------------- */
const screensList = {};
function mount(phone) {
  scrim = h('div', { class: 'scrim', onclick: closeSheet });
  sheetBody = h('div', { class: 'scroll' });
  sheet = h('div', { class: 'sheet' }, [h('div', { class: 'grab' }), sheetBody]);

  screensList.browse = buildBrowse();
  screensList.plans = buildPlans();
  screensList.inbox = buildInbox();
  screensList.me = buildMe();
  Object.values(screensList).forEach(s => phone.appendChild(s));
  phone.appendChild(scrim); phone.appendChild(sheet);

  // Registered once, globally — these fire regardless of which screen is
  // open, same as the full-screen celebratory overlay always has.
  Engine.on('request:sent', handleRequestSent);
  Engine.on('request:accepted', handleRequestAccepted);
  Engine.on('request:declined', handleRequestDeclined);
  Engine.on('status:changed', paintStatusChips);
  Engine.on('store:change', () => {
    paintStatusChips();
    // Keep whichever tab-screen is currently visible honest about live
    // (possibly cross-tab) state, without forcing a reload.
    if (st.screen !== 'map' && screensList[st.screen]) screensList[st.screen]._reset();
  });
  paintStatusChips();
}

const onShow = {
  browse: () => screensList.browse._reset(),
  plans: () => screensList.plans._reset(),
  inbox: () => screensList.inbox._reset(),
  me: () => screensList.me._reset(),
};

return { mount, mapUI, onShow, venue, spot, after, globe, reel, setAfters, toast, openSheet, closeSheet, authFlow };
};
