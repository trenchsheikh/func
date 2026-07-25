# Func Prototype Spec — "Velmont" Demo

Supersedes the draft spec from the founder's earlier Claude session (that file was
never in this repo). Founder-approved structure is preserved; amendments from team
decisions 004–005 are marked **[amended]**.

Goal: a pitch-ready, offline, in-memory demo that makes the Func thesis visceral in
under three minutes. Not production code — but production *taste*.

## Stack

- Expo (managed) + React Native + TypeScript, app lives in `prototype/`.
- **[amended]** Navigation: Expo Router (file-based tabs + modals) — wraps
  react-navigation; it's the current Expo default and demo-friendly.
- **[amended]** Map: custom SVG city map via `react-native-svg`, *not*
  `react-native-maps`. Velmont is fictional — real map tiles can't render it, and
  custom dark map styling doesn't work in Expo Go on iOS anyway. An illustrated map
  is fully art-directable, offline, and runs in Expo Go *and* on web.
- `expo-linear-gradient` for neon glows.
- Runs in Expo Go on a phone and via `npx expo start --web` for desk demos.

## Theme

Near-black `#0A0A0F` background, electric purple `#A855F7` primary, hot pink
`#EC4899` secondary, cyan `#22D3EE` hottest-zone accent. One shared `theme.ts`.

## The city — Velmont (coastal, five districts)

| District | Personality | Heat at night |
|---|---|---|
| The Arches | Railway-arch clubbing district | Hottest — dense cyan/pink |
| Old Quarter | Bars + late food | Mid heat, many small points |
| Harbourside | Waterfront, events-driven | Spikes at event venues |
| Uni Hill | Student bars, 18–21 skew | Clustered around cheap bars |
| The Docks | Quiet/emerging | Near-cold (contrast sells realism) |

## Mock data (`prototype/data/*.ts`, all in-memory, reset on launch)

- `users.ts` — ~30 profiles: name, age (18–26), bio, interest tags, home district,
  gender mix, group affiliation, `verified` flag (all true — verification is a
  first-class visual in the demo).
- `groups.ts` — ~10 groups (user-ID composition, vibe line, looking-for line,
  district + night).
- `poolInvites.ts` — ~8 open invites in Browse; 4 seeded Inbox items covering every
  state: incoming-pending (actionable), sent-pending, accepted, denied.
- `events.ts` — ~10 events across districts incl. daytime/non-nightlife (five-a-side,
  food market) to show breadth. Fields: title, venue, district, date/time, attendees
  (count + avatar refs), price, joined flag.
- `heatPoints.ts` — ~60 weighted points in **map-local coordinates** (SVG space, not
  lat/lng) distributed per district personality.
- `datingProfiles.ts` — ~12 profiles; #3 and #7 always match (reliable pitch moment).
- **[amended]** Imagery: no bundled photos (none exist; remote images break the
  offline rule). People render as neon gradient monogram avatars — deliberate
  brand look, not a gap. `prototype/assets/people/` is wired so real photos dropped
  in later are picked up automatically. Events use gradient art headers.

"You" = fixed persona: 19, male, group of 4 mates ("You + 3") — keeps the demo
narrative coherent on every screen.

## Screens

1. **Map (home).** Full-screen SVG Velmont: coastline, district shapes + labels, heat
   as layered translucent radial gradients (purple → pink → cyan by intensity).
   Tappable venue pins on hot spots → mini-card: venue, activity level, groups in the
   pool tonight, linked event. Floating pill: "Tonight in Velmont · 214 people out".
2. **Pool.** Sub-tabs Browse / Inbox. Browse: open-invite cards (avatar stack, ages,
   vibe, looking-for, district + night) with "Send invite" → "Invite sent ✓" and
   tap-through to member profiles. Inbox: the 4 seeded items with status chips;
   incoming-pending has working Accept / Deny.
3. **Events.** Card list (gradient header, date chip, district, attendee stack,
   price) → detail modal (description, who's-going profiles, "Join event" →
   "You're going 🎉", attendee count ticks up).
4. **Dating.** Swipe deck (name, age, district, interests; swipe + buttons). Match →
   neon overlay, both avatars, "Send a message" → stub chat with one canned reply.
5. **Profile.** Your public profile: avatar, name/age, verified badge, bio,
   interests, "You + 3" group, badges (events attended, pool meets), caption:
   "This is what others see."

Tapping any person or group anywhere opens their public profile as a modal.

## Demo script (the walkthrough is the test)

Map → tap The Arches pin → Pool → accept the incoming invite → Events → join
"Neon Fridays @ Archive 9" → Dating → swipe to the guaranteed match → send message →
Profile. Every step visibly mutates UI state.

## Error handling / testing

No network ⇒ no failure states. TypeScript strict. Manual test = the demo script,
run before every pitch and after every change. QA owns a checklist in
`prototype/QA.md`.

## Out of scope (known future workstreams, not oversights)

Real auth, backend, real verification/moderation pipeline, payments, push, live
location. Trust & safety architecture is specified at thesis level
(aggregate-only heat, opt-in groups, 18+ verification) and demo'd visually
(verified badges) only.
