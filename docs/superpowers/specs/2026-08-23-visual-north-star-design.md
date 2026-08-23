# Func Visual North Star v1

**Date:** 2026-08-23
**Status:** Founder-approved direction; written-spec review pending
**Scope:** Visual identity, interaction language, and staged redesign direction for `func-mobile`
**Product line:** Func is a bridge between you and the opportunities of the night.

## 1. Purpose

This document turns the founder’s visual direction into a durable north star for future design and engineering work. It is a direction and sequencing document, not permission for a wholesale rewrite, backend work, or production-security claims.

The goal is not to make Func resemble another nightlife app. The goal is to combine the strongest qualities of the references—living maps, expressive event surfaces, visual identity, motion, and dopamine—with Func’s own map-first, privacy-safe, calm posture.

## 2. One-line visual thesis

> **Func is a bright, living city map held inside a premium black-and-silver instrument.**

Func should feel exciting because the city is alive and opportunities are visible—not because the interface is childish, noisy, or pressuring the user.

## 3. Reference framework

The references are inputs, not templates:

- **Bump:** a social map that feels alive through zooming, friend presence, movement, ETA, and layered moments.
- **Partiful:** event pages as visual objects, strong typography, poster-like artwork, and expressive invitations.
- **Beli:** map-led discovery, recognisable place objects, social context, and lightweight exploration.
- **Duolingo:** collectible progression and a memorable icon system, without importing childish copy or gamification pressure.
- **Snap Map / Find My:** continuous map-scale transitions and friend presence that resolves from world view to local detail.
- **Google Maps:** factual, formal, trustworthy information hierarchy for places, time, distance, and navigation context.

Func’s synthesis is deliberately more mature: premium materials and playful objects, with factual information and safety boundaries always clear.

## 4. Visual foundations

### 4.1 Shell and materials

- True black is the structural foundation.
- Interface surfaces use dark translucent glass with liquid-silver chrome edges.
- Chrome is neutral silver, not coloured chrome.
- Chrome may have subtle moving reflections at rest.
- Liquid mirror chrome is reserved for the logo, premium rings, hero controls, major transitions, and other high-value identity moments.
- Controls float above the map rather than forming a heavy permanent frame.

### 4.2 Colour

Func owns a controlled electric palette:

- cobalt blue
- violet
- hot pink
- cyan
- acid lime
- emerald for live energy, heartbeat, and genuinely live states
- black, white, and silver chrome for structure and clarity

The map may use geographic colours—blue water, green parks, muted roads, pale land—without violating the emerald semantic rule. Critical states never rely on colour alone.

### 4.3 Typography and copy

- Primary headlines use a large, heavy, rounded grotesk with immediate presence.
- Interface text uses a clean, highly legible sans.
- Event information is formal and factual, closer to Google Maps than party-promo slang.
- Copy starts neutral and utility-first. Personality can be layered in later after the product has earned it.
- No forced slang, childish phrasing, or copy that makes assumptions about the user’s night.

### 4.4 Iconography and objects

- Utility actions use clean line icons.
- Meaningful content uses custom 3D objects.
- 3D objects combine polished collectible materials with playful character; they should feel premium, not cartoonish.
- Each venue/event category has a consistent base form so it is recognisable at a glance.
- Event-specific skins, colours, textures, artwork, and motion provide uniqueness.
- Do not use emoji glyphs as interface iconography.
- Func has no recurring mascot. The eye, globe, chrome, photography, and object system carry the identity.

## 5. Map art direction

The map is the product centrepiece and the primary visual stage.

### 5.1 Base map

- Bright and geographically legible at every hour.
- No forced dusk, night, afters, or end-of-night mode.
- The map should bring every hour to life without telling the user how late it is or what they should do next.
- Overview is clean and readable.
- Mid-zoom reveals richer neighbourhood structure and live layers.
- Street-level zoom adds subtle-to-strong 3D buildings and physical depth.
- Zooming, panning, and globe-to-city transitions must feel continuous and coherent, not like unrelated screens.

