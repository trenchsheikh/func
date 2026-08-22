# Func prototype-web — session handoff

Written 2026-08-09, updated twice same day after two follow-on bug-hunt
passes, to continue this work in a fresh chat with no memory of the sessions
that produced it. Read this first, then `README.md` in this same folder for
the original file-by-file description.

**Path note**: the containing folder is `All Files/Func.` (trailing period),
not `All Files/Func` — it was renamed mid-session 2026-08-09. Same git repo,
same history, nothing lost; just update any saved path. There's also now a
sibling native Xcode project (`func. - prototype 1/`, with its own `.git`) —
untouched by this work, not part of `prototype-web/`, flagging only so it
isn't mistaken for stray/orphaned files.

## What this phase is

Phoenix's directive for this phase: stop polishing the visual prototype and
build the actual **functional foundation** — real data model, real state
management, real user journeys, connected systems — so a later design pass
can focus purely on visual identity without discovering the product logic
underneath is fake. Explicitly out of scope this phase: aesthetics, chrome
styling, animation polish, typography, colour. In scope: architecture,
correctness, edge cases, empty states, permissions, cross-feature
consistency. Full directive text isn't reproduced here; ask Phoenix if you
need the original wording — the essentials are captured in what follows.

## Read these before touching product direction

In this order, per `Func/team/README.md`'s own reading order:
1. `Func/team/roles.md`, `operating-principles.md`, `standing-orders.md`,
   `glossary.md`, `func-identity.md`, `intake-process.md`
2. `Func/docs/DECISION_LOG.md` (esp. **Decision 012, 013, 014** — 2026-08-07,
   the current product direction) and `docs/PRODUCT_THESIS.md`
3. `Func/docs/PRD.md` (2026-08-07) — the actual feature/screen spec

**Two things worth knowing before you re-derive them:**

- **The build HOLD is lifted.** `Func/CLAUDE.md` and the vault-level
  `All Files/CLAUDE.md` both still say (stale, as of 2026-07-28) that a HOLD
  is active pending a "Func Bible." It isn't — `team/standing-orders.md`
  itself records the HOLD lifted 2026-08-07 by live founder instruction, and
  that entry is the authoritative, most-recent, most-specific source. I
  proceeded on that basis; flagging the stale `CLAUDE.md` wording rather than
  editing it myself, since it's a governance file outside this scope.
- **`team/glossary.md` is stale** relative to Decision 012 (still documents
  retired Pool/Call It/Convoy vocabulary, doesn't define traffic
  light/afters/pass/local spot). Not touched this session — docs weren't in
  scope, only `prototype-web/` code was.

## Tier 0 — do not silently touch

Group-first is retired. The line is *"Func is just a bridge between you and
the opportunities of the night."* Party size is a number on a request, never
a group object. Presence is opt-in, per night, self-expiring. No payments/
ticketing processed by Func. 18+ with government-ID verification. No emoji
as iconography. Full list: `team/func-identity.md` + Decision 012.

## Architecture

Vanilla JS, no build step, no framework. Two entry points sharing the same
`app.js`/`screens.js` UI layer via a strategy-pattern `Engine`:

| File | Role |
|---|---|
| `index.html` | **Demo mode** — scripted pitch walkthrough, fixed timers, always-accepts, in-memory only. Loads `data/engine-demo.js`. Never gate new features behind auth here — its whole point is that it always just works. |
| `interactive.html` | **Real mode** — the actual product logic. Loads `data/store.js` (localStorage persistence) + `data/engine-real.js`. This is where almost all of this session's work lives. |
| `app.js` | Map renderer/camera, cold-open animation, the pet widget, tab router, `boot()`/`bootMain()` split (auth-gates real mode before the map ever renders). |
| `screens.js` | Every screen/sheet builder. `window.SCREENS(ctx)` factory, `ctx()` built in `app.js`. |
| `data/store.js` | Real mode's persistence + business logic. `window.STORE`. Root schema versioned (`VERSION = 4` currently) — **bump it whenever `freshRoot()`'s shape changes**, not just when values change, or old localStorage throws on read. |
| `data/engine-real.js` / `data/engine-demo.js` | Identical call-surface `window.Engine`, different implementation. screens.js never branches on mode — if you add an Engine function, add it to both (demo can be a lighter in-memory version). |
| `data/pet-brain.js` | Architectural seam for the pet's "intelligence." `PetBrain.getMessage(ctx)` — rules-based today, checks real state before saying anything, not fake AI. A future LLM-backed assistant replaces just this file. |
| `data/persona-switcher.js` | Real-mode-only QA harness — "act as" any seeded person or business without a second device. Uses `sessionStorage` (tab-scoped), separate from the durable login session in `localStorage`. |

