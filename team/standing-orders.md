# Standing Orders

**Check this file before starting any build work, enabling automation, or
making a judgment call about what to do next.** Everything here is a live,
founder-issued instruction — not a durable principle (those are in
`operating-principles.md`) and not a permanent fact about Func (those are in
`docs/`). Entries get added, updated, and *removed* as the founder issues new
direction. If an entry no longer reflects reality, delete it — a stale order
is worse than no order.

Format: each entry has an issue date, the order itself, and what would lift
or change it. Newest first.

---

## 🟢 Pool restored — `func-mobile/` is the active build; Mapbox over MapLibre

- **Issued:** 2026-08-21
- **Order:** Pool (capacity × access toggles, batch request review, pre-accept
  messages, auto-created group chats) is back as the hero mechanic — see Decision 015.
  Call It, In/Nah voting, Plan Flag, Convoy and Sparks stay retired/undefined; only
  Pool itself is reversed from the 2026-08-07 retirement below.
  - **Active build is `func-mobile/`** — Expo SDK 57, RN, TypeScript, `@rnmapbox/maps`
    with `projection: 'globe'`. Needs a Mapbox account + `EXPO_PUBLIC_MAPBOX_TOKEN` in
    `.env` — none exists on this Mac yet, so the globe itself has never actually been
    seen rendering; without it the map falls back to a labelled schematic view.
  - **`func-app/` and `prototype-web/` are archived, not deleted** — moved to
    `archive/`. `func-app/` was mid-migration onto MapLibre and was fully
    Decision-012-compliant; that work is paused, not wrong, if Pool/Mapbox ever get
    reversed again.
  - `func-mobile/` was sitting untracked in git (52 files, never committed) as of this
    entry — stage/commit it before doing further build work on it, or an accidental
    delete loses everything with no recovery path.
- **Supersedes:** the entry directly below, as far as which app is being built and
  which map library. That entry's identity/colour/city notes (chrome-on-black, SF/LA
  in dollars, no emoji) are untouched by this one and still apply.

## ~~🟢 Prototype rebuilt as real code — `prototype-web/` is the live prototype~~ (SUPERSEDED 2026-08-21)

**Superseded 2026-08-21** by the entry above — the active build moved to
`func-mobile/` and the map library moved back to Mapbox. Kept below for the record;
the identity/colour/city decisions in it are still current, only the "which
app/which map library" parts changed.

- **Issued:** 2026-08-07
- **Order:** The investor/developer prototype is now built as real code in
  `prototype-web/`, not in Figma Make and not in the Expo `prototype/`.
  Run it with `python3 -m http.server` from that folder; regenerate the map
  with `build_map.py`.
  - **Setting is San Francisco in dollars.** SF and LA launch first. Velmont
    and £ are retired — do not reintroduce them.
  - **Identity (updated 2026-08-07, second pass):** **chrome / liquid metal on
    true black.** The official logo is the chrome `func.` lockup with the
    eye-and-person replacing the "n" — Phoenix supplied it, along with a
    six-beat opening-animation storyboard that must be followed closely:
    *home screen → logo appears → letters retract into the pupil → the eye
    blinks → the pupil becomes Earth → Earth expands and dives → live map.*
  - **Emerald is no longer the interface colour.** It survives as the single
    signal for **life only** — heat, the traffic light, live stories. Every
    other surface is chrome, glass or white. If everything is coloured,
    nothing means anything.
  - Condensed uppercase display type, and **no emoji as iconography, ever**.
  - **Base map:** moving to **MapLibre + a custom Func style** (Phoenix's call,
    2026-08-07) for global coverage, real 3D buildings and normal map zoom.
    Not Google Maps — it can't be art-directed far enough and needs billing.
  - The Expo `prototype/` is left untouched as the record of the previous
    direction. Do not build on it.
- **Supersedes:** the Bible HOLD below, and the Michail hand-off as the route
  to prototype UI (the sketch → digitise pipeline itself still stands if
  Phoenix resumes drawing).

## ⚠️ Read Decision 012 before touching product direction

- **Issued:** 2026-08-07
- **Order:** A **Tier 0 change** landed on 2026-08-07. Group-first is retired;
  the line is now *"Func is just a bridge between you and the opportunities of
  the night."* Pool, Call It, In/Nah voting, Plan Flag and Convoy are retired.
  Backing/vouches are **deferred, not deleted**.
  - **Every deck generated before 2026-08-07 is stale.** Do not send one.
  - The Map v3 spec (`docs/specs/map-v3-social-layer-spec.md`) is now largely
    superseded. Keep it for the record; do not build from it.
  - Open question the founder accepted knowingly: without groups, "why can't
    Instagram or Google Maps do this?" needs a sharper answer than the deck
    currently has. Worth working on before investor meetings.

## ✏️ First UI drawing stage — sketch → digitise → Michail pipeline live

- **Issued:** 2026-08-04
- **Order:** Phoenix is hand-drawing the first UI ideas on paper. He
  photographs them, drops the photos in `Func/inbox/ui-sketches/`, Claude
  digitises/cleans/upscales them into `Func/docs/design/ui-sketches-digitised/`,
  and Phoenix sends those to **Michail** (friend, Func co-partner), who
  produces the final prototype UI art for the slide decks.
  - Full mechanics in `team/ui-sketch-workflow.md`.
  - This is a legibility pass, not a design pass — no inventing UI elements
    that weren't drawn.
  - Doesn't touch the HOLD — it's tooling work done at his direct request.
