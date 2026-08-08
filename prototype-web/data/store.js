/* ==========================================================================
   Func. — data/store.js
   Persisted world state for real (interactive) mode: request/pass/thread/
   message state, and a status/heat overlay on top of the static SEED data.
   localStorage for the shared world (so a second tab sees it via the
   `storage` event), sessionStorage for which persona this tab is acting as.
   ========================================================================== */
window.STORE = (function () {
  'use strict';

  const KEY = 'func:v1';
  // Bumped whenever root's shape gains fields older saves won't have —
  // an old save passing the version check but missing a field throws on
  // first read (e.g. Object.keys(undefined)), so this must move every time
  // freshRoot()'s shape changes, not just when values change.
  const VERSION = 4;
  const PERSONA_KEY = 'func:persona';
  const NIGHT_MS = 8 * 60 * 60 * 1000; // how long a non-red status holds before it quietly expires

  const S = window.SEED;
  const now = () => Date.now();
  const uid = (prefix) => prefix + '_' + Math.random().toString(36).slice(2, 9);
  const byIdLocal = (arr, id) => (arr || []).find((o) => o.id === id);
  const AGE_MS = 365.25 * 24 * 60 * 60 * 1000;
  const ageFromDob = (dob) => { const t = Date.parse(dob); return isNaN(t) ? null : Math.floor((now() - t) / AGE_MS); };

  let root = null;
  let applyingRemote = false;
  const listeners = {};

  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn); }
  function emit(evt, payload) { (listeners[evt] || []).slice().forEach((fn) => fn(payload)); }

  function freshRoot() {
    const peopleStatus = {};
    S.people.forEach((p) => {
      peopleStatus[p.id] = {
        status: p.status,
        statusSetAt: now(),
        statusExpiresAt: p.status === 'red' ? null : now() + NIGHT_MS,
      };
    });
    return {
      version: VERSION,
      peopleStatus,
      venueHeat: {},
      requests: [],
      passes: [],
      threads: [],
      messages: [],
      idVerifications: [],
      // ---- accounts: real signup/verification/onboarding, keyed by actor id
      // (a person id or a business id — both are already used interchangeably
      // as "who is acting" throughout requests/hosts, so accounts follow suit).
      accounts: {},
      session: { personId: null },
      newPeople: [],
      newBusinesses: [],
      newStories: [],
      newTables: [],
      newSpots: [],
      visits: [],
      checkins: [],
      interest: [],
      saved: [],
    };
  }

  function load() {
    let raw = null;
    try { raw = localStorage.getItem(KEY); } catch (e) { /* private mode etc — fall through to fresh */ }
    if (raw) {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && parsed.version === VERSION) return parsed;
      } catch (e) { /* corrupt — fall through to fresh */ }
    }
    return freshRoot();
  }

  function persist() {
    if (applyingRemote) return; // never write back data we just received from another tab
    try { localStorage.setItem(KEY, JSON.stringify(root)); } catch (e) {}
  }

  // Overlay the persisted status/heat onto the live SEED-derived objects, so
  // every existing S.people / S.venues reference in app.js and screens.js
  // sees the current value without those files needing to know Store exists.
  // Also hydrates anything created at runtime (new accounts, businesses,
  // stories) into the same S.* arrays every other screen already reads from
  // — so a signed-up person or a posted story is a real S.people/S.stories
  // entry, not a parallel shadow list screens.js has to know about.
  function applyOverlay() {
    (root.newPeople || []).forEach((p) => { if (!byIdLocal(S.people, p.id)) S.people.push(p); });
    (root.newBusinesses || []).forEach((b) => { if (!byIdLocal(S.businesses, b.id)) S.businesses.push(b); });
    (root.newStories || []).forEach((st) => { if (!byIdLocal(S.stories, st.id)) S.stories.push(st); });
    (root.newTables || []).forEach((t) => { if (!byIdLocal(S.tables, t.id)) S.tables.push(t); });
    (root.newSpots || []).forEach((sp) => { if (!byIdLocal(S.spots, sp.id)) S.spots.push(sp); });
    S.people.forEach((p) => {
      const o = root.peopleStatus[p.id];
      if (o) p.status = o.status;
    });
    S.venues.forEach((v) => {
      if (root.venueHeat[v.id] != null) v.heat = root.venueHeat[v.id];
    });
    // stories age in real minutes once posted (mins is otherwise a static
    // seed field — only entries with a real postedAt tick forward here).
    const t = now();
    (root.newStories || []).forEach((st) => {
      const live = byIdLocal(S.stories, st.id);
      if (live && st.postedAt) live.mins = Math.max(0, Math.round((t - st.postedAt) / 60000));
    });
  }

  // Stories expire — without this they'd fade dimmer on the story ring
  // forever but never actually leave the map, which isn't how "story" has
  // ever worked in any product that uses the word. Only applies to
  // real, dynamically-posted stories (a postedAt timestamp) — the static
  // seed stories have no real post time to expire against.
  const STORY_EXPIRY_MS = 6 * 60 * 60 * 1000;
  function expireOldStories() {
    const t = now();
    const stale = root.newStories.filter((st) => st.postedAt && t - st.postedAt > STORY_EXPIRY_MS);
    if (!stale.length) return;
    const staleIds = new Set(stale.map((st) => st.id));
    root.newStories = root.newStories.filter((st) => !staleIds.has(st.id));
    S.stories = S.stories.filter((st) => !staleIds.has(st.id));
    persist(); emit('change', {});
  }

  function expireStaleStatuses() {
    let changed = false;
    const t = now();
    Object.keys(root.peopleStatus).forEach((id) => {
      const o = root.peopleStatus[id];
      if (o.statusExpiresAt && t > o.statusExpiresAt && o.status !== 'red') {
        o.status = 'red';
        o.statusExpiresAt = null;
        changed = true;
      }
    });
    if (changed) { applyOverlay(); persist(); emit('change', {}); }
  }

  function tick() {
    expireStaleStatuses();
    expireOldStories();
    applyOverlay(); // re-ages newStories' `mins` even when nothing else changed
    emit('tick', {});
  }

  function init() {
    if (root) return; // idempotent — safe to call from more than one place
    root = load();
    applyOverlay();
    expireStaleStatuses();
    expireOldStories();
    rearmPendingVerifications();
    setInterval(tick, 60000);
    window.addEventListener('storage', (e) => {
      if (e.key !== KEY || !e.newValue) return;
      applyingRemote = true;
      try {
        const parsed = JSON.parse(e.newValue);
        if (parsed && parsed.version === VERSION) { root = parsed; applyOverlay(); }
      } catch (err) {}
      applyingRemote = false;
      emit('change', {});
    });
  }

  function resetDemoData() {
    root = freshRoot();
    applyOverlay();
    persist();
    emit('change', {});
  }

  // ---- persona (tab-scoped, so two tabs can act as two different people) --
  // Two distinct ideas share this: `home` is who is actually logged into
  // this device (a real signed-up account, or the seed 'you' demo persona
  // if none has signed up); `active` additionally honours the QA persona
  // switcher's per-tab override, so "act as Kit" can test the host side
  // without touching who is really logged in.
  function getHomePersonaId() { return (root && root.session.personId) || 'you'; }
  function getActivePersonaId() {
    try { const o = sessionStorage.getItem(PERSONA_KEY); if (o) return o; } catch (e) {}
    return getHomePersonaId();
  }
  function setActivePersona(id) {
    try { sessionStorage.setItem(PERSONA_KEY, id); } catch (e) {}
    emit('persona', id);
  }

  // ---- static entity lookups (S.* is already hydrated from SEED) ---------
  function getPerson(id) { return S.people.find((p) => p.id === id) || null; }
  function getBusiness(id) { return (S.businesses || []).find((b) => b.id === id) || null; }
  function getVenue(id) { return S.venues.find((v) => v.id === id) || null; }
  function getTable(id) { return S.tables.find((t) => t.id === id) || null; }
  function getAfter(id) { return S.afters.find((a) => a.id === id) || null; }
  function listPeople() { return S.people; }
  function listBusinesses() { return S.businesses || []; }

  // ---- status (opt-in, per night, self-expiring) --------------------------
  function setStatus(personId, status) {
    root.peopleStatus[personId] = {
      status,
      statusSetAt: now(),
      statusExpiresAt: status === 'red' ? null : now() + NIGHT_MS,
    };
    applyOverlay(); persist(); emit('change', {});
  }
  function getStatus(personId) {
    const o = root.peopleStatus[personId];
    if (o) return o.status;
    const p = getPerson(personId);
    return p ? p.status : 'red';
  }

  // ---- heat (mutated only by rateNight) -----------------------------------
  function setVenueHeat(venueId, heat) {
    root.venueHeat[venueId] = heat;
    applyOverlay(); persist(); emit('change', {});
  }

  // ---- requests -------------------------------------------------------------
  function addRequest(r) { root.requests.push(r); persist(); emit('change', {}); return r; }
  function updateRequest(id, patch) {
    const r = root.requests.find((x) => x.id === id);
    if (!r) return null;
    Object.assign(r, patch); persist(); emit('change', {}); return r;
  }
  function getRequest(id) { return root.requests.find((r) => r.id === id) || null; }
  function listRequests() { return root.requests; }

  // ---- passes ---------------------------------------------------------------
  function addPass(p) { root.passes.push(p); persist(); emit('change', {}); return p; }
  function listPasses() { return root.passes; }

  // ---- threads + messages ----------------------------------------------------
  function addThread(t) { root.threads.push(t); persist(); emit('change', {}); return t; }
  function updateThread(id, patch) {
    const t = root.threads.find((x) => x.id === id);
    if (!t) return null;
    Object.assign(t, patch); persist(); emit('change', {}); return t;
  }
  function getThread(id) { return root.threads.find((t) => t.id === id) || null; }
  function getThreadForRequest(requestId) { return root.threads.find((t) => t.requestId === requestId) || null; }
  function listThreads() { return root.threads; }

  function addMessage(m) {
    root.messages.push(m);
    const t = root.threads.find((x) => x.id === m.threadId);
    if (t) t.lastMessageAt = m.sentAt;
    persist(); emit('change', {});
    return m;
  }
  function listMessagesForThread(threadId) { return root.messages.filter((m) => m.threadId === threadId); }

  // ---- accounts: signup, 18+ ID verification, profile, onboarding --------
  // Verification is a simulated external service (no real ID check exists),
  // but the state machine is real: unverified -> pending -> verified/rejected,
  // and rejection is enforced (under-18 stays rejected, gates map entry).
  const VERIFY_DELAY_MS = 2200;

  // A business account IS its actor (seed.js's own rule: "a business is a
  // single actor, exactly like a person, never a roster of users") — it gets
  // no separate owner-person record. Requests/hosts/Inbox already key host
  // identity off businessId; giving business signups a *different* id from
  // their person record would make every accept/decline queue come up empty.
  function createAccount({ role, name, dob, email, phone }) {
    const isBiz = role === 'business';
    const id = uid(isBiz ? 'biz' : 'u');
    const initial = (name || (isBiz ? 'B' : 'Y')).trim()[0].toUpperCase();

    if (isBiz) {
      root.newBusinesses.push({
        id, name: name || 'New business', kind: 'promoter', venueIds: [],
        verified: false, tier: 'standard', bio: '', avatarInitial: initial,
      });
    } else {
      root.newPeople.push({
        id, name: name || 'You', initial, status: 'red', age: ageFromDob(dob),
        verified: false, bio: '', ig: '', tokens: 0, spots: 0, nights: 0,
      });
      root.peopleStatus[id] = { status: 'red', statusSetAt: now(), statusExpiresAt: null };
    }

    root.accounts[id] = {
      role: isBiz ? 'business' : 'consumer', businessId: isBiz ? id : null,
      email: email || null, phone: phone || null, dob: isBiz ? null : (dob || null),
      verification: { status: 'unverified', method: null, submittedAt: null, verifiedAt: null },
      profileComplete: false, onboardingComplete: false, premium: false,
      createdAt: now(),
    };
    root.session.personId = id;
    applyOverlay(); persist(); emit('change', {});
    return { personId: id, businessId: isBiz ? id : null };
  }

  function getAccount(actorId) { return root.accounts[actorId] || null; }
  function getSessionPersonId() { return root.session.personId; }
  function logout() { root.session.personId = null; persist(); emit('change', {}); }

  function resolveVerification(actorId) {
    const cur = root.accounts[actorId]; if (!cur || cur.verification.status !== 'pending') return;
    const age = cur.dob ? ageFromDob(cur.dob) : null;
    const ageOk = cur.role === 'business' || age == null || age >= 18;
    cur.verification.status = ageOk ? 'verified' : 'rejected';
    cur.verification.verifiedAt = now();
    if (ageOk) {
      const p = byIdLocal(S.people, actorId); if (p) p.verified = true;
      const biz = byIdLocal(S.businesses, actorId); if (biz) biz.verified = true;
    }
    persist(); emit('change', {}); emit('verification:resolved', { actorId, status: cur.verification.status });
  }

  function submitVerification(actorId, method) {
    const acc = root.accounts[actorId]; if (!acc) return;
    acc.verification = { status: 'pending', method: method || 'id_upload', submittedAt: now(), verifiedAt: null };
    persist(); emit('change', {});
    setTimeout(() => resolveVerification(actorId), VERIFY_DELAY_MS);
  }

  // A page reload mid-"pending" would otherwise lose the in-memory timer
  // above and leave the account stuck — re-arm (or resolve immediately if
  // the delay has already elapsed) for anything still pending at boot.
  function rearmPendingVerifications() {
    Object.keys(root.accounts).forEach((id) => {
      const acc = root.accounts[id];
      if (acc.verification.status !== 'pending') return;
      const remaining = Math.max(0, VERIFY_DELAY_MS - (now() - acc.verification.submittedAt));
      setTimeout(() => resolveVerification(id), remaining);
    });
  }

  function completeProfile(actorId, fields) {
    const acc = root.accounts[actorId]; if (!acc) return;
    const person = byIdLocal(S.people, actorId);
    if (person) {
      if (fields.name) { person.name = fields.name; person.initial = fields.name.trim()[0].toUpperCase(); }
      if (fields.bio != null) person.bio = fields.bio;
      if (fields.ig != null) person.ig = fields.ig;
    }
    if (acc.businessId && fields.bio != null) {
      const biz = byIdLocal(S.businesses, acc.businessId); if (biz) biz.bio = fields.bio;
    }
    acc.profileComplete = true;
    persist(); emit('change', {});
  }

  // Real upload — a browser-native FileReader data URL, no backend needed.
  // Only meaningfully persists for accounts created this session (see the
  // newPeople/newBusinesses hydration note in applyOverlay): editing a
  // pre-existing seed persona's photos works for the live session but, like
  // completeProfile below, won't survive a reload — nobody signs up *as*
  // the demo persona, so that's not a real product gap, just this
  // prototype's seed-vs-account boundary.
  function uploadPhoto(personId, index, dataUrl) {
    const p = byIdLocal(S.people, personId); if (!p) return;
    if (!p.photos) p.photos = [];
    p.photos[index] = dataUrl;
    persist(); emit('change', {});
  }

  function completeOnboarding(actorId) {
    const acc = root.accounts[actorId]; if (!acc) return;
    acc.onboardingComplete = true;
    persist(); emit('change', {});
  }

  function setPremium(actorId, on) {
    const acc = root.accounts[actorId]; if (!acc) return;
    acc.premium = !!on;
    persist(); emit('change', {});
  }

  // ---- check-ins: "I'm going" becomes real presence-at-a-venue, which is
  // what unlocks posting a verified story (camera only "opens" once you are
  // genuinely somewhere) -----------------------------------------------------
  const CHECKIN_MS = 3 * 60 * 60 * 1000;
  function checkIn(personId, venueId) {
    const entry = { id: uid('ci'), personId, venueId, at: now(), expiresAt: now() + CHECKIN_MS };
    root.checkins.push(entry);
    persist(); emit('change', {});
    return entry;
  }
  function activeCheckin(personId) {
    const t = now();
    const mine = root.checkins.filter((c) => c.personId === personId && c.expiresAt > t);
    return mine.length ? mine[mine.length - 1] : null;
  }

  // ---- stories: real creation, verified mark only when genuinely checked
  // in at the venue at post time -------------------------------------------
  const STORY_PALETTE = [
    ['#12E08A', '#0B7A5B'], ['#1BF5A0', '#0E4F6B'], ['#F5C542', '#0B7A5B'],
    ['#7A5BF5', '#12E08A'], ['#F55B8A', '#12E08A'], ['#0EF0C0', '#0A3A55'],
  ];
  function postStory(personId, { colorIdx } = {}) {
    const ci = activeCheckin(personId);
    const g = STORY_PALETTE[(colorIdx || 0) % STORY_PALETTE.length];
    const story = {
      id: uid('st'), venue: ci ? ci.venueId : null, by: personId,
      postedAt: now(), mins: 0, atVenue: !!ci, g,
    };
    root.newStories.push(story);
    applyOverlay(); persist(); emit('change', {});
    return story;
  }

  // ---- business dashboard: claim a venue, post real table offers ---------
  // New businesses start with no venueIds (per PRD, Func's venues are
  // pre-mapped real SF places, not user-fabricated locations) — claiming
  // attaches a business to one that isn't already run by someone else.
  function venueClaimedBy(venueId) {
    return (S.businesses || []).find((b) => b.venueIds.includes(venueId)) || null;
  }
  function claimVenue(businessId, venueId) {
    const biz = byIdLocal(S.businesses, businessId); if (!biz) return { ok: false, reason: 'not_found' };
    if (biz.venueIds.includes(venueId)) return { ok: true }; // already theirs — idempotent
    const claimant = venueClaimedBy(venueId);
    if (claimant) return { ok: false, reason: 'already_claimed', by: claimant.name };
    biz.venueIds.push(venueId);
    persist(); emit('change', {});
    return { ok: true };
  }
  function postTable(businessId, { venueId, name, seats, perHead, vibe }) {
    const biz = byIdLocal(S.businesses, businessId); if (!biz || !biz.venueIds.includes(venueId)) return null;
    const seatCount = Math.max(1, Math.floor(seats) || 1);
    const table = {
      id: uid('t'), venue: venueId, name: name || 'Table', seats: seatCount, left: seatCount,
      perHead: Math.max(0, Math.floor(perHead) || 0), host: biz.name, hostKind: 'promoter',
      businessId, vibe: vibe || '',
    };
    root.newTables.push(table);
    applyOverlay(); persist(); emit('change', {});
    return table;
  }

  // ---- local spots: real creation, real visit -> token loop ("earns a
  // token when people actually visit it" — PRD §9). Projection (x/y) is
  // computed by the caller (screens.js has app.js's proj()) and stored
  // alongside lat/lon, same as every other spot on the map. -------------
  function dropSpot(personId, { name, note, lat, lon, x, y }) {
    const person = byIdLocal(S.people, personId);
    const spot = {
      id: uid('spot'), name: name || 'Local spot', lat, lon, x, y,
      by: person ? person.name : personId, byId: personId, note: note || '', tokens: 0, kind: 'spot',
    };
    root.newSpots.push(spot);
    if (person) person.spots = (person.spots || 0) + 1;
    applyOverlay(); persist(); emit('change', {});
    return spot;
  }
  function hasVisited(personId, spotId) {
    return root.visits.some((v) => v.personId === personId && v.spotId === spotId);
  }
  // One counted visit per (visitor, spot) — tokens reward genuine discovery,
  // not repeat taps of the same button.
  function visitSpot(personId, spotId) {
    const spot = byIdLocal(S.spots, spotId); if (!spot) return { ok: false, reason: 'not_found' };
    if (personId === spot.byId) return { ok: false, reason: 'own_spot' };
    if (hasVisited(personId, spotId)) return { ok: true, alreadyCounted: true };
    root.visits.push({ id: uid('vis'), personId, spotId, at: now() });
    spot.tokens = (spot.tokens || 0) + 1;
    const dropper = byIdLocal(S.people, spot.byId);
    if (dropper) dropper.tokens = (dropper.tokens || 0) + 1;
    persist(); emit('change', {});
    return { ok: true, alreadyCounted: false };
  }

  // ---- saved items: Browse's swipe-right on a venue/spot used to just
  // toast "Saved" with nothing behind it — this makes that claim true. -----
  function saveItem(personId, kind, refId) {
    const exists = root.saved.find((s) => s.personId === personId && s.kind === kind && s.refId === refId);
    if (exists) return exists;
    const entry = { id: uid('sv'), personId, kind, refId, at: now() };
    root.saved.push(entry);
    persist(); emit('change', {});
    return entry;
  }
  function unsaveItem(personId, kind, refId) {
    const before = root.saved.length;
    root.saved = root.saved.filter((s) => !(s.personId === personId && s.kind === kind && s.refId === refId));
    if (root.saved.length !== before) { persist(); emit('change', {}); }
  }
  function getSavedItems(personId) { return root.saved.filter((s) => s.personId === personId); }

  // ---- interest: "see who wants you" is a real signal, gated to premium
  // in the UI rather than faked with a toast --------------------------------
  function expressInterest(fromId, toId) {
    if (fromId === toId) return null;
    const existing = root.interest.find((i) => i.fromId === fromId && i.toId === toId);
    if (existing) return existing;
    const entry = { id: uid('int'), fromId, toId, at: now() };
    root.interest.push(entry);
    persist(); emit('change', {});
    return entry;
  }
  function interestReceived(personId) { return root.interest.filter((i) => i.toId === personId); }

  // ---- derived capacity: table/after-party counts move for real when a
  // request is actually accepted, instead of sitting frozen at their seed
  // value forever -------------------------------------------------------
  function acceptedCountForTable(tableId) {
    return root.requests.filter((r) => r.tableId === tableId && r.status === 'accepted').length;
  }
  function acceptedCountForAfter(afterId) {
    return root.requests.filter((r) => r.afterId === afterId && r.status === 'accepted').length;
  }
  function tableSpotsLeft(table) {
    if (!table) return 0;
    return Math.max(0, table.left - acceptedCountForTable(table.id));
  }
  function afterGoingCount(after) {
    if (!after) return 0;
    return after.going + acceptedCountForAfter(after.id);
  }

  return {
    init, resetDemoData, on, off, uid, now,
    getActivePersonaId, getHomePersonaId, setActivePersona,
    getPerson, getBusiness, getVenue, getTable, getAfter, listPeople, listBusinesses,
    setStatus, getStatus, setVenueHeat,
    addRequest, updateRequest, getRequest, listRequests,
    addPass, listPasses,
    addThread, updateThread, getThread, getThreadForRequest, listThreads,
    addMessage, listMessagesForThread,
    createAccount, getAccount, getSessionPersonId, logout,
    submitVerification, completeProfile, completeOnboarding, setPremium, uploadPhoto,
    claimVenue, postTable,
    dropSpot, visitSpot, hasVisited,
    saveItem, unsaveItem, getSavedItems,
    checkIn, activeCheckin,
    postStory,
    expressInterest, interestReceived,
    acceptedCountForTable, acceptedCountForAfter, tableSpotsLeft, afterGoingCount,
    ageFromDob,
  };
})();
