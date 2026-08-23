# Visual Foundation Audit — func-mobile

**Date:** 2026-08-23
**Author:** Claude Sonnet 5, first session on the visual north star handover
**Repository:** `/Users/phoenixbarnes/Developer/Func`
**Active product audited:** `/Users/phoenixbarnes/Developer/Func/func-mobile`
**Mode:** Discovery only. No source code was written. No screens were redesigned. No libraries were installed. The reviewed `safe-map-pool` worktree (`/Users/phoenixbarnes/Developer/Func-safe-map`, branch `safe-map-pool`) was not touched.
**Method:** Read `CLAUDE.md`, the visual north star spec, and Decisions 012–016 directly. Everything else (`team/`, `docs/PRODUCT_THESIS.md`, `func-mobile/README.md`, and every file under `func-mobile/src` and `func-mobile/app` named in the brief) was read by six parallel research passes, each returning file:line evidence. A sample of the highest-stakes claims (`liveStatus.ts`, `Pins.tsx`, `theme.ts`, `index.tsx`, `TabBar.tsx`) was independently re-read and confirmed line-for-line before writing this document.

---

## 0. Executive summary

The architecture the north star spec asks you to preserve — `src/domain/` pure rules, `src/data/` safe projections, `src/ui/`+`app/` as renderers — is **real and mostly sound**. `livePinFor()`, `pool.ts`, and the `FuncRepository`/`Snapshot` boundary are exactly the kind of seams a visual pass should build on top of, not around.

But there is one finding that changes the shape of the whole plan: **no safe-view / visibility projection exists anywhere in the codebase.** `livePinFor()` correctly withholds identity fields from its own output, but every screen that renders a live pin (`app/(tabs)/index.tsx`, `src/ui/map/content.ts`) reaches straight past it to the raw `FuncUser` and prints full `displayName`, `@handle`, and photo for **every** live person, unconditionally. There is no `friend`/`mutual` concept anywhere in the type system (repo-wide grep returns zero hits) to gate it. This isn't a case of privacy logic leaking into the UI layer — there is no privacy logic to leak. It directly contradicts the already-adopted, non-superseded rule in `team/operating-principles.md`'s 2026-08-11 addendum (friends see exact position only if the viewed person has DTF on; mutuals get aggregate-only; everyone else gets anonymous heat only) and the north star's "mutuals/anonymous presence never become identifiable person pins."

Practical consequence: **the marker-system milestone (Stage 4 of the recommended sequence) cannot be built safely as pure styling.** Adding a photo + emerald heartbeat halo directly to the current code would render every stranger's name and face on tap. The projection needs to exist first, at the domain/data layer, before any visible-friend visual work starts. This is not new privacy policy — it's implementing a rule that's already decided but currently unenforced — but it is domain/data engineering, not Tier 3 styling, and Phoenix should confirm it's in scope before that milestone begins. See §7, item 1.

Three more concrete, high-confidence, unambiguous gaps, each independently reproducible by reading the cited line:

- **The map is permanently dark**, both in the real renderer (`MapboxGlobe.tsx:69`, `Mapbox.StyleURL.Dark`) and its token-less fallback (`SchematicMap.tsx:114`, `#111115`). The north star's single biggest visual instruction — "bright, readable at every hour" — is not just unimplemented, it's implemented backwards.
- **Emoji glyphs are used as interface iconography** in at least three live locations: Pool-invite map pins (`Pins.tsx:25`, 🔒/🪩), every Pool-invite card cover (`InviteBits.tsx:15`, 8 emoji), and the invite-placement crosshair (`app/(tabs)/create.tsx:142`, 📍). `Icons.tsx` itself is clean (pure SVG) — the violation is everywhere *else* icons are needed.
- **Premium's chrome ring is conditional, not permanent** (`Pins.tsx:85`, `ring={status === 'dtf' ? colors.chrome : undefined}`) — it disappears for casual, off, and business accounts, the opposite of "permanent... independent of DTF/Casual/Off state."

None of this requires a rewrite. `theme.ts`, `Pins.tsx`, and `Avatar.tsx` are small, well-bounded files; the fixes are additive. The rest of this document lays out where every seam is, what's Tier 0/1 vs Tier 3 under `team/func-identity.md`, and a staged plan that fixes the identity leak before it gets designed around.

---

## 1. Architecture map of the active build

```
func-mobile/
├─ src/domain/            pure rules, no React, no IO — "locked shapes" (types.ts:1-8)
│  ├─ types.ts              FuncUser, PersonalProfile, BusinessProfile, PoolInvite, PoolRequest, Venue
│  ├─ liveStatus.ts          livePinFor() → LivePin (no identity fields) · OFF_PIN_TTL_HOURS=48h · canUseLiveStatus()
│  └─ pool.ts                 relationTo(), isFull(), seatsLeft(), pendingRequests() — Decision 015 capacity math
│                              ⚠ NO visibility/friend/mutual projection exists here or anywhere else.
│
├─ src/data/               the backend seam
│  ├─ repository.ts          FuncRepository interface + immutable Snapshot — the one true UI/domain boundary
│  ├─ InMemoryRepository.ts   mock impl; setLiveStatus(), switchProfile() are the only status mutation paths
│  ├─ selectors.ts            read helpers over Snapshot (myThreads, hostedInvitesWithPending, groupLead, …)
│  └─ seed/                   SF demo data; PersonalProfile.photo is `mono:<hex>`, not a real photo asset
│
├─ src/ui/
│  ├─ theme.ts                ONE flat dark palette; no glass/chrome/electric-palette tier; bg=#16161a (placeholder, Decision 016)
│  ├─ components/              Avatar (single generic `ring` prop, no halo), TabBar (opaque full-width frame),
│  │                            Icons (clean SVG), DiscoBall (SVG marker, recurs 4x), InviteBits (⚠ emoji covers),
│  │                            Primitives (flat Card/Screen, no blur/glass), Logo, ScreenHeader, ThreadRow
│  └─ map/
│     ├─ FuncMap.tsx           switch: MapboxGlobe if token present, else SchematicMap (two independent renderers)
│     ├─ MapboxGlobe.tsx        real map — globe→mercator continuity works here; style is Dark
│     ├─ SchematicMap.tsx       token-less fallback — flat sketch, no globe, no continuity (self-labelled fallback)
│     ├─ Pins.tsx                shared marker rendering — ⚠ emoji glyphs, ⚠ conditional premium ring
│     └─ content.ts              ⚠ mapPins() projection lives here (src/ui/), not src/data/ — attaches raw FuncUser
│
└─ app/                    expo-router routes (render-only, per architecture guardrail)
   ├─ (tabs)/index.tsx       MapScreen = home tab; LivePreview ⚠ prints full displayName/@handle for every live pin
   ├─ (tabs)/profile.tsx     personal profile — photo(mono)/name/status pill/business-switch only; no city/scene/friends/vouches/badges
   ├─ (tabs)/create.tsx      ⚠ 📍 emoji crosshair
   ├─ venue/[id].tsx          event-card equivalent — flat Card, no live social proof, no distance shown, ⚠ distanceKm() duplicated here instead of domain
   ├─ invite/[id].tsx, review/[id].tsx   Pool detail + Decision-015 batch review (structurally correct)
   └─ thread/[id].tsx, inbox.tsx, messages.tsx
```

