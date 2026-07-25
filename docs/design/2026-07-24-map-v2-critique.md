# Design Critique — Map v2 ("the whole world is out tonight")

Full-team review before building, per founder instruction. Scope: the Map tab, the
cost/spend feature, app "fun factor", and the phone-app question.

## 1. CEO vision (restated so we build the right thing)

- A **scrollable, interactive map** — ultimately the **entire world** as a live
  heatmap of "where things are happening".
- Every event/plan shows **what each part of the night costs**, with **min/max
  spend** ranges.
- The app should feel **more fun**.
- It must be experienced as a **phone app**, not a website.

## 2. Critique of the current map (v1)

| # | Weakness | Severity | Root cause |
|---|---|---|---|
| 1 | Map is a fixed poster: no pan, no zoom, no sense of a larger world | High | v1 spec optimised for a 3-min pitch on one screen |
| 2 | Scale story is wrong: Func's ambition is planet-scale liveness; v1 shows one city with no hint there is anything beyond it | High | Spec predates CEO's world-vision statement |
| 3 | Nothing moves. "Live" heat that never changes reads as a screenshot | Medium | No animation budget in v1 |
| 4 | No money anywhere on the map; cost is a real decision input for a night out | High | Cost model didn't exist in v1 |
| 5 | Fun lives in the copy, not the interaction; nothing rewards poking around | Medium | v1 favoured reliability over delight |

Verdict: v1 was the right first draft (it proved the aesthetic and the venue→event
loop) but it under-sells the ambition. Rebuild the Map tab as a **two-altitude
experience**: World → City.

## 3. Options considered (and why we chose what we chose)

**World rendering.** (a) Real map tiles — rejected: needs network + API keys,
breaks the offline demo rule, and a fictional city can't live on a real map
(Decision 004 reasoning still holds). (b) Hand-drawn SVG continents — rejected:
high risk of "slightly wrong geography" reading as amateur at pitch distance.
(c) **Stylised night-globe** — chosen: a dark globe with graticule lines, glowing
city nodes (Velmont live; London, Ibiza, Berlin, Miami, NYC, Tokyo… "landing
soon"), connection arcs, and a global live counter. Geography-free, so it always
looks intentional; planet-scale story lands instantly; pure SVG, zero deps.

**City interactivity.** (a) react-native-gesture-handler + reanimated — best-in-class
but new native deps and a rewrite of proven code; rejected for this iteration.
(b) **PanResponder pan + zoom buttons + tap-to-select** — chosen: no new deps,
works in Expo Go and on web, taps still reach venue pins (movement threshold
disambiguates). Pinch-to-zoom deferred: buttons are demo-reliable everywhere;
pinch arrives with the gesture-handler upgrade when we build the real app.

**Liveness.** Animate the *feeling*, not everything: pulsing hot-venue halos,
a ticking "people out" counter, and a scrolling ticker of what's happening now.
Three animations max — old phones must not stutter.

**Cost model.** Per event: itemised `costBreakdown` (entry/drinks/food/travel…),
each with min–max; totals derived, never hand-typed (single source of truth).
Per venue: `avgSpend` for the map mini-card. A full "night plan builder" (chain
venue → event → taxi into one budgeted plan) is the natural V2 — deliberately out
of scope this iteration, noted for the roadmap.

## 4. Pipeline & workflow analysis (real product, so the prototype fakes the right things)

**Heat data pipeline (future):** three inputs — venue partners (ticket scans, POS
velocity), event platforms (sales curves), and opt-in anonymous presence pings.
All inputs aggregate server-side into per-venue intensity; **nothing renders below
a k-anonymity threshold (k≥10)** so heat can never deanonymise an individual —
this is the aggregate-only promise from the thesis, enforced in the pipeline, not
the UI. Refresh cadence ~60s; client interpolates between frames so heat breathes
rather than jumps. *Prototype fakes this with: weighted heat points + pulse
animation + a counter that ticks.*

**Cost data pipeline (future):** seeded by venue-declared prices (entry, average
drink), corrected by anonymised crowd-sourced receipts ("what did your night
cost?" one-tap post-night prompt — which is also a retention touchpoint). Ranges
widen/narrow with variance. *Prototype fakes this with: hand-authored min/max
per line item.*

**Interaction workflow (the demo loop we optimise):**
World ("the planet is out tonight") → tap Velmont → city heat → tap a hot venue →
see activity + avg spend → open its event → see the full cost breakdown →
join → Pool. Every altitude answers one question: *where / how busy / how much /
who with.*

**Dev/test workflow:** unchanged — TypeScript strict, demo-script QA on web,
phone verification via Expo Go (instructions in prototype/README.md).

## 5. Accepted risks

- JS-driven SVG animation may not run at 60fps on very old Androids — acceptable
  for a pitch prototype; reanimated upgrade path exists.
- Zoom buttons instead of pinch is a visible simplification — defensible, and
  invisible in a guided demo.
- The globe is symbolic, not geographic — if an investor asks "is that the real
  world?", the answer is "it's the real ambition; real tiles come with the real
  backend" (and that answer is rehearsed, not improvised).
