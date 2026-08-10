# func-app

The TypeScript + React Native rebuild of func. Replaces `prototype-web/`, which
is frozen at tag `prototype-web-reference` and kept runnable as the reference
implementation.

## Where this is up to

| Stage | What | State |
|---|---|---|
| 0 | Freeze and preserve the prototype | **Done** |
| 1 | Domain layer in TypeScript | **Substantially done** — presence, visibility, access, accounts, spots, stories, geography, ids |
| 2 | Persistence + platform services behind interfaces | Not started |
| 3 | React Native app shell + navigation | Not started |
| 4 | Screens, in user-journey order | Not started |
| 5 | Map (MapLibre) | Not started |
| 6 | Parity check + fresh bug hunt | Not started |

`FUNCTIONAL-INVENTORY.md` is the checklist every stage is measured against. It
lists every capability in the frozen prototype with an explicit destination, so
nothing is dropped by accident.

## ⚠️ Node is not installed on this machine

This blocks stages 2–5 entirely and stops stage 1 being typechecked or unit
tested. React Native, Expo, `tsc` and the test runner all need it.

```bash
curl -fsSL https://nodejs.org/dist/v22.11.0/node-v22.11.0.pkg -o ~/Downloads/node.pkg && open ~/Downloads/node.pkg
```

Then:

```bash
cd "$(git rev-parse --show-toplevel)/func-app" && npm install && npm test && npm run typecheck
```

Until that happens, the rules are verified by `verify/index.html` instead — see
below.

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
  __tests__/         Real tests, runnable once Node exists
verify/              Stopgap browser rule-check — delete once Node is installed
```

### Still to do in stage 1

Threads and messages, venue claiming and table posting, night rating → heat,
saved items, and expressed interest. All small, all mechanical, none of them
carrying new product decisions.

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

## Verifying without Node

`verify/` runs the presence and visibility rules in a browser — a
line-for-line transcription of the same logic into plain JavaScript, exercised
over the full truth table.

```bash
cd func-app && python3 -m http.server 8779
```

Then open <http://localhost:8779/verify/index.html>. Last run: **94/94 passed** —
all 16 rows of the mutuals matrix, DST-crossing expiry in three time zones,
stale-fix withholding, the venue rollup, capacity by party size, the
self-listing and authorisation guards, after-party address reveal, every
fail-closed path in the 18+ gate, the token rules, and the check-in geofence.

It is a stopgap, not a shipping artifact. Rules change in the TypeScript first;
`verify/` is deleted the day Node arrives.

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
