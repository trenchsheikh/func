# Func — Product Requirements Document

**Version:** 1.0 current-truth draft
**Date:** 2026-08-25
**Status:** Ready for founder review; not yet an implementation contract
**Product baseline:** `func-mobile` at `aac98d3`
**Companion authority:** Master Product Spec v4.1 and Feature & Decision Tracker, both last updated 2026-08-23
**Audience:** Product, design, mobile, backend, safety, operations, and future investors

> This document replaces the older historical handoff that previously occupied `docs/PRD.md`. Older Call It, voting, Plan Flag, Convoy, group-first, Afters-mode, and MapLibre requirements must not be treated as current requirements.

## 1. Product definition

Func is a map-first social nightlife product. It shows what is happening, shows people or places only when permission allows, and helps a person take a safe next step toward a real night out.

### Core loop

```text
open map → find an opportunity → understand context and visibility → join or request → host accepts → coordinate safely
```

### Primary outcome

**A successful night enabled, not time spent in the app.**

### Primary audience

Adults approximately 18–25 who already go out socially, initially in San Francisco and Los Angeles. The research sample should begin with 18–22-year-olds who can describe their last real night-out decision.

### Business audience

Verified venues and promoters who need accountable business identity, event creation, request handling, and future demand tools. Business accounts are secondary to the consumer map and must not make Func dependent on venue participation.

## 2. Invariants

These are Tier 0 requirements and cannot be changed implicitly:

- map first;
- presence is explicitly enabled for tonight and expires automatically;
- exact location is viewer-relative and permission-aware;
- mutual activity is anonymous venue-level glow, never a person pin;
- no forced schedules, timers, voting, streaks, or manipulative urgency;
- party size is an attribute of a request, not a permanent administrated group;
- 18+ identity verification is required for real social/location access;
- every connection feature is reviewed for scams, stalking, harassment, and predatory behaviour;
- private-place details are protected until the correct acceptance state;
- a business identity cannot silently reveal its operator;
- Func does not process payments or tickets in the current direction;
- no emoji glyphs as interface iconography;
- the app must not be used with real people or real locations while it remains client-only and seeded.

## 3. Scope status vocabulary

| Status | Meaning |
|---|---|
| Prototype built | Demonstrated with seeded, in-memory data; not production security. |
| Prototype incomplete | Some behaviour exists, but the product contract or states are incomplete. |
| Production foundation | Required before real users, real locations, or a public pilot. |
| Needs evidence | Direction is plausible but must be tested with target users or businesses. |
| Deferred | Not in the current launch slice. |
| Out of scope | Explicitly excluded unless a new decision is recorded. |
| Decision required | Cannot be specified responsibly without a founder/product choice. |

## 4. Feature requirements

### SHELL-001 — Map-first application shell

**Status:** Prototype built; final naming decision required.

The map is the first and primary surface. The current prototype routes are:

- map: `app/(tabs)/index.tsx`;
- create: `app/(tabs)/create.tsx`;
- messages: `app/(tabs)/messages.tsx`;
- inbox: `app/(tabs)/inbox.tsx`;
- profile: `app/(tabs)/profile.tsx`;
- detail routes for venue, invite, review, and thread.

The target product may rename Create to Discover/Browse and Messages to Plans, but no rename is an implementation requirement until `OD-001` is resolved.

**Acceptance criteria:** the map can be reached immediately; supporting surfaces never obscure the map’s role; navigation labels are consistent across app, Bible, PRD, and deck.

### MAP-001 — Globe and city map

**Status:** Prototype built.

The map uses Mapbox and deliberate globe access. It must support real geography, normal zoom, safe loading/fallback states, and a future Func-specific visual style. The current schematic fallback is a demo fallback, not the intended production map.

**Required states:** token unavailable, network unavailable, permission unavailable, loading, empty city, populated city, selected item, cluster, and reduced motion.

**Production requirements:** real map data policy, pricing/licensing review, performance testing, map style ownership, caching/offline policy, and abuse-resistant venue data.

### MAP-002 — Venue and opportunity objects

**Status:** Prototype built; visual system incomplete.

Venues and public invitations appear as distinct, selectable map objects. Object meaning must not rely on colour alone. Tapping an object opens a spatially anchored preview; the preview may expand into a detail surface without losing its venue relationship.

