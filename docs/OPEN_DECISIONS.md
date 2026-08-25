# Func — Open Decisions

**Date:** 2026-08-25
**Rule:** unresolved alternatives stay visible; they are not silently resolved inside the PRD or deck.

## OD-001 — Final navigation names

**Current prototype:** Map, Create, Messages, Inbox, Profile.
**Older product language:** Browse, Plans + Chats, Map, Inbox, Profile.
**Recommendation:** keep the map centre and decide whether “Create” becomes a user-facing Discover/Browse surface and whether “Messages” becomes Plans.
**Owner:** Phoenix.

## OD-002 — What is a pass?

**Current language:** request → host accepts → pass.
**Unresolved meaning:** confirmation card, guest-list record, QR credential, host-issued access token, or non-binding social confirmation.
**Why it matters:** backend model, venue operations, legal responsibility, revocation, entry expectations, and investor claims.
**Recommendation:** initially treat it as a non-ticketing access confirmation unless a venue workflow is deliberately added.

## OD-003 — Business product scope

**Current baseline:** verified venue persona can create a venue-linked Pool invitation.
**Unresolved expansion:** event fields, table offers, operator roles, paid visibility, analytics, billing, staff accounts, and promotion permissions.
**Recommendation:** launch with verified identity and accountable event publishing; defer paid promotion until consumer density and business value are measured.

## OD-004 — Stories versus Flares

**Current prototype:** seeded/text story scaffolding.
**Older concept:** venue-anchored, geofenced, expiring media that contributes to place atmosphere.
**Recommendation:** keep Stories as a future evidence-led workstream; do not call the prototype Flares or claim live venue proof.

## OD-005 — After-party invitations and Afters mode

**Current engineering direction:** private after-party invitations can remain; the global time-of-night personality mode is retired.
**Recommendation:** adopt that distinction in the current PRD unless Phoenix explicitly restores the mode.

## OD-006 — Pet / AI companion

**Current status:** concept only.
**Recommendation:** keep deferred until the core loop is validated and a threat model defines its data access, recommendation authority, hallucination behaviour, cost, and user controls.

## OD-007 — Visual type hierarchy

**Current inputs:** condensed uppercase display language in standing orders; rounded grotesk direction in the visual north star.
**Recommendation:** use condensed display typography for brand/editorial moments and a highly legible grotesk/sans for product information and safety copy. Final family and licence remain open.

## OD-008 — Exact black and tile colour

**Current implementation:** near-black theme and a separate icon/tile black.
**Recommendation:** obtain the supplied master logo asset and lock one structural black before calling the visual system final.

## OD-009 — Electric colour policy

**Current inputs:** emerald reserved for live meaning; electric palette exists in tokens and visual direction.
**Recommendation:** keep electric colours in event artwork/editorial concept moments, while structural UI remains black, glass, chrome, white, and semantic states.

## OD-010 — First launch geography

**Current direction:** San Francisco and Los Angeles; current seed world is San Francisco.
**Recommendation:** present San Francisco as the prototype/pilot city and Los Angeles as the next intended launch market unless the operating plan proves both can be seeded together.

## OD-011 — Investor claim boundary

**Accepted:** working prototype, coherent privacy model, and an architectural path to backend replacement.
**Not proven:** demand, retention, venue willingness to pay, safety in real use, network effects, or a defensible moat.
**Rule:** all decks must label hypotheses, prototype evidence, and production roadmap separately.
