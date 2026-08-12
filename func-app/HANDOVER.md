# func — engineering handover

**Written 2026-08-10, updated 2026-08-11 (night session). Read this in full
before touching anything.**

You are continuing work on func, directly under Phoenix Barnes, the founder.
This document is the state of the world. The paste-in prompt that brought you
here covers your role and the standard you are held to; this covers what exists.

## Note — the simulator tap issue in §9 is resolved

Two 2026-08-11 sessions lost time to the dedicated iOS-Simulator MCP tool's
`tap` action silently failing to reach RN's touch responder (app/simulator/
tool restarts didn't fix it). It turned out to be specific to that tool's
synthetic injection path — **real mouse clicks through the actual
Simulator.app window work fine**, always did. If a future session hits dead
taps again: don't spend time on app/simulator restarts, switch straight to
driving Simulator.app with genuine clicks (computer-use, or by hand) and see
§9's last entry for the full writeup. Browse filters and the business
posting/accept-decline loop that were unverified at the point this happened
are now confirmed working — see §4a.

---

## 1. Where everything is

| Path | What it is |
|---|---|
| `func-app/` | **The product.** TypeScript + React Native. This is what you work on. |
| `func-app/FUNCTIONAL-INVENTORY.md` | The checklist the migration is measured against. Every capability, with a destination. |
| `prototype-web/` | **Frozen.** Tag `prototype-web-reference`, commit `6d901dd`. The old vanilla-JS prototype, still runnable, kept as the parity oracle. Do not develop it. |
| `prototype/` | The retired Expo/Velmont direction. Do not build on it. |
| `docs/` | Product truth: `PRD.md`, `DECISION_LOG.md`, `PRODUCT_THESIS.md` |
| `team/` | How the team operates. `standing-orders.md` is live founder instruction. `func-identity.md` holds the Tier 0 constitution. |

Repo is at `~/Developer/Func`. Work happens on `main`. **No remote** — GitHub
push is blocked on Phoenix running `gh auth login`; do not set one up without
asking.

*(This repo was cloned 2026-08-11 from a since-deleted iCloud-hosted copy to
escape native-build failures there. The iCloud copy was removed 2026-08-12 —
it had fallen behind this one and its few unique uncommitted edits were
folded in first. The old cloud-placeholder-file caveat that used to live here
no longer applies.)*

---

## 2. The directive

On 2026-08-09 Phoenix issued an architectural reset. Four changes, all landed:

**1 — "After Hours" is gone.** No mode, anywhere. func behaves identically at
9pm and 3am. What changes is what's happening in the city, not what the app is.
After-parties (which the mode used to hide entirely) are now permanently
visible.

**2 — The product is `func`.** Lowercase. **No trailing full stop — confirmed
by Phoenix on 2026-08-12** ("always 'func' never 'func.'"). This applies to the
**logo lockup too**, not just prose: an aesthetic-reset pass drew a full stop
after the `c` in the chrome mark and it was removed on his correction. No
longer an open question — see §7.

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

### Live-verified 2026-08-11 (later session, after §9 resolved)

**Browse filters** (`app/(tabs)/browse.tsx`). Kind chips and search both
confirmed live: tapping Clubs took the deck from "1 of 16" to "1 of 6," Next
cycled correctly within the filtered set, and search correctly produced the
"Nothing matches" empty state and correctly matched a real venue name.

**Business dashboard, the two flows §4a left unverified:**
- **Posting a table** (Nightform → Monarch → "Post a table"): posted, showed
  a "Posted." confirmation, appeared immediately in "Your tables tonight"
  and in the consumer-facing venue detail's "Tables tonight" list with the
  right price and spot count.
- **Accept/decline loop**: as Maya, requested the just-posted table (party of
  4) — it appeared in Nightform's Inbox under "Waiting on you" with
  Accept/"Not this time." **Accept** cleared it, moved the thread to
  Messages showing "Nightform accepted," and correctly flipped the table to
  "Full tonight" with its Request button disabled (4 of 4 filled). A second
  request against the other table, **declined** via "Not this time," cleared
  correctly, showed "Nightform declined" in the thread, and closed the
  thread to further messages ("This one is closed.") — all without touching
  the first table's now-full state.

Demo data was reset afterward (Profile → Reset demo data) to leave a clean
state.

### Stage 6 first pass — 2026-08-11/12, same session, after §9 resolved

