# Functional inventory — what the migration must account for

Source of truth: `prototype-web/` at tag **`prototype-web-reference`** (commit `6d901dd`).

Every genuinely functional capability in the frozen prototype is listed here with
an explicit destination in the TypeScript + React Native architecture. Nothing
gets dropped by accident — anything removed is removed **on purpose**, with the
reason recorded in the Disposition column.

Disposition values:

| Value | Meaning |
|---|---|
| **Port** | Move as-is into the new architecture |
| **Port+** | Move, but the new product direction changes its behaviour |
| **Redesign** | The need is real; the current mechanism is wrong |
| **Cut** | Deliberately removed — reason given |
| **Defer** | Not in the first migration pass; not forgotten |

---

## 1. Identity, accounts, session

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 1.1 | Consumer signup (name, dob, email/phone) | `store.createAccount` | Port | `domain/accounts` |
| 1.2 | Business signup — business **is** its own actor, no owner-person record | `store.createAccount` | Port | `domain/accounts` |
| 1.3 | 18+ ID verification state machine: `unverified → pending → verified \| rejected` | `store.submitVerification`, `resolveVerification` | Port | `domain/verification` |
| 1.4 | Under-18 stays **rejected** and is gated out — fails **closed** on unparseable dob | `store.resolveVerification` | Port | `domain/verification` — keep the fail-closed default, it is a compliance rule |
| 1.5 | Calendar-accurate age math (not a 365.25-day divisor) | `store.ageFromDob` | Port | `domain/verification` |
| 1.6 | Pending verification survives reload (timer re-armed at boot) | `store.rearmPendingVerifications` | Redesign | Real async job, not a `setTimeout` |
| 1.7 | Profile completion (name, bio, Instagram) | `store.completeProfile` | Port | `domain/profile` |
| 1.8 | Onboarding completion flag | `store.completeOnboarding` | Port | `domain/accounts` |
| 1.9 | Session (who is logged in on this device) | `store.session.personId` | Port | `services/session` |
| 1.10 | Logout — clears session **and** the persona override | `store.logout` | Port | `services/session` — the scope bug this fixed must not return |
| 1.11 | Premium flag (disco ball) | `store.setPremium` | Port | `domain/accounts` |
| 1.12 | Photo upload (data URLs) | `store.uploadPhoto` | Redesign | Real file/asset service |
| 1.13 | QA persona switcher (act as another actor, tab-scoped) | `persona-switcher.js` | Port | Dev-only tool, must not ship in release builds |

## 2. Relationships and presence — **the biggest change**

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 2.1 | Friendship | Static `friend: true` flag on the seed person — global, not per-viewer | **Redesign** | Real relationship edges in `domain/relationships` |
| 2.2 | Mutual / friend-of-friend | Static `mutual: N` count on the seed person | **Redesign** | Derived from the edge graph, not stored |
| 2.3 | Traffic light: green (DTF) / amber (casual) / red (not out) / disco (premium) | `store.setStatus` | **Port+** | `domain/presence` — DTF now also gates location |
| 2.4 | Status expiry | Rolling 8h → red | **Port+** | Now expires at the **next 12:00**, user-adjustable, switch-off-any-time |
| 2.5 | Location of another person | Does not exist — `person.venue` is authored seed data | **New** | `domain/presence` + `services/location` |
| 2.6 | Location-sharing permission | Does not exist | **New** | DTF gates friends; a separate permanent setting gates mutuals |
| 2.7 | Friend vs mutual intimacy gradient | Does not exist — both render as identical named avatars | **New** | `domain/visibility` — friends exact, mutuals aggregate-only |
| 2.8 | "Who's here" at a venue | `peopleAt()` + `describeWho()` | **Port+** | Rebuilt on the visibility rules |