**Boundary reading:** `src/domain` and `src/data` are genuinely clean of UI concerns — that part of the guardrail is holding. The violations run the other direction: projection/derivation logic (`content.ts`'s `mapPins()`, `venue/[id].tsx`'s `distanceKm()`) has drifted into `src/ui/` and `app/` instead of living in `src/data/`. That's a real but low-severity architecture debt. The identity-leak finding above is a different, higher-severity class of problem: it's not logic in the wrong layer, it's logic that doesn't exist in any layer.

---

## 2. Current-state audit (area / evidence / gap / proposed seam / risk)

### 2.1 Governance fit — what tier is this work?

| Area | Evidence | Current state | Gap vs. north star | Proposed seam | Risk |
|---|---|---|---|---|---|
| Change-tier system | `team/func-identity.md:22-83` | Tier 0 = constitution (needs Phoenix naming the item + Decision Log + version bump). Tier 1 = architecture, explicitly including **Map** and **Func ID/Profiles** (`:61-69`, needs a Decision Log entry). Tier 2 = features. Tier 3 = "colour, copy, motion, naming, iconography, ordering — just do it, note it in the tracker." | Most of the north star (palette, chrome, type, icons, map *style*) is squarely Tier 3 — low friction by design. But two things this audit found are **not** Tier 3: (a) the friend/mutual/anonymous visibility projection is Tier-0-adjacent (it enforces an existing safety rule, not a styling choice); (b) adding profile fields (city, scene, friends, vouches, badges) touches **Func ID/Profiles**, a named Tier 1 system. | Tier-check each milestone before starting it, not after. | Treating (a) or (b) as ordinary styling risks shipping a Tier 0/1-consequential change without the sign-off the founder's own process requires. |
| Currently active standing orders | `team/standing-orders.md:16-49, 85-97` | Two live orders, both consistent with this brief: trust-and-safety-as-whole-app-requirement (2026-08-22) and Pool-restored/Mapbox/func-mobile-is-active (2026-08-21). Chrome identity color is explicitly "pending the source file." | None — no active order conflicts with the visual north star. | — | The exact identity hex is genuinely blocked on Phoenix supplying `docs/brand/func-icon-chrome.png` (Decision 016). |
| `func-mobile/` git status | `git log`, `git status` (verified live) | The 2026-08-21 standing-order risk ("52 files untracked, could be lost") is resolved — committed 2026-08-22 (`6286c1e`). Working tree clean except 3 untracked docs files unrelated to `func-mobile/`. | — | — | This session's own environment metadata reported "Is directory a git repo: No" for this exact path — that's wrong; `git status` confirms a repo on `main`. Don't trust that field in a future session. |
| `docs/PRODUCT_THESIS.md` staleness | `PRODUCT_THESIS.md:76-90` | "Current status" section still names `prototype-web/` as live and `func-app/` (MapLibre) as successor. Both are archived per Decision 015. | Not a code gap, but a doc that will mislead a future reader who doesn't also check `team/README.md`. | — | Low; flagged as an open question in §7, not fixed here (out of scope for a code audit). |
| Emoji in `PRODUCT_THESIS.md`'s traffic-light notation | `PRODUCT_THESIS.md:33-35` (🟢 DTF · 🟠 casual · 🔴 off · 🪩 premium · 🥇 business) | Documentation shorthand, not code. | Ambiguous against "no emoji as iconography, ever" — unclear if this ever meant literal in-app iconography. | — | No code impact found (the app itself does not render these emoji as status icons) — flagged as an open question in §7 so it isn't silently read as license for the *code* emoji found in §2.4. |

### 2.2 Domain & data — the privacy/projection boundary

