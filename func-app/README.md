# func-app

The TypeScript + React Native rebuild of func. Replaces `prototype-web/`, which
is frozen at tag `prototype-web-reference` and kept runnable as the reference
implementation.

## Where this is up to

| Stage | What | State |
|---|---|---|
| 0 | Freeze and preserve the prototype | **Done** |
| 1 | Domain layer in TypeScript | **Done** — 123 tests passing, typecheck clean |
| 2 | Persistence + platform services behind interfaces | Not started |
| 3 | React Native app shell + navigation | Not started |
| 4 | Screens, in user-journey order | Not started |
| 5 | Map (MapLibre) | Not started |
| 6 | Parity check + fresh bug hunt | Not started |

`FUNCTIONAL-INVENTORY.md` is the checklist every stage is measured against. It
lists every capability in the frozen prototype with an explicit destination, so
nothing is dropped by accident.

## Running it

Node 22.11 / npm 10.9.

```bash
cd func-app && npm install && npm test && npm run typecheck
```

## Layout

```
src/domain/          Pure rules. Imports nothing outside this folder.
  ids.ts             Branded identifiers
  clock.ts           Time as an injected dependency
  geography.ts       World → Country → Region → City → District → Venue
  presence.ts        DTF, expiry, location fixes
  visibility.ts      Who may see whose location, and how precisely
  access.ts          request → accept → pass, capacity, address reveal
  accounts.ts        Signup, the 18+ gate, onboarding routing
  spots.ts           Local spots and the token economy
  stories.ts         Check-in geofence and the verified mark
  threads.ts         Per-request correspondence, deliberately not a chat app
  venues.ts          Claiming venues, posting tables
  engagement.ts      Night rating → heat, saved items, interest
  __tests__/         123 tests
```

## The product model, in short

Three things the prototype collapsed into one field are now separate:

- **Availability** — the traffic light. An explicit statement of intent.
- **Location** — where the device is. A fact about the world.
- **Sharing permission** — who may see it, decided in advance.

DTF is the switch that connects them:

| Viewer | Sees your location when |
|---|---|
| **Friend** | your DTF is on |
| **Mutual** | **both** of you have the mutuals setting on **and both** of you are DTF |
| **Anyone else** | never — anonymous heat only |

Precision differs by relationship. Friends get an exact position; mutuals get
presence only — *"people you know are here"*, never who or exactly where. This
is enforced by the types, not by discipline: the aggregate result carries no
coordinates, so a screen cannot render a mutual's position even by mistake.

DTF expires by itself at the next local **12:00**, adjustable, and can be
switched off at any moment. The mutuals setting is permanent and never expires —
but grants nothing on its own, because DTF still gates it.

This keeps Tier 0 intact: presence stays opt-in, per night, self-expiring, and
nobody is on the map without having turned DTF on. What changed is that within
that window your friends keep seeing you **without you touching the app again**.

## What the tests cover

**123 tests, all passing.** The ones worth knowing about, because they encode
product rules rather than implementation details:

- all 16 rows of the mutuals visibility matrix — exactly one grants anything
- DTF expiry at local noon across three time zones and both DST transitions
- stale and future-dated location fixes withheld rather than shown as current
- capacity counted by party size, so a party of six consumes six seats
- the self-listing and authorisation guards on every request transition
- an after-party address revealed at exactly one moment and to exactly one person
- every fail-closed branch of the 18+ gate, including a document that
  contradicts what was typed at signup
- tokens counted from the visit log, one per person per spot
- the venue geofence behind a story's verified mark

A previous browser-based stopgap (`verify/`) stood in while Node was missing.
It has been deleted; its coverage is now in the TypeScript tests. Recoverable
from commit `1329edf` if ever needed.

## Rules for working in here

1. **Nothing in `src/domain` may import from outside it.** No React, no storage,
   no platform APIs.
2. **No city may be named in the domain layer.** San Francisco is seed data
   loaded through the same interfaces any other city would use. Deleting it must
   leave a working product.
3. **Never call `Date.now()` in the domain.** Take a `Clock`.
4. **Money is integer minor units.** The prototype floored dollars and lost
   cents.
5. **Location visibility is decided in `visibility.ts` and nowhere else.** No
   screen, query or cache may re-derive it.
6. **Anything removed from the inventory is removed on purpose**, with the
   reason written down.
