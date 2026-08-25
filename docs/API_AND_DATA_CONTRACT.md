# Func — Production API and Data Contract Direction

**Version:** 1.0 draft
**Date:** 2026-08-25
**Purpose:** give a professional engineering team a bounded production direction without pretending the backend has already been designed in detail.

## 1. Architectural rule

The current `FuncRepository` and in-memory snapshot are a useful prototype seam. Production must not simply return the entire world as one raw snapshot. It should expose viewer-scoped read models and explicit, authorised commands.

The client may retain a defensive `viewFor()` projection, but the server is authoritative for identity, permissions, state transitions, location disclosure, and audit events.

## 2. Core domains

- accounts and sessions;
- personal profiles and verification;
- businesses, venues, and operator roles;
- nightly presence and location fixes;
- relationships and visibility capabilities;
- Pool invitations, requests, acceptance, and access confirmation;
- conversations and messages;
- stories/media;
- notifications;
- moderation, reports, blocks, appeals, and suspensions;
- entitlements and future business promotion;
- analytics and privacy-sensitive audit.

## 3. Read-model principles

Read models should contain capability-shaped fields rather than raw secrets, for example:

```text
canJoin
canRequest
canMessage
canViewExactLocation
canReviewRequests
canPublishAsVenue
canReport
canBlock
```

Private coordinates, raw relationship graphs, operator identities, and hidden thread IDs must never be included in generic payloads and filtered later by screens.

## 4. Command principles

Commands that can be retried must be idempotent and server-authoritative:

- enable/disable presence;
- create/edit/cancel invitation;
- join public invitation;
- submit private request;
- accept/decline request;
- send message;
- create story/media post;
- report/block;
- publish or revoke business event.

Every state transition must validate the current state again at commit time. Capacity acceptance must be atomic. A failed command must not partially admit a person, reveal a private place, or create an orphan conversation.

## 5. Real-time requirements

The eventual production system needs bounded real-time updates for:

- request status;
- acceptance/decline;
- Pool conversation;
- presence expiry or off state;
- business verification changes;
- moderation/suspension actions where relevant.

The client must handle reconnect, duplicate delivery, stale reads, offline actions, and server conflict without exposing more data.

## 6. Audit events

At minimum, audit:

- identity and business verification changes;
- presence enable/disable/expiry;
- exact-location disclosure;
- private-place reveal;
- request acceptance/decline;
- message access changes;
- reports, blocks, suspensions, and appeals;
- business persona usage;
- moderation decisions.

Audit records must be access-controlled, retention-limited, and reviewable by the appropriate safety/operations role.

## 7. Production non-functionals

- secure authentication and session management;
- encrypted transport and storage appropriate to the data;
- least-privilege services and operator access;
- rate limits and abuse detection;
- cursor pagination and bounded payloads;
- observability, crash reporting, alerting, and rollback;
- staging environment and seeded non-real test data;
- automated contract, privacy, abuse, and concurrency tests;
- data deletion, retention, export, and regional legal requirements.

## 8. What the current prototype does not define

The following require a professional architecture decision before production implementation:

- backend provider and deployment model;
- data store and geospatial strategy;
- real-time transport;
- identity-verification provider;
- business-verification provider;
- media storage/transcoding/CDN;
- notification provider;
- moderation tooling and staffing model;
- analytics/privacy system;
- legal retention and data residency policy.

This document is an engineering boundary, not permission to choose those providers silently.