| Area | Evidence | Current state | Gap vs. north star | Proposed seam | Risk |
|---|---|---|---|---|---|
| Presence → pin resolution | `src/domain/liveStatus.ts:36-65` `livePinFor()` | Correctly returns `LivePin` with no `displayName`/`handle`/`photo` — only `status`, `premium`, `location`, `elapsedHours`. This is the right pattern, just incomplete. | — | — | — |
| **No safe-view / visibility projection exists** | Repo-wide grep for `ViewerSnapshot`, `safe view`, `projection` (excl. Mapbox's `projection="globe"` prop): zero hits. | Nothing between `FuncUser` and the screen strips identity for non-mutuals. | Direct conflict with the core marker-hierarchy rule (§0). | New function alongside `livePinFor()` in `src/domain/` (or a `src/data/selectors.ts` projection over `Snapshot`) that returns identity fields only when the viewer/subject relationship allows it. | **High.** This is the audit's central finding — see §0 and §7.1. |
| Where the leak actually happens | `src/ui/map/content.ts:23-26` `mapPins()` attaches `user: u` (full `FuncUser`) to every live `MapPin`; `app/(tabs)/index.tsx:157,161-162,175` (`LivePreview`) reads `u.personalProfile.displayName`, `u.handle`, interpolates `premium` directly; `src/ui/components/Avatar.tsx:8-14` reads `user.personalProfile.photo` directly. Verified directly: `index.tsx:157` renders `{u.personalProfile.displayName}` unconditionally for every non-`isMe` live pin. | Every live pin — dtf, casual, or off, for any user — shows full name + handle + photo on tap, regardless of relationship to the viewer. | This *is* the gap, not a symptom of one. | Once a projection exists, `content.ts` and `LivePreview` should consume its output instead of the raw `FuncUser`. | **High** — building any "friend halo" UI against today's `MapPin.user` bakes the leak in further. |
| No friend/mutual concept in the type system | grep for `friend\|mutual` across `src/`: zero relevant hits (only an unrelated venue named "Halo"). | `FuncUser`/`Group` carry no relationship field. `Group` only models "who you're out with tonight." | North star's 3-tier marker hierarchy (venue/event → visible friend → anonymous glow) has no data to be built from. | A relationship signal needs a home — new field or derived function. Genuinely unresolved; see §7. | Any visual-only "who gets a photo" decision (e.g. picking at random, or keying off premium) would fabricate a privacy boundary that doesn't exist — worse than not building it. |
| Premium is type-independent of status, rendering is not | `types.ts:30` `premium: boolean` is a separate field from `liveStatus`; `repository.test.ts:136-137` explicitly asserts "premium is a skin, not a status." Verified: `Pins.tsx:80-88` — `tint = status === 'dtf' ? 'green' : 'amber'`, `ring={status === 'dtf' ? colors.chrome : undefined}`. | Type-correct, render-incorrect: the chrome ring only appears when a premium user is also `dtf`. | "Permanent neutral-silver chrome ring... independent of DTF/Casual/Off state" is violated at the render layer even though the data layer already got it right. | `Pins.tsx`'s `LivePinView` — attach `ring=colors.chrome` unconditionally whenever `live.premium`, across all three `DiscoBall` call sites (dtf/casual/off/business currently only one of four sites sets a ring). | Medium — a partial fix (only the dtf branch) is an easy trap given four separate call sites. |
| No location-precision / cluster-by-zoom field | `PersonalProfile.lastKnownLocation` (`types.ts:29`) is always exact `{lat,lng,timestamp}`, no fuzz-radius. `content.ts`'s `mapPins()` takes no zoom/viewport parameter. | Every pin renders at exact coordinates at every zoom. | North star implies precision should degrade zooming out; nothing supports that today. | Unclear whether this belongs as a type-level precision field or a zoom-aware transform — see §7. | — |
| Test coverage of the privacy boundary | `src/data/__tests__/repository.test.ts` (only test file in the repo) covers: 48h TTL expiry, business-account status suppression, premium-is-a-skin invariant. Zero tests touch identity/name/photo exposure or mutual/anonymous distinction. | Consistent with zero implementation — there's nothing to test yet. | Any future fix needs its own tests, since none exist to regress. | — | — |

**Do not touch** (this area): `types.ts`'s locked shapes (file header, `types.ts:1-8`); `livePinFor()` and `OFF_PIN_TTL_HOURS`; `canUseLiveStatus()`; `InMemoryRepository.ts`'s `setLiveStatus()`/`switchProfile()` (the `switchProfile('business')` → forces `liveStatus:'off'` invariant); the `FuncRepository`/`Snapshot` boundary itself; `pool.ts`'s capacity/access math.

### 2.3 Map foundation

| Area | Evidence | Current state | Gap vs. north star | Proposed seam | Risk |
|---|---|---|---|---|---|
| Which renderer is live | `FuncMap.tsx:24-39` switches on `hasMapboxToken` (`mapConfig.ts:6-9`); `.env` on this machine has a `pk.`-prefixed token. | `MapboxGlobe.tsx` is what's actually mounted today, not the schematic fallback. | — | — | If `.env` is local-only, anyone without it silently gets `SchematicMap` with no error — confirm whether the token is meant to be shared. |
| **Map style is dark** | `MapboxGlobe.tsx:69` `styleURL={Mapbox.StyleURL.Dark}`; `:84-91` atmosphere colors `rgb(22,22,26)`/`rgb(8,8,12)`; `SchematicMap.tsx:114` `backgroundColor:'#111115'`. | Both the real renderer and its fallback are permanently dark; no bright/day style, no time-of-day logic anywhere. | **Direct, largest single conflict**: "bright, readable at every hour; no forced night/afters mode." | `mapConfig.ts` is the natural seam for a style constant `MapboxGlobe.tsx` consumes instead of the hardcoded `Dark` constant; `SchematicMap`'s fill/grid need matching light tokens. | — |
| Globe→city→street continuity | `MapboxGlobe.tsx:30-33,53-64,70` — native `projection="globe"` + explicit `flyTo` entrance (`GLOBE_ZOOM 1.2 → LOCAL_ZOOM 12.4`). `SchematicMap.tsx:32` `flyTo` is a documented no-op; `:34-58` fixed flat bounds. | Continuity is real, but only inside `MapboxGlobe`. `SchematicMap` is a wholly separate, disconnected implementation, not a graceful degrade of the same experience. | North star wants one continuous system; today it's a hard switch between two unrelated ones. | Keep `SchematicMap` explicitly scoped as a labelled dev/no-token fallback (it already self-labels on-screen), not a second real map surface to chase parity on. | — |
| Venue markers | `Pins.tsx:11-18` `VenuePinView`; `theme.ts:28-43` `categoryColor()`. | A single 14×14 solid-color dot; only differentiator across 5 categories is fill color. | "Every colour state needs a non-colour cue"; falls short of "category objects." | `VenuePinView` is the single seam — both renderers import from it. | — |
| **Invite pins render emoji** | `Pins.tsx:25` — verified directly: `<Text style={styles.inviteGlyph}>{invite.access.mode === 'private' ? '🔒' : '🪩'}</Text>` | Lock/disco-ball emoji as the pin's iconography inside a circular badge. | Direct, unambiguous violation of "no emoji glyphs as iconography." | Replace with an SVG glyph in the `Icons.tsx` pattern. | — |
| **Premium ring is conditional** | `Pins.tsx:85` (verified) — `ring={status === 'dtf' ? colors.chrome : undefined}`; `:70-71` premium+off gets a plain grey `DiscoBall`, no ring; business branch (`:56-59`) also has no ring. | Chrome ring only appears for premium+dtf. | "Permanent... independent of state" — see §2.2, same finding, render-layer view. | See §2.2 proposed seam. | Four separate call sites make a partial fix easy to leave broken elsewhere. |
| No profile photo on any live pin | `Pins.tsx:52-96` `LivePinView` — every branch renders a colored dot or SVG glyph; no `Image`/photo reference anywhere in the file. | "Visible friend = profile photo + emerald heartbeat halo" is entirely absent, not partially built. | See §0/§2.2 — this cannot be built correctly until the visibility projection exists. | `LivePinView` is the render seam, but photo-eligibility must come from the domain projection, not be decided here. | High — same identity-leak risk as §2.2 if built ahead of the projection. |
| No clustering | grep for `cluster` across all map files: zero hits. Every pin is its own `Mapbox.MarkerView` with `allowOverlap`. | At `GLOBE_ZOOM` (1.2), every pin renders simultaneously. | World→city→street continuity implies some density strategy; none exists. | Native Mapbox `ShapeSource`/cluster properties, or a client-side zoom-aware grouping step ahead of `mapPins()`. | — |
| Ambient glow / reduced motion | `Pins.tsx:31-50` `Pulse` — loops unconditionally via `Animated.loop`, only for `dtf` status; no `AccessibilityInfo.isReduceMotionEnabled` anywhere in the file. | Only ambient visual is a per-pin pulse ring, dtf-only, no map-level glow. | "Reduced-motion uses fades/state changes" cannot currently be honored — no reduced-motion branch exists. | Add a reduced-motion check to `Pulse` (or a shared hook). | — |
| Pin projection lives in `src/ui/`, not `src/data/` | `content.ts:1-28` imports `Snapshot`, `groupLead`, `livePinFor`, then itself filters/derives `MapPin[]` (including a deliberate "shops never drawn on map" rule, `:11,14`). | Projection/derivation logic sits under `src/ui/map`, not `src/data/`. | Borderline against the "src/data holds safe projections" guardrail. | Consider relocating `mapPins()`'s derivation into `src/data/` if a second screen ever needs equivalent map-pin derivation. | Low today — correct logic, wrong layer. |

**Do not touch** (this area): `content.ts`'s shop-exclusion rule (`v.category !== 'shop'`, a deliberate product rule); the shared-`Pins.tsx` pattern (both renderers import from one file — keep it that way); the Mapbox token value itself.

### 2.4 UI tokens, materials, primitives

| Area | Evidence | Current state | Gap vs. north star | Proposed seam | Risk |
|---|---|---|---|---|---|
| Token layer | `theme.ts:3-26` (verified) — one flat dark palette: `bg #16161a`, `surface #1f1f25`, `chrome #c9c9d2`, 5 locked category colors, 3 status colors, plus `radius`/`space`/`font`. | Single tier, no glass/chrome/electric-palette system, no bright/day palette. `#16161a` is explicitly a placeholder per Decision 016, not final identity color. | Missing: true-black, glass/blur/opacity tokens, named electric palette (cobalt/violet/hot-pink/cyan/acid-lime), bright-context colors. | Extend `theme.ts` with a second tier: `glass`/`chrome` (gradient + blur/opacity), a named `electric` palette, and (eventually) a bright/day set — all still feeding `categoryColor()`/`statusColor()` as the single source of truth. | Design-drift risk only if no token exists to reach for — see `InviteBits.tsx` COVERS finding below. |
| No glass/chrome primitive | `Primitives.tsx` `Card`/`ScreenHeader`/`ThreadRow`/`TabBar`/invite-card styles — all flat `backgroundColor` + 1px border; only chrome-*looking* visuals anywhere are one-off inline SVG gradients local to `Logo.tsx` and `DiscoBall.tsx`. | Every surface is opaque flat color; nothing is reusable as "glass." | "Dark glass, liquid-silver chrome" is a core material with zero primitive support. | A `GlassCard`/`ChromeSurface` primitive in `Primitives.tsx`, promoting `Logo.tsx`'s gradient to a reusable token. | — |
| Emoji outside `Icons.tsx` | `Icons.tsx` (full file): zero emoji, all SVG — good precedent. `InviteBits.tsx:15,36`: `GLYPHS = ['🪩','🌃','🎤','🍸','🌅','🎧','🔥','🍕']` rendered as every Pool-invite cover. | Icons.tsx is clean; the violation is in a sibling file using emoji as primary card imagery, appearing on nearly every screen that touches a Pool invite. | Direct violation, high-frequency (not an edge case). | Replace `GLYPHS` with an SVG icon set in the `Icons.tsx` pattern, or a category-tinted abstract pattern. | — |
| Disco-ball motif recurrence | `DiscoBall.tsx` (map-pin, static SVG, not animated/named) + `Logo.tsx` (disco ball inside an eye, the wordmark) + `TabBar.tsx:45-52` (renders `Logo` as the center tab) + `InviteBits.tsx` 🪩 emoji option. | The same shape recurs in 4 places. | Judgment call, not a clear violation — "no mascot" is about a recurring *character*, and this is a static abstract mark, but 4 independent recurrences starts to read as one. | If a single canonical mark is wanted, consolidate `DiscoBall.tsx` to derive from `Logo.tsx` rather than maintain a second gradient/facet implementation. | Brand-consistency only, not privacy. |
| Avatar has no halo/premium-ring concept | `Avatar.tsx:7,22` — one generic `ring?: string` prop rendered as a flat 2px border; no animation, no independent second ring. | Any caller can pass any color as "the ring" — no dedicated primitive for friend-halo vs. premium-chrome. | Cannot represent "emerald heartbeat halo" + "independent permanent chrome ring" simultaneously with the current single-slot API. | Composable halo/ring props (e.g. `presence` driving a pulsing emerald halo, `premium` driving an independent silver ring layered outside it), fed by a data projection — not computed per-screen. | Architectural: without a shared primitive, this gets reinvented per-screen, and an ad hoc implementation could leak identity styling for someone who should be anonymous. |
| **TabBar is a heavy permanent frame** | `TabBar.tsx:76-84` (verified) — full-width, `backgroundColor: colors.bg`, `borderTopWidth:1`, no inset, no translucency. | Precisely a heavy permanent frame. | Direct, unambiguous: "controls float above the map rather than forming a heavy permanent frame." | Once a glass/chrome primitive exists, rebuild `styles.bar` as an inset, translucent floating capsule — restyle only, preserve the existing five-tab/tap-only/center-eye contract (`TabBar.tsx:21-24`, locked). | Single clearest, highest-confidence gap in this whole file set. |
| `#16161a` hardcoded outside `theme.ts` | `Avatar.tsx:47`, `DiscoBall.tsx:32`, `Logo.tsx:24-25,60` all hardcode the literal string instead of importing `colors.bg`. | 4 occurrences across 3 files won't update when Decision 016's real identity color lands in `theme.ts`. | Concrete propagation risk, not a visual-language gap. | Replace all 4 with `colors.bg`. | Low severity, easy fix — do before/alongside the Decision-016 color swap. |
| Emerald reused for generic "success" | `Primitives.tsx:80` `Button`'s `variant==='success'` uses `colors.dtf`; `InviteBits.tsx:133` static "You're in" pill also uses `colors.dtf`. | Same green token does live-presence duty *and* generic UI-success duty. | "Emerald reserved for live energy only" is violated by reuse, not by a wrong color choice. | Split into `colors.dtf` (reserved) and a separate `colors.success` token. | Low; semantic-drift, compounds silently as more screens copy the pattern. |
| `InviteBits.tsx` COVERS palette | `InviteBits.tsx:14` — 7 hex values, none present in `theme.ts`. | A second, undocumented mini-palette. | Exactly the per-component color duplication the token layer should prevent. | Fold into `theme.ts` or derive from the category/electric palette. | Low; cosmetic but visible on every invite card. |

**Do not touch** (this area): `theme.ts`'s `categoryColor()`/`statusColor()` domain→ui seam (extend, don't bypass); the "green is reserved for DTF" comment (`theme.ts:15`) and the shop "never drawn on map" comment (`theme.ts:41`) — these encode rules, not arbitrary choices; `TabBar.tsx`'s locked five-tab/tap-only shell (`:21-24`) — restyle the frame only.

