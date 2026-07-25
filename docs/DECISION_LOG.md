# Decision Log

Significant decisions only. Each entry records the options considered and why we chose
what we chose, so future-us can tell whether the reasoning still holds.

Format: status is one of `OPEN`, `ACCEPTED`, `SUPERSEDED (by NNN)`.

---

## Decision 001 — Sequence of founding work

- **Date:** 2026-07-24
- **Status:** ACCEPTED
- **Context:** Empty repository, no product definition. Candidate first moves: investor
  pitch, market research, technical planning, or prototyping.
- **Options considered:**
  1. *Investor pitch first* — rejected: a deck with no product thesis and no demo is
     fiction; it would also anchor us to whatever story sounded good on a slide.
  2. *Technical planning first* — rejected: architecture decisions made before the
     product is chosen are guesses we would pay to undo.
  3. *Prototype first* — rejected as a company-level move (a week on the wrong product
     is the most expensive research method), but accepted as a tactic: a 1–2 day spike
     is allowed once a direction is chosen.
  4. *Product direction first, then validation research, then a walking-skeleton demo* —
     *chosen.* The biggest risk at this stage is building something nobody wants;
     everything else is downstream of what the product is.
- **Decision:** Phase 0: choose product direction (founder call, Decision 002).
  Phase 1: validation research + one-page product thesis. Phase 2: architecture sketch +
  walking-skeleton prototype of the single core loop. Phase 3: private alpha with real
  users. Investor materials are prepared only once a demo and an early usage story exist,
  unless the founder chooses to raise earlier.

---

## Decision 002 — Product direction

- **Date:** 2026-07-24
- **Status:** SUPERSEDED (by 003)
- **Context:** "Func" (short for Function) fixes almost nothing about the product. The
  team's shortlist, filtered for (a) buildable to a compelling demo by a small team,
  (b) a wedge where incumbents are weak, (c) credible monetisation, (d) name fit:
  1. **Tools-for-AI-agents platform** — developers write small functions; Func hosts
     them and exposes them as secure, billable tools (MCP-compatible) that any AI agent
     can call. Marketplace + usage-based revenue. Strongest market timing; competitive
     but not yet consolidated.
  2. **Instant backend functions** — write a function, instantly get an HTTPS endpoint,
     cron, and secrets. Proven demand; direct incumbents (Val Town, Cloudflare Workers)
     with community lock-in.
  3. **Plain-English automations** — non-developers describe a task in English; Func
     builds and runs the automation. Largest market; hardest distribution; incumbents
     (Zapier, Make) are adding AI quickly.
- **Decision:** Option 1 — tools-for-AI-agents platform. The founder was offered the
  choice and expressed no preference, delegating to the team; the team's recommendation
  stands. Rationale: strongest why-now (agent adoption is compounding while tool
  infrastructure is still fragmented), best name fit, clearest monetisation
  (usage-based + marketplace), and a demo is achievable by a small team. This decision
  is **reversible until Phase 1 validation confirms it** — if research contradicts the
  thesis, we return here rather than pushing through.
- **Superseded:** hours after acceptance, the founder delivered their actual product
  vision (see 003). Founder direction outranks team recommendation; no work was lost
  beyond this log entry.

---

## Decision 003 — Product direction (founder's vision)

- **Date:** 2026-07-24
- **Status:** ACCEPTED (founder directive)
- **Context:** The founder supplied a rough draft (produced with Claude in a separate
  session, not present in this repo): **Func is a social nightlife app** — a dark,
  neon-themed mobile app with (1) a live city heatmap of going-out activity, (2) a
  "Pool" where friend groups invite other groups to go out together, (3) an events
  feed, (4) a dating swipe deck, (5) public profiles. First deliverable: a pitch-ready
  prototype (Expo + React Native + TypeScript) running entirely on in-memory mock data
  for a fictional city, "Velmont". All mock users are adults (18–26).
- **Founder's brief:** build on or change the draft freely to maximise the product's
  chance of becoming industry-leading; the draft is explicitly not final. Team has
  creative freedom within the founder's concept.