## 3. Map

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 3.1 | Pan / zoom / camera | Hand-rolled SVG transform | Cut | Replaced by the map library |
| 3.2 | Venue markers sized and lit by heat | `app.drawMarks` | Port | Map layer |
| 3.3 | Heat as glow only — never a number or word on the map | `app.drawMarks` | Port | A product rule, not a styling detail |
| 3.4 | Story rings around venues, freshest brightest | `app.drawMarks` | Port | Map layer |
| 3.5 | Friend/mutual count badge on a venue | `app.drawMarks` | **Port+** | Must respect the new intimacy gradient |
| 3.6 | Local spot markers | `app.drawMarks` | Port | Map layer |
| 3.7 | After-party markers | `app.drawMarks` — **gated behind Afters mode** | **Port+** | Always visible; the gate is removed |
| 3.8 | "You are here" dot | Fixed `YOU_LL` constant | **Redesign** | Real device location |
| 3.9 | 3D building extrusion | `build_bld.py` → `sfmap.js` | Defer | Map library styling |
| 3.10 | Filters: kind, vibe, cost, distance, green-only, search | `st.filters*`, `passesFilter` | Port | Moves into real app state — must fire change events |
| 3.11 | Live-now venue strip | `mapUI.fillStrip` | Port | Component |
| 3.12 | Globe / city picker | `screens.globe` — 6 hardcoded cities at hand-placed pixels | **Redesign** | Driven by the geography model |

## 4. Access — request → accept → pass

**The most carefully debugged part of the system. Every guard below was a real bug.**

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 4.1 | Send request with party size | `engine.sendRequest` | Port | `domain/access` |
| 4.2 | Host accepts → issues a pass with code | `engine.acceptRequest` | Port | `domain/access` |
| 4.3 | Host declines, with optional reason | `engine.declineRequest` | Port | `domain/access` |
| 4.4 | Guest cancels a pending request | `engine.cancelRequest` | Port | `domain/access` |
| 4.5 | **Capacity counts party size, not request count** | `store.acceptedCountForTable` | Port | A party of 6 consumes 6 seats. Regression here means overbooking |
| 4.6 | **Self-request/self-accept blocked** at both create and accept time | `engine.sendRequest`, `acceptRequest` | Port | Checked at accept because that is where a seat is really consumed |
| 4.7 | **Duplicate pending request** for the same target blocked | `engine.alreadyPendingForSameTarget` | Port | `domain/access` |
| 4.8 | Free accounts capped at 3 pending; premium unlimited | `engine.canSendRequest` | Port | `domain/access` |
| 4.9 | Only the host may accept/decline; only the guest may cancel | `engine.*Request` | Port | Authorisation belongs in the domain, never the UI |
| 4.10 | Accept increments the guest's "nights out" | `store.incrementNights` | Port | `domain/access` |
| 4.11 | Pass with QR + code | `screens.passCard`, `qr` | Port | Component |
| 4.12 | After-party address revealed **only on accept** | `screens.after`, `askAfter` | Port | Safety mechanic — a Tier 0-adjacent rule |
| 4.13 | Accept/decline events fire exactly once, incl. cross-tab | `engine.reconcile` | Port | Real-time subscription |

## 5. Content and the local economy

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 5.1 | Post a story | `store.postStory` | Port | `domain/stories` |
| 5.2 | Verified mark only when genuinely checked in at the venue | `store.postStory` | Port | `domain/stories` |
| 5.3 | Stories expire (6h) and age in real minutes | `store.expireOldStories` | Port | `domain/stories` |
| 5.4 | Story reel viewer | `screens.reel` | Port | Component |
| 5.5 | Check in to a venue (3h) | `store.checkIn` | **Port+** | No longer a presence source — only proof-of-venue for stories |
| 5.6 | Drop a local spot | `store.dropSpot` | Port | `domain/spots` |
| 5.7 | Visit a spot → token to the dropper, one per visitor per spot | `store.visitSpot` | Port | `domain/spots` |
| 5.8 | Cannot earn a token from your own spot | `store.visitSpot` | Port | `domain/spots` |
| 5.9 | Rate the night → moves venue heat, once per pass | `engine.rateNight` | Port | `domain/rating` |
| 5.10 | Save an item (venue/spot) from Browse | `store.saveItem` | Port | `domain/saved` |
| 5.11 | Express interest / see who wants you (premium) | `store.expressInterest` | Port | `domain/interest` |