- **Also issued the same day:** everything Func-related, filtered or not,
  now gets logged in `Func/docs/RAW_IDEAS.md` — including ideas that never
  make it past a conversation. Separate from the tracker, which only holds
  post-intake items.

## 📥 Intake pipeline is live — conversations go through it, not straight into the spec

- **Issued:** 2026-07-27
- **Order:** The founder records conversations (with friends, or alone),
  cleans them up, and drops them into `inbox/`. From there they go through
  the **`func-intake`** skill, which structures, extracts, classifies,
  tiers, and assesses them before anything reaches the master spec.
  - **Do not** write conversation content directly into the master spec or
    the Product Thesis. It goes through intake.
  - **Tier 0 and Tier 1 changes are never auto-applied** — see
    `func-identity.md`. Propose, escalate, wait for the founder.
  - The **master spec** (Google Doc "Func — Master Product Spec (Living)")
    and **tracker** (Google Sheet "Func — Feature & Decision Tracker") are
    the shareable current-truth versions. `docs/` remains the
    engineering-side source of truth. They must never disagree.
- **Purpose:** the founder explicitly wants Func to be able to change
  radically without the app's identity eroding. The tier system is the
  mechanism — big changes stay possible, but their blast radius is visible
  before they land.

## ~~🛑 HOLD — no further build work until the Func Bible is complete~~ (LIFTED)

**Lifted 2026-08-07** by the founder's live instruction to rebuild the prototype.
Per `CLAUDE.md`, the live conversation outranks a standing order. The Func Bible
was never written; the direction it was meant to settle was instead given
directly across this session and is recorded in Decision 012. Kept below for the
record — treat the restrictions as no longer active.

### Original order

- **Issued:** 2026-07-25
- **Order:** The founder is writing the **Func Bible** — a descriptive essay
  defining Func's ultimate vision and how the founder envisions it — before
  the team resumes building. Until it's complete:
  - **Do not** proactively continue the Map v3 build plan
    (`docs/specs/map-v3-social-layer-spec.md` §6, steps 5–11).
  - **Do not** enable or trigger the cloud routine once it exists.
  - **Do not** treat "the founder is away" as license to keep building
    autonomously.
  - **Acceptable work during the hold:** anything the founder directly asks
    for in a live conversation — infra/tooling setup, bug fixes on request,
    discussion, and editing or critiquing a Func Bible draft *if the founder
    asks for that*. The team does not write the Bible; it's founder-authored.
- **Lifts when:** the founder has published the Func Bible (expected home:
  `docs/FUNC_BIBLE.md`) and explicitly says to resume.
- **Status note (2026-07-27):** `docs/FUNC_BIBLE.md` exists as an empty
  directory, not a written document. Hold still in effect.

## GitHub push + cloud routine — infrastructure prepped, not active

- **Issued:** 2026-07-25
- **Order:** The founder approved pushing the Func repo to a new private
  GitHub repository and setting up a daily cloud-scheduled session (via
  `RemoteTrigger`) to resume the Map v3 build autonomously once the hold
  above lifts. As of this writing:
  - **Blocked on:** the founder running `gh auth login` on this Mac (no
    GitHub CLI or credentials were present). See `team/reviews/` or the
    conversation history for exact setup steps if needed again.
  - **Once auth is confirmed:** create a private repo, push `main`, then
    create the `RemoteTrigger` routine — but leave it **disabled**
    (`enabled: false`) until the Bible-hold above also lifts. Both
    conditions must clear before the routine actually fires.
  - **Known limitation to keep in the routine's prompt:** cloud sessions
    have no access to this Mac — no local Node install, no iOS Simulator, no
    physical phone. They can typecheck, build, and do a browser-level sanity
    check; they cannot do the native verification `operating-principles.md`
    #9 requires. Native verification of cloud-built work still needs a
    session run from this Mac.

## iOS Simulator — ready

- **Issued:** 2026-07-25
- **Status, not an order:** Xcode 26.6 and the iOS 26.5 Simulator runtime are
  fully installed and working on this Mac (five iPhone models available via
  `xcrun simctl`). Native verification per `operating-principles.md` #9 can
  proceed normally once build work resumes. No action needed — noted here so
  a future session doesn't waste time re-diagnosing something already fixed.

---

## 🔧 Engineering sync (added 2026-08-11)

Build work continued past this file's last update — a 2026-08-09 architectural
reset (After Hours mode removed, product renamed lowercase `func`, new
presence/DTF model, migration to TypeScript + React Native) and MapLibre
delivery (commit `cf39f79`) both happened as live founder directives, recorded
in `func-app/HANDOVER.md` rather than here. No entry above covers that work,
and none of it was blocked by anything in this file — it's a gap in this log,
not a conflict with it.

**Active repo for `func-app/` build work is now `~/Developer/Func/func-app`**
(migrated from this iCloud location — see `func-app/HANDOVER.md` §1 for why).
`docs/` and `team/` still govern from here; only the code moved. This file and
`docs/DECISION_LOG.md` were also stale in the new location (committed history
stopped at 2026-07-25 because these files were edited but never committed
before the migration) — synced by hand 2026-08-11. Check `func-app/HANDOVER.md`
for current build status before starting engineering work.