- **Standing flags carried with this decision:**
  - Trust & safety (ID/age verification, moderation, harassment prevention, duty of
    care) must have a credible answer in any pitch, even though the prototype mocks it.
  - Location privacy: the heatmap must be designed aggregate-only from day one —
    individual live locations are never exposed. This is both an ethical requirement
    and an investor-facing strength.
  - Cold-start/liquidity is the historical killer of this category (Tinder Social et
    al.) — the thesis must name our wedge, not hand-wave it.
- **Decision:** Adopt the founder's vision. Phase 1 (validation research + thesis) now
  targets the social-nightlife space; Phase 2 is the Velmont prototype.

---

## Decision 004 — Prototype map: custom SVG city, not react-native-maps

- **Date:** 2026-07-24
- **Status:** ACCEPTED (team execution call, reversible)
- **Context:** Founder's draft specified `react-native-maps` with a dark style. Three
  problems: (1) Velmont is fictional — real map tiles cannot render it, and fictional
  labels floating over a real city reads as broken; (2) custom dark map styling
  requires the Google provider and a dev build — it does not work in Expo Go on iOS,
  which is exactly where a pocket demo will be shown; (3) tiles need network, which
  violates the offline rule.
- **Decision:** Draw Velmont as an art-directed SVG (react-native-svg): coastline,
  district shapes, heat as layered radial gradients, tappable pins. Works in Expo Go,
  on web, offline, and looks intentional. If the product graduates to a real city,
  we return to real map tiles — this decision is prototype-scoped.

---

## Decision 005 — Prototype conventions: Expo Router, `prototype/` dir, monogram avatars

