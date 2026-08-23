# Handover — Func M1 Visual Foundation

**Date:** 2026-08-23
**Next worker:** New ChatGPT development conversation
**Repository:** `/Users/phoenixbarnes/Developer/Func`
**Active app:** `/Users/phoenixbarnes/Developer/Func/func-mobile`
**Audit:** `docs/handoffs/2026-08-23-visual-foundation-audit.md`
**Visual source of truth:** `docs/superpowers/specs/2026-08-23-visual-north-star-design.md`

## Objective

Implement **M1 only: visual tokens, materials, shared glass/chrome primitives, and emoji-icon cleanup.** This is a bounded visual foundation pass, not a screen redesign or product-behavior change.

## Founder-approved direction

Func is a bright, living city map held inside a premium black-and-silver instrument.

- The shell uses near-black surfaces, dark glass, silver/chrome, restrained reflections, and electric accents.
- Event details, statistics, names, and practical information must remain formal and legible.
- Emoji glyphs are not interface iconography.
- M1 does not introduce forced night mode; the bright Mapbox style is M2.

## Audit findings that govern this session

- The existing `src/domain/` → `src/data/` → `src/ui/`/`app/` architecture is sound and must be preserved.
- There is currently no centralized visibility projection. Do not add friend photos, mutual logic, heartbeat halos, clustering, or identity changes in M1.
- The map is dark-only today; Mapbox style selection is M2 and needs a separate asset decision.
- Emoji glyphs remain in active invite/map/create UI paths.
- Premium’s permanent chrome ring is a later M3 behavior. Do not implement it here.

## Expected M1 scope

Confirm current line numbers before editing. Change only what is necessary in:

- `func-mobile/src/ui/theme.ts` — named glass, chrome, electric-accent, border, highlight, and text tokens; preserve existing exports.
- `func-mobile/src/ui/components/Primitives.tsx` — reusable `GlassCard` and `ChromeSurface` primitives.
- `func-mobile/src/ui/components/Icons.tsx` — SVG icon variants needed for current emoji replacements.
- `func-mobile/src/ui/components/InviteBits.tsx` — remove emoji cover glyphs.
- `func-mobile/src/ui/map/Pins.tsx` — remove lock/disco-ball emoji rendering only.
- `func-mobile/app/(tabs)/create.tsx` — replace the emoji placement crosshair.
- `func-mobile/src/ui/components/Avatar.tsx`, `DiscoBall.tsx`, and `Logo.tsx` — safe token/material replacements only; no behavior changes.

Do not assume every listed file must change. Explain omitted files in the final handoff.

## Hard boundaries

- Do not edit `func-mobile/src/domain/` or `func-mobile/src/data/`.
- Do not add the visibility projection, friend/mutual logic, profile photos, heartbeat halos, clustering, or permanent premium rings.
- Do not choose or implement the M2 bright Mapbox style.
- Do not build Browse rows, event-card IA, profiles, business pathways, loading, onboarding, sound, haptics, or navigation.
- Do not install dependencies or modify `package.json`.
- Do not touch `/Users/phoenixbarnes/Developer/Func-safe-map`.
- Do not rewrite screen layouts or information hierarchy.

## Required workflow

1. Read this file, the visual north star spec, and the complete M1 section of the audit.
2. Inspect `git status`, branch, current exports, exact emoji usages, and hardcoded color inventory.
3. Run baseline `npm run typecheck` and `npm test` from `func-mobile`.
4. Implement small verified slices: tokens → primitives → SVG icon cleanup → safe token replacements.
5. Run complete checks and targeted searches.
6. Perform the native iOS walkthrough if available; browser-only validation is not sufficient final evidence.
7. Write the M2 handover before ending. Do not begin M2 in this session.

## Definition of done

From `/Users/phoenixbarnes/Developer/Func/func-mobile`:

```bash
npm run typecheck
npm test
rg -n '🔒|🪩|📍|🌃|🎤|🍸|🌅|🎧|🔥|🍕' src app
rg -n '#16161a' src app
git diff --name-only
git diff --check
```

Expected: typecheck and tests pass; both targeted searches return zero matches; no `src/domain/` or `src/data/` path appears in the diff; no dependency files changed; no whitespace errors.

The final response must list changed files, verification output, native walkthrough evidence or its precise blocker, explicit confirmation of untouched boundaries, unresolved M2 decisions, and the next handover path.

## Gate before M3

Before photo-based friend markers and heartbeat halos, Phoenix must explicitly decide whether the already-adopted friend/mutual/anonymous visibility projection is in scope for the visual foundation. That projection must exist centrally and be tested before identity-bearing marker work begins.
