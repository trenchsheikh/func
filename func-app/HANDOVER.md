# func — engineering handover

**Written 2026-08-10, updated 2026-08-11 (evening session). Read this in full
before touching anything.**

You are continuing work on func, directly under Phoenix Barnes, the founder.
This document is the state of the world. The paste-in prompt that brought you
here covers your role and the standard you are held to; this covers what exists.

## ⚠️ Read this first — an open session-continuity issue

The 2026-08-11 evening session ended mid-work because the iOS Simulator
control tool stopped delivering taps to React Native `Pressable` components
specifically — native iOS controls (tab bar, header back button, hardware
Home button, system alerts) kept working throughout, but no in-app button
press registered. Full detail, and everything already tried, is in §9. **Try
a tap on any button as your first simulator action** (e.g. a Map filter
chip) before doing anything else — if it doesn't register, don't re-diagnose
from scratch, read §9 first.

If taps work fine for you: great, the issue was likely scoped to that one
tool session. Proceed to §4a for what's built but not yet live-verified.

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

## 4a. Session update — 2026-08-11, evening

MapLibre (§4's "one committed decision not delivered") shipped earlier the
same day — commit `cf39f79`. This session picked up from there, chose its
own workstream (Phoenix: "this is your call... keep going until a genuine
roadblock"), and did a first Stage 6 pass on business dashboard, Browse
filters, and Map filters. Four commits, oldest first:

- `fd7637a` — synced `docs/` and `team/` with their actual current content.
  The migration to this repo (`~/Developer/Func`, see §1) only carried
  **committed** history, but those files had been edited directly in the old
  iCloud repo through the 2026-08-07 product reset and never committed — so
  this repo's copies were frozen at 2026-07-25 (`team/standing-orders.md`
  still showed the Func Bible build HOLD as active; it was lifted 2026-08-07).
  `team/func-identity.md` and `docs/PRD.md` didn't exist here at all. Check
  `git log -- docs/ team/` if this ever looks wrong again — the old repo may
  still be ahead if someone edited there directly.
- `f1dcfda` — **fixed a real map bug**, not the one it went looking for. The
  MapLibre commit flagged a tightly-packed marker cluster (a friend/mutual
  sitting exactly on a venue, an after-party anchor nearby) as unverified —
  two taps at "the same coordinate" gave two different results. Zoomed in
  until the markers were visually separated and tapped each one repeatedly:
  hit-testing was correct and deterministic every time, so that wasn't it.
  What was actually happening: `FuncMap.tsx`'s camera position wasn't
  restored when the native map view got torn down and recreated by the
  navigator (pushing a venue/after-party screen and coming back) — silently
  resetting the visible map between two "identical" taps, which is what
  actually produced the original symptom. Fixed with a module-level
  `lastKnownCamera`, verified live (reproduced the reset via the header back
  chevron, confirmed the fix holds).
- `005b26d` + `2521f32` — the business dashboard had no door. Signup
  hard-codes `role: 'consumer'` (`app/auth.tsx`); the "QA persona switcher"
  `FUNCTIONAL-INVENTORY.md` 1.13 claims was ported never was. Added
  `devSwitchActor` (`src/ui/state/actions.ts`) and a `__DEV__`-gated "Switch
  actor" sheet on Profile. Along the way found and fixed a real bug it
  surfaced: `app/index.tsx`'s root gate bounced any business session to
  `/auth` on every restart, because businesses have no `Account` record by
  design (`FUNCTIONAL-INVENTORY.md` 1.2) and the gate didn't know that.
  **Verified live**, before the tooling issue in §9 started: switched to
  Nightform, Inbox showed its business section, dashboard rendered real
  data, claiming a third venue worked and correctly stayed claimable after
  (the exact bug `business.tsx`'s own header comment warns about).
  **Not verified**: posting a table, the accept/decline loop from a
  business's inbox — planned next, blocked by §9.

### Built but not live-verified — do this first

**Browse filters** (`app/(tabs)/browse.tsx`). Browse had zero filtering
before this session — no state, no UI, contrary to what the PRD and
`FUNCTIONAL-INVENTORY.md` 3.10 both describe. Added kind chips (Dinner/Bars/
Clubs) and search, mirroring Map's already-verified filter pattern exactly
(same `KINDS`, same match logic). `npm test` 212/212, `npx tsc --noEmit`
clean, but **never driven live** — the tooling issue in §9 started right
before this could be tested. Structurally near-identical to Map's filters,
which are verified, but treat it as unverified until someone actually taps
the chips and watches the deck change.

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

---

## 9. Open — simulator stopped delivering taps (2026-08-11 evening)

Partway through the session (mid persona-switcher testing), a stray keystroke
sent to an unfocused text field toggled React Native's element inspector.
Clearing it should have been routine. Instead, every tap on an RN `Pressable`
— every in-app button, every filter chip — stopped registering. Native iOS
controls kept working the whole time: the tab bar, the header back button/
chevron, the hardware Home button, system alerts (`UIAlertController`). Only
RN-mediated touches were affected.

**Everything tried, none of it worked:**

- Multiple full app relaunches (`simctl terminate` + `simctl launch`)
- Two full simulator OS reboots (`simctl shutdown` + `simctl boot`)
- Killing and restarting whatever backing process serves the simulator
  connection (`killall Simulator`, then reboot + relaunch)
- Detaching and reattaching the simulator panel tool connection
- A different gesture-injection primitive (`touch_path` instead of `tap`)
- A full uninstall and reinstall of the app (`simctl uninstall`, then
  `simctl install` from the existing DerivedData build, wiping all native
  and JS-persisted state, AsyncStorage included)

The last one is the important data point: on the **freshly reinstalled**
app's very first screen — Expo's own stock dev-client onboarding dialog,
not a line of func code — the "Continue" button didn't respond either. That
rules out anything persisted (app data, native flags, JS bundle state) and
points at the tap-injection path itself, within that tool session.

**If you hit this:** don't re-diagnose from scratch — tap something trivial
first (a Map filter chip is a good canary) before doing any other work.
If it's broken, the list above is what's already been ruled out; a fresh
Claude Code session (not just a reloaded app) is the one thing that wasn't
tried, because there wasn't a way to test it from inside the stuck session.
If a fresh session doesn't fix it, this may need Phoenix driving the
simulator by hand, or investigating on the host side directly.

**Unaffected by this**: `npm test` and `npx tsc --noEmit` were reliable
throughout — this only blocks *live* verification, not the automated checks.

### 2026-08-11, later same evening — a fresh session reproduced it too

A new Claude Code session picked up this handover, read this section first as
instructed, and ran the canary tap. First tap looked promising — it hit a
MapLibre marker and navigated to a venue detail screen — but that was a false
positive. Every explicit-target tap after that (Map's DTF chip, Browse's
Clubs/Dinner/Bars chips, the Next/Save/Open deck buttons, even the Browse
search bar's `TextInput` — a large, unmissable target, and not a `Pressable`
at all) landed with zero visible effect. The header back chevron and bottom
tab bar kept working throughout, exactly as before.

**New data point:** the previous session's simulator (booted `19:28:17Z`,
i.e. mid-session, already post-dating its own two reboots) was still the one
attached — this session's first canary tap wasn't actually a clean test. To
get a genuine one, this session did a **third** full reboot
(`simctl shutdown` + `simctl boot`) and a fresh `simctl launch`, combined
with a fresh Claude Code session for the first time. **Still broken.** So:
neither a fresh tool session nor a fresh simulator boot fixes this alone, and
combining both doesn't either.

**New data point:** it's not `Pressable`-specific. The search bar's
`TextInput` also would not focus. Whatever is failing sits below both
component types — closer to RN's shared touch dispatch (`RCTTouchHandler` /
the root responder) than to any one component's gesture handling. This is
still consistent with the original theory (an element-inspector overlay, or
something it left behind, sitting above the RN root view and swallowing
touches meant for it) — a reboot not clearing it suggests, if that theory is
right, the stuck piece survives at the host/tooling layer, not inside the
guest OS a `simctl` reboot resets.

**Tried and blocked, not ruled out:** this session asked to drive
Simulator.app directly (via computer-use, outside the dedicated simulator
tool) to trigger Device → Shake Gesture and reach the RN dev menu, to try
toggling the inspector explicitly rather than hoping it was already clear.
**Phoenix denied the access request.** So this specific idea — is there a
debug overlay still live that a dev-menu toggle would clear — is untested,
not disproven. If you're reading this and want to try it yourself: Shake
Gesture is Device menu → Shake Gesture, or ⌘⌃Z, with the Simulator window
focused.

**Where this leaves it:** two independent sessions, three reboots, a full
reinstall, and two gesture-injection primitives have all failed to restore
touch delivery to RN-mediated controls. Per this file's own escalation path
in the paragraph above — this now needs either Phoenix driving the simulator
by hand, or someone investigating the host side directly (the automation
tool's own connection to the simulator, not the simulator's internal state,
since guest-OS reboots provably don't touch whatever's wrong). Don't spend a
third session re-running what's already in this list.