- **Date:** 2026-07-24
- **Status:** ACCEPTED (team execution call)
- **Decision:** (1) Expo Router (current Expo default, wraps react-navigation — the
  draft's intent, less template-fighting). (2) App lives in `prototype/` — honest
  naming; the production app will likely be rebuilt, and docs stay at repo root.
  (3) No bundled photos: none exist, remote images violate offline; people render as
  neon gradient monogram avatars as a deliberate brand look, with an assets drop-in
  path wired for real photos later. (4) Strategic reframe recorded in the thesis:
  the Pool is the hero feature; heatmap is context; dating is downstream ("Sparks",
  post-night mutual reveal as the V2 design) — prototype still ships the founder's
  five-tab structure unchanged.

---

## Decision 006 — Map v2: two-altitude world→city map, stylised night-globe

- **Date:** 2026-07-24
- **Status:** ACCEPTED (founder directive: map must depict planet-scale live heat and
  be scrollable/interactive)
- **Decision:** Map tab becomes two altitudes. **World**: stylised SVG night-globe
  (graticule + glowing city nodes + arcs + global live counter) — geography-free by
  design so it always looks intentional; Velmont is the one live city, others are
  labelled as launching soon (roadmap storytelling built into the UI). **City**: the
  Velmont map becomes pannable (PanResponder drag, movement-threshold so venue taps
  still work) with zoom buttons (pinch deferred to the gesture-handler upgrade).
  Liveness via exactly three animations: pulsing hot-venue halos, ticking people
  counter, scrolling "happening now" ticker. Full rationale and rejected options in
  docs/design/2026-07-24-map-v2-critique.md.

---

## Decision 007 — Cost model: itemised min–max breakdown per event, avg spend per venue

- **Date:** 2026-07-24
- **Status:** ACCEPTED (founder directive: every event/plan shows per-part costs and
  min/max spends)
- **Decision:** `FuncEvent` gains `costBreakdown: CostItem[]` (label, emoji, min,
  max); totals are always derived by summing items, never hand-typed. `Venue` gains
  `avgSpend` for the map mini-card. Event cards show the derived total range
  ("£18–42 night"); the event modal shows the full itemised breakdown ("The damage
  💸"). Real-product data pipeline (venue-declared + crowdsourced receipts) documented
  in the map-v2 critique. Night-plan builder (multi-stop budgeted plans) recorded as
  V2 scope, not built now.

---

## Decision 008 — Map-first strategic directive; social layer deepens (founder)

- **Date:** 2026-07-24
- **Status:** ACCEPTED (founder directive)
- **Context:** Founder directive: the map is the single highest product priority and
  must become Func's defining, centrepiece feature (Snap Map = usability benchmark,
  not end goal); profiles evolve into digital identities; a "Vouch" reputation
  system is explored across multiple implementations with a recommendation; Stories
  integrate natively into the map-first experience. Inspiration artifact supplied
  and critiqued (docs/design/2026-07-24-inspiration-artifact-critique.md) — its
  trust mechanics adopted as direction, its map-as-afterthought, gender telemetry
  and luxury-only economics explicitly rejected.
- **Process:** Per the EM operating changes (docs/team/2026-07-24-em-review.md),
  the design ran as parallel independent explorations (three map concepts from
  different first principles + vouch/stories/profile designs) with adversarial
  judging before synthesis — single-designer tunnel vision is the biggest quality
  risk on a centrepiece feature. Outcomes will be logged as Decisions 009+.

---

## Decision 009 — Map v3 + Social Layer: adopt "The Call" (The Decision Engine)

- **Date:** 2026-07-24
- **Status:** ACCEPTED
- **Context:** Three independent map concepts were designed from different first
  principles (Pulse — Living City / presence-and-atmosphere; The Call — Decision
  Engine / ranked instrument; The Floor — Social Stage / map-as-performance),
  scored blind by three judges each applying a different lens (first-time
  usability as a sceptical 19-year-old; retention/network-effects as a growth
  operator; brand defensibility as an investor). Full designs and scorecards in
  `docs/design/exploration/`.
- **Result:** **"The Call" won unanimously** (49/52/51 of 60 vs Pulse 44/48/44 and
  The Floor 46/46/45) — the only concept with a structural moat (money-on-the-map,
  per-crew ranked fit, consensus-as-map-interaction) rather than an aesthetic one.
  Its judged weakness ("best moat, thinnest soul") is fixed by grafting The
  Floor's brand marks (burn rings, crew flags) and Pulse's living-city treatments
  (BPM pill, comets, Night Tide) — all three judges independently proposed
  overlapping grafts, which is why the synthesis merges rather than picks-and-discards.
- **Decision:** Adopt the full synthesis in
  `docs/specs/map-v3-social-layer-spec.md` as Func's next build target: a
  three-altitude map (World → City → Venue Focus) built around **Beacons**
  (burn-ring + fit-scored glow), a **Group Lens** that re-ranks the city live
  per crew/budget, **Call It → verdict flag → Plan Flag** as the core group
  decision mechanic, **Convoy** (plan-scoped-only live presence, visible
  countdown, opt-in-by-act), **Flares** (venue-anchored ephemeral stories that
  literally are the heat signal, geofence-gated posting, no stories tab), a
  **Backing** vouch system (stake-based, co-attendance-gated, typed 4-verb
  vocabulary, no numeric score ever shown), and **Func ID** profiles (identity
  as a receipt of verified behaviour — Night Record, earned friends only via
  closed nights, no add-friend button). Full rationale, conflict rulings, and a
  12-step prototype build plan are in the spec; abuse-vector analysis for
  Backing and cold-start/ranking-trust risk analysis are in spec §3.4 and §7.
- **Note:** the workflow's automated completeness-critic step failed on API
  usage credits (non-blocking — 13/14 agents including all research, all three
  designs, all three judges, and the synthesis completed). The EM performed the
  completeness check manually before accepting; see the Map v3 build-progress
  note for what shipped in this session vs what remains.
- **Build status (2026-07-24, same session):** spec §6 steps 0–4 shipped and
  verified in the browser (see prototype/QA.md): shared data foundation (Story,
  Vouch, Night, Standing types; extended User with earned-friends/roles/status;
  seed files for stories/nights/vouches); Beacon anatomy (burn rings colour-coded
  by flare freshness, fit-scored core glow, crew badges) in `VelmontMap.tsx`;
  Decision Card v3 (busyness+trend, cost meter, who-line, flare filmstrip, tide
  line) in `app/(tabs)/index.tsx`; Flare Reel modal (`FlareReel.tsx`) with
  auto-advance, progress bars, Call It / Pool us in / Hype action bar; Call It →
  scripted verdict → Plan Flag lock, rendered live on the map; Group Lens budget
  chips live re-ranking the Top-3 rail; default altitude flipped to city-first;
  BPM pill with beat animation; world-view flare count. One bug found and fixed
  during QA: `FlareReel` had no `zIndex` and rendered behind the Decision Card
  (fixed, zIndex 50). **Not yet built:** Convoy, Night Tide scrubber, Crew
  Flags/Constellations for other crews, Pool Beacons, the Func ID profile
  rebuild, and the close-the-night Backing flow (spec §6 steps 5–11) — next
  session's work, tracked in prototype/QA.md.

---

## Decision 010 — Phone-first verification: native device/Simulator, not the browser

- **Date:** 2026-07-24
- **Status:** ACCEPTED (founder directive)
- **Context:** All QA to this point ran via `expo start --web` (react-native-web
  in a browser) because it's fast to drive with browser-automation tools. That
  choice produced real false signals this session: `PanResponder` gestures
  behave differently on web than native (the whole gesture-overlay design in
  the map exists to work around a web-only limitation — SVG-originated gestures
  never reach a parent `PanResponder` on web); a missing `zIndex` symptom that
  is web-stacking-context-specific; and repeated screenshot/click coordinate
  mismatches from `devicePixelRatio` scaling that don't exist on-device. The
  founder's priority is an app that is "highly user friendly" as a **phone**
  app and "coded ... in the format of a phone" — a browser approximation is
  the wrong instrument to judge that against, and every web-only workaround is
  a piece of complexity the real native app may not even need.
- **Options considered:** (1) Full Xcode + iOS Simulator, driven by the
  session's `mcp__Claude_Code_iOS_Simulator__control` tool — blocked this
  session: the Mac had only Xcode **Command Line Tools** installed
  (`xcodebuild`/`simctl` absent), and installing full Xcode (~15GB) needs the
  founder's Apple ID and cannot be done by the agent. Exact remaining setup
  steps (the `sudo xcode-select`/`xcodebuild -license` commands, which need the
  founder's password) were handed to the founder to run. (2) **Physical device
  via Expo Go** — zero install cost beyond the free Expo Go app, real touch/
  gestures/screen, arguably a *better* test than a simulator; already the
  documented path in `prototype/README.md`. (3) Keep using the browser as
  primary — rejected for the reasons above.
- **Decision:** Founder is installing full Xcode; once `xcrun simctl list
  devices available` shows real devices, the iOS Simulator becomes the
  primary automated dev/QA loop (screenshot + tap verification without
  needing the founder's phone every time). Until then, and as an ongoing
  complement even after, physical-device testing via Expo Go remains
  available and is arguably the more honest test. **The browser build is now
  explicitly secondary** — acceptable for a quick visual sanity check or a
  desk pitch, never sufficient alone to call a feature "verified." Any
  behavior that only reproduces on web (gesture quirks, z-index, gradient
  banding, hover states) must be treated as a web-emulation artifact, not a
  product bug, unless it also reproduces on-device.
- **Immediate fix while blocked:** audited existing screens for browser-shaped
  assumptions. `components/FlareReel.tsx` used hardcoded pixel offsets
  (`paddingTop: 54`, tap-zone `bottom: 120`) instead of the device's actual
  safe-area insets — on a real phone with a notch or Dynamic Island this would
  sit wrong and could make tap zones overlap the header/footer. Fixed to use
  `useSafeAreaInsets` plus measured header/footer heights via `onLayout`. All
  other screens already used `useSafeAreaInsets`/`SafeAreaView` correctly.
- **Next:** resume once Xcode is confirmed working — attach the Simulator
  panel, launch Func via `expo start --ios`, and re-verify the whole demo
  script (prototype/QA.md) natively before any further "verified" claims.