Walked the core consumer journey (presence states, map markers, save/check-in,
Plans), the after-party request→accept→address-reveal loop, and business
dashboard edge cases (posting at a second venue, claiming a new venue,
restart persistence). All driven live via real mouse clicks per §9's fix.

**Found and fixed one real bug:** `saveItem`/`unsaveItem` in
`domain/engagement` were fully wired — Browse and the venue screen both call
them, a Save button toggles state — but nothing ever read `state.saved` back.
No screen listed what you'd saved. The prototype had this (its own toast
said "see it in Plans"), so it's a migration regression, not a missing
feature. Fixed: added `mySaved()` to `src/ui/state/selectors.ts` (wraps
domain's existing `savedFor`) and a "Saved" section to
`app/(tabs)/plans.tsx` with Open/Unsave. Verified live: save two venues from
Browse, both appear in Plans, Open navigates correctly, Unsave removes them
and restores the empty state. `npm test` (212/212) and `tsc --noEmit` clean.
Commit `c34cee4`.

**Everything else checked came back clean, no regressions:**
- Presence states (DTF/Casual/Off), the +1 hour / Till midday controls, and
  the "who sees what" breakdown all matched §3's model exactly.
- The check-in geofence gate still correctly blocks ("You need to actually
  be there to check in").
- After-party: request → pending → host accepts → address reveals
  (`3312 22nd St...`) → thread shows "accepted". No regression from the
  camera-reset fix or MapLibre.
- Business dashboard: posting at a second venue (Audio) with edited
  name/party-size/price fields, claiming a brand-new venue (Nopa) and
  immediately being able to post at it, and — most importantly — a full
  `simctl terminate` + `simctl launch` restart while still signed in as
  Nightform did **not** bounce to `/auth` and kept all 3 venues and posted
  tables intact. Confirms `005b26d`'s fix still holds.

One friction note, not a product bug: the dev-only actor-switcher sheet
(`Profile → Switch actor`) mis-targets taps if you click right after a
scroll — the list keeps settling for a beat after the drag ends. Wait ~1s
after scrolling it before tapping a name, or you'll land on the wrong actor
(happened repeatedly this session — burned a fair amount of time before being
recognized as a settle-timing issue, not a persistence bug).

No further bugs found in this pass. Stage 6 is not exhaustively done —
photo upload, the pet, cold-open animation, demo mode, and MapLibre visual
polish are all still untouched — but the core journeys are now confirmed
solid on top of the 2026-08-11 architectural reset.

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
| ~~**Product name**~~ | **Settled 2026-08-12** — `func`, never `func.`, in prose and in the mark. See §2. |
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

### 2026-08-11, resolved — it was the injection tool, not the app or the simulator

Phoenix authorized driving the Simulator app directly (computer-use, real
mouse clicks on the actual window) to try the Shake Gesture idea above.
Device → Shake reached the Expo dev menu fine (a native macOS menu command,
not an on-screen touch, so this was never in question). Its own "Reload"
button also worked on a real click. That was the tell: **on-screen taps
delivered as genuine mouse clicks through the real Simulator.app window work
correctly** — Map's Clubs chip responded immediately (highlighted, marker
set filtered) the first time it was tried this way, no reboot, no reinstall,
no dev-menu fiddling required.

So the bug was never in func, React Navigation, RN's touch dispatch, or the
simulator's own input handling — all of those work. It's specifically in
**this dedicated iOS-Simulator MCP tool's synthetic tap-injection path**
(the one that talks to the booted device directly via CoreSimulator/simctl
APIs rather than through a real on-screen window). Something about how it
injects touches stopped reaching the RN touch responder, and neither
restarting the app, the simulator, nor the tool session touched whatever was
actually wrong, because none of those are the layer that broke.

**Practical fix, if this recurs:** don't fight the dedicated simulator tool.
Open Simulator.app's real window (`open -a Simulator` after `simctl boot`;
quit and relaunch Simulator.app if the dedicated tool's `attach` shows no
actual on-screen window — it talks to the device directly and doesn't need
one, which is exactly why this was hard to notice) and drive it with genuine
mouse clicks (computer-use or by hand) instead of the tool's `tap` action.
Screenshots from the dedicated tool are still fine for reading state; it's
only the injected taps that were unreliable.

One rough edge along the way, unrelated to the above: with no Simulator
window open and no app focused, clicking on the bare desktop got refused by
computer-use as landing on "Notification Centre" (desktop widgets sitting in
that hit-test layer) — not a bug, just what an empty desktop with widgets
resolves to. It went away as soon as Simulator.app actually had a window and
was frontmost.