## 6. Messaging

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 6.1 | One thread per request, auto-created | `engine.sendRequest` | Port | `domain/threads` |
| 6.2 | Messages with sender + timestamp | `engine.sendMessage` | Port | `domain/threads` |
| 6.3 | System messages ("X accepted") | `engine.acceptRequest` | Port | `domain/threads` |
| 6.4 | Thread closes on decline/cancel | `engine.declineRequest` | Port | `domain/threads` |

Scope guard: Tier 0 says func does not host the conversation. Threads stay
scoped to a single request and must not grow into general-purpose chat.

## 7. Business

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 7.1 | Business dashboard | `screens.businessDashboard` | Port | Screen |
| 7.2 | Claim a venue; blocked if already claimed; idempotent if already yours | `store.claimVenue` | Port | `domain/venues` |
| 7.3 | A business may run more than one venue | `store.claimVenue` | Port | `domain/venues` |
| 7.4 | Post a table offer (seats, per-head, vibe) | `store.postTable` | Port | `domain/venues` |
| 7.5 | Per-head is a real currency amount, rounded to the cent | `store.postTable` | Port | Use a money type, not a float |
| 7.6 | Host request queue with accept/decline | `screens.buildInbox` | Port | Screen |
| 7.7 | Business profile view | `screens.businessDashboard` | Port | Screen |

## 8. Shell, navigation, platform

| # | Capability | Where it lives now | Disposition | Destination |
|---|---|---|---|---|
| 8.1 | Five tabs, map dead centre | `app.mount`, `screens.mount` | Port | Navigation |
| 8.2 | Bottom sheets | `screens.openSheet` | Port | Component |
| 8.3 | Toasts | `screens.toast` | Port | Component |
| 8.4 | Haptics | `app.buzz` | Port | Platform service |
| 8.5 | Custom icon set — **no emoji as iconography, ever** | `app.I` | Port | Tier 0 design rule |
| 8.6 | Cold-open animation | `app.coldOpenV2` | Defer | Layer 5 — the six-beat storyboard is unbuilt |
| 8.7 | The pet — on-map creature with contextual speech | `pet-brain.js` | Port+ | Its late-night line references Afters mode and must change |
| 8.8 | Cross-tab state sync | `store` + `storage` event | Redesign | Real-time backend concern |
| 8.9 | Demo mode — scripted pitch walkthrough | `index.html`, `engine-demo.js` | Defer | Keep the frozen web version for pitching until parity is reached |

## 9. Being deliberately removed

| # | Capability | Why |
|---|---|---|
| 9.1 | **Afters mode** — the global mode flag, Profile toggle, clock-triggered nudge banner, and `.afters` app-wide reskin | func behaves consistently at all times. Verified live: this mode hid all three after-parties from the map entirely. The after-parties themselves stay and become permanently visible. |
| 9.2 | Rolling 8-hour status expiry | Replaced by expiry at the next 12:00, user-adjustable |
| 9.3 | Check-in as a source of presence | Presence now comes from real location + DTF. Check-in survives only as proof-of-venue for verified stories |

## 10. Known gaps in the prototype — do not port the gap

- No location services of any kind.
- No relationship graph; `friend`/`mutual` are per-person flags meaning "relative to `you`".
- No persistence migration path — a schema version bump discards all data.
- No tests anywhere.
- Business id doubles as account id and host id — works, but the ambiguity is where identity bugs cluster.
- Filters live outside the store and fire no change events, so screens go stale.
- SF is structural, not seed: baked map geometry, a projection derived from a fixed bounding box, a hardcoded "you are here" coordinate, and 9 hardcoded "San Francisco" strings.

## 11. Data preservation finding

Inspected the live `localStorage` (`func:v1`, version 4): **3,144 bytes, entirely QA
residue** from the bug-hunt sessions — one test person ("FilterTest"), one test
business ("ClaimTestCo"), 3 dropped spots, 1 posted table, 1 visit. No real users,
no production data, no requests, passes, threads or messages.

**Conclusion: this is a clean development migration.** No instance data needs to be
carried across. The obligation is to map the **schema** field-by-field into the typed
model — which this inventory does — not to preserve rows. No destructive reset is
required or performed; the existing browser state is simply left alone.
