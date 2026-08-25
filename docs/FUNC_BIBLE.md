# Func — Product Bible

**Version:** 1.0 draft
**Date:** 2026-08-25
**Status:** Founder review required before being treated as constitutional
**Owner:** Phoenix Barnes, founder / CTO
**Companion documents:** [`docs/PRD.md`](/Users/phoenixbarnes/Developer/Func/docs/PRD.md), [`docs/FEATURE_MATRIX.md`](/Users/phoenixbarnes/Developer/Func/docs/FEATURE_MATRIX.md), [`docs/DESIGN_SYSTEM.md`](/Users/phoenixbarnes/Developer/Func/docs/DESIGN_SYSTEM.md), [`docs/PRIVACY_AND_SAFETY.md`](/Users/phoenixbarnes/Developer/Func/docs/PRIVACY_AND_SAFETY.md), [`docs/OPEN_DECISIONS.md`](/Users/phoenixbarnes/Developer/Func/docs/OPEN_DECISIONS.md)

> This is the durable statement of what Func is trying to be. It is not a backlog, a technical specification, or a promise that the current prototype is production-ready.

## 1. The line

**Func is a bridge between you and the opportunities of the night.**

Func helps a person see what is actually happening, understand the context, find the right people or places when permission allows it, and take a safe next step. It does not try to own the conversation after that. WhatsApp, text, and real life remain real life.

## 2. The feeling

Func should feel like opening a premium instrument that reveals a living city.

It should be:

- alive without being frantic;
- social without being exposing;
- desirable without being juvenile;
- useful without becoming a utility screen;
- expressive without becoming noise;
- trustworthy without feeling bureaucratic;
- memorable enough to be recognised in one glance.

The emotional promise is not “spend more time in Func.” It is: **open Func, find something real, and have a better night.**

## 3. The problem

The opportunity of a night out is fragmented across Instagram, TikTok, Google Maps, Eventbrite, venue sites, promoter messages, and private chats. Those systems show content, places, events, or conversations, but they do not give a person one trustworthy answer to:

> What is happening near me, who is open to the night, what does it feel like, and can I safely participate?

Func compresses that uncertainty into a living map and a small number of deliberate actions.

## 4. The product posture

The map is the centrepiece. Browse, profiles, messages, and notifications support the map; they do not replace it.

The core loop is:

```text
discover → understand → request or join → get accepted → go out
```

The product optimises for a useful real-world outcome, not for scrolling, streaks, or time spent.

## 5. What Func is not

Func is not:

- a replacement for WhatsApp or group chat;
- a generic social feed;
- a dating-first app;
- a ticketing or payments platform in the current direction;
- a surveillance map;
- a permanent group-management system;
- a voting or forced-decision app;
- a pressure system built around countdowns, streaks, or imposed schedules;
- a directory that exposes people who did not opt in;
- a promise that Func itself guarantees entry to a venue.

## 6. The constitution

These principles are Tier 0 and must not drift without Phoenix explicitly naming the change.

1. **Map first.** The map is the product’s primary interface.
2. **Opt-in presence.** Nobody appears as a person on the map without deliberately enabling a qualifying status for tonight.
3. **No pressure or surveillance.** No forced timelines, streaks, imposed schedules, or manipulative urgency.
4. **Party size, not administered groups.** A party is a temporary attribute of a request and, after acceptance, a bounded conversation. It is not a permanent social group object.
5. **Safe by construction.** Every people- or business-connecting feature must resist scams, stalking, harassment, and predatory behaviour before shipping.
6. **18+ with real verification before real social access.** The prototype uses seeded adults only. Production requires government-ID age verification and a women-first safety review of every social feature.
7. **Privacy is a product feature.** Exact location, venue information, identities, and messages are disclosed only through explicit viewer-relative rules.
8. **A night out is the success metric.** Engagement is secondary to a useful outcome.
9. **Free consumer layer, venue-side business model later.** Func should work without depending on any single venue. Payments and ticketing remain out of scope unless explicitly reconsidered.

## 7. The primary user

The initial consumer is an adult, approximately 18–25, who already goes out socially and wants to decide what to do without coordinating across five separate apps.

The first intended launch geography remains San Francisco and Los Angeles. The first research sample should be narrow enough to produce useful behavioural evidence: adults who go out socially and can describe what they did the last time they decided where to go.

Secondary users are verified venues and promoters who need a trusted way to publish opportunities, handle requests, and understand demand without receiving unrestricted access to personal identities or locations.

## 8. The product world

### The map

The map is a real city rendered in Func’s language. Opportunities come first, visible friends second, and anonymous live energy third. Glow can communicate life, but Func must not invent unsupported precision or expose people through aggregate signals.