**Identity model** (this took real debugging to get right, don't reintroduce
the bug): `STORE.getHomePersonaId()` = who is actually logged into this
device (`root.session.personId`, or `'you'` if nobody's signed up — that's
the demo/legacy default). `STORE.getActivePersonaId()` = home, unless the
QA persona-switcher's `sessionStorage` override is set, in which case that
wins. **Use `getActivePersonaId()` for "who is the current viewer,"
`getHomePersonaId()` for "is this genuinely my own logged-in session"**
(e.g. gating a Log Out button) — conflating them caused two real bugs this
session (see log below). A business account **is** its own actor (id starts
`biz_`) — no separate owner-person record, per seed.js's own stated rule
("a business is a single actor, never a roster of users").

## What's real right now (tested end-to-end in-browser, not just read)

- **Auth**: signup (consumer or business) → simulated 18+/business ID
  verification (real state machine: unverified→pending→verified/rejected,
  survives reload, under-18 is a genuine hard block) → profile completion →
  onboarding → map. Resumes correctly from any interrupted step.
- Real active-persona threading everywhere (was hardcoded `'you'` before this
  session — Profile, status chips, Inbox routing, map presence all fixed).
- **Premium**: real 3-pending-request cap (`FREE_PENDING_CAP`) that premium
  bypasses; real "who's interested" list fed by Browse swipe-right-on-person.
- **Business dashboard** (inside Inbox — no 6th tab, the five-tab structure
  is committed): claim an unclaimed real venue (exclusivity-guarded, one
  business per venue), post real table offers, accept/decline real requests,
  empty state when nothing's left to claim.
- **Stories**: posting gated on a real check-in ("I'm going"), verified mark
  only when genuinely checked in, appear on the map immediately, **expire
  after 6h** (`STORY_EXPIRY_MS`) both on a periodic tick and immediately at
  boot if already stale.
- **Request → accept → pass**: full loop, tested cross-persona (guest and
  host as two different logged-in identities via the persona switcher).
  Table/after-party capacity derived from real accepted requests (not
  static seed numbers), decrements on accept **by the request's actual
  partySize** (fixed this session — was counting accepted requests, not
  people, so a party of 6 could take the last 2 real seats), blocks
  over-capacity accepts, blocks duplicate pending requests to the same
  target. "Nights out" on Profile now increments on every accepted request
  (was frozen at signup).
- **Local spots**: drop a spot (anchored to `YOU`'s fixed location — no real
  GPS), real visit → token loop (guarded against self-visits and double-
  counting). Profile's Spots dropped/Tokens stats are now **derived from
  real S.spots data** (fixed this session — used to read a static field
  written once at drop/visit time that drifted from the spot's own token
  count; Maya's Profile showed 0 tokens while her spot's own detail sheet
  said 128).
- **Saved items**: Browse swipe-right on a venue/spot persists to a real
  list, surfaced in Plans, removable.
- **Real photo upload**: FileReader → canvas-downscaled JPEG data URL, no
  backend needed, persists for signed-up accounts.
- **Filter sheet**: unified with the map's top-bar chips (one shared model,
  not two disconnected ones); What/Vibe/Cost/Distance/Green-only all real;
  **also now filters the Browse deck**, not just the map (was cosmetic
  there until this session).
