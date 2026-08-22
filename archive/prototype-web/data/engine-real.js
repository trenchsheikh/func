/* ==========================================================================
   Func. — data/engine-real.js
   The real request → accept/decline → pass → chat state machine. Backed by
   STORE (localStorage), so every accept/decline is a genuine decision made
   by whichever persona is active when the action is taken — never a timer.
   Implements the same call surface as engine-demo.js.
   ========================================================================== */
window.Engine = (function () {
  'use strict';

  // Self-initializing: engine-real.js loads before app.js's boot() runs, but
  // it needs STORE ready immediately to seed the reconcile-seen set below.
  // STORE.init() is idempotent, so app.js calling it again later is harmless.
  STORE.init();

  const byId = (arr, id) => arr.find((o) => o.id === id);

  const listeners = {};
  function on(evt, fn) { (listeners[evt] = listeners[evt] || []).push(fn); }
  function off(evt, fn) { listeners[evt] = (listeners[evt] || []).filter((f) => f !== fn); }
  function emit(evt, payload) { (listeners[evt] || []).slice().forEach((fn) => fn(payload)); }

  function getActivePersonaId() { return STORE.getActivePersonaId(); }
  function getHomePersonaId() { return STORE.getHomePersonaId(); }

  function resolveHostId({ kind, tableId, afterId }) {
    if (kind === 'after') { const a = STORE.getAfter(afterId); return a ? a.hostId : null; }
    const t = STORE.getTable(tableId); return t ? t.businessId : null;
  }
  function hostDisplayName(hostId) {
    const b = STORE.getBusiness(hostId); if (b) return b.name;
    const p = STORE.getPerson(hostId); return p ? p.name : hostId;
  }

  // Non-premium accounts can have at most this many requests pending at
  // once — "unlimited requests" (Premium/PRD §13) only means something if
  // there's a real cap for everyone else to bypass.
  const FREE_PENDING_CAP = 3;
  function canSendRequest(guestId) {
    const acc = STORE.getAccount(guestId);
    if (acc && acc.premium) return true;
    const pending = STORE.listRequests().filter((r) => r.guestId === guestId && r.status === 'pending').length;
    return pending < FREE_PENDING_CAP;
  }

  function alreadyPendingForSameTarget(guestId, params) {
    return STORE.listRequests().some((r) => {
      if (r.guestId !== guestId || r.status !== 'pending') return false;
      if (params.kind === 'after') return r.kind === 'after' && r.afterId === params.afterId;
      return r.tableId === params.tableId;
    });
  }

  function sendRequest(params) {
    const guestId = params.guestId || getActivePersonaId();
    if (!canSendRequest(guestId)) return { ok: false, reason: 'request_cap' };
    if (alreadyPendingForSameTarget(guestId, params)) return { ok: false, reason: 'duplicate' };
    const hostId = resolveHostId(params);
    // Same reasoning as visitSpot's own_spot guard: a business (or, via the QA
    // switcher, an after-party host) has no business requesting/accepting
    // their own listing — it would consume a real seat against nobody and
    // let them accept their own pending request trivially.
    if (hostId === guestId) return { ok: false, reason: 'own_listing' };
    const request = {
      id: STORE.uid('req'), kind: params.kind, guestId, partySize: params.partySize,
      venueId: params.venueId || null, tableId: params.tableId || null, afterId: params.afterId || null,
      hostId, status: 'pending', createdAt: STORE.now(), respondedAt: null,
      declineReason: null, passId: null, threadId: null,
    };
    STORE.addRequest(request);
    const thread = STORE.addThread({
      id: STORE.uid('th'), requestId: request.id, participantIds: [guestId, hostId],
      createdAt: STORE.now(), lastMessageAt: STORE.now(), status: 'open',
    });
    STORE.updateRequest(request.id, { threadId: thread.id });
    emit('request:sent', { request, host: hostDisplayName(hostId), etaCopy: null });
    return request;
  }

  function acceptRequest(requestId, actingPersonaId) {
    const request = STORE.getRequest(requestId);
    if (!request) return { ok: false, reason: 'not_found' };
    if (request.status !== 'pending') return { ok: false, reason: 'already_resolved' };
    if (actingPersonaId !== request.hostId) return { ok: false, reason: 'not_authorized' };
    // Re-check own_listing here too, not just at creation in sendRequest — a
    // self-request could still reach root.requests from before that guard
    // existed (this repo's localStorage persists across sessions) or from
    // any other write path, and accepting it is the actual point where a
    // real seat gets consumed against nobody.
    if (request.guestId === request.hostId) return { ok: false, reason: 'own_listing' };
    const partySize = request.partySize || 1;
    if (request.kind === 'after') {
      const after = STORE.getAfter(request.afterId);
      if (after && STORE.afterGoingCount(after) + partySize > after.capacity) return { ok: false, reason: 'at_capacity' };
    } else if (request.tableId) {
      const table = STORE.getTable(request.tableId);
      if (table && partySize > STORE.tableSpotsLeft(table)) return { ok: false, reason: 'at_capacity' };
    }

    let pass = null;
    if (request.kind !== 'after') {
      pass = STORE.addPass({
        id: STORE.uid('pass'), requestId: request.id, guestId: request.guestId, partySize: request.partySize,
        venueId: request.venueId, tableId: request.tableId, code: 'FNC-' + (4820 + STORE.listPasses().length),
        issuedAt: STORE.now(), status: 'active', rated: false,
      });
    }
    STORE.updateRequest(request.id, { status: 'accepted', respondedAt: STORE.now(), passId: pass ? pass.id : null });
    STORE.incrementNights(request.guestId);
    if (request.threadId) {
      STORE.addMessage({ id: STORE.uid('msg'), threadId: request.threadId, senderId: 'system',
        body: hostDisplayName(actingPersonaId) + ' accepted', sentAt: STORE.now(), readBy: [] });
    }
    reconcile();
    return { ok: true };
  }

  function declineRequest(requestId, actingPersonaId, reason) {
    const request = STORE.getRequest(requestId);
    if (!request) return { ok: false, reason: 'not_found' };
    if (request.status !== 'pending') return { ok: false, reason: 'already_resolved' };
    if (actingPersonaId !== request.hostId) return { ok: false, reason: 'not_authorized' };

    STORE.updateRequest(request.id, { status: 'declined', respondedAt: STORE.now(), declineReason: reason || null });
    if (request.threadId) STORE.updateThread(request.threadId, { status: 'closed' });
    reconcile();
    return { ok: true };
  }

  function cancelRequest(requestId, actingPersonaId) {
    const request = STORE.getRequest(requestId);
    if (!request) return { ok: false, reason: 'not_found' };
    if (request.status !== 'pending') return { ok: false, reason: 'already_resolved' };
    if (actingPersonaId !== request.guestId) return { ok: false, reason: 'not_authorized' };

    STORE.updateRequest(request.id, { status: 'cancelled', respondedAt: STORE.now() });
    if (request.threadId) STORE.updateThread(request.threadId, { status: 'closed' });
    emit('store:change', {});
    return { ok: true };
  }

  function getRequestsForGuest(id) { return STORE.listRequests().filter((r) => r.guestId === id); }
  function getPendingRequestsForHost(id) { return STORE.listRequests().filter((r) => r.hostId === id && r.status === 'pending'); }
  function getRequest(id) { return STORE.getRequest(id); }
  function getPassesForGuest(id) { return STORE.listPasses().filter((p) => p.guestId === id); }
  function getThreadsForPersona(id) { return STORE.listThreads().filter((t) => t.participantIds.includes(id)); }
  function getMessages(threadId) { return STORE.listMessagesForThread(threadId); }

  function sendMessage(threadId, senderId, body) {
    const m = STORE.addMessage({ id: STORE.uid('msg'), threadId, senderId, body, sentAt: STORE.now(), readBy: [] });
    emit('message:new', m);
    return m;
  }

  function setStatus(personaId, status) {
    STORE.setStatus(personaId, status);
    emit('status:changed', { personaId, status });
  }
  function getStatus(personaId) { return STORE.getStatus(personaId); }

  // ---- accounts / verification / onboarding — thin passthroughs to STORE,
  // kept on Engine so screens.js never has to know demo vs. real mode -------
  function getAccount(actorId) { return STORE.getAccount(actorId); }
  function getSessionPersonId() { return STORE.getSessionPersonId(); }
  function hasSession() { return !!STORE.getSessionPersonId(); }
  function createAccount(fields) { return STORE.createAccount(fields); }
  function submitVerification(actorId, method) { return STORE.submitVerification(actorId, method); }
  function completeProfile(actorId, fields) { return STORE.completeProfile(actorId, fields); }
  function completeOnboarding(actorId) { return STORE.completeOnboarding(actorId); }
  function setPremium(actorId, on) { return STORE.setPremium(actorId, on); }
  function uploadPhoto(personId, index, dataUrl) { return STORE.uploadPhoto(personId, index, dataUrl); }
  function logout() { return STORE.logout(); }

  function claimVenue(businessId, venueId) { return STORE.claimVenue(businessId, venueId); }
  function postTable(businessId, fields) { return STORE.postTable(businessId, fields); }
  function dropSpot(personId, fields) { return STORE.dropSpot(personId, fields); }
  function visitSpot(personId, spotId) { return STORE.visitSpot(personId, spotId); }
  function hasVisitedSpot(personId, spotId) { return STORE.hasVisited(personId, spotId); }
  function saveItem(personId, kind, refId) { return STORE.saveItem(personId, kind, refId); }
  function unsaveItem(personId, kind, refId) { return STORE.unsaveItem(personId, kind, refId); }
  function getSavedItems(personId) { return STORE.getSavedItems(personId); }

  function checkIn(personId, venueId) { return STORE.checkIn(personId, venueId); }
  function activeCheckin(personId) { return STORE.activeCheckin(personId); }
  function postStory(personId, opts) { return STORE.postStory(personId, opts); }

  function expressInterest(fromId, toId) { return STORE.expressInterest(fromId, toId); }
  function getInterestReceived(personId) { return STORE.interestReceived(personId); }

  function tableSpotsLeft(table) { return STORE.tableSpotsLeft(table); }
  function afterGoingCount(after) { return STORE.afterGoingCount(after); }

  // Generalises off the demo's hardcoded 'monarch': rates whichever venue the
  // persona most recently held a pass at. No-ops if they never held one.
  function rateNight(personaId, stars) {
    if (!stars) return { ok: false, reason: 'no_rating' };
    const passes = STORE.listPasses().filter((p) => p.guestId === personaId).sort((a, b) => b.issuedAt - a.issuedAt);
    if (!passes.length) return { ok: false, reason: 'no_pass' };
    const latest = passes[0];
    if (latest.rated) return { ok: false, reason: 'already_rated' };
    const venue = STORE.getVenue(latest.venueId);
    if (!venue) return { ok: false, reason: 'no_pass' };
    STORE.setVenueHeat(venue.id, Math.max(0.1, Math.min(1, venue.heat + (stars >= 4 ? 0.05 : -0.14))));
    STORE.markPassRated(latest.id);
    return { ok: true };
  }

  // Diff-based reconciliation: fires 'request:accepted' / 'request:declined'
  // exactly once per request, for whichever persona is active *right now* —
  // whether the resolution happened locally (this tab, this action) or
  // remotely (another tab, surfaced via STORE's `storage` listener). This is
  // what lets a second tab show the "you're in" moment without a reload.
  const _seenResolved = new Set();
  function reconcile() {
    const me = getActivePersonaId();
    STORE.listRequests().forEach((r) => {
      if (r.guestId !== me) return;
      if (_seenResolved.has(r.id)) return;
      if (r.status === 'accepted') {
        _seenResolved.add(r.id);
        emit('request:accepted', {
          request: r,
          pass: r.passId ? STORE.listPasses().find((p) => p.id === r.passId) : null,
          venue: r.venueId ? STORE.getVenue(r.venueId) : null,
          table: r.tableId ? STORE.getTable(r.tableId) : null,
          after: r.afterId ? STORE.getAfter(r.afterId) : null,
        });
      } else if (r.status === 'declined') {
        _seenResolved.add(r.id);
        emit('request:declined', { request: r });
      }
    });
  }
  // Anything already resolved at boot is history, not a new event — mark it
  // seen before the UI can subscribe, so reload never replays old accepts.
  STORE.listRequests().forEach((r) => {
    if (r.status === 'accepted' || r.status === 'declined') _seenResolved.add(r.id);
  });
  STORE.on('change', reconcile);
  STORE.on('change', () => emit('store:change', {}));
  STORE.on('verification:resolved', (p) => emit('verification:resolved', p));
  // Switching persona doesn't touch STORE's persisted root (it's tab-scoped
  // sessionStorage), so it never fires STORE's 'change' event — without this,
  // reconcile() would run but the currently-mounted screen would keep
  // showing the previous persona's requests/passes until you navigated away
  // and back.
  STORE.on('persona', reconcile);
  STORE.on('persona', () => emit('store:change', {}));

  return {
    mode: 'real',
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
