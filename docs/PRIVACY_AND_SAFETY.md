# Func — Privacy and Safety Specification

**Version:** 1.0 draft
**Date:** 2026-08-25
**Authority:** Decision 017 and the safe projected-location design
**Production warning:** the current implementation is simulated and client-only; this specification is not a claim of production security.

## 1. Core rule

Every screen receives the least information needed for its job. Screens must never reach around a projection boundary to read raw people, relationships, coordinates, requests, messages, or business operators.

The production server must enforce this policy before data reaches the device. The client projection remains a defensive layer and test oracle.

## 2. Fail closed

Missing, malformed, duplicated, future-dated, expired, contradictory, or unauthorised data produces less disclosure or no disclosure. It must never produce a best guess that leaks identity, location, private-plan existence, or thread membership.

Neutral absence is a safety feature. A guessed or copied link must not reveal whether the underlying object exists.

## 3. Disclosure matrix

| Subject | Viewer | Permitted disclosure |
|---|---|---|
| Personal presence | Self | Exact current fix only when valid and live |
| Personal presence | Authorised friend with qualifying DTF state | Exact fix under current relationship and time rules |
| Personal presence | Casual friend | No person pin |
| Personal presence | Mutual | Anonymous venue-level glow only when threshold is met |
| Personal presence | Unrelated viewer | No disclosure |
| Public venue | Any viewer | Known public venue information and validated coordinate |
| Public invitation | Eligible viewer | Public venue and safe invitation information |
| Private invitation | Host / accepted attendee | Exact private details allowed by invitation policy |
| Private invitation | Pending / denied / unrelated | Safe area label, generic wording, or neutral absence |
| Business venue persona | Permitted viewer | Venue identity and verified business information; never operator identity by fallback |
| Pool request | Host | Only permitted requester and party information |
| Pool request | Requester | Own state and permitted invitation information |
| Pool thread | Participant | Thread messages and participant identities permitted by policy |
| Pool thread | Non-participant | Neutral not-found result |

## 4. Presence requirements

Presence is explicit, nightly, and self-expiring. Production must specify:

- foreground versus background collection;
- location permission timing and copy;
- fix freshness and accuracy thresholds;
- server clock and local-time expiry behaviour;
- whether raw fixes are stored and for how long;
- user-visible pause/off controls;
- account/device/session mismatch handling;
- anti-spoofing and suspicious movement handling;
- deletion and export controls;
- incident response for accidental disclosure.

## 5. Private places

Private places include homes, hotels, warehouses, after-parties, and any place whose exact disclosure could create physical risk. Before acceptance:

- do not expose the exact coordinate;
- do not expose authored text that reveals the address;
- do not leak the location through map bounds, search, distance, error messages, notification previews, or deep links;
- show only a safe area label or neutral absence;
- re-check authorisation at read time, not only when the request was created.

After acceptance, the server must issue only the exact details the host and accepted attendee are authorised to see. Revocation, attendee removal, cancellation, and address changes must invalidate prior access according to policy.

## 6. Business personas

Business operators authenticate as people but act through an opaque venue persona. The UI and API must not silently substitute the operator’s personal profile when a venue identity is missing, malformed, duplicated, or revoked.

Verified businesses may host their own venue-linked public invitations. Verification loss must immediately affect publishing and trusted presentation. Appeals, ownership disputes, operator roles, suspension, and audit records are production requirements.

## 7. Messaging safety

Before real users:

- report and block must exist in every relevant conversation;
- request-gated messaging must not become a repeated-contact loophole;
- rate limits must cover requests, messages, links, and repeated attempts;
- message previews and push notifications must avoid leaking private details;
- moderation must cover harassment, coercion, scams, threats, sexual exploitation, and predatory behaviour;
- users need account-level mute, block, report, and safety escalation paths;
- deletion and retention rules must be clear.

## 8. Verification and moderation gates

Production requires:

- 18+ government-ID verification with consent, failure, appeals, and retention policy;
- business verification and revocation;
- reporting of users, invitations, messages, venues, stories, and businesses;
- user blocking;
- moderation queue and human escalation;
- response targets and incident playbooks;
- account suspension and deletion;
- abuse monitoring and auditability;
- independent security and women-first safety review before real location/social access.

## 9. Safety acceptance criteria

No feature connecting people or businesses is launch-ready unless:

1. its disclosure matrix is written;
2. unauthorised reads fail closed;
3. report and block entry points are reachable;
4. rate-limit and abuse cases are defined;
5. production authority is server-side;
6. audit events exist for sensitive transitions;
7. the user can understand the relevant privacy state without sound or animation;
8. the safety owner has reviewed the abuse cases;
9. incident response and appeals have an operational owner.