**Acceptance criteria:** co-located venue, business, and event items remain independently discoverable; a user can return to the map without losing context; the selected object is clear under accessibility settings.

### MAP-003 — Anonymous live energy

**Status:** Prototype built; user evidence needed.

Qualifying mutual presence can contribute to venue-level glow. It must never reveal a person, name, avatar, count, coordinate, or unsupported heat claim.

**Acceptance criteria:** fewer than the qualifying threshold produces no glow; malformed or expired presence fails closed; glow remains visually secondary to opportunities; a non-colour cue exists wherever state is actionable.

### PRES-001 — Nightly presence

**Status:** Prototype built; production foundation required.

The user chooses DTF, Casual, or Off. DTF may qualify for exact friend visibility subject to relationship, current location fix, and expiry rules. Casual does not create a person pin. Off removes peer-visible location immediately. Expiry is automatic at the defined local boundary.

**Required production states:** permission request, permission denied, stale fix, future-dated fix, expired presence, user-initiated off, account suspension, device/session mismatch, and recovery after reconnect.

### PRES-002 — Viewer-relative disclosure

**Status:** Prototype built; production server enforcement required.

The UI receives a limited viewer view rather than raw people, relationships, or coordinates. See `docs/PRIVACY_AND_SAFETY.md`.

**Acceptance criteria:** no screen bypasses the viewer projection; unauthorised viewers receive neutral absence rather than clues; hidden data cannot be recovered through deep links, selection state, messages, or errors.

### POOL-001 — Create invitation

**Status:** Prototype built; production state machine required.

A personal or eligible verified business host creates an invitation with public or private access, venue or protected private place, capacity or uncapped capacity, party-size expectations, human-readable details, and host identity appropriate to the active persona.

Public invitations must be anchored to a known commercial venue. Private invitations must not expose exact location to outsiders or pending requesters.

### POOL-002 — Join or request access

**Status:** Prototype built; demand and trust evidence required.

An eligible person can join a public invitation immediately subject to capacity, or request a private invitation with party size and an optional permitted pre-accept message.

**Required states:** unavailable, full, already joined, already requested, blocked, pending, accepted, declined, revoked, expired, network retry, and malformed invitation.

### POOL-003 — Host review and acceptance

**Status:** Prototype built; production concurrency and moderation required.

The host sees pending requests grouped by invitation, with only the identity and party information permitted by policy. Accept and decline must be atomic and idempotent. Capacity must be checked again at commit time.

**Acceptance criteria:** no over-capacity acceptance; no partial state where a person is admitted without the correct conversation; blocked or reported users are handled through policy; every decision can be audited in production.

### POOL-004 — Accepted reveal and bounded conversation

**Status:** Prototype built; pass semantics unresolved.

After acceptance, the host and accepted attendees receive the exact private details permitted by policy and the relevant Pool conversation. Outsiders and denied users receive a neutral result.

The product language says “pass,” but its technical meaning is unresolved. See `OD-002` in `docs/OPEN_DECISIONS.md`.

### MSG-001 — Request and Pool messaging

**Status:** Prototype built; production messaging foundation required.

Messages are identity-scoped, participant-only, and request-gated where applicable. Business messages use the venue persona, not the operator’s personal identity.

**Production requirements:** real-time delivery, push notifications, message retention/deletion, links and media policy, report/block, rate limits, spam controls, moderation, and safety escalation.

### PROFILE-001 — Personal identity

**Status:** Prototype incomplete.

The prototype demonstrates a seeded personal profile and status. Production requires real account creation, editing, photo/media policy, identity verification, privacy settings, recovery, deletion, block/report, and age-safe display rules.

### BUSINESS-001 — Verified business identity

**Status:** Prototype built; production verification required.

Businesses have separate personas and verification states. A verified business may host its own venue-linked invitation. An unverified business may retain a profile but cannot present as trusted or publish a trusted event.

Business-specific fields, operator roles, appeals, venue claims, suspension, and promotion permissions remain open in `OD-003`.

### DISC-001 — Discover / Browse

**Status:** Prototype incomplete; needs evidence.

The prototype includes search, categories, privacy-safe invite cards, and distance ordering. A future Browse surface may include Live Near You, Near You, and category rows. A swipe/card-stack interaction is not current scope and must not be presented as built.

### STORY-001 — Live venue proof

**Status:** Prototype incomplete; separate safety specification required.