### 2.5 App screens — Browse, event cards, profiles, invites

| Area | Evidence | Current state | Gap vs. north star | Proposed seam | Risk |
|---|---|---|---|---|---|
| Home tab / Browse structure | `TabBar.tsx:12` (`index` = center Eye button); `app/(tabs)/index.tsx:19-87` (`MapScreen`, opens `Discover` as overlay); `src/ui/map/Discover.tsx:36-83` (no-query state = one flat "Nearby tonight" list, sorted by recency — no genre rows, no Live-Near-You section). | Map is the true home; Discover is a search overlay, not a persistent Browse tab. Live/presence users never appear in Discover — only as map pins. | No "Live Near You" / "Near You" / genre-row structure exists; this is a bigger IA question than styling (see §7). | — | — |
| Event-card equivalent (`venue/[id].tsx`) | Full file + `Primitives.tsx` `Card`/`Screen` (flat fill, no blur, verified: grep for `BlurView`/`expo-blur`/`LinearGradient` across `src/` and `app/` returns only `Logo.tsx`/`DiscoBall.tsx`). | Category dot + pill + area + price + blurb + plain invite list. No live social proof, no distance shown to the user (a `distanceKm()` helper exists but only filters, never renders). Flat opaque shell, same as everywhere else. | Spec's hierarchy — (1) live social proof (2) practical details + distance (3) deeper details on tap — inside a black/chrome glass shell — none of the three layers exist as designed. | A shared glass-card primitive (see §2.4) + a data-layer selector returning distance-from-viewer and live-presence-count per venue, rather than each screen computing or omitting it. | — |
| `distanceKm()` duplicated at screen level | `app/venue/[id].tsx:10-16` — a Haversine function defined and used only in this file. | Pure, reusable geo math living in `app/` instead of `src/domain/`. | Architecture guardrail: `app/` should only render through the projection boundary. | Move to `src/domain/geo.ts` or wrap as a `selectors.ts` function. | Low by itself; sets a precedent for more screen-level math if not corrected. |
| **Identity leak, screen-level view** | `app/(tabs)/index.tsx:130-193` `LivePreview` — verified directly: line 157 renders `{u.personalProfile.displayName}` unconditionally for every non-`isMe` live pin; line 161 renders `@{u.handle}`. `src/domain/liveStatus.ts` governs only *whether a pin exists* (TTL, business/personal), not *who may see identity*. | Same finding as §2.2/§2.3, confirmed at the actual render site. | Same as §0 — this is the highest-severity finding of the whole audit. | See §2.2. | High. |
| **Emoji, screen-level view** | `InviteBits.tsx:15,36` (`InviteCover`, used in `index.tsx`, `invite/[id].tsx`, `profile.tsx`'s hosting list, `venue/[id].tsx`'s nearby list, `Discover.tsx`); `app/(tabs)/create.tsx:142` (`📍` as the map crosshair while placing an invite). | Emoji covers appear on nearly every screen that touches a Pool invite; the crosshair emoji is separate and additional. | Same violation as §2.3/§2.4, confirmed pervasive across the app, not isolated to map pins. | Same seam as §2.3/§2.4. | — |
| Premium as text label only | `profile.tsx:32,38,90`; `index.tsx:154,162`; `Avatar.tsx:7-28` (single ring slot, never assigned to premium). | Premium is communicated by a text "Premium" pill and a " · premium" text suffix — no visual ring/halo anywhere at the screen level either. | Confirms §2.2/§2.3's finding: Avatar's single-ring architecture cannot represent status-ring + premium-ring simultaneously today. | Needs the Avatar restructure described in §2.4 before this can be fixed anywhere it's used. | — |
| Profile fields vs. spec §7.1 | `profile.tsx:16-122` (full render); grep for `vouch\|badge\|scene\|city\|friend` repo-wide: zero hits outside unrelated UI (a notification badge, a map-pin badge style). | Exists: monogram photo, name, @handle, Personal/Business pill, Premium pill (text), account-switch, live-status control, "Hosting" list, "Stories" list. Absent **end-to-end, not just on-screen**: city, scene, friends (count or list), vouches, badges — none of these exist in `domain/types.ts` either. | Spec §7.1 lists photo/name/city/scene/friends/vouches/badges/status-pill/business-pathway. Only 3 of 8 exist. | This is a **data-model gap**, not a rendering gap — new fields on `PersonalProfile` are needed before `profile.tsx` can grow. `PersonalProfile`/Profiles is a named Tier 1 system (§2.1) — flag before starting. | Needs Phoenix sign-off per §7. |
| Pool invite/review screens | `invite/[id].tsx:31-68`, `review/[id].tsx:39-98`. | Flat-Card visual shell (same gap as everywhere), but the **batch-review structure itself** (all pending requests for one invite on one screen, per-row accept/deny) correctly matches Decision 015's restored hero mechanic. | Only the shared shell/emoji gaps apply here; the underlying mechanic is right and should not be restructured. | — | — |

