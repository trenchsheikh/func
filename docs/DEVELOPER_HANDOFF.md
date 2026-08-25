# Func — Developer Handoff

**Version:** 1.0 draft
**Date:** 2026-08-25
**Active app:** `/Users/phoenixbarnes/Developer/Func/func-mobile`
**Active checkpoint:** `aac98d3`

## 1. Read first

1. [`docs/FUNC_BIBLE.md`](/Users/phoenixbarnes/Developer/Func/docs/FUNC_BIBLE.md)
2. [`docs/PRD.md`](/Users/phoenixbarnes/Developer/Func/docs/PRD.md)
3. [`docs/FEATURE_MATRIX.md`](/Users/phoenixbarnes/Developer/Func/docs/FEATURE_MATRIX.md)
4. [`docs/PRIVACY_AND_SAFETY.md`](/Users/phoenixbarnes/Developer/Func/docs/PRIVACY_AND_SAFETY.md)
5. [`docs/DESIGN_SYSTEM.md`](/Users/phoenixbarnes/Developer/Func/docs/DESIGN_SYSTEM.md)
6. [`docs/API_AND_DATA_CONTRACT.md`](/Users/phoenixbarnes/Developer/Func/docs/API_AND_DATA_CONTRACT.md)
7. [`docs/OPEN_DECISIONS.md`](/Users/phoenixbarnes/Developer/Func/docs/OPEN_DECISIONS.md)
8. [`func-mobile/README.md`](/Users/phoenixbarnes/Developer/Func/func-mobile/README.md)

The connected Master Product Spec v4.1 and Feature & Decision Tracker remain stakeholder references. If the repo, tracker, and master spec disagree, stop and reconcile; do not choose the most convenient version.

## 2. Current implementation shape

- `func-mobile/app/` — Expo Router screens and routes;
- `func-mobile/src/domain/` — pure product and privacy rules;
- `func-mobile/src/data/` — repository, in-memory state, seed data, and projections;
- `func-mobile/src/ui/` — theme, components, map renderers, and shared UI;
- `func-mobile/src/data/views.ts` — viewer-relative permitted view boundary;
- `func-mobile/src/ui/map/content.ts` — map projection and content shaping.

Preserve these seams. Do not move privacy decisions into screens, duplicate status logic in components, or expose raw snapshots to UI.

## 3. Current verification reality

The current app is a simulated in-memory prototype. It has no real accounts, authentication, persistence, server-side privacy, government-ID verification, business-verification authority, moderation, rate limits, auditability, production analytics, or real-world location safety.

Current local verification from the Stage 8A/visual checkpoint:

- `npm test`: 147 cases, 144 pass, three known pre-authorised residual failures;
- `npm run typecheck`: stale `livePinFor` import residual only;
- `git show --format= --check HEAD`: clean;
- source tree clean at the last application checkpoint; unrelated documentation work may be uncommitted.

Do not restore `livePinFor`. Do not describe the residuals as product functionality.

## 4. Implementation order for a professional team

### Phase 0 — contract review

- approve Bible, PRD, feature matrix, safety, design, and open decisions;
- run the 10–15 target-user core-loop study;
- resolve navigation and pass semantics;
- freeze the launch slice.

### Phase 1 — production foundation

- auth and sessions;
- 18+ and business verification;
- persistence and server-authoritative permissions;
- presence and location policy;
- Pool state machine;
- messaging and notifications;
- reports, blocks, moderation, rate limits, and audit;
- analytics, retention, deletion, and incident response.

### Phase 2 — controlled alpha

- one city;
- small adult cohort;
- trusted hosts/venues;
- manual support and moderation;
- security and safety review;
- measure useful discovery, acceptance, successful nights, repeat use, and incidents.

### Phase 3 — evidence-led expansion

Only after the core loop is working: media stories, recommendation systems, business promotion, premium, the pet, reputation, and additional cities.

## 5. Hard constraints

- Keep TypeScript/Expo unless Phoenix explicitly changes the stack.
- Keep the safe projected-location design; do not add a blanket `.location` ban.
- Do not touch `/Users/phoenixbarnes/Developer/Func-safe-map`.
- Do not use protected simulator `1FFE46C0-5FAC-47E8-B09E-F10BB9425045`.
- Do not use Metro 8081.
- Do not start native QA until Stage 8A is accepted.
- Preserve intentional M1–M8 and later privacy/persona work.
- The stale `repository.test.ts` import of removed `livePinFor` is pre-authorised; do not restore the API.
- All app coding/hard implementation is delegated to Claude Sonnet 5 through Claude Work/Cowork at the highest available code-effort setting. A fresh bounded handover is required for each implementation slice.

## 6. Definition of a good handoff

A developer should be able to answer, without asking for hidden chat history:

- what Func is;
- what is current, deferred, retired, or unresolved;
- what the core loop does;
- what each viewer can see;
- what is actually built;
- what must be server-enforced;
- what safety gates block a real pilot;
- which visual decisions are locked;
- which decisions require Phoenix;
- how to verify a change without touching protected resources.