### Presence

A person chooses **DTF**, **Casual**, or **Off** for tonight. DTF means open to the night and, subject to the exact relationship and time rules, eligible for exact friend visibility. Casual means browsing without a person pin. Off means peer-invisible. Presence expires automatically.

### Pool

Pool is the invitation and access mechanic. A host creates an invitation with access rules, capacity, place information, and party-size expectations. A person discovers it, joins or requests access, and the host accepts or declines. Accepted access creates the relevant bounded conversation. Pool must never quietly become a general-purpose group-management product.

### Public and private places

A public invitation is anchored to a known public commercial venue. A home, hotel, warehouse, after-party, or other sensitive place is private. Before acceptance, an outsider receives only a safe area label and generic private-plan wording. Exact private details are revealed only to the host and accepted attendees.

### Business identity

A verified venue or promoter may publish a business-created Pool invitation using a separate venue persona. The venue persona must not leak the operator’s personal identity. A business can host its own verified event, but business accounts do not join or request personal Pools in the current direction.

### Discovery and stories

Discovery helps a person find public opportunities and safe previews of private plans. Stories or live venue proof may become valuable, but media, authenticity, expiry, and moderation require a dedicated production specification. They are not allowed to expand by assumption.

### Profiles

Profiles establish that a person or business is real enough to make a decision without turning safety into a public popularity score. Personal and business identities are visibly distinct. Verification is a trust foundation, not a decorative badge.

## 9. The brand

Func is a **bright, living city map held inside a premium black-and-silver instrument**.

The visual language is:

- true black structure;
- smoked glass surfaces;
- restrained neutral liquid-metal chrome;
- white and silver for information and clarity;
- emerald only for genuinely live energy;
- controlled electric colour mainly for event artwork and selected identity moments;
- a chrome eye/person motif;
- custom iconography, never emoji glyphs;
- physical, spring-like motion;
- calm, factual information hierarchy beneath expressive surfaces.

The brand should feel specific and slightly strange, not like a generic “neon nightlife” template.

## 10. Motion and interaction

Motion should make the city feel physical, not make the user feel trapped in an attention machine.

- Pressed controls compress and rebound.
- Markers expand into cards while remaining spatially anchored.
- Live energy moves gently and meaningfully.
- Hero transitions are spacious and memorable.
- Sound and haptics enhance, but never replace, visual communication.
- Reduced motion replaces movement with clear fades and state changes.
- The opening story is logo → eye → blink → Earth → city → live map, subject to final asset and accessibility review.

## 11. Trust is part of the experience

Trust is not a compliance page at the end of the flow. It is visible in:

- the clarity of who can see what;
- the protection of private places;
- the separation of personal and business identities;
- the absence of unsupported numbers and claims;
- the ability to block and report;
- the accountability of verified hosts;
- the calmness of the product’s language;
- the willingness to say when something is simulated or unavailable.

## 12. What the current prototype proves

The active `func-mobile` build proves a coherent interaction and privacy model with seeded in-memory data. It includes the map and globe, nightly presence, privacy-projected friends and mutuals, Pool creation and discovery, private-place redaction, host review, acceptance, Pool conversations, personal and business personas, and verified-business event creation.

It does **not** prove demand, retention, real-world safety, production privacy, identity verification, or venue willingness to pay. It must not be used with real people or real locations in its current form.

## 13. The ambition and the discipline

Func can become a major product if it earns a specialised nightlife graph: intent, opportunities, trusted hosts, venue context, safe access, and successful nights out. That graph is not created by adding more screens. It is created by density, repeated use, reliable supply, and trust.

The company must therefore be willing to:

- test the core loop before expanding the feature count;
- bring in professional backend, security, trust-and-safety, and operations expertise;
- keep claims proportional to evidence;
- preserve the product constitution while allowing reversible detail changes;
- retire attractive ideas that do not strengthen the bridge to a real night out.

## 14. Founder review gates

Before this Bible becomes constitutional, Phoenix must explicitly review:

- whether Pool is the enduring name and mechanic for access;
- whether the “pass” is a social confirmation or an operational entry credential;
- whether after-party invitations remain while the global Afters mode stays retired;
- whether the pet remains a future possibility or is removed from the vision;
- the final type hierarchy and black/tile colour;
- the launch navigation names;
- what counts as launch-critical versus post-validation expansion.

Those questions are recorded, without being silently answered, in [`docs/OPEN_DECISIONS.md`](/Users/phoenixbarnes/Developer/Func/docs/OPEN_DECISIONS.md).
