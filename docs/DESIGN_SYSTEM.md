# Func — Design Language and Visual System

**Version:** 1.0 draft
**Date:** 2026-08-25
**Status:** Visual north star approved; exact tokens and asset set require founder review
**North-star source:** [`docs/superpowers/specs/2026-08-23-visual-north-star-design.md`](/Users/phoenixbarnes/Developer/Func/docs/superpowers/specs/2026-08-23-visual-north-star-design.md)

## 1. Visual thesis

**Func is a bright, living city map held inside a premium black-and-silver instrument.**

Func should not look like a generic neon nightlife app, a fintech glassmorphism kit, or an AI-generated moodboard. It should feel controlled, physical, editorial, and slightly strange.

## 2. Locked foundations

- map-first hierarchy;
- true black structural shell;
- smoked glass surfaces;
- neutral silver/chrome identity;
- emerald reserved for genuinely live energy;
- eye/person motif;
- no emoji as interface iconography;
- factual, readable information hierarchy;
- physical spring-like interaction;
- reduced-motion equivalents;
- visual excitement never overrides privacy disclosure rules.

## 3. Proposed system awaiting final token lock

### Materials

Use three primary materials:

1. matte black structure;
2. translucent smoked glass;
3. reflective neutral chrome.

Chrome belongs to identity, selection, premium moments, major transitions, and high-value controls. If every control shines, nothing feels premium.

### Colour semantics

| Role | Direction |
|---|---|
| Structural black | shell, negative space, primary canvas |
| Glass charcoal | surfaces over map and content |
| Silver chrome | identity, selection, premium, hero moments |
| White | factual content and high-contrast actions |
| Emerald | genuinely live energy, heartbeat, live availability |
| Red | destructive, unsafe, denied, or critical states |
| Electric palette | event art, editorial accents, controlled concept moments |

The exact black/tile colour and the boundary between semantic category colours and decorative electric colour remain open. The current code tokens are implementation evidence, not final brand approval.

### Typography

Recommended two-level hierarchy:

- condensed uppercase display face for brand moments, short labels, and editorial headlines;
- highly legible grotesk/sans for names, event information, controls, safety copy, and settings.

Numbers for capacity, time, and distance should remain especially legible. Uppercase is for short labels, never paragraphs. Font family and mobile licence are not yet locked.

### Shape

- small radius: controls and compact metadata;
- medium radius: inputs and segmented controls;
- large radius: cards and sheets;
- pill: status and access labels only.

Do not make every object a rounded rectangle. Map objects and event posters should carry visual variety.

## 4. Map language

The map is the primary visual stage.

1. Opportunities first: venues, events, and access.
2. Visible friends second: only where policy permits.
3. Anonymous live energy third: glow and atmosphere, never unsupported precision.

The map should be bright and geographically legible at every hour. There is no automatic night/afters personality shift in the current direction. World → city → street transitions should feel continuous.

### Marker grammar

- venue and event objects use consistent category forms with event-specific skins;
- visible friend markers use profile photo plus emerald heartbeat halo;
- premium adds a permanent neutral-silver chrome ring;
- mutual presence is anonymous pulse within eligible venue glow, never a person pin;
- co-located items remain independently selectable;
- precision degrades on zoom-out; the system must never invent precision.

## 5. Event and discovery surfaces

Browse is secondary to the map and should feel like a curated night index, not an infinite social feed.

Proposed structure:

- Live Near You;
- Near You;
- genre/category rows;
- factual cards with time, distance, access, capacity, and safe social context;
- expressive artwork where it does not obscure practical information.

Emerald is reserved for actions that are genuinely live or immediately available. Neutral actions use white, silver, or chrome.

## 6. Profiles and business identity

Personal profiles are compact nightlife identities, not public popularity dashboards. A business profile is a linked, accountable identity with venue context and current opportunity first. Personal and business identities must remain visibly separate.

Badges and achievements are optional proof surfaces, not a compulsory progression system or leaderboard.

## 7. Motion system

| Motion class | Intended use | Target range |
|---|---|---|
| Micro | press, selection, status feedback | 120–180 ms |
| Component | cards, pills, state changes | 240–420 ms |
| Spatial | marker expansion, map-linked transitions | 600–900 ms |
| Hero | opening globe/city sequence | 1.8–2.8 s |
| Ambient | live energy only | gentle, non-demanding loops |

Motion should compress, stretch, settle, bob, and rebound. Reduced motion should use fades and clear state changes without losing meaning.

## 8. Signature opening

The intended six-beat story is:

1. app icon / home-screen recognition;
2. chrome `func.` lockup on black;
3. letters retract into the pupil;
4. eye blinks and pupil becomes Earth;
5. Earth expands and dives toward the city;
6. live map arrives.

The current app’s zoom/fade is an interim prototype, not the finished animation.

## 9. Trust and accessibility visuals

The concept pack must show not only hero states but also:

- presence Off;
- expiring presence;
- reduced location precision;
- pending request;
- accepted request;
- blocked/report flow;
- verification pending;
- unavailable event;
- empty map;
- reduced-motion mode.

Every colour state needs text, shape, icon, or another cue. Sound and haptics must have complete visual equivalents. Privacy states must never be communicated by decoration alone.

## 10. Real UI versus concept art

Use real app code for map composition, privacy-safe pins, invite and request flows, profiles, navigation, factual copy, empty/loading/error/safety states, accessibility, and reduced motion.

Use concept art for hero atmosphere, material studies, early 3D object explorations, event poster direction, opening storyboard frames, and future map mood frames.

Never use concept art to imply real density, real users, real verification, real partnerships, working moderation, metrics, or a production backend.

## 11. Anti-generic rules

Avoid generic purple/blue nightlife gradients, stock party crowds, malformed AI faces/hands, unreadable generated map labels, fake venue logos, random 3D mascots, excessive chrome, rainbow bloom, meaningless particles, forced slang, and fake screenshots.

The visual test is simple: if the screen could belong to any nightlife, fintech, or social app, it is not finished.
