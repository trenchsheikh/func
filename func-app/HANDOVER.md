# func — engineering handover

**Written 2026-08-10. Read this in full before touching anything.**

You are continuing work on func, directly under Phoenix Barnes, the founder.
This document is the state of the world. The paste-in prompt that brought you
here covers your role and the standard you are held to; this covers what exists.

---

## 1. Where everything is

| Path | What it is |
|---|---|
| `func-app/` | **The product.** TypeScript + React Native. This is what you work on. |
| `func-app/FUNCTIONAL-INVENTORY.md` | The checklist the migration is measured against. Every capability, with a destination. |
| `prototype-web/` | **Frozen.** Tag `prototype-web-reference`, commit `6d901dd`. The old vanilla-JS prototype, still runnable, kept as the parity oracle. Do not develop it. |
| `prototype/` | The retired Expo/Velmont direction. Do not build on it. |
| `func. - prototype 1/` | A bare SwiftUI template, separate git repo, no functionality. Ignore. |
| `docs/` | Product truth: `PRD.md`, `DECISION_LOG.md`, `PRODUCT_THESIS.md` |
| `team/` | How the team operates. `standing-orders.md` is live founder instruction. `func-identity.md` holds the Tier 0 constitution. |

Repo is at `~/Library/Mobile Documents/com~apple~CloudDocs/All Files/Func.`
(note the trailing period). Work happens on `main`. **No remote** — GitHub push
is blocked on Phoenix running `gh auth login`; do not set one up without asking.

### ⚠️ iCloud

Files can be cloud-only placeholders — tracked by git, readable by the file
tools, **invisible to `ls`**. Never conclude a file is missing from a shell
listing. Shell *writes* may fail with "Operation not permitted"; use the
file-writing tools.

---

## 2. The directive

On 2026-08-09 Phoenix issued an architectural reset. Four changes, all landed:

**1 — "After Hours" is gone.** No mode, anywhere. func behaves identically at
9pm and 3am. What changes is what's happening in the city, not what the app is.
After-parties (which the mode used to hide entirely) are now permanently
visible.

**2 — The product is `func`.** Lowercase. No trailing full stop — that was a
judgment call I took and flagged; the `func.` lockup is treated as logo-only.
**Phoenix has not confirmed this.** If he says otherwise, it's a rename.

**3 — Presence must not require constant app usage.** The core change. Details
in §3.

**4 — TypeScript + React Native.** Done. Expo 57 / RN 0.86.

---

## 3. The presence model — learn this exactly

Three things the old prototype collapsed into one field are now separate:

- **Availability** — the traffic light. An explicit statement of intent.
- **Location** — where the device is. A fact about the world.
- **Sharing permission** — who may see it, decided in advance.

| Viewer | Sees your location when |
|---|---|
| **Friend** | your DTF is on |
| **Mutual** (friend-of-friend) | **both** of you have the mutuals setting on **and both** of you are DTF |
| **Anyone else** | never — anonymous heat only |

**Precision differs.** Friends get an exact position. Mutuals get presence only
— *"people you know are here"*, never who, never exactly where. This is
enforced by the **types**: `visibleLocation()` returns an `aggregate` variant
that carries no coordinates at all, so a screen cannot leak a mutual's position
even by mistake. **Do not weaken this.** If you need to add a field to that
result type, stop and think about what you are doing.

**DTF expires by itself at the next local 12:00.** Adjustable; switchable off at
any moment. **The mutuals setting is permanent** — never expires — but grants
nothing on its own, because DTF still gates it.

**This keeps Tier 0 intact.** Presence is still opt-in, per night,
self-expiring, and nobody is on the map without having turned DTF on. Phoenix
was asked to confirm the collision and his refinement resolved it. Recorded as
Tier 2. `team/func-identity.md` was **not** edited and should not be.

---

## 4. What is built

Stages 0–5 complete. **10,700 lines. 187 tests. `tsc --noEmit` clean under
`strict` + `noUncheckedIndexedAccess` + `exactOptionalPropertyTypes`.**

```
src/domain/     Pure rules. Imports nothing outside this folder.
                ids, clock, geography, presence, visibility, access,
                accounts, spots, stories, threads, venues, engagement
src/data/       schema (v2), storage adapter, store, graph, migrations,
                seed/ (san-francisco, demo-world), places
src/services/   location, notifications — interfaces with fakes
src/ui/         theme, components (Icon, kit, FuncMap), state (AppProvider,
                selectors, actions)
app/            expo-router: 5 tabs + venue, after, thread, auth, settings,
                business
```

**Verified working on an iPhone 17 simulator**: the friend/mutual gradient at a
venue; DTF expiring at local midday with an adjustable window; request →
pending → Plans with party size carried; after-party address locked until
accept; the friend list showing amber as "Out, not sharing".

### Not done

- **MapLibre.** Standing orders commit to it. The map base layer is currently
  vector-drawn because MapLibre needs a native dev build and blocking every
  screen behind a native toolchain was the wrong trade. The projection is
  already Web Mercator and the func layers take positions, so swapping the
  backdrop is contained. **This is the one committed decision not delivered.**
- **Stage 6 — a fresh systematic bug hunt** against the new architecture. Bugs
  hit while walking the main journeys were fixed; nobody has gone looking.