**Do not touch** (this area): `livePinFor`/`OFF_PIN_TTL_HOURS`/`canUseLiveStatus` as the single source of pin-visibility truth; `pool.ts`'s capacity/access functions, already correctly consumed by these screens; `selectors.ts`'s existing pattern for deriving screen data from `Snapshot`; the batch-review structure in `review/[id].tsx`; the existing non-color status cue pattern (Pill text alongside `statusColor()`) — this already satisfies "every colour state needs a non-colour cue" and should be preserved, not dropped.

### 2.6 Build & verify surface

| Area | Evidence | Current state | Risk |
|---|---|---|---|
| npm scripts | `package.json:29-37` | `start`, `ios`, `android`, `prebuild`, `typecheck` (`tsc --noEmit`), `test` (`node --import tsx --test "src/**/__tests__/*.test.ts"`), `gen:icon`. No `lint` script or ESLint config anywhere. | Don't assume a lint step exists in any CI/pre-commit expectation. |
| Node/npm | Verified live: `node -v` → `v22.11.0`, `npm -v` → `10.9.0` (run from `func-mobile/`). | **Working**, contradicting a stale note in this session's memory (`func_prototype_web_state.md`) that flagged Node as missing — that flag no longer applies to this shell/location and should be corrected. | Low, but worth fixing the memory so a future session doesn't wrongly believe scripts can't run here. |
| Motion/haptics/sound deps | `package.json` + `node_modules` grep. | Present: `react-native-gesture-handler`, `react-native-reanimated` (+ `react-native-worklets`). Absent: `expo-haptics`, `expo-av`/`expo-audio`, any dedicated a11y package (RN's built-in Accessibility API needs none). README (`:53-58`) already documents motion/glow/photo-stories as "deliberately simple in this pass." | Haptic/sound milestone (Stage 6) needs new dependencies added first — worth a quick confirm before adding. |
| Test coverage | Exactly **one** test file project-wide: `src/data/__tests__/repository.test.ts`. The `test` script's glob (`src/**/__tests__/*.test.ts`) would not even pick up a `.test.tsx` file if one existed. | Covers TTL expiry, business-status suppression, premium-is-a-skin. Zero coverage of `liveStatus.ts`'s actual privacy-relevant logic beyond those three cases, zero UI coverage. | Any regression in the privacy-adjacent parts of `liveStatus.ts` would not be caught today. |
| Mapbox token gating | `.env.example`, `README.md:21-27`, `mapConfig.ts`. | `EXPO_PUBLIC_MAPBOX_TOKEN` (public `pk.` token), read at bundle time. Documented graceful fallback (schematic map) if absent. A local `.env` exists on this machine with a `pk.`-prefixed value (not read further). | Confirm whether this token is meant to be shared across dev machines/CI, or intentionally local-only. |
| Dependency version note | `package.json:6` `"@rnmapbox/maps": "^10.3.5"` vs. `app.json:33-38` `RNMapboxMapsVersion: "11.20.1"` (native). | JS wrapper semver range and native SDK version string don't match. Not verified whether this resolves cleanly — no build was run. | Worth a quick confirm with engineering before the next native build; not visual-pass-blocking today since the app is reportedly already building/running. |

---

## 3. Staged implementation plan

This refines the north star spec's §11 seven-stage sequence into concrete, file-scoped, independently testable milestones. Each milestone lists its Tier (per `team/func-identity.md`), acceptance checks, and exact files.

### M1 — Visual tokens, materials, and icon cleanup *(Tier 3 — no sign-off needed)*
Extend `src/ui/theme.ts` with a glass/chrome tier and a named electric palette; add a `GlassCard`/`ChromeSurface` primitive; replace every emoji-as-icon instance with SVG.
- **Files:** `src/ui/theme.ts`, `src/ui/components/Primitives.tsx` (new primitive), `src/ui/components/InviteBits.tsx` (remove `GLYPHS`/emoji covers), `src/ui/map/Pins.tsx` (remove 🔒/🪩), `app/(tabs)/create.tsx` (remove 📍 crosshair), `src/ui/components/Icons.tsx` (add any new SVG glyphs needed), `src/ui/components/Avatar.tsx`, `src/ui/components/DiscoBall.tsx`, `src/ui/components/Logo.tsx` (replace 4× hardcoded `#16161a` with `colors.bg`).
- **Acceptance:** `npm run typecheck` clean. `grep -rn "🔒\|🪩\|📍\|🌃\|🎤\|🍸\|🌅\|🎧\|🔥\|🍕" func-mobile/src func-mobile/app` returns zero. No file under `src/domain/` or `src/data/` touched. Native walkthrough: every screen still renders (no visual redesign yet, just token/material swap).

### M2 — Map foundation: bright style *(Tier 3 — style/color is explicitly Tier 3 per func-identity.md)*
Replace `Mapbox.StyleURL.Dark` with a bright style; align `SchematicMap`'s fallback palette; keep globe→city→street continuity as-is (already works).
- **Files:** `src/ui/map/mapConfig.ts` (style constant), `src/ui/map/MapboxGlobe.tsx`, `src/ui/map/SchematicMap.tsx`.
- **Blocked on:** a target Mapbox style asset/URL — none exists in any doc or code today (§7.4).
- **Acceptance:** native walkthrough on iOS Simulator showing a bright map at globe, city, and street zoom; `SchematicMap` (test by unsetting `EXPO_PUBLIC_MAPBOX_TOKEN`) visually tracks the same palette.

### M3 — Visibility projection + marker & clustering system *(mixed — see below)*
This is the milestone that must not be built as pure styling.
1. **Domain/data prerequisite** (implements an existing, already-decided rule — not new policy, but not Tier 3 either): a visibility/relationship projection in `src/domain/` (sibling to `livePinFor`) or `src/data/selectors.ts`, gating identity fields by friend/mutual/anonymous status.
2. **Rendering**: photo + emerald heartbeat halo for visible friends, permanent chrome ring for premium (all statuses, all account kinds), category-object venue markers, clustering at zoom-out.
- **Files:** `src/domain/types.ts` (relationship field — resolve open question §7.1 first), `src/domain/liveStatus.ts` or new `src/domain/visibility.ts`, `src/data/selectors.ts`, `src/ui/map/content.ts` (consume projection instead of raw `FuncUser`), `src/ui/map/Pins.tsx`, `src/ui/components/Avatar.tsx` (dual ring/halo support).
- **Acceptance:** new domain-level test(s) asserting an anonymous/non-mutual pin's data never contains `displayName`/`handle`/`photo`; existing `repository.test.ts` still passes; native walkthrough confirms the chrome ring renders identically across dtf/casual/off/business for premium accounts.
- **Gate:** confirm scope with Phoenix first — see §7.1.

### M4 — Event cards & Browse rows *(Tier 3 styling + Tier 2-adjacent IA question)*
Glass-shell event cards with live-social-proof/distance/details hierarchy; resolve whether Browse becomes a dedicated tab or stays a map-overlay search (§7.6) before building "Live Near You"/genre rows.
- **Files:** `app/venue/[id].tsx`, `app/(tabs)/index.tsx` (`VenuePreview`), `src/ui/map/Discover.tsx`, `src/data/selectors.ts` (distance/social-proof selectors), `app/venue/[id].tsx`'s `distanceKm()` → relocate to `src/domain/geo.ts`.
- **Acceptance:** native walkthrough of tap-to-expand venue card; typecheck clean; no new domain/data logic added beyond the relocated distance helper and the new selectors.

### M5 — Profiles & linked business pathway *(Tier 1 — Func ID/Profiles — needs a Decision Log entry)*
Add city/scene/friends/vouches/badges to `PersonalProfile`; render DTF/Premium/Casual/Off as a pill; wire the Verified-Operator/Active-Event badge pathway to the existing business profile.
- **Files:** `src/domain/types.ts` (new fields — **Tier 1, log first**), `src/data/seed/users.ts` (seed data for new fields), `app/(tabs)/profile.tsx`.
- **Gate:** confirm with Phoenix whether this needs a Decision Log entry before starting (§7.2).

### M6 — Motion, sound/haptic hooks, loading, onboarding hints, accessibility *(Tier 3, new dependencies)*
Reduced-motion guard on `Pins.tsx`'s `Pulse`; add `expo-haptics`/`expo-av` (confirm first); build the launch sequence (logo→eye→blink→globe→city dive→map) and loading states per north star §8.
- **Files:** `src/ui/map/Pins.tsx`, `src/ui/map/entrance.ts`, new loading/onboarding components, `package.json` (new deps).
- **Acceptance:** `AccessibilityInfo.isReduceMotionEnabled()` verified to swap animation for a fade in at least one component; native walkthrough with iOS "Reduce Motion" toggled on.

### M7 — Integration, performance, native walkthrough, visual QA *(Tier 3)*
Full native walkthrough per `team/operating-principles.md` #9/#10 (iOS Simulator, not browser-only); performance pass on marker/clustering at scale; final emoji/hardcoded-color audit re-run.

---

## 4. Verification commands

Run from `/Users/phoenixbarnes/Developer/Func/func-mobile`:

```bash
npm run typecheck
npm test
```

Native walkthrough (per Decision 010 / operating-principles #9-10 — required, browser is sanity-check-only):

```bash
npx expo prebuild --platform ios
npx expo run:ios
```

Regression greps worth running after any milestone touching icons or colors:

```bash
grep -rn "🔒\|🪩\|📍\|🌃\|🎤\|🍸\|🌅\|🎧\|🔥\|🍕" src app
grep -rn "#16161a" src app
```

---

## 5. Non-goals and do-not-touch boundaries (this pass)

Carried forward from the north star spec §13 and confirmed against the current code:

- No backend or real identity verification implementation.
- No production location tracking or production-security claim — **the prototype remains simulated**; nothing in this codebase should be described otherwise (`liveStatus.ts` has no real device location, `.env` gates a public Mapbox token only).
- No redesign of the product constitution or privacy rules — M3's projection *implements* the existing operating-principles.md rule, it does not invent a new one; if that line gets crossed, it needs to go back to Phoenix as a Tier 0 matter, not proceed as a visual milestone.
- No general-purpose messaging redesign, no payments/ticketing platform build, no mascot system, no fake "For You" recommendation engine.
- No broad rewrite before this audit and staged plan are reviewed.
- Do not modify `/Users/phoenixbarnes/Developer/Func-safe-map` (branch `safe-map-pool`) — untouched this session.
- Do not move privacy/visibility decisions into screens or duplicate them per-component — the single biggest architectural risk this audit found is that this has *already* effectively happened by omission (no projection exists, so every screen independently reads raw data); M3 must fix this once, centrally.
- Do not reach past `FuncRepository`/`Snapshot`/`useSnapshot()` to obtain data.
- `types.ts`'s locked shapes, `livePinFor`, `OFF_PIN_TTL_HOURS`, `canUseLiveStatus`, `pool.ts`'s capacity math, `InMemoryRepository.ts`'s `setLiveStatus`/`switchProfile`, the shop-exclusion rule in `content.ts`, the five-tab/tap-only `TabBar` shell, and the batch-review structure in `review/[id].tsx` — see §2's per-area "do not touch" lists for the full set with citations.

---

## 6. What's genuinely built and correct (worth knowing, not just gaps)

- `livePinFor()`'s TTL/business/personal resolution is clean, tested, and the right shape to extend.
- `pool.ts`'s capacity/access math and the batch-review UI in `review/[id].tsx` correctly implement Decision 015's restored hero mechanic — do not touch or "improve" this while doing visual work.
- The `FuncRepository`/`Snapshot` boundary is real and consistently used by every screen read in this audit.
- `Icons.tsx` is already emoji-free, SVG-based, and is the correct pattern to extend into the gaps found elsewhere.
- The non-color status cue (text Pill alongside `statusColor()`) already satisfies "every colour state needs a non-colour cue" — an existing north-star-compliant pattern, worth explicitly preserving rather than rebuilding.
- Globe→city→street continuity inside `MapboxGlobe.tsx` (native `projection="globe"` + `flyTo`) already works; M2 only needs a style swap, not new transition logic.

---

## 7. Open questions for Phoenix

1. **(Highest priority.)** Building the friend/mutual/anonymous visibility projection (M3) is domain/data work implementing an *already-decided* rule (operating-principles.md's 2026-08-11 addendum), not new privacy policy — but it's not Tier 3 styling either. Is this in scope for "the visual foundation" work, or should marker work stop at non-identity-bearing markers (venue/event, generic colored dot) until this is explicitly authorized as its own piece of work?
2. Adding city/scene/friends/vouches/badges to `PersonalProfile` (M5) touches **Func ID/Profiles**, a named Tier 1 system per `team/func-identity.md:61-69`. Does this need a Decision Log entry before M5 starts, or is it minor enough for the Tier 2/3 tracker?
3. Where should the friend/mutual relationship signal actually live — a new field on `FuncUser`, on `Group`, or a separate relationship structure? `types.ts`'s "locked shapes, do not extend casually" warning covers exactly the objects this would need to touch.
4. No target bright Mapbox style (custom Studio style ID, style JSON, or day-style URL) exists anywhere in the docs or code — M2 needs this named before it can start for real.
5. The exact chrome-identity hex values are pending `docs/brand/func-icon-chrome.png` per Decision 016 — M1's token work will otherwise ship with documented *estimates*, not final values.
6. Is a dedicated Browse tab intended (distinct from the map's Discover search overlay), or is "Discover reached via the map's search bar" the permanent IA? This changes how literally M4 should build "Live Near You / Near You / genre rows."
7. `docs/PRODUCT_THESIS.md`'s "Current status" section still names `prototype-web/`/`func-app/` as current — intentional (thesis stays product-level) or a doc that needs syncing? Not fixed in this audit; flagged only.
8. `PRODUCT_THESIS.md`'s traffic-light emoji notation (🟢🟠🔴🪩🥇) — documentation shorthand only, or does it reflect a design intent in tension with "no emoji as iconography"? No code impact found either way; worth a direct answer so it doesn't quietly resurface as a justification later.
9. Is the local `.env`'s Mapbox token meant to be shared (so other machines/CI don't silently fall back to `SchematicMap`), or intentionally per-developer?
10. The `@rnmapbox/maps` JS package range (`^10.3.5`) and the native `RNMapboxMapsVersion` (`11.20.1`) in `app.json` don't match — intentional, or needs reconciling before the next native build?
11. Should `func-mobile/` get a `HANDOVER.md`/`FUNCTIONAL-INVENTORY.md` (the pattern `archive/func-app/` used), or does this audit document serve that purpose going forward?

---

## 8. Proposed next-session handover

**Objective for the next session:** M1 — visual tokens, materials, and icon cleanup (Tier 3, no domain/data changes, no sign-off blockers). This is the safest and highest-value next step: it fixes the three unambiguous, high-frequency violations found in this audit (dark-only palette, emoji-as-icons, no glass/chrome primitive) without touching the privacy-sensitive area flagged in §7.1.

**Before starting M1, get from Phoenix:**
- An answer to §7.1 (is the M3 visibility projection in scope for this work), so the *next* session after M1 isn't blocked.
- Ideally, `docs/brand/func-icon-chrome.png` (Decision 016), so M1 can use final identity-color values instead of documented estimates.

**Prompt for the next session:**
> Read this file (`docs/handoffs/2026-08-23-visual-foundation-audit.md`) and `docs/superpowers/specs/2026-08-23-visual-north-star-design.md` first. Implement Milestone 1 only (visual tokens, materials, glass/chrome primitive, emoji-icon cleanup) per §3 of the audit. Do not touch `src/domain/` or `src/data/`. Do not start M2 or later. End with: files changed, `npm run typecheck`/`npm test` output, the emoji-grep and `#16161a`-grep results, a native-walkthrough screenshot/description, and a written handover for M2.

**Definition of done for M1:** every acceptance check in §3's M1 entry passes; `npm run typecheck` and `npm test` are clean; the app still runs and every screen still renders (this is a token/material swap, not a redesign); a handover is written before any M2 work starts.
