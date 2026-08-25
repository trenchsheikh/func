# Func — Feature and Status Matrix

**Version:** 1.0 draft
**Date:** 2026-08-25
**Purpose:** one-page delivery view of what exists, what is intended, and what is blocked.

Status meanings:

- **Prototype built:** demonstrated with seeded, in-memory data.
- **Prototype incomplete:** some behaviour exists, but it is not a complete product contract.
- **Production foundation:** required before real users or real locations.
- **Needs evidence:** direction is plausible but demand or comprehension is unproven.
- **Deferred:** not part of the current launch slice.
- **Out of scope:** not part of the current product direction.
- **Decision required:** cannot be responsibly specified until Phoenix chooses.

| ID | Area | Feature | Current behaviour / intended behaviour | Status | Production gate or next evidence |
|---|---|---|---|---|---|
| SHELL-001 | Shell | Map-first navigation | Map is the primary route; supporting routes provide create, messages, inbox, and profile surfaces in the prototype. Final naming of Browse/Discover and Plans remains open. | Prototype built / decision required | Lock final navigation before broad redesign. |
| MAP-001 | Map | Globe and city map | Mapbox globe and city map with schematic fallback when no token is present. | Prototype built | Confirm Mapbox pricing, licensing, performance, and custom style direction. |
| MAP-002 | Map | Venue and event discovery | Public venues and invitations render through privacy-aware projections and selected previews. | Prototype built | Real map data source, freshness, loading, offline, and scale testing. |
| MAP-003 | Map | Map clustering | Co-located and nearby items are grouped; a known co-located marker chooser remains a usability fix. | Prototype incomplete | Resolve selection treatment before moderated study. |
| MAP-004 | Map | Live energy | Anonymous venue-level glow may appear when qualifying mutual activity exists; no names, counts, or coordinates are exposed. | Prototype built | Validate comprehension and server-side aggregation. |
| PRES-001 | Presence | DTF / Casual / Off | Explicit per-night status with self-expiry; DTF may permit exact friend visibility under the canonical relationship rules. | Prototype built | Real permissions, server authority, anti-spoofing, retention, and user controls. |
| PRES-002 | Privacy | Exact friend visibility | Viewer-relative exact location for qualifying friends only; casual, mutual, and unrelated viewers receive less or none. | Prototype built | Threat model, server-side redaction, disclosure audit, abuse testing. |
| PRES-003 | Privacy | Private-place protection | Outsiders see a safe area or neutral label; host and accepted attendees can receive exact private details. | Prototype built | Server-side policy, address-change handling, revocation, incident response. |
| POOL-001 | Pool | Create invitation | Personal or verified business host creates public/private invitation with access and capacity rules. | Prototype built | Invite expiry, edit/cancel, server transitions, notifications, moderation. |
| POOL-002 | Pool | Discover and join/request | Eligible person joins public opportunity or requests access to a private plan with party size. | Prototype built | Abuse limits, idempotency, duplicate requests, full-invite handling. |
| POOL-003 | Pool | Host review | Host reviews pending requests in batches and accepts or declines without over-capacity admission. | Prototype built | Concurrency, blocked users, report flow, audit records. |
| POOL-004 | Pool | Accepted reveal and conversation | Acceptance reveals permitted private details and creates the relevant bounded conversation. | Prototype built | Define pass semantics, revoke/remove behaviour, notifications, moderation. |
| POOL-005 | Pool | Pass | Product language implies a pass after acceptance; current prototype has no independent pass credential. | Decision required | Decide whether it is confirmation, guest-list record, QR credential, or non-binding social state. |
| MSG-001 | Messaging | Request and Pool conversations | Persona-scoped messages and participant-only threads; malformed or unauthorised reads fail closed. | Prototype built | Real-time transport, push, retention, report/block, spam controls, moderation. |
| PROFILE-001 | Identity | Personal profile | Seeded profile with status and selected identity information; production editing and account lifecycle absent. | Prototype incomplete | Auth, profile editing, privacy settings, recovery, deletion, moderation. |
| BUSINESS-001 | Business | Verified venue persona | Opaque venue identity can host a verified venue event without exposing operator identity. | Prototype built | Legal verification, operator roles, appeals, suspension, venue disputes. |
| BUSINESS-002 | Business | Business events | Same Pool invitation model with business-specific fields and known-venue anchoring. | Prototype built / incomplete | Define event fields, publishing rules, cancellation, analytics, commercial model. |
| DISC-001 | Discovery | Browse / Discover | Privacy-safe venue and invite shelves, search overlay, categories, and distance ordering exist in prototype. | Prototype incomplete | Lock final navigation, filters, ranking, sparse-city behaviour, sponsored rules. |
| STORY-001 | Stories | Live venue proof | Story concepts and limited seeded/text behaviour exist; media, authenticity, expiry, and moderation are not specified. | Prototype incomplete | Dedicated safety/media specification before production expansion. |
| AUTH-001 | Accounts | Real authentication | Not implemented; current identity is seeded and local. | Production foundation | Account, session, recovery, deletion, device and consent model. |
| VERIFY-001 | Trust | 18+ government-ID verification | Requirement is constitutional; prototype uses seeded adults only. | Production foundation | Select provider, consent, failure, appeals, retention, legal review. |
| VERIFY-002 | Trust | Business verification | Prototype simulates verified/unverified business state. | Production foundation | Select authority, operator proof, venue ownership, revocation, appeals. |
| SAFE-001 | Safety | Report and block | Not implemented in current prototype. | Production foundation | In-app reporting, block, escalation, response targets, audit. |
| SAFE-002 | Safety | Moderation operations | Not implemented. | Production foundation | Human queue, policy, tooling, staffing, appeals, incident response. |
| SAFE-003 | Security | Rate limits and audit | Not implemented. | Production foundation | Abuse model, rate limits, privacy-sensitive disclosure events, monitoring. |
| ANALYTICS-001 | Measurement | Product analytics | Not implemented as production telemetry. | Production foundation | Privacy-preserving events, consent, retention, dashboard and experiment rules. |
| PREMIUM-001 | Business model | Premium / disco ball | Vision only; possible entitlements include visibility and access benefits. | Deferred / decision required | Validate demand, fairness, safety, and monetisation before committing. |
| PET-001 | Companion | Customisable assistant creature | Concept only; no approved scope or safety model. | Deferred | Do not build before core-loop evidence and AI threat model. |
| REPUTATION-001 | Trust | Vouches / Backing | Retained idea, not current launch scope. | Deferred | Research gaming, fairness, safety, and user need. |
| COMMERCE-001 | Commerce | Payments and ticketing | Explicitly excluded from current direction. | Out of scope | Reconsider only through a new product decision. |
| MODE-001 | Product | Global Afters mode | Older direction removed; after-party invitations can remain as private plans. | Out of scope / decision required | Keep mode retired unless Phoenix explicitly restores it. |

## Current launch slice

The candidate launch slice is:

1. authenticated adult account;
2. 18+ verification;
3. map and venue discovery;
4. DTF / Casual / Off presence;
5. canonical server-side privacy projection;
6. personal and verified business profiles;
7. public and private Pool invitations;
8. request, host review, acceptance, safe reveal, and bounded chat;
9. report, block, moderation, rate limits, and auditability;
10. production analytics and incident response.

Stories, premium, the pet, reputation mechanics, recommendation intelligence, and broader business monetisation should not be treated as launch commitments until evidence and operating requirements exist.
