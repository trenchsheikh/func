/* ==========================================================================
   Func. — data/engine-demo.js
   Today's scripted pitch-demo behaviour (fixed timers, always accepts),
   lifted verbatim from the pre-refactor screens.js so the shareable "whole
   night" link keeps its exact timing and copy. Implements the same call
   surface as engine-real.js so screens.js never has to know which mode it's
   in. In-memory only — nothing here persists across a reload, same as today.
   ========================================================================== */
window.Engine = (function () {
  'use strict';

  const S = window.SEED;
  const byId = (arr, id) => arr.find((o) => o.id === id);
  const uid = (p) => p + '_' + Math.random().toString(36).slice(2, 9);

  const _requests = [];
  const _passes = [];
  const _threads = [];
  const _messages = [];
  const _checkins = [];
  const _interest = [];
  // The scripted pitch demo's single account: seed 'you' is already
  // fully profiled and ID-verified, so the account record just mirrors that
  // rather than making a fresh visitor sit through signup mid-pitch.
  const _accounts = { you: {
    role: 'consumer', businessId: null, email: null, phone: null, dob: null,
    verification: { status: 'verified', method: 'id_upload', submittedAt: Date.now(), verifiedAt: Date.now() },
    profileComplete: true, onboardingComplete: true, premium: false, createdAt: Date.now(),
  } };

  const listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn); }
  function emit(evt, payload) { (listeners[evt] || []).slice().forEach((fn) => fn(payload)); }

  function getActivePersonaId() { return 'you'; }
  function getHomePersonaId() { return 'you'; }

  function seedThread(hostId, requestId, canned) {
    const thread = { id: uid('th'), requestId, participantIds: ['you', hostId], createdAt: Date.now(), lastMessageAt: Date.now(), status: 'open' };
    _threads.push(thread);
    canned.forEach((m) => _messages.push({ id: uid('msg'), threadId: thread.id, senderId: m.mine ? 'you' : hostId, body: m.body, sentAt: Date.now(), readBy: [] }));
    return thread;
  }

  function sendRequest(params) {
    const request = { id: uid('req'), ...params, guestId: 'you', status: 'pending', createdAt: Date.now() };
    _requests.push(request);

    if (params.kind === 'after') {
      const a = byId(S.afters, params.afterId);
      emit('request:sent', { request, host: a.host, etaCopy: a.host + ' has 4 mutuals with you. That usually goes through.' });
      setTimeout(() => {
        request.status = 'accepted'; request.respondedAt = Date.now();
        const thread = seedThread(a.hostId, request.id, []);
        request.threadId = thread.id;
        const p = byId(S.people, 'you'); if (p) p.nights = (p.nights || 0) + 1;
        emit('request:accepted', { request, after: a });
      }, 3600);
    } else {
      const v = byId(S.venues, params.venueId), t = byId(S.tables, params.tableId);
      emit('request:sent', { request, host: t.host, etaCopy: 'Sent. ' + t.host + ' usually comes back within a couple of minutes.' });
      setTimeout(() => {
        request.status = 'accepted'; request.respondedAt = Date.now();
        const pass = { id: uid('pass'), requestId: request.id, guestId: 'you', partySize: params.partySize,
          venueId: v.id, tableId: t.id, code: 'FNC-' + (4820 + _passes.length), issuedAt: Date.now(), status: 'active' };
        _passes.push(pass);
        request.passId = pass.id;
        const thread = seedThread(t.businessId, request.id, [
          { mine: false, body: 'Booth 5 is yours — ask for Dani on the door.' },
          { mine: false, body: 'we’re 10 mins away' },
        ]);
        request.threadId = thread.id;
        const p = byId(S.people, 'you'); if (p) p.nights = (p.nights || 0) + 1;
        emit('request:accepted', { request, pass, venue: v, table: t });
      }, 4200);
    }
    return request;
  }

  // Demo mode has no host-side UI (no persona switcher) — these exist only
  // so the call surface matches engine-real.js.
  function acceptRequest() { return { ok: false, reason: 'not_available_in_demo' }; }
  function declineRequest() { return { ok: false, reason: 'not_available_in_demo' }; }
  function cancelRequest() { return { ok: false, reason: 'not_available_in_demo' }; }

  function getRequestsForGuest(id) { return _requests.filter((r) => r.guestId === id); }
  function getPendingRequestsForHost() { return []; }
  function getRequest(id) { return byId(_requests, id); }
  function getPassesForGuest(id) { return _passes.filter((p) => p.guestId === id); }
  function getThreadsForPersona(id) { return _threads.filter((t) => t.participantIds.includes(id)); }
  function getMessages(threadId) { return _messages.filter((m) => m.threadId === threadId); }

  function sendMessage(threadId, senderId, body) {
    const m = { id: uid('msg'), threadId, senderId, body, sentAt: Date.now(), readBy: [] };
    _messages.push(m);
    const t = byId(_threads, threadId); if (t) t.lastMessageAt = m.sentAt;
    emit('message:new', m);
    return m;
  }

  function setStatus(personaId, status) {
    const p = byId(S.people, personaId);
    if (p) p.status = status;
    emit('status:changed', { personaId, status });
  }
  function getStatus(personaId) { const p = byId(S.people, personaId); return p ? p.status : 'red'; }

  // Generalised the same way as engine-real.js: rate whichever venue the
  // demo persona most recently held a pass at, not a name hardcoded to
  // match only the scripted table (t1, at Monarch) — the demo script always
  // ends up there today, but this stops being true the moment someone rates
  // after requesting a different table.
  function rateNight(personaId, stars) {
    const mine = _passes.filter((p) => p.guestId === personaId).sort((a, b) => b.issuedAt - a.issuedAt);
    if (!mine.length) return;
    const v = byId(S.venues, mine[0].venueId);
    if (!v) return;
    v.heat = Math.max(0.1, Math.min(1, v.heat + (stars >= 4 ? 0.05 : -0.14)));
    emit('store:change', {});
  }

  function reconcile() {} // no-op — demo mode has no cross-tab state to reconcile

  // ---- accounts / verification / onboarding — demo mode has one account,
  // pre-verified, so these mostly just report that back consistently -------
  function getAccount(actorId) { return _accounts[actorId] || null; }
  function getSessionPersonId() { return 'you'; }
  function hasSession() { return true; }
  function createAccount() { return { personId: 'you', businessId: null }; }
  function submitVerification() {}
  function completeProfile(actorId, fields) {
    const p = byId(S.people, actorId); if (!p) return;
    if (fields.name) p.name = fields.name;
    if (fields.bio != null) p.bio = fields.bio;
    if (fields.ig != null) p.ig = fields.ig;
    emit('store:change', {});
  }
  function completeOnboarding() {}
  function setPremium(actorId, on) { const acc = _accounts[actorId]; if (acc) acc.premium = !!on; emit('store:change', {}); }
  function uploadPhoto(personId, index, dataUrl) {
    const p = byId(S.people, personId); if (!p) return;
    if (!p.photos) p.photos = [];
    p.photos[index] = dataUrl;
    emit('store:change', {});
  }
  function logout() {}

  function canSendRequest() { return true; } // the pitch script never hits a cap

  // Business signup/dashboard is real-mode only (the demo's one persona is
  // always the seed consumer 'you') — these exist only so nothing throws.
  function claimVenue() {}
  function postTable() { return null; }

  function dropSpot(personId, { name, note, lat, lon, x, y }) {
    const person = byId(S.people, personId);
    const spot = {
      id: uid('spot'), name: name || 'Local spot', lat, lon, x, y,
      by: person ? person.name : personId, byId: personId, note: note || '', tokens: 0, kind: 'spot',
    };
    S.spots.push(spot);
    if (person) person.spots = (person.spots || 0) + 1;
    emit('store:change', {});
    return spot;
  }
  const _visits = [];
  function hasVisitedSpot(personId, spotId) { return _visits.some((v) => v.personId === personId && v.spotId === spotId); }
  function visitSpot(personId, spotId) {
    const spot = byId(S.spots, spotId); if (!spot) return { ok: false, reason: 'not_found' };
    if (personId === spot.byId) return { ok: false, reason: 'own_spot' };
    if (hasVisitedSpot(personId, spotId)) return { ok: true, alreadyCounted: true };
    _visits.push({ personId, spotId });
    spot.tokens = (spot.tokens || 0) + 1;
    const dropper = byId(S.people, spot.byId); if (dropper) dropper.tokens = (dropper.tokens || 0) + 1;
    emit('store:change', {});
    return { ok: true, alreadyCounted: false };
  }

  const _saved = [];
  function saveItem(personId, kind, refId) {
    const exists = _saved.find((s) => s.personId === personId && s.kind === kind && s.refId === refId);
    if (exists) return exists;
    const entry = { id: uid('sv'), personId, kind, refId };
    _saved.push(entry);
    emit('store:change', {});
    return entry;
  }
  function unsaveItem(personId, kind, refId) {
    const before = _saved.length;
    const kept = _saved.filter((s) => !(s.personId === personId && s.kind === kind && s.refId === refId));
    _saved.length = 0; _saved.push(...kept);
    if (_saved.length !== before) emit('store:change', {});
  }
  function getSavedItems(personId) { return _saved.filter((s) => s.personId === personId); }

  function checkIn(personId, venueId) {
    const entry = { id: uid('ci'), personId, venueId, at: Date.now(), expiresAt: Date.now() + 3 * 60 * 60 * 1000 };
    _checkins.push(entry);
    emit('store:change', {});
    return entry;
  }
  function activeCheckin(personId) {
    const t = Date.now();
    const mine = _checkins.filter((c) => c.personId === personId && c.expiresAt > t);
    return mine.length ? mine[mine.length - 1] : null;
  }
  const STORY_PALETTE = [
    ['#12E08A', '#0B7A5B'], ['#1BF5A0', '#0E4F6B'], ['#F5C542', '#0B7A5B'],
    ['#7A5BF5', '#12E08A'], ['#F55B8A', '#12E08A'], ['#0EF0C0', '#0A3A55'],
  ];
  function postStory(personId, opts) {
    const ci = activeCheckin(personId);
    const g = STORY_PALETTE[((opts && opts.colorIdx) || 0) % STORY_PALETTE.length];
    const story = { id: uid('st'), venue: ci ? ci.venueId : null, by: personId, mins: 0, atVenue: !!ci, g };
    if (ci) S.stories.push(story);
    emit('store:change', {});
    return story;
  }

  function expressInterest(fromId, toId) {
    if (fromId === toId) return null;
    const existing = _interest.find((i) => i.fromId === fromId && i.toId === toId);
    if (existing) return existing;
    const entry = { id: uid('int'), fromId, toId, at: Date.now() };
    _interest.push(entry);
    emit('store:change', {});
    return entry;
  }
  function getInterestReceived(personId) { return _interest.filter((i) => i.toId === personId); }

  function tableSpotsLeft(table) {
    if (!table) return 0;
    const accepted = _requests.filter((r) => r.tableId === table.id && r.status === 'accepted')
      .reduce((sum, r) => sum + (r.partySize || 1), 0);
    return Math.max(0, table.left - accepted);
  }
  function afterGoingCount(after) {
    if (!after) return 0;
    const accepted = _requests.filter((r) => r.afterId === after.id && r.status === 'accepted')
      .reduce((sum, r) => sum + (r.partySize || 1), 0);
    return after.going + accepted;
  }

  return {
    mode: 'demo',
    getActivePersonaId, getHomePersonaId,
    sendRequest, acceptRequest, declineRequest, cancelRequest, canSendRequest,
    getRequestsForGuest, getPendingRequestsForHost, getRequest,
    getPassesForGuest,
    getThreadsForPersona, getMessages, sendMessage,
    setStatus, getStatus,
    rateNight,
    reconcile,
    getAccount, getSessionPersonId, hasSession, createAccount, submitVerification,
    completeProfile, completeOnboarding, setPremium, uploadPhoto, logout,
    claimVenue, postTable,
    dropSpot, visitSpot, hasVisitedSpot,
    saveItem, unsaveItem, getSavedItems,
    checkIn, activeCheckin, postStory,
    expressInterest, getInterestReceived,
    tableSpotsLeft, afterGoingCount,
    on, off,
  };
})();
