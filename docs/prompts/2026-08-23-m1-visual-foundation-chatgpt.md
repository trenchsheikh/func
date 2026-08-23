# Copy-paste prompt — Func M1 Visual Foundation

Copy everything between the markers into a new ChatGPT development conversation.

--- BEGIN PROMPT ---

You are continuing development of Func in:

- Repository: `/Users/phoenixbarnes/Developer/Func`
- Active app: `/Users/phoenixbarnes/Developer/Func/func-mobile`
- Branch: `main`

Your task is **M1 only: visual tokens, materials, shared glass/chrome primitives, and emoji-icon cleanup.** Do not start M2 or any later milestone.

## Read first

Read these files completely before changing anything:

1. `/Users/phoenixbarnes/Developer/Func/CLAUDE.md`
2. `/Users/phoenixbarnes/Developer/Func/team/README.md` and its required reading order
3. `/Users/phoenixbarnes/Developer/Func/team/standing-orders.md`
4. `/Users/phoenixbarnes/Developer/Func/team/func-identity.md`
5. `/Users/phoenixbarnes/Developer/Func/team/operating-principles.md`
6. `/Users/phoenixbarnes/Developer/Func/docs/DECISION_LOG.md`, especially Decisions 012–016
7. `/Users/phoenixbarnes/Developer/Func/docs/superpowers/specs/2026-08-23-visual-north-star-design.md`
8. `/Users/phoenixbarnes/Developer/Func/docs/handoffs/2026-08-23-visual-foundation-audit.md`
9. `/Users/phoenixbarnes/Developer/Func/docs/handoffs/2026-08-23-m1-visual-foundation-handover.md`

## Founder intent

Func is a bright, living city map held inside a premium black-and-silver instrument. The shell should feel like near-black glass, silver/chrome material, restrained reflections, and electric accents. Event information, statistics, names, and practical details must remain formal, legible, and more important than decoration. Emoji glyphs are not acceptable as interface iconography.

## First actions before editing

From `/Users/phoenixbarnes/Developer/Func`:

```bash
git status --short
git branch --show-current
git log -1 --oneline
```

From `/Users/phoenixbarnes/Developer/Func/func-mobile`:

```bash
npm run typecheck
npm test
```

Inspect the current exports and usages in `src/ui/theme.ts`, `src/ui/components/Primitives.tsx`, `src/ui/components/Icons.tsx`, `src/ui/components/InviteBits.tsx`, `src/ui/map/Pins.tsx`, `app/(tabs)/create.tsx`, `src/ui/components/Avatar.tsx`, `src/ui/components/DiscoBall.tsx`, and `src/ui/components/Logo.tsx`. Do not rely on stale line numbers.

## Implement only this

1. Extend the shared theme with named semantic tokens for near-black surfaces, dark glass, chrome/silver tiers, electric accents, borders, highlights, and readable text hierarchy. Preserve existing exports and avoid a broad palette rewrite.

2. Add small reusable `GlassCard` and `ChromeSurface` primitives in `src/ui/components/Primitives.tsx`, following existing primitive conventions. They must consume shared tokens, preserve children/layout/accessibility behavior, and not imply premium entitlement.

3. Replace active emoji-as-icon usage with SVG/icon components using the existing `Icons.tsx` pattern: invite map-pin lock/disco-ball glyphs, invite card cover glyphs, and the create-screen placement crosshair.

4. Replace the audit-identified hardcoded `#16161a` values with semantic tokens without changing layout or behavior.

5. Make only safe token/material changes in `Avatar.tsx` and `DiscoBall.tsx`. Do not alter identity semantics, status logic, ring entitlement, or animation behavior.

## Hard prohibitions

- Do not edit `src/domain/` or `src/data/`.
- Do not add visibility projection, friend/mutual logic, profile photos, heartbeat halos, clustering, or permanent premium rings.
- Do not implement the bright Mapbox style; that is M2 and requires a separately chosen style asset.
- Do not build Browse rows, event-card redesigns, profiles, business pathways, onboarding, loading, sound, haptics, or new navigation.
- Do not install packages or change `package.json`.
- Do not touch `/Users/phoenixbarnes/Developer/Func-safe-map`.
- Do not use emoji glyphs as a fallback icon.

## Verification before stopping

From `/Users/phoenixbarnes/Developer/Func/func-mobile`:

```bash
npm run typecheck
npm test
rg -n '🔒|🪩|📍|🌃|🎤|🍸|🌅|🎧|🔥|🍕' src app
rg -n '#16161a' src app
git diff --name-only
git diff --check
```

Expected: typecheck and tests pass; both targeted searches return no matches; no path under `src/domain/` or `src/data/` appears in the diff; no dependency files changed; no whitespace errors.

Perform a native iOS walkthrough if supported. Verify that current screens still render and that event details, names, statistics, and controls remain legible. Browser-only validation is not sufficient final evidence.

## Required final response

Do not continue into M2. End with:

1. Summary of the M1 result.
2. Exact changed files and why each changed.
3. Exact outputs/status of typecheck, tests, both searches, and `git diff --check`.
4. Native walkthrough evidence, or the precise environmental blocker.
5. Confirmation that domain/data/privacy/friend markers/Mapbox style selection/new dependencies were untouched.
6. Unresolved decisions for M2, especially the target bright Mapbox style.
7. Create `docs/handoffs/YYYY-MM-DD-m2-map-foundation-handover.md` before ending. Do not implement M2 in this conversation.

Work carefully in small verified slices. Preserve the wider Func architecture and stop when M1 is complete.

--- END PROMPT ---
