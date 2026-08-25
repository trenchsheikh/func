# func — mobile prototype

React Native (Expo SDK 57, TypeScript) prototype of **func**: a map-first
night-out app. Fully mocked, in-memory data — no backend, no auth, no
persistence. Every launch is the same pristine demo state.

## ⚠️ Production boundary

This remains a simulated prototype. Nothing in this design is production
security. There are no real users and no real locations: identity is a
seed constant, relationships and business verification are seeded
simulations, and every check runs on the client. The build must not be
used with real people or real positions until backend authentication,
server-side redaction, government-ID and business verification, reporting,
blocking, moderation, rate limits, and auditability exist.

The current product and developer source-of-truth pack is maintained one level
up: [`docs/FUNC_BIBLE.md`](../docs/FUNC_BIBLE.md), [`docs/PRD.md`](../docs/PRD.md),
[`docs/FEATURE_MATRIX.md`](../docs/FEATURE_MATRIX.md),
[`docs/PRIVACY_AND_SAFETY.md`](../docs/PRIVACY_AND_SAFETY.md), and
[`docs/DEVELOPER_HANDOFF.md`](../docs/DEVELOPER_HANDOFF.md). Older product-era
documents remain for historical provenance and must not override that pack.

## Run it

```bash
npm install
cp .env.example .env          # add your Mapbox public token (pk.…) — see below
npx expo prebuild --platform ios
npx expo run:ios              # builds the custom dev client and launches it
```

Two real setup costs, both from `@rnmapbox/maps` (the only library that gives
a true 3D globe on both platforms):

1. **Custom dev client.** The app will not run in plain Expo Go. `expo run:ios`
   / `expo run:android` builds one (Xcode / Android Studio required).
2. **Mapbox account + public access token.** Free at
   <https://account.mapbox.com/>. Put it in `.env` as
   `EXPO_PUBLIC_MAPBOX_TOKEN=pk.…` and restart Metro (`npx expo start -c`).
   Without it the map screen renders a clearly-labelled **schematic fallback**
   (flat sketch of the same pins) so every other flow still demos; the globe
   itself needs the token. (Mapbox v11.8+ no longer needs the old secret
   *download* token — `pod install` works without one.)

Useful scripts: `npm test` (data-layer tests, node:test), `npm run typecheck`,
`npm run gen:icon` (re-rasterises `assets/icon.png` from the flat logo).

## Architecture

```
src/domain/      types + pure rules (no React, no IO)
  types.ts         FuncUser / PersonalProfile / BusinessProfile / PoolInvite / PoolRequest — locked shapes
  liveStatus.ts    pin resolution: dtf/casual/off, 48h expiry, premium skin, business ball
  pool.ts          capacity maths, viewer relation (host/attending/requested/…)
src/data/        data access — the seam for a real backend
  repository.ts    FuncRepository interface + immutable Snapshot
  InMemoryRepository.ts  the mock implementation (all commands, all rules)
  seed/            SF-centred demo content (nothing else assumes SF)
  DataContext.tsx  React binding: <DataProvider>, useRepository(), useSnapshot()
  selectors.ts     read helpers over a Snapshot
src/ui/          theme, primitives, map renderers, shared invite components
app/             expo-router routes: (tabs)/{create,messages,map,inbox,profile}, invite/[id], review/[id], venue/[id], thread/[id]
```

Swapping in a real backend = implement `FuncRepository` against the API and
pass it to `<DataProvider repository={…}>`. Screens only ever call repository
commands and read the snapshot.

## What's deliberately simple in this pass

Visual polish, motion (the Eye entrance is a plain zoom/fade), disco-ball
particle glow, photo stories, and a card-stack browse mode are out of scope
or stubbed. Convoy, Sparks, a swipe tab, and pro event tooling are
intentionally not built.
