# Func — Product Thesis

**Version:** 5.0 draft
**Date:** 2026-08-25
**Status:** Current local product truth; founder review required
**Canonical implementation:** `func-mobile` — Expo SDK 57, React Native, TypeScript, Mapbox

## The line

**Func is a bridge between you and the opportunities of the night.**

Func shows what is happening, shows people or places only when permission allows, and helps someone take a safe next step. It does not replace WhatsApp, force a schedule, or optimise for time spent.

## The problem

Deciding what to do tonight means checking Instagram, TikTok, Google Maps, event pages, venue sites, promoter messages, and group chats. The information exists, but the useful answer is fragmented: what is actually happening, who is open, what does it feel like, and can I participate safely?

## The product

1. **Map first.** A living city map shows venues, opportunities, approved friend context, and anonymous live energy without unsupported heat claims.
2. **Nightly presence.** DTF, Casual, or Off. Presence is explicit, temporary, self-expiring, and viewer-relative.
3. **Pool access.** A host creates an invitation; a person joins or requests; the host accepts or declines; accepted people coordinate in a bounded conversation.
4. **Private-place protection.** Sensitive locations reveal only to the host and accepted attendees.
5. **Verified business identities.** Venues and promoters can publish through accountable, opaque venue personas rather than exposing operators.
6. **Discovery support.** Search, categories, and opportunity cards support the map. They do not become an infinite content feed.

## What Func refuses to do

- expose a person who did not choose to be visible;
- use forced timers, streaks, voting, or manipulative urgency;
- turn party size into a permanent group-management system;
- process payments or tickets in the current direction;
- make client-side simulation look like production security;
- use emoji glyphs as interface iconography;
- silently reveal private addresses, operator identities, or hidden threads.

## Why it could matter

The opportunity is not another social feed. It is a specialised nightlife graph combining intent, current opportunity, trusted host supply, safe access, and successful real-world outcomes. The map, visual identity, and privacy model are foundations; the moat is only earned through density, repeated use, reliable hosts, and trust.

## Current truth

The active mobile prototype demonstrates the map, globe, presence, privacy projections, Pool flows, private-place redaction, messaging, business personas, and verified-business event rules with seeded in-memory data. It has no real accounts, backend, persistence, government-ID verification, server-side enforcement, moderation operation, rate limits, or auditability. It must not be used with real people or real locations.

## Riskiest assumptions

1. Adults will create and accept Pool invitations rather than stay in existing habits.
2. People will understand and trust the visibility controls enough to enable presence.
3. Hosts and venues will respond quickly enough for the loop to feel useful.
4. One city can be seeded to useful density before expansion.
5. Production verification, moderation, and safety operations can be made viable at the intended price point.

## What happens next

Run 10–15 moderated prototype sessions through the map → discover → request → review → acceptance → safe reveal loop. Use the results to choose the next product milestone. Then build the production foundation: trusted accounts, server-side privacy, verification, moderation, reporting, blocking, rate limits, auditability, and observability.

The product should feel like **a bright, living city map held inside a premium black-and-silver instrument**. Excitement comes from the city being alive, not from pressuring the user to remain inside Func.
