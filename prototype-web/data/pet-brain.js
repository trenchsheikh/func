/* ==========================================================================
   Func. — data/pet-brain.js
   The architectural seam for the pet's intelligence.

   getMessage(ctx) is the entire contract: given real, current app state,
   return one line of text for the pet to say. Today's implementation below
   is deterministic and rules-based, not AI — every line it can say is
   checked against live data first, so it never claims something untrue
   ("Maya and Theo are both out" when they aren't, "340 tokens" when you
   have none), but it is not a generalised assistant either.

   A future LLM-backed assistant is a drop-in replacement for this file's
   getMessage function — same ctx shape in, a string out. Nothing in app.js
   or screens.js needs to change to swap it in. Do not build a fancier
   scripted version of this in place of a real assistant later; either keep
   it honestly rules-based, or replace it with something that actually
   reasons over ctx.
   ========================================================================== */
window.PetBrain = (function () {
  'use strict';

  function pick(arr) { return arr.length ? arr[Math.floor(Math.random() * arr.length)] : null; }

  // ctx: { personId, S, Engine, byId }
  function candidates(ctx) {
    const { personId, S, Engine, byId } = ctx;
    const out = [];
    if (!personId || !S || !Engine) return out;

    const pending = Engine.getRequestsForGuest(personId).filter((r) => r.status === 'pending');
    if (pending.length) {
      out.push(`You have ${pending.length} request${pending.length > 1 ? 's' : ''} still out — I will tell you the second one moves.`);
    }

    const passes = Engine.getPassesForGuest(personId);
    if (passes.length) {
      const v = byId(S.venues, passes[passes.length - 1].venueId);
      if (v) out.push(`You are in at ${v.name} — the pass is in Plans whenever you need it.`);
    }

    // Derived from real spot data, not the person record's own .tokens field
    // — that field is written at drop/visit time but never reconciled, so it
    // drifts from what a spot's own detail sheet and Inbox actually show.
    const myTokens = (S.spots || []).filter((sp) => sp.byId === personId).reduce((sum, sp) => sum + (sp.tokens || 0), 0);
    if (myTokens > 0) out.push(`You have ${myTokens} tokens from spots you have dropped.`);

    if (Engine.getInterestReceived) {
      const interested = Engine.getInterestReceived(personId);
      if (interested.length) out.push(`${interested.length} ${interested.length === 1 ? 'person has' : 'people have'} shown interest in you tonight.`);
    }

    const hot = (S.venues || []).slice().sort((a, b) => b.heat - a.heat)[0];
    if (hot && hot.heat > 0.6) out.push(`${hot.name} is the busiest thing on right now — ${(hot.word || '').toLowerCase()}.`);

    const hour = new Date().getHours();
    if (hour >= 23 || hour < 5) out.push('It is properly late — Afters mode changes what the map shows.');

    return out;
  }

  function getMessage(ctx) {
    return pick(candidates(ctx)) || 'Tap a venue to see what is actually happening there right now.';
  }

  return { getMessage };
})();