### 5.2 Map hierarchy

1. Venues and events: the opportunities of the night.
2. Visible friends: social confidence and context.
3. Anonymous live energy: atmosphere, never unsupported precision.

### 5.3 Live energy

- Use soft ambient glows around venues and areas.
- Glows move organically and can become richer when eligible anonymous mutual presence exists.
- Never use hard boundaries, artificial rankings, unsupported exact heat numbers, or noisy visual claims.
- Empty areas remain quiet map; Func does not notify the user that nothing is happening there or automatically broaden the search.

### 5.4 Friend presence across zoom levels

Friends who are currently visible under their privacy setting remain visible across map scales:

- globe/world view: country or regional presence
- city view: friend clusters and city context
- street view: individual profile-photo markers and venue relationships

Several friends in one area form an expressive cluster until the user zooms in. Exact precision must still obey the existing DTF/Casual/Off and viewer-eligibility rules. The visual system must degrade precision as the user zooms out, never invent it.

### 5.5 Markers

- Venue/event markers are custom 3D category objects with event-specific skins.
- Tapping a marker physically expands it into its event card; the card remains spatially anchored to the selected place.
- Visible regular friend: circular profile photo with an emerald heartbeat halo behind it.
- Visible Premium friend: the same heartbeat halo plus a permanent neutral-silver chrome circle.
- Mutual presence is not a person pin. It appears only as anonymous pulses within eligible venue glow.
- Premium chrome is independent of the temporary DTF/Casual/Off state.

## 6. Browse and event surfaces

Browse is secondary to the map but uses the same visual world.

### 6.1 Browse structure

- A **Live Near You** row appears first and is sorted from closest to furthest.
- A **Near You** row is the first non-live recommendation until real behavioural data justifies a “For You” system.
- Genre rows follow below.
- Rows use compact, scannable cards.
- Tapping opens the full event card.

### 6.2 Event cards

- Black/chrome glass shell.
- Large edge-to-edge hero artwork, but never behind or over important information.
- Designed posters/graphics and real photography are both valid: artwork leads for expressive events; photography grounds venues and people.
- Information hierarchy:
  1. safe, relevant live social proof
  2. essential practical details, with distance folded into the same compact context
  3. deeper details on tap
- Live social proof uses visible friend avatars only when allowed, with anonymous live-energy language or glow where appropriate.
- Emerald is reserved for actions that are genuinely live or immediately available. Other actions use chrome or neutral treatments.
- Event information remains formal, factual, and easy to scan.

## 7. Profiles and linked business identities

### 7.1 Personal profile

The personal profile is a compact nightlife identity:

- profile photo in the corner, name, city, main going-out scene, friends, and vouches
- optional information cards chosen by the user
- flat graphic badges for achievements
- optional venue badges and city/country/world map-coverage badges
- badges are a flex layer, not a compulsory progress system or leaderboard
- DTF, Premium, Casual, or Off appears as a pill/small circle beside the name on expanded profile views
- compact map views use the temporary status as a fading glow behind the photo
- Premium always receives the chrome circle around the profile photo

### 7.2 Linked business identity

Business is an optional linked identity, not a dominant product mode:

- a person may show a **Verified Operator** badge, an **Active Event** badge, both, or neither on their personal profile
- the badge provides a pathway to a separate linked business profile
- the personal and business identities do not need to duplicate each other
- business profiles use the same Func black/chrome language
- current event or opportunity leads the business profile
- identity, scene, event history, vouches, and verification are accessible secondary proof
- if a user uses business event tools, verification and accountability are mandatory even if badge display is optional

The exact verification, business fields, and promoter workflow remain product and safety design work; they must not be improvised inside a visual pass.

## 8. Motion, sound, and touch