- **Search box**: real substring match on venue name/district.
- **Directions**: real haversine walking-time estimate (was a hardcoded
  "11 minutes" regardless of venue).
- **Afters mode**: real toggle; the "switch to Afters" nudge checks the
  actual device clock (`hour >= 23 || hour < 5`) instead of a fixed 26s
  session timer with hardcoded "1:40am"; manual toggle also lives in
  Profile so the feature isn't only reachable during real late-night hours.
- **Globe/cities**: SF's "out" count is a real tally of non-red statuses;
  every city is tappable with honest feedback (LA says "map coming soon,"
  not a fabricated population number; waitlist cities say so).
- **Profile**: real editing (reuses the same `completeProfile()` the auth
  flow calls), business personas get their own correct summary instead of
  the broken person-shaped fallback, real Log Out (real mode only, gated to
  your actual home session — not shown for a QA-switched-to persona, which
  was a real bug caught and fixed this session).
- **Inbox**: hardcoded fake items (fake friend request, fake warehouse
  invite) removed; replaced with real derived notifications (businesses
  with genuinely open tables, real token earnings from your own spots).

## Session work log (commits, in order — `git log` in this repo for full messages)

1. `6c5ec12` — Build Func prototype-web functional foundation (the big one:
   everything in "What's real" above except items 2–6 below)
2. `81b1f06` — Wire Browse's filter sheet to actually filter the swipe deck
3. `4f2c2c5` — Real story expiry + fix map staleness on store changes
4. `a954360` — Add a real way to log out
5. `a217478` — Profile editing, real business profile view, fix a
   logout-scope bug (caught via testing — QA-switching personas could
   silently sign out a different, still-logged-in account)
6. `d386c69` — Empty state for business dashboard's venue-claim list
7. `328dcce` — Add this handoff doc
8. `d2bff5b` — **Bug-hunt session**: fix capacity math (accept-time gate
   compared spots-left to zero, never to the request's own partySize — a
   party of 6 could be accepted into a table with 2 real seats), fix the
   18+ verification fail-open gap (unparseable dob resolved to "verified"
   instead of "rejected"), add real "Nights out" tracking (was written once
   at signup, never incremented), fix Profile/PetBrain's token count
   reading a static field that drifted from the real per-spot data
9. `fb121f9` — **Same session**: fix Browse's swipe deck self-wiping on
   every right-swipe (a synchronous store:change cascade rebuilt the deck
   mid-swipe), map top-bar Kind chips not repainting from the filter sheet,
   the late-night Afters banner not syncing with Profile's toggle, venue/
   spot/after detail sheets going stale while open (no store:change
   subscription — sheets now take an `onChange` rebuild hook), Inbox
   routing on "not my home persona" instead of "actually hosts something"
   (same home-vs-active conflation class as the Log Out bug, bit a
   QA-switched-to guest persona this time), a hardcoded "Nine minutes" for
   every after-party regardless of which one, demo mode's Cancel button
   being a dead no-op, and Post-a-table silently no-opping on invalid seats
