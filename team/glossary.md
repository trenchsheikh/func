# Glossary

Func-specific vocabulary. Use these exact terms in code, copy, and
conversation — consistency here is what makes the product feel designed
rather than assembled. Full detail for the Map v3 terms is in
`docs/specs/map-v3-social-layer-spec.md`; this is the fast-reference version.

## The product, in one line

**Func is where your group finds tonight.** Group-first nightlife app. The
Pool is the hero mechanic; the map is the centrepiece surface; dating is
downstream of real nights out, not the starting point.

## Places

- **Velmont** — the fictional coastal city the prototype demos in. Five
  districts, each with a distinct personality: **The Arches** (clubbing,
  hottest), **Old Quarter** (bars, spread heat), **Harbourside**
  (events-driven), **Uni Hill** (student, cheap), **The Docks** (quiet,
  deliberately near-cold — contrast sells realism).
- **You** — the fixed demo persona (Jordan, 19, "You + 3" crew) — keeps the
  demo narrative coherent across every screen.

## The map (Map v3 / Decision 009)

- **Beacon** — a venue's complete map mark: burn ring + core glow + crew
  badge. The atomic unit of the map.
- **Burn ring** — the ring around a Beacon; brightness = flare freshness.
  White-hot (<30 min) → cyan (<2h) → pink ember (2–6h) → gone.
- **Flare** — a venue-anchored ephemeral story. Posting requires being at
  the venue. There is no stories tab — Flares only exist on the map.
- **Group Lens** — the crew/budget chip row that re-ranks the whole city
  live.
- **Fit score** — heat × budget fit × graph presence × distance. Drives a
  Beacon's core-glow size. Different from raw heat: heat is what the city
  feels like, fit is what *you* should do about it.
- **Decision Card** — the venue bottom sheet: busyness, cost meter, who's
  around, flare filmstrip, tide line, then the Call It CTA.
- **Call It / In / Nah** — proposing a venue to your crew; the two-button
  verdict flow.
- **Plan Flag** — a locked plan: the crew's flag, planted and upright, on
  the map.
- **Convoy** — plan-scoped live presence (comet trails converging on the
  Plan Flag). Never exists outside a locked plan. Not built yet.
- **Crew Flag** — 2+ opted-in crew members co-located at a venue, rendered
  as one planted flag. Individuals never render alone on the map, ever.
- **Constellation** — an anonymous aggregate mark ("3 crews here") for
  crews present but not broadcasting.
- **Night Tide** — the time-scrub bar (past = actual, now = live,
  ahead = ghosted forecast). Off-peak it becomes **Afterglow** (embers,
  fading footprints, crew streaks).
- **BPM pill** — the city-level liveliness readout ("Velmont · 128 BPM ·
  214 out").
- **Ghost** — the one-toggle, time-boxed presence override (3h / tonight /
  until off).

## Trust and identity

- **Backing** — the chosen Vouch model (Decision 009 §3): a stake-based
  attestation, gated to people you've verifiably shared a real night with,
  typed to one of four conduct-only verbs (Shows up / Great host / Good with
  new people / Looks out for people), revocable, and consequential for the
  giver if the backee seriously misbehaves. **No numeric score ever renders
  in the UI** — only coarse Standing bands.
- **Standing** — coarse reputation band: New / Building / Solid / High.
  Never shown as a number.
- **Func ID / Night Record** — the profile system. Identity as a receipt of
  verified behaviour: closed nights, earned friends, typed backings. Not
  self-authored.
- **Earned friends** — the social graph is built by closing real nights
  together, not by an add-friend button. There isn't one.

## Groups and going out

- **Pool** — groups inviting other groups out; the app's hero mechanic.
  Browse (open invites) + Inbox (sent/received, with status).
- **Night** — a closed, real-world event that produces the receipts
  everything else (Standing, earned friends, Backing eligibility) is built
  from.
- **Sparks** — the working name for Func's dating layer once it moves
  downstream of real nights out (V2 direction; the current prototype demos a
  classic swipe deck for legibility in the meantime).

## Process vocabulary (added 2026-07-27)

- **Tier 0–3** — the change-weight system in `func-identity.md`. Tier 0 =
  Constitution (changing it changes what Func is), Tier 1 = Architecture,
  Tier 2 = Feature, Tier 3 = Detail.
- **Intake** — the pipeline turning raw conversations into assessed
  proposals. See `intake-process.md` and the `func-intake` skill.
- **Superseded** — an idea replaced by a later decision. Moves to the
  tracker rather than being deleted; the master spec only ever states
  current truth.

---

**⚠️ Note (added 2026-08-11, engineering sync):** this file was not updated when
group-first was retired (Decision 012, 2026-08-07) — it still defines Func by the
superseded v1.0–v2.1 vocabulary (Pool as hero mechanic, Beacons, Call It, Convoy,
Plan Flag, Crew Flag). That vocabulary describes the product **before** the Tier 0
reset; see `func-identity.md` and `docs/DECISION_LOG.md` Decision 012 for current
terms (traffic light, request → accept → pass, friends/mutuals). Left as-is rather
than silently rewritten — flagging it is this sync's job, not editing product
history. Worth a proper pass whenever this file next comes up in real use.