- Motion is springy and physical: objects compress, stretch, settle, bob, and rebound.
- Micro-interactions are fast; hero transitions are slower and more spacious.
- Ambient map motion is gentle; meaningful live events receive stronger responses.
- Pressed controls compress and rebound with a brief chrome/light response and haptic.
- Sound combines physical UI micro-sounds with occasional musical signatures for major moments.
- Sound and haptics enhance dopamine but are never required for the product to feel complete.
- First launch: logo → eye → blink → Earth/globe → city dive → live map, followed by concise trust/privacy setup.
- Later launches use a shorter energetic re-entry version.
- Loading states are contextual. Full-screen loading uses a near-black glass background, chrome eye, spinning globe, and literal progress wording such as “Fetching…” or “Gathering…”. Inline loading preserves the visible map.
- Contextual onboarding hints appear once and never recur.
- Reduced-motion mode replaces movement with short fades and clear state changes.

## 9. Accessibility and trust baseline

- Every colour state has a second cue: text, shape, icon, or motion/state change.
- Formal information remains readable over artwork and glass.
- Motion has a reduced-motion equivalent.
- Sound/haptic feedback has a complete visual equivalent.
- Privacy states are never communicated by decorative styling alone.
- A visually exciting surface must not disclose more identity or location than the current Func rules authorise.
- The prototype remains simulated; client-side checks must not be described as production security.

## 10. Implementation principles and architecture guardrails

The existing broad architecture is the right foundation:

- `src/domain/` owns pure product rules and visual-state decisions that can be tested without React or IO.
- `src/data/` owns raw state and safe viewer projections.
- `src/ui/` and `app/` render only allowed views and consume shared tokens/primitives.
- A visual redesign must not move privacy decisions into screens, duplicate status logic, or bypass `ViewerSnapshot`/repository boundaries.
- Add a shared visual token layer before broad screen-specific styling.
- Build visual primitives and map primitives before polishing individual screens.
- Use real or simulated data only through the existing seam.
- Keep the reviewed `safe-map-pool` branch/worktree untouched unless Phoenix explicitly chooses otherwise.

## 11. Recommended staged delivery

1. **Visual foundation audit:** inspect the active build, capture current gaps, identify seams, and produce a file-level implementation plan. No broad code changes.
2. **Token and material foundation:** colour, type, spacing, radii, glass, chrome, shadows, elevation, icon rules, reduced-motion rules.
3. **Map foundation:** bright custom map style, zoom-dependent layers, world/city/street transitions, glows, and clustering.
4. **Marker system:** venue/event object grammar, friend heartbeat markers, Premium chrome, anonymous mutual glow.
5. **Event and Browse surfaces:** rows, information-first cards, marker-to-card expansion, formal content hierarchy.
6. **Profiles:** personal identity, badges, DTF treatments, optional linked business pathway.
7. **Sensory and quality pass:** motion timing, sound/haptic hooks, loading, onboarding hints, accessibility, and native walkthrough.

Each stage gets its own bounded handover, acceptance checks, verification commands, and restart instructions. Do not combine all stages into one Claude context.

## 12. High-priority visual improvements

1. Replace the current schematic/dark visual treatment with the bright multi-scale map foundation.
2. Establish shared black/glass/silver-chrome tokens and the controlled electric palette.
3. Replace generic pins with the category-based object and friend-heartbeat marker system.
4. Make marker-to-event-card expansion spatial and physical.
5. Rebuild Browse around Live Near You, Near You, and genre rows with formal information hierarchy.
6. Add profile status treatments, flat badges, and the optional linked business pathway without making business a top-level mode.
7. Add the launch, loading, touch, sound/haptic, reduced-motion, and one-time hint language.

## 13. Explicit non-goals for the first redesign pass

- no backend or real identity verification implementation
- no production location tracking or production security claim
- no redesign of the product constitution or privacy rules
- no general-purpose messaging redesign
- no payments/ticketing platform build
- no mascot system
- no fake “For You” recommendation engine
- no broad rewrite before the foundation audit and staged plan are reviewed