- Photo upload, the pet, the cold-open animation, demo mode. See the inventory.

---

## 5. Rules you must not break

1. **Nothing in `src/domain` may import from outside it.** No React, no
   storage, no platform APIs. That is what makes the rules testable without a
   simulator.
2. **No city may be named in the domain layer.** San Francisco is seed data
   loaded through the same interfaces any other city would use. Deleting it
   must leave a working product. The map asks for **bounds**, never for a
   city's venue list.
3. **Never call `Date.now()` in the domain.** Take a `Clock`.
4. **Money is integer minor units.** The prototype floored dollars and lost
   cents.
5. **Location visibility is decided in `visibility.ts` and nowhere else.** No
   screen, query or cache may re-derive it.
6. **A `SCHEMA_VERSION` bump ships with a migration in the same commit.** A
   test enforces this. A version with no migration is a data-loss bug.
7. **Tier 0 changes** (`team/func-identity.md`) are never inferred, bundled, or
   auto-applied. They need Phoenix naming the specific item. Escalate.
8. **Anything removed from the inventory is removed on purpose**, with the
   reason written down.

### Repo hygiene

`CLAUDE.md`, `docs/`, most of `team/`, and `inbox/` carry uncommitted changes
from a **different, concurrent work stream**. **Do not commit those.** Stage
`func-app/` paths only, and check `git diff --cached --name-only` before every
commit.

---

## 6. How to run and verify

```bash
cd func-app
npm test          # 187 tests
npm run typecheck # tsc --noEmit
npx expo start    # then press i for the iOS simulator
```

Profile → **Reset demo data** returns the app to a known state.

### Simulator gotchas that cost real time

- **Screenshot pixels ≠ tap points.** The panel reports 402×874 points;
  screenshots come back 919px wide. Scale ≈ **0.437**. Multiply screenshot
  coordinates by this before tapping, or every tap misses.
- **Fast refresh preserves `useRef`.** A change inside
  `useRef(PanResponder.create(...))` will not take effect on save. You need a
  full reload, and you will waste twenty minutes concluding your fix "doesn't
  work" if you forget.
- **`expo start --ios` can die** on an osascript call to focus the Simulator
  window. Use `npx expo start` and reload inside Expo Go instead.
- **`node:assert/strict`'s `equal` carries an `asserts actual is T` signature**
  — it narrows. A follow-up guard after it is dead code and fails the build.

### prototype-web gotchas (if you ever run the frozen reference)

- The browser HTTP cache serves stale JS. Append an unused query string to the
  `<script src>` tag itself, not the page URL. **Reverting the cache-bust
  re-exposes the pre-fix cached copy** — this produced a false "the fix doesn't
  work" result. Re-verify with a fresh bust.
- `Screens` is not on `window`; `FUNC` is. `FUNC.go()` does not redraw the map.
- Marker group is `.marks` (class), not `#marks`.
- Run: `cd prototype-web && python3 -m http.server 8778` → `/interactive.html`.

---

## 7. Open judgment calls — Phoenix has not ruled on these

Surface them again if they become load-bearing; do not silently decide.

| Call | Current behaviour |
|---|---|
| **Product name** | `func`, no trailing full stop. Unconfirmed. |
| **The rating curve** | Carried over from the prototype **unchanged and deliberately**: three stars counts as *negative*, and a bad night moves heat almost 3× as far as a good one (−0.14 vs +0.05). This looks wrong. It is a product call, not a refactor. |
| **Party size caps at 6** | The prototype's "6+" chip meant exactly 6. Made honest rather than fixed. |
| **Amber shares no location** | Only DTF does. Phoenix named DTF specifically. |
| **Amber also expires at noon** | He said "only DTF expires"; read as contrasting with the *permanent mutuals setting*, not with amber. |
| **A lone mutual is suppressed** | "1 mutual is here" identifies them by elimination. Threshold is 2. |
| **Venue geofence 75m** | For a story's verified mark. Untuned against real venues. |
| **Location watch 2 min / 50 m** | Battery vs. accuracy. Unmeasured on a real device. |
| **DTF enabled late morning gives a short window** | "Next noon" means 11am → one hour. Correct per the rule; the user can extend. |

### A real behaviour change worth re-flagging

**Check-in now requires you to actually be there** (within 75m). The prototype
granted it from a button tap anywhere in the city, which made "live from
inside" a promise rather than a fact. You can no longer post a verified story
from your sofa. Phoenix has been told; he has not objected.

---

## 8. Data

The prototype's `localStorage` held **3.1KB of pure QA residue** — no real
users, no production data. This is a **clean development migration**: map the
schema, don't migrate rows.

An importer for the old `func:v1` store exists anyway
(`src/data/migrations/legacy-prototype.ts`) and is tested field-by-field,
because proving the mapping is real is the point. Its judgment calls are
documented in the file — most importantly, **the mutuals setting defaults to
off for everyone**, because a migration must never grant a sharing permission
the user was never asked for.

The store **quarantines** unreadable or newer-than-this-build documents under a
separate key rather than discarding them, and surfaces write failures instead
of swallowing them. Both were prototype bugs. Don't undo them.