Text stories and seeded content exist as scaffolding. A production media story system must define media capture, venue attachment, authenticity proof, expiry, audience, storage/transcoding, moderation, face/privacy treatment, reporting, and deletion. Do not silently equate current text stories with a production Flares system.

## 5. Required user flows

Every flow must specify entry, preconditions, actions, server transitions, read-model updates, notifications, success, empty, loading, error, permission, privacy disclosure, abuse controls, analytics, and accessibility.

### Flow A — Open and discover

1. Launch into map shell.
2. Show appropriate loading state.
3. Resolve map token/network/permission state.
4. Render safe opportunities and approved live energy.
5. Select a cluster or object.
6. Show anchored preview.
7. Open detail or return to map.

### Flow B — Enable nightly presence

1. Explain the three states and who can see what.
2. Request permission only when necessary.
3. Choose DTF or Casual.
4. Show expiry and current visibility.
5. Allow immediate Off.
6. Handle denial, stale data, malformed data, and automatic expiry.

### Flow C — Join a public invitation

1. Open a public venue/invitation.
2. Show disclosed practical information.
3. Choose party size.
4. Validate capacity.
5. Join idempotently.
6. Show confirmation/pass state according to `OD-002`.
7. Enter bounded conversation if applicable.

### Flow D — Request a private invitation

1. Show only safe area/plan information.
2. Choose party size.
3. Add optional permitted message.
4. Submit request idempotently.
5. Show pending state.
6. Host reviews.
7. Accepted state reveals only permitted details.
8. Declined, blocked, revoked, expired, and error states remain neutral and safe.

### Flow E — Business publishing

1. Switch to business persona.
2. Verify eligibility.
3. Select a known venue.
4. Enter event fields.
5. Validate and publish.
6. Receive and review requests through the business identity.
7. Handle verification loss, cancellation, reports, and suspension.

## 6. Non-functional requirements

### Privacy and safety

See the dedicated safety specification. The production server must enforce the same policy the prototype models, with audit events for sensitive disclosure.

### Accessibility

- never rely on colour alone;
- provide reduced-motion equivalents;
- preserve readable contrast over artwork and glass;
- make permission and privacy copy understandable without animation or sound;
- support dynamic text without clipping critical actions;
- ensure map objects have accessible labels and actions.

### Performance and reliability

- map and opportunity surfaces must have explicit loading/error/empty states;
- commands must be idempotent where retries can duplicate access or messages;
- viewer-scoped payloads must remain bounded and paginated;
- production must have crash reporting, observability, and rollback capability;
- native device verification is required before public distribution.

### Measurement

The initial research measures are comprehension, task completion, trust, willingness to create/request/accept, and the alternative users would otherwise choose. Production measures include successful nights, time to useful discovery, acceptance response time, repeat nights, report/block rate, response time to safety cases, and serious incident rate.

## 7. Production gates

### Gate 0 — Truth and demand

- Bible, PRD, tracker, design system, and deck agree;
- 10–15 moderated target-user sessions complete the core loop;
- navigation, pass semantics, business scope, and launch slice are resolved.

### Gate 1 — Production foundation

- real accounts and sessions;
- age and business verification;
- persistent server-authoritative state;
- server-side redaction;
- presence expiry and abuse controls;
- Pool state machine;
- messaging and notifications;
- report/block/moderation/escalation;
- rate limits, auditability, analytics, retention/deletion controls.

### Gate 2 — Controlled alpha

One city, small adult cohort, trusted hosts/venues, manual moderation and support, independent security/safety review, and clear incident response.

## 8. Explicit non-goals for this PRD version

- payments or ticketing;
- Call It, voting, In/Nah, Plan Flags, or Convoy;
- a permanent group/community system;
- global recommendation intelligence;
- pet/AI companion implementation;
- premium entitlement implementation;
- Backing/vouches implementation;
- full media story platform;
- global multi-city operations;
- any claim that the prototype is production-secure.

## 9. Evidence and known prototype residuals

At the current local checkpoint, the prototype has 147 test cases in the existing harness, with 144 passing and three known pre-authorised residual failures: two stale `livePinFor` references and one compile-only type test that throws if executed. Typecheck has the same stale `livePinFor` import residual. These are not to be “fixed” by restoring the removed API. They must be clearly separated from product evidence in any presentation.