10. `9640d86` — Update this handoff with the above
11. `ebf8406` — **Second bug-hunt pass (fresh session)**: no guard stopped a
    business (or, via the persona switcher, an after-party host) from
    requesting and self-accepting its own listing — fixed with a
    sendRequest-level own_listing guard mirroring visitSpot's own_spot
    check; rateNight's "Send it" silently submitted a full negative rating
    at zero stars picked, with no cap on re-rating the same pass — now
    disabled until a star is tapped, passes track a `rated` flag; the QA
    persona switcher's "Reset demo data" cleared root/localStorage but left
    every runtime-created ghost (people/businesses/tables/spots/stories)
    and every rateNight heat mutation in place — now restores S.* and venue
    heat from a pristine pre-overlay snapshot; demo mode's auto-accept had
    no capacity gate at all (unlike the real-mode fix from commit 8),
    visibly showing more people "going" than an after-party's stated
    capacity — display now clamps at capacity (doesn't reject: demo's
    guaranteed-accept is deliberate, not a bug); demo mode's nights-
    increment (from commit 8) never emitted store:change, so Nights out
    froze on Profile if the accept fired while that screen was open; an
    open chat thread sheet, and the persona switcher's own "Act as" sheet,
    were both missed by commit 9's onChange-rebuild mechanism and went
    stale while open; a cancelled request's thread was mislabeled "Waiting"
    forever and Plans' empty-state check ignored threads entirely, hiding
    real chat history; a closed (declined/cancelled) thread's composer
    still accepted messages with zero indication the chat was over; chat
    lists weren't sorted by recency despite tracking lastMessageAt
    correctly; the story composer could post after its check-in expired
    while the sheet sat open, reporting false success; the Inbox tab badge
    only ever grew, never cleared; rapid toasts rendered stacked directly
    on top of each other; the map's "live now" strip froze at boot instead
    of tracking heat/story changes; a cross-tab localStorage version
    mismatch was silently dropped with zero signal (now console.warn's).

All on `main`, nothing pushed (**no git remote configured** — per
`standing-orders.md`, GitHub push is prepped but blocked on Phoenix running
`gh auth login`; don't set one up without asking). Other uncommitted/
untracked changes in the repo (`CLAUDE.md`, `docs/`, most of `team/`,
`inbox/`) predate this session and belong to a different work stream
(the Decision 012–014 docs restructuring) — **not mine, don't commit them
as part of continuing this work** unless separately asked.

**Method for commits 8–9 and 11**: a fresh N-agent parallel code-audit each
pass (9 agents pass one, 9 agents pass two with deliberately different
lenses so it wouldn't just re-find the same things — chat/threads, saved/
rateNight/premium/interest, check-in/stories, business-claim edges, request
lifecycle, persona-switcher/multi-tab sync, engine parity, a UI sweep, and a
dedicated regression check on pass one's own fixes) surfaced 20 candidates
each round (40 total across both passes). Every high-confidence one was
live-verified in-browser (or via direct Engine/STORE calls exercising the
same code path the UI uses) before fixing, and every fix was re-verified
live afterward, not just read — per standing instruction, this is
non-negotiable. Full candidate lists + verification detail are in this
session's transcript, not reproduced here.

Not fixed (deliberately, judgment calls — revisit if this keeps mattering):
Kind/search filters in Browse don't narrow after-parties/spots/people
(product-scope ambiguity, may be intentional); story freshness ring doesn't
live-fade each tick (fixable in one line but forces a full redraw of
whatever screen/sheet is open every 60s — real UX cost for a cosmetic bug,
wanted your call before accepting that trade); age display on Profile frozen
at signup (low impact, nobody's prototype account lives past a birthday);
Globe overlay's SF "out" count doesn't live-update while open (same root
cause as the sheet-staleness fix, different code path — narrow cross-tab-
only repro, lowest priority of the bunch); removing a saved item from Plans
doesn't let Browse's swipe deck offer that card again this session (Browse's
per-session "decided" exclusion set — added in commit 9 to fix the self-wipe
bug — has no link back to unsaveItem; genuinely ambiguous whether "un-saving"
should also "un-decide" it for Browse, flagged rather than guessed);
message `readBy` field is written everywhere but read nowhere (dead
scaffolding for an unread-indicator feature that was never built — no
visible bug today, not worth building the feature just to use the field).

Also noticed in passing, not fixed: demo mode's Plans screen shows "Waiting
on undefined" for pending requests (engine-demo's sendRequest never sets a
`hostId` on the request object) — pre-existing, unrelated to this session's
fixes, flagging for whenever demo mode gets touched again.

## Honest gaps — Missing / Deferred / Ambiguous

**Missing, not yet built:**
- Full LA map/venue data — needs a real OSM/Overpass data-acquisition pass
  (`build_map.py` reads pre-fetched JSON that isn't in the repo), not a UI
  task. Correctly out of scope for a code-only session.
- MapLibre migration — PRD itself calls this "committed, not yet built."
- Deeper afters-mode visual personality shift beyond the existing dark-
  purple theme swap + filtered map (visual work, explicitly deprioritized).

**Deliberately deferred, twice-considered and left alone:**
- `tables.host` / `afters.host` / `spots.by` denormalized name fields
  (duplicate what's derivable from their FK). Nothing currently mutates
  them independently after creation, so the drift risk is theoretical, not
  active — evaluated in two separate passes this session and judged not
  worth the ~15-call-site edit surface for zero current behavioral bug.
  Worth doing eventually if a "rename yourself" feature is ever added
  (currently `completeProfile` only ever runs once, at signup).
- Business renaming — `editProfileSheet` deliberately has no name field for
  businesses, since nothing else in the data model derives a display name
  from anywhere but `S.businesses[].name` at creation; wiring it would mean
  revisiting every `host`/label lookup site, not just one field.
- Vouches/Backing, deeper local-spots economy beyond tokens, pet as a real
  LLM-backed assistant (architecture is ready — `data/pet-brain.js` — intelligence isn't) — all Tier 0/PRD-deferred, correctly untouched.

**Judgment calls made without asking (small enough to fall under "use
judgment," per the directive's own §20 threshold — flagging for visibility,
not because they need revisiting):**
- Premium request cap set at 3 pending (not specified anywhere).
- Business venue "claiming" is from a fixed list of pre-mapped real SF
  venues, not user-fabricated new locations (matches "Func's venues are
  real, pre-mapped places" reading of the PRD).
- Story expiry window: 6 hours (not specified anywhere; matches presence's
  own 8h `NIGHT_MS` as a "one night" scale).
- "See who wants you" (premium) reuses the existing Browse
  swipe-right-on-person mechanic rather than a new feature — deliberately
  did **not** build a mutual-match/messaging system on top, since the
  directive explicitly warns against drifting into "dating app" territory.

## Testing environment gotchas (lost real time to these — read before re-discovering them)

1. **The embedded browser's HTTP cache can serve stale JS/HTML even after
   `navigate()` to a fresh URL, including with a cache-busting query
   string on the navigation itself.** The only reliable fix found: append a
   **new, never-before-used query string to the actual `<script src="...">`
   tag** in the HTML file (e.g. `data/store.js?cb=7`), which forces that
   specific sub-resource to refetch. Verify with
   `Array.from(document.scripts).map(s => s.src)` before trusting any test
   result that depends on recent edits. **Always revert the cache-bust query
   string before committing** — it's a testing artifact, not shipped code.
   Sanity-check suspicious "it didn't work" results with
   `fetch(url, {cache:'no-store'})` against the server directly (or `curl`)
   to rule out a real bug before chasing a cache ghost.
2. **Clicking SVG map markers via the `computer` tool's `left_click` (by
   coordinate or by `ref`) reliably hangs the tool for 30s and fails.**
   Likely `setPointerCapture` in `app.js`'s gesture handler interacting
   badly with synthetic pointer events. Workaround: use
   `mcp__Claude_Browser__javascript_tool` and dispatch a real click via
   `element.dispatchEvent(new MouseEvent('click', {bubbles:true}))` or
   `element.click()` instead — both reliably trigger the app's
   `addEventListener('click', ...)` handlers without hanging.
3. **`document.querySelector('.swipecard')` on the Browse deck returns the
   *back-most* card, not the visible top one** — `render()` appends cards
   back-to-front in DOM order (`items.slice(0,3).reverse().forEach(...)`, so
   the true top card is `zIndex === '10'`, appended last). Find the top card
   via `cards.find(c => c.style.zIndex === '10')`, not the first DOM match.
4. **Re-fetch `read_page` immediately before every click** — screens rebuild
   their DOM wholesale on `_reset()`, so a `ref` from even one action ago can
   resolve to a stale coordinate and click the wrong thing (this is what
   made early persona-switcher clicks land on the wrong row).
5. At the default ~1280×720 browser viewport, the phone frame's CSS media
   query (`min-width:760px, min-height:720px`) kicks in and renders a fixed
   390×844 frame **taller than the viewport**, centered — meaning bottom-
   anchored UI (sheets, the persona chip) sits outside the visible/hit-
   testable area in ways that produce confusing misclicks. **Use
   `resize_window({width:450, height:950})`** (or similar, width < 760) to
   get the simpler full-bleed mobile layout instead, where on-screen
   coordinates match what you'd expect.
6. **The embedded browser's cache can serve a stale top-level HTML document
   itself**, not just stale sub-resources — `navigate()` to the exact same
   URL (even with `force: true`) can keep rendering an old `<script src>`
   list from before an edit to `index.html`/`interactive.html`. The fix
   from gotcha #1 (cache-busting the script tags) only works if the HTML
   document containing those tags is actually fresh. If
   `Array.from(document.scripts).map(s=>s.src)` doesn't show your edits
   after a `force: true` navigate, add a throwaway query string to the
   **navigation URL itself** too (e.g. `index.html?nocache=1`) — that
   reliably forces a fresh document fetch.
7. The `computer` tool's `left_click` can hang (~30s timeout, "Browser pane
   is currently hidden") on perfectly ordinary buttons, not just SVG map
   markers (gotcha #2) — seemingly any element inside this app's
   pointer-capture-heavy DOM. Default to driving the UI via
   `javascript_tool` + `element.click()` / `dispatchEvent(new
   MouseEvent('click', {bubbles:true}))` for *all* interaction in this app,
   not just map markers — it's faster and doesn't hang. Reserve `computer`
   for actual visual verification (screenshots).
8. `javascript_tool` evaluates each call in a shared top-level scope on the
   page — a `const`/`let` declared in one call collides ("Identifier ...
   has already been declared") if reused in a later call on the same page
   load. Wrap each script in `(function() { ... })();` to avoid this
   entirely rather than tracking variable names across calls.

## How to run it

```bash
cd "$HOME/Library/Mobile Documents/com~apple~CloudDocs/All Files/Func./prototype-web" && python3 -m http.server 8778
```
Then open `http://localhost:8778/interactive.html` (real mode, where nearly
all of the above lives) or `/index.html` (demo mode — leave it alone unless
explicitly asked to touch the pitch script). Note: a server may already be
running on 8778 from a prior session (`lsof -nP -iTCP:8778 -sTCP:LISTEN`)
serving the same files — check before starting a second one. If the folder
gets renamed again while a server is already running against it (as
happened this session), the running process can start 500ing on every
request even though the port is still listening — `curl -o /dev/null -w
'%{http_code}' <url>` a known page before assuming the app is fine; if it's
not 200, kill and restart the server from the *current* path rather than
debugging the app itself.

## If continuing: suggested next priorities

In roughly descending value, none of these blocking — pick based on what's
actually asked for next:
1. Another pass looking for "looks real but isn't" spots — two audit passes
   so far (13 bugs, then 16 more) have now found 29 real bugs total. Still
   no sign of the well running dry; each pass used deliberately different
   lenses so it wouldn't just re-find the same things. Worth a third pass
   before assuming diminishing returns, but consider whether it's time to
   switch modes — e.g. a pass that specifically hunts for regressions in
   *this* session's 16 fixes, the way this session's regression-check lens
   did for the session before it.
2. The deliberately-deferred findings from both audit passes (listed in the
   work log above) — none blocking, but two are genuine product-design
   questions worth 30 seconds of your input rather than a guess: should
   removing a saved item from Plans let Browse offer that card again this
   session, and is the story freshness ring worth a redraw-cost trade to
   fix.
3. Local-spots economy depth (tokens currently only ever go up by 1 per
   visit — no spending/redemption exists anywhere, which may be fine or may
   be a gap depending on what Phoenix actually wants tokens to do).
4. If Phoenix wants LA live in the prototype (not just acknowledged
   honestly on the globe), that's a real data-acquisition task via
   `build_map.py`'s Overpass pipeline — scope it with him first, it's not
   a small addition.
5. Re-read `docs/DECISION_LOG.md` for anything logged after 2026-08-07 that
   might supersede assumptions here — this doc is a snapshot as of the
   session that wrote it.
