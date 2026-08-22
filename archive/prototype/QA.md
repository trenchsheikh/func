# Func Prototype — QA Checklist

> ## ⚠️ Verification standard (Decision 010): native first, browser is not enough
> All runs before 2026-07-24 (Decision 010) used `expo start --web` in a browser.
> That surfaced real false signals — web-only `PanResponder`/gesture behaviour,
> web-only stacking-context bugs, `devicePixelRatio` coordinate mismatches — that
> don't reflect the actual phone app. **From now on: a feature is "verified" only
> once it's been checked on a physical device (Expo Go) or the iOS Simulator.**
> The browser build stays useful for a quick visual sanity check or a desk pitch,
> never as the sole basis for calling something done. If a bug only reproduces on
> web, say so explicitly and don't treat it as a product bug unless it also
> reproduces on-device.
>
> **Last full run: 2026-07-24 (web build, 390×844 viewport) — PASSED, but per the
> above this is now a *secondary* result, not a completed verification.**
> Map v3 (Decision 009: Beacons, Group Lens, Call It, Flares) checked end to end:
> burn rings + crew badges render on load, Decision Card 5-row layout, Flare Reel
> opens/closes/Hype toggles, Call It → scripted votes → Plan Flag locks and renders
> on the map, £15 budget chip live re-ranks the Top-3 rail. One bug found and fixed
> in this pass: FlareReel had no zIndex and rendered *behind* the Decision Card —
> fixed (zIndex 50). A second issue found by inspection (not yet re-verified
> on-device): FlareReel used hardcoded pixel offsets instead of safe-area insets —
> fixed to use `useSafeAreaInsets` + measured header/footer heights. Pool and
> Profile spot-checked with no regressions from the `User` type extension.
> TypeScript strict typecheck clean throughout. **Not yet run natively** — Xcode
> install in progress; physical-device run via Expo Go also still outstanding.
> Do a full native pass before the first real pitch and before trusting any of
> the above as final.

Run the full demo script before every pitch and after every change. The walkthrough
*is* the test suite (spec §Error handling / testing).

## Demo script (target: under 3 minutes)

1. **Map** opens directly on **Velmont at city altitude** (Decision 009 — city-first,
   not the globe). BPM pill ("Velmont · 128 BPM · 214 out") with a beating dot, the
   Group Lens chip row (You + 3 / £15 / £30 / £50), and the Top-3 rail pinned above
   the ticker ("1. Archive 9 — on fire, £20–47, including Maya's crew"). Venues show
   **Beacons**: burn rings (cyan = hot flares, pink = ember) and crew-count badges.
   Tap a budget chip (**£15**) → watch the Top-3 rail live re-rank. Tap the globe
   button (top-left) → animated pull-out to the World view (pulsing Velmont LIVE
   node, "15 flares live", purple coming-soon cities, ticking global counter). Tap
   Velmont again → animated drop back into the city.
2. Tap a hot venue → **Decision Card**: busyness + trend arrow, cost meter chip,
   who's-in-the-pool line, a flare filmstrip ("N flares live · tap to watch"), and
   (where seeded) a tide line. Tap the filmstrip → **Flare Reel** opens full-screen:
   auto-advancing story, progress bar, author + timestamp, cost chip, and the
   Call It / Pool us in / Hype action bar. Tap Hype (🧯→🔥), close the reel.
3. Back on the Decision Card, tap **Call It** → crew avatars light up one at a time
   as scripted votes arrive (~1s apart) → at majority the card shows "Plan locked 🚩"
   and a flag glyph renders directly on the map at the venue. Tap the linked event
   row (Archive 9 → Neon Fridays) → event modal shows **The damage 💸** itemised
   min–max costs with derived "All in £20–47". Close it.
4. **Pool → Browse**: cards show group stacks, ages, vibe, district/night chips.
   Tap "Send invite" on Maya + 3 → button becomes "Invite sent ✓" and stays disabled.
5. **Pool → Inbox**: four states visible (incoming-pending, sent-pending, accepted,
   denied). Tap **Accept** on the incoming invite → chip flips to Accepted and the
   "You're linked up 🎉" line appears.
6. **Events**: scroll list, open **Neon Fridays** → tap **Join event** → button
   becomes "You're going 🎉", count ticks up by one, "You 🎉" appears in Who's going,
   and the list card now shows the going badge.
7. **Dating**: swipe (gesture AND buttons — test both). Card 3 (Zara) right-swipe →
   neon match overlay with both avatars. Tap **Send a message** → chat opens; send a
   message → canned reply arrives after ~1s.
8. **Profile**: verified badge, "You + 3" group (tap → group modal), badges row.
   "This is what others see" caption present.
9. From any group modal, tap a member → person modal opens (public-profile mechanic).

## Invariants

- Every launch starts pristine (no persistence).
- No network requests at any point (works in airplane mode).
- All mock users are 18+; all show verified badges.
- No individual's position ever appears on the map — heat only.

## Known limitations (accepted for prototype)

- Match overlay only triggers on cards flagged `alwaysMatch` (deliberate: reliable
  pitch moment).
- Chat replies are canned; sending from chat does not persist across reopens.
- Map is illustrated SVG, not tiles (Decision 004) — venue pins are the only
  tappable map elements.
- **Web build:** drag-swiping the dating deck is unreliable in browsers (React
  Native's responder system is touch-first); the ✕ / ♥ buttons are the reliable
  path on web. Touch swiping works natively — verify on a phone. For desk demos,
  use the buttons.
- **Map v3 scope (Decision 009):** Convoy (live comets), the Night Tide scrubber,
  Crew Flags/Constellations for other crews, Pool Beacons on the map, the Func ID
  profile rebuild, and the "close the night" Backing-prompt flow are specced in
  full in `docs/specs/map-v3-social-layer-spec.md` §6 (steps 5, 6, 7, 8, 9, 10, 11)
  but NOT YET BUILT — this session shipped steps 0–4 and part of 12 (the Beacon
  map, Group Lens, Call It, and Flares). See the decision log for the full status.
- Vote timing in Call It is scripted (`setTimeout` in `lib/store.tsx`), not driven
  by real crew responses — accurately described in the demo as "here's how the
  mechanic will feel," not a live multiplayer simulation.
