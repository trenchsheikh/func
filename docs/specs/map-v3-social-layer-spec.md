# Func Map v3 + Social Layer — Definitive Specification

**Status:** Adopted design, ready to build. Log adoption as the next entry in `docs/DECISION_LOG.md`.
**Inputs merged:** Map concept "The Call — The Decision Engine" (unanimous judge winner) as the structural spine; visual/emotional grafts from "The Floor" and "Pulse" per all three judge verdicts; Vouch recommendation (Model D stake-based standing, gated by Model A co-attendance, spoken in Model C's typed vocabulary); the "Flares" stories design; the "Func ID / Night Record" profile design.
**Prototype target:** `/Users/phoenixbarnes/Library/Mobile Documents/com~apple~CloudDocs/Func./prototype` (Expo + React Native + react-native-svg, in-memory store, illustrated SVG city).

---

## 0. What won, what was grafted, and conflicts resolved

The Call won with all three judges because it is the only concept that (a) delivers single-player utility to a zero-friend user in under 20 seconds, (b) turns activation into invitation ("Call it" with no crew forces "who's coming?"), and (c) has a structural moat — money on the map, group-ranked fit, and consensus-as-map-interaction. Its judged weakness — "best moat, thinnest soul" — is fixed by grafting The Floor's brand marks (burn rings, crew flags, the rising-flag vote) and Pulse's living-city treatments (BPM pill, breathing tempo, comets, Night Tide).

**Conflicts resolved (final rulings — do not reopen):**

| Conflict | Ruling |
|---|---|
| Opening altitude (Pulse's orbit-first vs The Call's city-first) | **City-first.** The app opens on Velmont at city altitude. The globe survives as Altitude 0, reachable via the earth button / pinch-out. The orbit open cost the first-time user 10 seconds; it is demo theatre, so the *presenter* may start there, the *product* never does. |
| Rally vs Call It naming | **One mechanic, named "Call It."** Long-press a venue or tap the Decision Card CTA — same flow. "Rally" is retired as a term. |
| Verdict UI (vote slots vs flag) | **The Floor's flag.** Call It plants a half-raised crew flag at the venue; each "In" lights an avatar and raises the flag; at majority (or the 10-minute timer) it snaps upright with a burst. The HOA-meeting vote becomes a watchable open loop. |
| Story decay window (2h hard cutoff vs 2h/6h two-phase) | **Flares' two-phase decay.** Full heat and white-hot ring < 2h; cooling ember (half heat weight, still in reel) 2–6h; gone from the map at 6h or venue close; archived to the poster's private recap at 24h. |
| OMW scope (Flares' solo circle-shared ETA vs Convoy's plan scope) | **Plan-scoped only.** Live presence (Convoy) exists *only inside a locked plan* and auto-expires at night's end. There is no standalone OMW broadcast. Solo users viewing a reel get "Go" (directions), not OMW. This makes the consent model one sentence: *your location exists only inside a plan you joined, and dies with it.* |
| Presence model (toggle vs opt-in-by-act) | **Opt-in-by-act** (The Floor). Presence is off by default; joining a plan or planting a flag is the explicit act that turns it on. Ghost is the override, not the mechanism. |
| Heat generation (graph-weighted ambient vs computed ranking) | **Both, as two distinct layers.** The heat *wash* is aggregate and story-fed (Flares heat model, k≥10). The *ranking* (beacon size, Top-3 rail) is computed per-crew (fit score). Heat is what the city feels like; ranking is what you should do. They are never conflated visually: wash = background gradient, fit = mark size. |
| Vouch counts on profiles (profile design's "3 slots +1 per 5 nights" vs vouch rec's "3–5 backing capacity") | **One system: Backing.** Capacity starts at 3, +1 at 10 and 25 closed nights, hard cap 5. No raw vouch *count* ever renders; backings appear as named, typed, tappable attributions, and roll up only into a coarse Standing band. |
| Member code (profile artifact) | Replaced by the functional **night code** QR (used to close nights). No crest, no member number. |

**Glossary (canonical names — use these in code and copy):**

- **Beacon** — a venue's complete map mark: burn ring + core glow + crew badge.
- **Burn ring** — segmented ring around a beacon; one segment per fresh Flare, coloured by age (white-hot → cyan → pink ember).
- **Flare** — a venue-anchored ephemeral story clip. Posting copy: *"Drop a flare — put Archive 9 on the map."*
- **Group Lens** — the pinned chip row (crew / when / £ budget) that re-ranks the city.
- **Fit score** — heat × budget fit × extended-graph presence × distance; drives beacon glow size and the Top-3 rail.
- **Decision Card** — the venue bottom sheet: evidence rows + Call It.
- **Call It / In / Nah** — propose a venue to your crew; two-button verdict; 10-minute auto-lock; caller override ("captain's call").
- **Plan Flag** — the locked plan: your crew's avatar-stack flag planted upright on the venue.
- **Convoy** — plan-scoped live layer: OMW comets with ETAs converging on the Plan Flag, visible auto-expiry countdown.
- **Crew Flag** — 2+ opted-in crew members co-located at a venue render as one planted flag. Individuals never render alone, anywhere, ever.
- **Constellation** — anonymous aggregate mark for non-broadcasting crews: a small star-cluster with a count ("3 crews here").
- **Night Tide** — the 8pm–3am time bar: past = actual, now = live, ahead = ghosted forecast. Off-peak it becomes **Afterglow**.
- **BPM pill** — city-level pulse summary: "Velmont · 128 BPM · 214 out."
- **Backing** — a stake vouch: typed, co-attendance-gated, attributable, revocable, consequential for the giver.
- **Standing** — coarse non-numeric band: New / Building / Solid / High.
- **Night Record / Night Card / earned friends / night code** — per the Func ID design (§4).
- **Ghost** — one toggle, time-boxed (3h / tonight / until off).

---

## 1. The Map Experience — the centrepiece

### 1.1 Principle

A night out is a group decision made under time pressure. The map is a **ranked instrument with a living soul**: every pixel is either evidence (heat, cost, graph, freshness) or an action (Call It, vote, join), and every mark is drawn in group-first grammar (flags, constellations, crews — never individual dots). Success metric for the surface: **seconds from open to a locked group plan** — under 10 for evidence, under 60 including the crew's votes.

### 1.2 Altitudes

Three altitudes, one continuous camera, no page navigation. Each answers exactly one question.

- **A0 — GLOBE** ("is the world out?"). The existing stylised night-globe (`WorldMap.tsx`). City nodes sized by live count; node label gains flare volume ("Velmont · 214 out · 38 flares live"). Only Velmont is live; others show the expansion toast. Reached by the earth button or pinch-out from city. **Never the default open.**
- **A1 — CITY** ("where should we go?"). **The default open state.** The illustrated Velmont map with the full grammar: aggregate heat wash (k≥10, breathing — see motion budget), venue Beacons with burn rings sized by fit score, Crew Flags, Constellations, event light-columns, the Group Lens chip row pinned top, the Top-3 rail and Night Tide bar pinned bottom, and the BPM pill.
- **A2 — VENUE FOCUS** ("do we commit?"). Tapping a beacon pushes the camera toward the venue, dims surrounding streets, and slides the Decision Card up as a bottom sheet over the still-visible block. You never leave the map. Back-swipe or pinch-out ascends.

Movement: tap descends, swipe-down/pinch-out unwinds one level. Locking a plan re-frames A1 around the Plan Flag (**Night Mode**). Stories, events, cost, and the Pool are all reached *through* these altitudes; none has a separate top-level surface on the map tab.

### 1.3 The Beacon (venue mark anatomy)

One glanceable object carrying three signals (the judges' unanimous top graft):

1. **Burn ring** (outermost): segmented arc, one segment per live Flare (cap the render at 8 segments; overflow shown as ring thickness). Segment colour = age: white-hot (<30min) → cyan (<2h) → pink ember (2–6h) → gone. Ring brightness IS the freshness UI; no timestamps needed at city altitude.
2. **Core glow** (inner): radius and opacity scale with **fit score** for the active Group Lens. The #1-ranked venue is visibly the biggest object on the map.
3. **Crew badge**: small count chip ("3 crews") when crews are present but not broadcasting; replaced by Crew Flags / Constellations at the venue when they are.

Pulse tempo of the core glow encodes fill-rate (filling fast = faster breathe) — information without UI, but never the *only* channel for that information (the Decision Card's trend arrow states it in words).

### 1.4 Group Lens + ranking

Pinned chip row at top of A1: `[crew ▾] [tonight ▾] [£ budget]`. Changing any chip re-ranks the whole city live — beacon glow sizes animate, the Top-3 rail reorders.

- **Fit score** = live heat × budget fit (venue `avgSpend` vs budget chip) × extended-graph presence × distance.
- **Top-3 rail** (bottom edge, above the Night Tide bar): names the three winners with one-line *reasons* — "1. Archive 9 — rammed, £25–40 · 2 groups you know". Reasons are mandatory: when the ranking is wrong it must be legibly wrong. Tapping an entry flies the camera to that beacon.
- **Zero-friend degradation**: with no graph, fit = heat × budget × distance. This is real single-player utility on day one and is the product's cold-start answer.
- **Promotion rule (future)**: paid placement is capped, always labelled "Promoted", and may never occupy the #1 rail slot.

### 1.5 The Decision Card

One bottom sheet, five fixed rows in decision order, one primary CTA.

1. **Busyness** — level + trend arrow in words ("Filling up").
2. **Cost meter** — £min–max all-in from `costBreakdown` (Decision 007: totals always derived), rendered against the budget chip. Money on the map is Func's original signal; it never moves below the fold.
3. **Who** — aggregate only: "3 crews from your wider graph in tonight · 6 groups in the pool." The k≥10 threshold applies to this *copy*, not just heat pixels: below threshold the row reads "a few groups about" with no counts.
4. **Flare reel row** — filmstrip of the venue's live Flares, newest first, with visible cooling tint. Tap opens the full reel (§2).
5. **Tide row** — "Peaks around 11" rendered in the ghosted/forecast style, only where seeded history supports it; absent otherwise. Honesty affordance for the ranking-trust risk.

Primary CTA: **Call It.** Secondary: Directions · Event page (when `eventId` exists — reuses the existing event row) · **Pool us in** (when a crew at this venue has an open invite).

### 1.6 Call It → Verdict → Plan Flag

- Trigger: Decision Card CTA, or **long-press any venue** at A1 (one-shot tooltip teaches this — see §1.12).
- Calling plants a **half-raised crew flag** on the venue, greyed avatars of the crew along the banner, on *every crew member's map*, with a two-button verdict: **In / Nah**.
- Each "In" lights that avatar and visibly raises the flag. Majority → the flag **snaps upright with a burst** and becomes the **Plan Flag**. A visible **10-minute timer** auto-locks to prevent stalls; the caller can override-lock ("captain's call"). One line posts to the crew chat.
- If the caller has no crew yet, Call It immediately opens "Who's coming? Start your crew" — activation IS invitation.
- A locked plan flips A1 into **Night Mode**: the city re-frames around the Plan Flag and the Convoy layer becomes available.

### 1.7 Convoy (plan-scoped presence)

- Opt-in-by-act: accepting a Call It offers "Share your comet for tonight's plan" — off by default, one tap on.
- Members who opt in render as **comet trails** (Pulse's treatment) converging on the Plan Flag along streets, each with a live ETA chip. The Plan Flag visibly **charges up** as each comet arrives; on co-location the crew fuses into the planted upright Crew Flag — the map's most tappable object.
- **Visible expiry**: the Convoy layer toggle carries a literal countdown ("Convoy · ends 3:00am") — plan-scoped location rendered as undeniable UI, not a settings claim.
- Scope rules: visible only to this crew, only for this plan, auto-expires at night's end or plan cancellation. Ghost kills your comet instantly. No individual dot exists outside Convoy anywhere in the system.

### 1.8 Crew Flags & Constellations (social layer marks)

- **Crew Flag**: 2+ members of a crew co-located at a venue with presence on → one planted avatar-stack flag, gentle wave. Tap → crew card: who's out, who's OMW with ETA (if their plan's Convoy is on and you're in it), and — for other crews with an open invite — the one-tap Pool knock.
- **Constellation**: crews present but *not* broadcasting render only as an anonymous star-cluster with a count ("3 crews here"). Group-first grammar is preserved even for private crews; no names, no avatars.
- Broadcasting (flag visible beyond your own crew, to mutuals and the Pool) is explicit, per-night, and auto-off at 4am. It is offered inside the Call It/Pool flow ("Fly the flag so groups can find you"), never as a bare settings toggle — the Beacon-adoption lesson from Pulse's risk list.
- Your own crew's flag is always visible to you.

### 1.9 Night Tide, Afterglow, and the BPM pill

- **Night Tide bar** (bottom edge, A1): scrubs tonight 8pm→3am. Behind now = actual heat; at now = live; ahead = **ghosted forecast** (dashed, uncertain rendering) built from RSVPs, events, and historical patterns. "Peaks at 11" is decide-before-you-leave utility, and per-city forecast quality is a compounding data moat.
- **Afterglow** (off-peak state, Sun–Thu): the map cools to embers and shows your crew's last-night route as fading footprints, the crew streak flame ("4 weekends running"), and **crew home-bar marks** — "The Vault — your crew's spot, 5 nights" (The Floor's language, verbatim; group-scale Place Loyalty and the venue-monetisation rail).
- **BPM pill**: replaces the current liveliness pill. "Velmont · 128 BPM · 214 out" with an animated beat dot at city altitude; globe altitude keeps the world counter. BPM = a composite of live fill-rate; it is the screenshot, the widget, and the poster.

### 1.10 Privacy as visual grammar

- No individual live dot exists in the architecture, ever. Aggregate heat is k≥10. "This venue is popping" is discovery; "this person is here" is a headline the system cannot generate.
- Presence is opt-in-by-act (join plan / fly flag); everything presence-related carries a **visible countdown**.
- **Ghost**: one toggle, three durations (3h / tonight / until off). Ghosted = your comet vanishes, your flag renders without you, you contribute nothing to heat. What others can currently see of you is inspectable in one tap from your Night Card.
- Women-first safety review gates Convoy and flag-broadcast before any real-location build.

### 1.11 First-time story (60 seconds, zero friends)

- **0–5s**: App opens straight onto Velmont at city altitude. Dark city, three beacons breathing with burn rings of different thickness, sea at the bottom, BPM pill ticking. One coach line, shown once: *"Glow = busy. £ = the damage. Tap one."*
- **5–20s**: Her eye goes to the biggest beacon (Archive 9). The Top-3 rail confirms in words: "1. Archive 9 — rammed, £25–40 · 2. Skyline — filling up, £22–35 · 3. The Keg — cheap & busy, £10–18." She taps it.
- **20–40s**: Camera pushes in, streets dim, Decision Card rises: trend arrow climbing, cost meter against no budget yet, "6 groups in the pool," and the flare reel auto-plays a clip posted 12 minutes ago, timestamp glowing white-hot. She now knows where's good, what it costs, and has proof.
- **40–55s**: She hits **Call It**. Friendly interrupt: "Who's coming? Start your crew." Two contacts picked; a half-raised flag with two greyed avatars appears on her map, waiting.
- **55–60s**: One-shot tooltip as she pans away: *"Long-press anywhere to call it for your crew."* She has received real utility alone, and the product's first ask was its whole point: bring your people. No screen so far has been anything but the map.

### 1.12 Onboarding copy budget

Exactly two lines of coaching exist in the entire surface, each shown exactly once: the coach line ("Glow = busy…") and the long-press tooltip. Nothing else. If a mark needs explaining, redesign the mark.

### 1.13 Motion budget (hard rule, from the v2 review)

Max **three concurrent animation systems** at any moment. Priority order: (1) verdict flag-raise, (2) Convoy comets, (3) beacon pulse/breathing. The ticker pauses while Convoy runs; burn-ring cooling is a slow tint, not an animation loop; heat breathes on staggered slow frames. Rule of thumb: *tempo encodes data or it doesn't move.* Provide an animation-tier fallback (static glows) for low-end devices.

---

## 2. Stories on the map — Flares

### 2.1 Principle

A Flare is not media; it is a **decaying, geofence-verified liveness signal anchored to a venue**. Posting = putting the place on the map. Viewing = discovery. Replying = going. There is **no stories tab, no ring-row, no person-anchored content, ever**. Success metric: arrivals produced per Flare, not views.

### 2.2 Capture

- Composer unlocks **only inside a recognised venue's geofence at night** — you can only put a place on the map *from* the place. This makes every Flare spatially interesting by construction and makes the story layer and the heat layer the same verified-presence data.
- Two taps: shoot → post. Audience default: **Circles** (crew + earned friends); options: My Group / Circles / The City (public, pooled into the place reel where authorship is secondary).
- Prompted, not nagged: one prompt on arrival-dwell (>20 min), one when an RSVP'd event starts. Post-night, the crew's Flares auto-collect into a private group recap (memory is downstream; the map shows only live).

### 2.3 Surfacing

Flares surface in exactly four places, all on the map: burn rings on Beacons (A1), the filmstrip row on the Decision Card (A2), avatar-ringed Crew Flags when a flag-flying crew has posted, and city-node shimmer + flare count at globe altitude. The Top-3 rail indexes into ringed venues; it is never a separate content surface.

### 2.4 Decay (canonical timings)

Hot (<2h): full ring brightness, full heat weight. Ember (2–6h): dimmed ring, half heat weight, still in reel. Gone at 6h or venue close. Archived to the poster's private recap at 24h. Story heat signal uses a ~90-minute exponential half-life. A stale story that pulls someone to a dead bar destroys trust in the whole instrument — freshness must be visually legible, not just timestamped.

### 2.5 The reel

Tapping the filmstrip opens a full-screen overlay that keeps map context persistent: venue name, distance, cost chip pinned. Clips auto-advance through the **merged place reel** — you are watching the PLACE (friends' clips first, then circles, then public), not one author's feed. Every reel ends on a Go frame.

**Action bar (exactly three verbs):**
1. **Call It** (primary) — proposes this venue to your crew; the §1.6 flow.
2. **Pool us in** — when the posting crew has an open invite tonight: deep-links into a prefilled group→group Pool request. Stranger replies route to the poster's *group*, never a 1:1 DM — simultaneously the product mechanic and the safety architecture.
3. **Hype** (emoji) — costless, opens no channel.

Swipe down returns to the map exactly where you were.

### 2.6 Flares feed the heat (and the moat)

Venue heat = venue baseline (historical busyness — the never-blank floor) + aggregate presence + event RSVPs + **flare signal** (highest-weighted live term, because geofenced Flares are verified presence). Anti-gaming: per-user-per-venue nightly contribution cap; poster Standing weighting (a Flare from a Solid/High-standing regular counts more — the Vouch hook); venue/staff accounts labelled and down-weighted; reciprocal hype discounted. Because heat is generated by the accountable social graph, it compounds with network density — the structural gap Current/NOITE cannot cross.

### 2.7 Safety and privacy

18+ ID check gates both viewing and posting. Flares pin to the venue point, never the poster's coordinates — leaving the venue changes nothing. Face-blur tool in the composer; one-tap report on every clip; Ghost hides presence independently of posting. Moderation tooling and reporting ship day one (18+ nightlife UGC is the most expensive kind to moderate — costed as such, see risks).

---

## 3. Vouch system — Backing

### 3.1 Chosen model

**Model D (stake-based standing), gated by Model A (co-attendance), spoken in Model C's typed vocabulary, with Model B's scarcity imported only as a capacity cap — never tradeable slots.** Rationale: the research bar for a meaningful signal is *scarce, costly, attributable, revocable, consequential for the giver*; only the stake model delivers the last property, which is what separates a vouch from a like. Culturally it is the native idiom: "I'll put my name on the list for you."

### 3.2 Exact mechanics

- **Eligibility (the gate):** you can only back someone you have verifiably shared a night with — co-attendance confirmed (same Pool meet or event, same venue, overlapping window, two independent signals: geofence + the other group's confirmation or a scanned ticket). No co-attendance → no backing button exists. Strangers and internet-only contacts structurally cannot back anyone.
- **The earn moment:** backings are offered in the post-night recap only, max **2 per night** (forced selection, not blanket courtesy).
- **Typed, conduct-only vocabulary (locked, 4 verbs):** `Shows up` (honoured a real RSVP, arrived, stayed) · `Great host` (only offerable to the night's actual host) · `Good with new people` (only after a Pool meet between previously-unconnected groups) · `Looks out for people` (handled a bad moment, got people home). No vibe, looks, or status categories, ever — this is the anti-discrimination firewall for any future venue-facing use.
- **Stake:** backing is a standing state — "Backed by Maya (High standing)" — and consequences flow both ways. Confirmed *serious* misconduct by your backee (human-reviewed safety incidents only — never flakiness or taste) auto-revokes the backing, dips your Standing progress, and suspends your backing privilege for a period. Backees who consistently complete good nights slowly strengthen your Standing as a proven judge.
- **Capacity:** 3 concurrent backings to start; +1 at 10 closed nights, +1 at 25; hard cap 5. Backings are revocable anytime (quietly, with a cooling-off delay) and silently expire after 12 months without a shared night (pruning is the system's fault, not the friend's).
- **Standing:** coarse bands only — New / Building / Solid / High — fed by verified nights, conduct record, and backer-weighted backings received. **No numeric score renders anywhere in the UI, ever.**
- **Display:** typed rows with source diversity ("Shows up ×6 · from 4 groups, last 90 days"), named tappable attributions on both profiles, and a **crest on your Crew Flag only while hosting an open event** (The Floor's graft — trust surfaced at the exact join-decision moment: "Vouched by Maya + 2 you know"). Absent categories never render (no empty rows to read negatively).

### 3.3 Where Backing does work

- **Pool gate:** joining a stranger crew's open invite requires "a backed member or 2 mutuals." There is *always* a non-backing path (mutuals/verification) — backing must never be the only door.
- **Heat weighting:** Flares from higher-standing posters weigh more (§2.6).
- **Hosting supply:** `Great host` standing is the future B2B2C bridge (venues courting proven hosts).

### 3.4 Abuse mitigations (designed in, not aspirational)

- **Reciprocity inflation:** backings hidden for 48h after the recap, never shown as "pending" to the other side; perfectly-mutual pairs and dense pairwise rings algorithmically discounted; diminishing returns per relationship (repeat backings refresh recency, never stack).
- **Check-in farming / spoofing:** co-attendance requires two independent signals; night-closing is security-critical infrastructure, not a growth feature.
- **Market/coercion (Model B's failure):** backings are non-detachable from co-attendance history — a "sold" backing to a stranger is visibly hollow and algorithmically worthless; capacity caps bound exposure.
- **Weaponised reporting:** slashing only on confirmed, human-reviewed serious violations; false-report penalties for the reporter; a backer's dip is capped (loses Standing *progress*, never their verified-night record).
- **Homophily / newcomer exclusion:** **newcomer insurance** — backing a low-tenure member carries reduced downside for their first weeks and upside if it goes well, explicitly tilting the risk calculus toward on-ramping.
- **Sybil insulation:** Standing inputs are conduct-and-attendance based, never graph size — clean "backer" accounts that never go out cannot mint Standing.
- **External use guardrail:** any venue-facing use stays perk-level (queue skip, guest-list fast-track) and conduct-scoped — never an automated velvet rope that denies entry.

---

## 4. Profiles as digital identity — Func ID (the Night Record)

### 4.1 Principle

Identity on Func is **earned, not authored**. Every profile element is a receipt of verified real-world behaviour: closed nights, co-attendance-gated friendships, stake-backed backings. The profile cannot be faked by typing, and privacy tiers follow data sensitivity.

### 4.2 The Night Card (profile hero)

Card-as-object in the neon-street language: gradient monogram (the existing avatar system — it *is* the brand, no photo required), name + age + verified shield, home district, **crew strip** (group name + AvatarStack — identity is group-first, on the card itself), live status ribbon, **Standing band chip**, and derived role badges. One number survives — **Nights closed** — because it is unfakeable. "Friends" is relabelled **earned friends**. No raw vouch count; backings render as named typed attributions. The old member code becomes the functional **night code** QR used to close nights and hand off guest lists.

### 4.3 Core identity mechanics

- **Verified personhood:** third-party 18+ ID check at signup, one account per person, shield badge everywhere. Unverified accounts can browse the map but cannot post Flares or touch the Pool.
- **Night Record:** auto-written ledger of closed nights (date, venue, event, crews met, who was there). Never self-editable — you can hide a night, never add one. Public tier shows aggregates; circle tier shows the actual shared nights ("you two: 3 nights, last at The Arches").
- **Earned friends:** completing a real night together converts the party into earned friends — **there is no add-friend button anywhere in the product**. Each edge carries provenance ("met via Pool at Harbourside, 4 nights together"). Earned-friend status is what unlocks the circle tier.
- **Derived roles:** "Reliable host" (5+ hosted Pool meets that closed, 90%+ show rate) etc. — computed, never self-claimed; backings can endorse a role with attribution.
- **Taste layer:** self-declared chips (≤5 music genres + district) plus a computed scene fingerprint from the Record; where they diverge, the computed one quietly wins in Pool matching.
- **Status ribbon:** coarse tiers only — home / down tonight / heading out / out. Public sees at most "out tonight" (opt-in, off by default); circle can see venue if shared; exact coordinates exist for no tier.

### 4.4 Three-tier visibility, self-teaching

- **PUBLIC** (anyone in the Pool): name+age, verified, monogram, taste chips, roles, nights-closed, district, opt-in coarse status.
- **CIRCLE** (earned friends): full Night Record, named backing attributions, venue-level status, shared-history panel, streaks.
- **PRIVATE** (you): location history, hidden nights, backing capacity, Standing internals.

The profile screen renders a **You / Circle / Public segmented preview** so the tiers teach themselves. First-run empty state shows roles/backings/friends as *locked slots labelled "earned by going out"* — the empty card teaches the earn model instead of feeling dead.

### 4.5 Identity on the map

Identity never adds a surface; it enriches existing taps. City: your crew's fused flag, circle-tier status chips. Venue card: "3 of your circle have closed nights here," your loyalty rank ("Regular at Neon Yard — 6 nights"). Person tap anywhere (Pool, event, chat, flag): the tier-aware Night Card slides up.

---

## 5. How it connects to Pool, Events, and Dating

- **Pool.** The Pool is discovered *spatially*: open invites render as **Pool Beacons** — ringed pins with the crew's flag, note, and the trust gate line ("Backed member or 2 mutuals to join"). Knocking uses the same In/Nah verdict grammar (the receiving crew votes; the flag-raise animation is reused). Accepting crews see applicants' Standing bands and typed backings — reputation visibly doing work. The Pool tab remains as the list/inbox view; the map is its front door. A Flare's "Pool us in" verb deep-links here (§2.5).
- **Events.** Events keep their pages (`app/event/[id].tsx`) and render on the map as light-column beacons feeding the forecast layer. The Decision Card's event row (already built) is the bridge; RSVPs feed Night Tide's ghosted forecast; event start-times trigger Flare prompts; a scanned ticket is a co-attendance signal for night-closing. Future ticketing/table rows slot into the Decision Card without new surfaces.
- **Dating.** Dating stays a separate tab and **never renders on the map** (a dating layer on a location surface is the safety headline we architecturally refuse). The connection is identity: dating cards become tier-aware Night Cards — receipts, not bios ("12 nights closed · Shows up ×6" beats any typed bio), and matches convert to earned-friend edges only the way everything else does: by closing a night. Taste-layer fingerprints improve dating suggestions the same way they improve Pool matching.
- **The flywheel stated once:** Map surfaces the decision → Call It locks a plan → Convoy executes it → attendance closes the night → the Record, backings, streaks, and home-bar marks accrue → heat, ranking, and trust get smarter → next weekend's glance is better. Every subsystem writes to, and reads from, the same closed loop — invite → accept → attended — which is the company success metric.

---

## 6. PROTOTYPE BUILD PLAN

Ordered by demo impact; each step is self-contained and lists its own data changes. All in-memory via `lib/store.tsx` (pristine demo on relaunch — keep this rule). No new dependencies: Expo + RN + `react-native-svg` only. **Honesty column: everything here is scripted theatre — no real location, video, votes, or backend. The pitch narrates that.**

**Step 0 — shared data foundation (prerequisite, ~1 hour).** In `data/types.ts` add:

```ts
export interface Story { id: string; venueId: string; groupId: string; authorId: string;
  minutesAgo: number; audience: 'group'|'circles'|'city'; gradient: [string,string]; caption: string; }
export type VouchType = 'shows_up'|'great_host'|'good_with_new_people'|'looks_out';
export interface Vouch { fromId: string; toId: string; type: VouchType; nightId: string; }
export type Standing = 'new'|'building'|'solid'|'high';
export interface Night { id: string; date: string; venueId: string; crewIds: string[]; attendeeIds: string[]; }
// extend User: standing: Standing; nightsClosed: number; earnedFriendIds: string[]; roles: string[]; status: 'home'|'down'|'heading'|'out';
// extend HeatPoint: tempo?: 1|2|3;  // breathe rate tier
```

New seed files: `data/stories.ts` (~15 Flares weighted to Arches venues, `minutesAgo` spanning 5–300 to show all decay states), `data/nights.ts` (~10 nights), `data/vouches.ts` (~20 typed vouches referencing those nights). Extend `lib/store.tsx` with: `plan: {venueId, votes: Record<string,'in'|'nah'|null>, locked} | null`, `postedFlareVenueIds: string[]`, `ghost: boolean`, `callIt(venueId)`, `lockPlan()`, `postFlare(venueId)`, `closeNight(groupId)`, `setGhost()`.

**Step 1 — Burn rings + beacon anatomy (the screenshot).** `components/VelmontMap.tsx`: replace flat venue dots with the full Beacon — segmented ring arcs (SVG `Circle` with `strokeDasharray`, segment count = fresh stories from `data/stories.ts`, colour by `minutesAgo`: white-hot/cyan/ember), core glow radius from `level` (fit score arrives in Step 4), crew-count badge from `groupsTonight`. Reuse the existing `pulse` Animated.Value for ring shimmer on level-3 venues — stays inside the animation budget. *Faked: story counts/ages are seed data; no decay timers (static tints from `minutesAgo`).*

**Step 2 — Decision Card v3 + Flare reel.** `app/(tabs)/index.tsx`: upgrade the venue mini-card to the five-row Decision Card — busyness + hardcoded trend arrow, cost meter drawn from `costBreakdown` min/max (`lib/cost.ts`) against a budget value, aggregate "who" line from `groups`/`poolInvites`, filmstrip of gradient story tiles, ghosted "Peaks around 11" row (hand-authored per venue). New `components/FlareReel.tsx` modal: auto-advancing gradient frames (matches the monogram brand look — no photos exist) with caption, venue, distance, cost chip persistent; action bar = Call It / Pool us in (router push to Pool tab with prefilled outgoing invite via existing `sendInvite`) / hype. *Faked: no video (timed gradient stills), no real distances, trend arrows hand-authored.*

**Step 3 — Call It → rising-flag verdict (the money moment).** Long-press detection in the existing `PanResponder` (`onPanResponderRelease` with duration + <10px movement) → Call It sheet → plants a half-raised SVG crew flag (new `components/CrewFlag.tsx`: flagpole + `AvatarStack` banner, greyed avatars) at the venue. Scripted votes arrive on `setTimeout` ("Theo is in… Marcus is in…"), each lighting an avatar and raising the flag via Animated; at majority it snaps upright with a burst and becomes the Plan Flag; a 10-minute timer chip renders (accelerated in demo). State in `store.tsx`; resets on relaunch. *Faked: entirely scripted votes; no push, no real crew.*

**Step 4 — Group Lens + Top-3 rail.** Chip row pinned to the map top: crew selector (`g-you`) + £ budget chips (£15/£30/£50). Fit score computed client-side from `venue.level`, `avgSpend` vs budget, `groupsTonight`, district distance; beacon core-glow radius/opacity bind to it; Top-3 rail at bottom with generated reason strings ("rammed, £25–40 · 2 groups you know"); tapping a rail entry pans (`setOffset`) to the beacon. *Faked: "graph presence" term is seed data; ranking is a static formula.*

**Step 5 — Convoy comets.** After lock, "Share your comet" prompt → 3 comet dots animated along existing `streets` Path data toward the Plan Flag (path interpolation of the stroke geometry), fake decreasing ETA chips (12→8→3 min), venue halo intensifying per arrival, dots fusing into the upright Crew Flag with a pulse. Layer toggle carries the literal countdown label "Convoy · ends 3:00am". **Pause the Ticker while Convoy runs** (animation budget). Ghost toggle (Step 9) kills the layer. *Faked: no location; comets are keyframed along street paths.*

**Step 6 — Night Tide scrubber.** Slider above the Ticker crossfading three keyframed `heatPoints` datasets (21:00 / 23:00 / 01:00 — author two more arrays in `data/velmont.ts`), positions ahead of "now" rendered dashed/ghosted; story-ring brightness re-weights with scrubber time. Presenter drags it to prove the map is alive. *Faked: keyframes, not data; forecast is hand-drawn.*

**Step 7 — Crew Flags + Constellations on the city map.** Plant 2 static Crew Flags (Maya + 3 at Archive 9, Bassline Gang at The Vault) from a mock `outTonight` field on groups; render Constellation star-clusters with count badges ("2 crews") at 2 other venues. Tap a flag → crew mini-card with the Pool-knock button (existing `sendInvite`). *Faked: co-location is seed data.*

**Step 8 — Pool Beacons + Backing gate.** Ringed pins for 2 of the existing `poolInvites` on the map; knock flow shows the gate line "Backed member or 2 mutuals to join" and reuses the In/Nah verdict UI on the receiving side (scripted accept). In `app/(tabs)/pool.tsx`, show applicant Standing bands + typed vouch rows on group cards. *Faked: gate always passes in demo; standing is seed data.*

**Step 9 — Func ID: Night Card + tiers + Ghost.** `app/(tabs)/profile.tsx` becomes the Night Card hero with the You/Circle/Public segmented preview, Standing chip, typed vouch rows ("Shows up ×6 · from 4 groups"), backing capacity row ("Backing 2 of 3"), locked-slot empty states, and the Ghost toggle (3h/tonight/until-off — cosmetic, flips you out of your Crew Flag and comet). `app/person/[id].tsx` renders tier-aware via `earnedFriendIds`. *Faked: no timers, no verification, bands are seed data.*

**Step 10 — Close the night (the flywheel, live).** "Close the night" button on `app/group/[id].tsx` → writes a Night to the store, increments `nightsClosed`, converts the other crew to earned friends, and pops the post-night recap: co-attendees listed, max 2 typed backing selections (host gets `Great host`), with the stake copy verbatim: *"Backing puts your name on it. If they let the night down badly, it reflects on you."* One seeded consequence vignette (a revoked backing notification + Standing dip on a mock user) makes shared consequence legible to the room. *Faked: everything — but this one interaction demonstrates the entire earn model live.*

**Step 11 — Closed-loop Flare beat.** After joining "Neon Fridays @ Archive 9" in Events, a prompt fires: "You're at Archive 9 — drop a flare." Posting a mock Flare visibly adds a white-hot ring segment and brightens the beacon on return to the map. *Faked: no camera, no geofence — but it closes see → go → post → pull on screen.*

**Step 12 — Frame polish.** Default `mode` in `app/(tabs)/index.tsx` flips to `'city'` (globe stays via the earth button — presenter can still open on it manually for the pitch). BPM pill replaces the liveliness pill ("Velmont · 128 BPM · 214 out", animated beat dot). `WorldMap.tsx` Velmont label gains "· 38 flares live". Add the two one-shot coach lines. Afterglow chip: dims heat, draws a fading footprint `Polyline` across 3 venues, streak flame, and "The Vault — your crew's spot, 5 nights" crest.

**Explicitly out of prototype scope (narrated in the pitch, not built):** real location/geofencing/ETAs, video capture, push-driven votes, continuous pinch-zoom (keep the 3-step `ZOOMS` array), k-anonymity pipeline, backing/slashing logic, ID verification, moderation tooling, widgets, decay timers, forecast modelling. **Demo arc (3 minutes):** city map with burn rings + BPM → tap Archive 9 → Decision Card + reel → Call It → flag rises and locks → Convoy comets converge → Tide scrubber → Pool Beacon knock with Standing visible → profile Night Card → close the night + backing prompt.

---

## 7. Open risks

1. **Cold-start density is existential.** Ephemeral content makes sparsity visible and self-reinforcing (the nightlife-graveyard's shared cause). Mitigation is *enforced architecture*, not aspiration: neighbourhood-gated launch, never render a region below minimum liveness, non-UGC backfill (venue baseline, events, labelled venue reels). Note the tension we accepted: backfill mildly compromises "heat is generated by the graph" — we choose a live-looking map over doctrinal purity, with labelling.
2. **Ranking trust is a single point of failure.** One Friday where the #1 beacon is a dead room and the instrument is broken in a way vibes-only heat never can be. Mitigations: mandatory reasons on the rail, conservative confidence copy, fast signal decay, ghosted forecast rendering, promotion capped/labelled/never-#1. Needs a kill-switch to degrade to unranked heat if confidence collapses.
3. **Verdict mechanic may be dorky in practice.** Groups decide by inertia; In/Nah + timer can read as Doodle-for-nightlife. The flag animation de-risks the feel, but the mechanic must be tested with real crews before it keeps the hero slot; fallback is Call It as a one-way ping with passive "seen/coming" states.
4. **Privacy misread despite the architecture.** "Nightlife app shows where people are" is one headline away from the Instagram-Map backlash, even with aggregate-only heat and plan-scoped Convoy. The visible countdowns, opt-in-by-act, and women-first safety review must ship with, not after, any real-location build; k≥10 must apply to copy, not just pixels.
5. **Content supply at midnight.** People mid-night don't stop to post; if the 2-tap composer plus prompted moments don't produce Flares, burn rings stay thin and the core loop starves. Early venue/promoter seeding is the fallback and needs honest labelling.
6. **Backing failure modes need live monitoring.** Reciprocity inflation, homophily amplification, weaponised reports, and over-chill (stake feels scary → nobody backs anyone → the growth loop dies) all have designed mitigations, but norms beat mechanics — requires dashboards and willingness to retune caps/insurance quickly.
7. **Night-closing is security-critical.** If closing a night is cheap to spoof (GPS spoof, code sharing), the entire receipt model — Record, backings, heat weighting — inflates simultaneously. Geofence engineering in dense districts (The Arches) is real work, not a growth feature.
8. **Moderation cost vs unit economics.** Live 18+ nightlife video plus human-reviewed backing revocations directly stress the riskiest-assumption-#4 economics at student price points. Budget review tooling and staffing before the Flare layer ships publicly.
9. **Animation vs legibility vs battery.** Flags, comets, rings, breathing heat, and the ticker can tip from alive into noisy and drain phones on a night out. The three-concurrent-animations budget and a Zenly-style sleep-unless-watched location engine are hard requirements; the prototype must already demonstrate the budget discipline.
10. **Soul vs utility balance.** The Call's judged weakness — reading as a generic utility — is patched with grafted warmth (flags, rings, BPM, Afterglow). If build resourcing cuts the motion craft, the product regresses to "Yelp with votes"; if it cuts the ranking rigour, it regresses to a pretty mirror. Both halves are load-bearing; neither is polish.