# Func M1 Visual Foundation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Establish Func’s shared black/glass/chrome visual foundation and remove active emoji iconography without changing domain behavior, privacy behavior, navigation, or map data.

**Architecture:** Keep `src/domain/` as pure product rules and `src/data/` as the repository/snapshot seam. Add visual semantics only in `src/ui/` and `app/`, with reusable primitives consuming shared theme tokens so later map markers, event cards, and profiles do not invent their own materials.

**Tech Stack:** Expo SDK 57, React Native, TypeScript, existing SVG icon primitives, existing theme/component structure, Jest/React Native tests, iOS native walkthrough.

## Global Constraints

- Do not edit `func-mobile/src/domain/` or `func-mobile/src/data/`.
- Do not add dependencies or modify `package.json`.
- Do not implement M2 bright Mapbox styling.
- Do not implement M3 visibility projection, friend markers, heartbeat halos, clustering, or permanent premium rings.
- Do not touch `/Users/phoenixbarnes/Developer/Func-safe-map`.
- Preserve existing information hierarchy and formal event copy.
- Replace interface emoji glyphs with SVG/icon components.
- Validate with typecheck, tests, targeted searches, native walkthrough, and `git diff --check`.

---

### Task 1: Baseline and boundary

**Files:** Read the current theme, primitives, icons, invite bits, map pins, create screen, avatar, disco ball, and logo files. Modify none.

- [ ] Run `git status --short`, `git branch --show-current`, and `git log -1 --oneline` from the repository root.
- [ ] Run `npm run typecheck` and `npm test` from `func-mobile`; record the baseline.
- [ ] Run `rg -n '🔒|🪩|📍|🌃|🎤|🍸|🌅|🎧|🔥|🍕' src app` and `rg -n '#16161a' src app`; record exact matches.
- [ ] Confirm that no unrelated working-tree changes will be staged.

### Task 2: Shared visual tokens

**Files:** Modify `func-mobile/src/ui/theme.ts` only.

- [ ] Inspect all current imports so existing theme exports remain compatible.
- [ ] Add named semantic roles for near-black surfaces, dark glass, chrome/silver tiers, electric accents, borders, highlights, and readable text hierarchy.
- [ ] Keep the existing theme object/export convention; do not create a second theme system.
- [ ] Run `npm run typecheck` from `func-mobile`; expected result: PASS.

### Task 3: Shared glass/chrome primitives

**Files:** Modify `func-mobile/src/ui/components/Primitives.tsx`; modify `theme.ts` only if needed.

- [ ] Follow the existing primitive prop and export conventions.
- [ ] Add `GlassCard` that renders children unchanged, accepts the existing style convention, and consumes glass tokens.
- [ ] Add `ChromeSurface` that renders children unchanged, accepts the existing style convention, and consumes chrome tokens.
- [ ] Keep both primitives visual-only; they must not imply premium entitlement, DTF status, navigation, or identity behavior.
- [ ] Run `npm run typecheck`; expected result: PASS.

### Task 4: SVG icon cleanup

**Files:** Modify `func-mobile/src/ui/components/Icons.tsx`, `InviteBits.tsx`, `src/ui/map/Pins.tsx`, and `app/(tabs)/create.tsx`.

- [ ] Add only the SVG variants needed for the current lock, disco-ball, invite-cover, and placement-crosshair affordances.
- [ ] Remove emoji-cover glyph data from `InviteBits.tsx` without changing invite copy or data behavior.
- [ ] Replace lock/disco-ball emoji rendering in `Pins.tsx` only; preserve all current identity/status/ring behavior.
- [ ] Replace the create-screen placement crosshair emoji with an SVG/icon and accessible label.
- [ ] Run `rg -n '🔒|🪩|📍|🌃|🎤|🍸|🌅|🎧|🔥|🍕' src app`; expected result: zero matches.
- [ ] Run `npm run typecheck`; expected result: PASS.

### Task 5: Safe hardcoded-token cleanup

**Files:** Modify `func-mobile/src/ui/components/Logo.tsx`; modify `Avatar.tsx` and `DiscoBall.tsx` only where a safe token replacement is demonstrated.

- [ ] Replace audit-identified `#16161a` values with semantic tokens; preserve logo geometry and accessibility.
- [ ] Do not alter avatar identity semantics, status logic, premium ring entitlement, or animation behavior.
- [ ] Leave a file unchanged if no safe M1 token replacement is needed; record that decision.
- [ ] Run `rg -n '#16161a' src app`; expected result: zero matches.
- [ ] Run `npm run typecheck`; expected result: PASS.

### Task 6: Verification and M2 handover

**Files:** Create `docs/handoffs/YYYY-MM-DD-m2-map-foundation-handover.md` after M1 is complete. Do not modify M2 files.

- [ ] Run `npm run typecheck` and `npm test` from `func-mobile`; both must pass.
- [ ] Run both targeted `rg` searches; both must return zero matches.
- [ ] Run `git diff --name-only` and confirm no domain/data/dependency paths appear.
- [ ] Run `git diff --check`; expected result: no output and exit code 0.
- [ ] Perform the required iOS native walkthrough if supported; record actual evidence or the exact environment blocker.
- [ ] Write the M2 handover with M1 evidence, the unresolved bright Mapbox style decision, exact M2 scope, and a stop-before-M3 instruction.
- [ ] Stage exact M1 files only, inspect the staged diff, and commit with a focused message such as `feat: establish Func visual foundation`.

## Self-review

- [ ] No domain/data/privacy behavior changed.
- [ ] No Mapbox style was selected.
- [ ] No friend markers, halos, clustering, or premium entitlement logic was added.
- [ ] Event information remains more legible than decoration.
- [ ] All checks and native evidence are recorded before the session ends.
