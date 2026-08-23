# Handover — Func Visual North Star to First Sonnet Development Session

**Date:** 2026-08-23
**Recipient:** Claude Sonnet 5, when available
**Repository:** `/Users/phoenixbarnes/Developer/Func`
**Active product:** `/Users/phoenixbarnes/Developer/Func/func-mobile`
**Mode:** Discovery and architecture planning first; implementation only after review

## Founder intent

Func is not trying to copy Bump, Partiful, Snap Map, Find My, Google Maps, or Beli. It is building a premium black/chrome instrument around a bright, living, map-first city experience.

The approved visual thesis is:

> Func is a bright, living city map held inside a premium black-and-silver instrument.

Read the full source of truth before making recommendations:

1. `CLAUDE.md`
2. `team/README.md` and its required reading order
3. `team/standing-orders.md`
4. `team/func-identity.md`
5. `team/operating-principles.md`
6. Decisions 012–016 in `docs/DECISION_LOG.md`
7. `docs/PRODUCT_THESIS.md`
8. `docs/superpowers/specs/2026-08-23-visual-north-star-design.md`
9. `func-mobile/README.md`
10. the active `func-mobile` domain, repository, map, UI, profile, invitation, and test files
11. archived builds only as reference, never as current product truth

## Your first task: Visual Foundation Audit

Do not start by redesigning screens. Do not start by installing libraries. Do not start by inventing a new architecture.

First inspect the active build and produce a written audit with exact file references:

1. What is currently built, stubbed, or absent for the visual north star?
2. Where are the current seams for theme tokens, typography, map style, marker rendering, event cards, profiles, motion, haptics, sound, loading, and accessibility?
3. Which existing domain/data boundaries must remain untouched?
4. Which current visual choices conflict with the approved north star?
5. What is the smallest safe sequence of implementation stages?
6. Which decisions are still genuinely unresolved and must return to Phoenix?

Return:

- a current-state table: area / evidence / gap / proposed seam / risk
- an architecture map of the active build
- a staged implementation plan with independently testable milestones
- a list of exact files likely to change per milestone
- verification commands and native walkthrough checks
- explicit non-goals and “do not touch” boundaries
- a proposed next-session handover

Do not write source code during this first task unless a tiny read-only diagnostic requires it. Do not modify the reviewed `safe-map-pool` worktree. Do not claim the prototype is production-secure.

## Non-negotiable product and visual constraints

- Map first; Browse is secondary.
- Bright, readable map at every hour; no forced night/afters mode.
- Venue/events first; visible friends second; anonymous live glow third.
- World → city → street map scale must be continuous.
- Visible friends persist across zoom, but precision degrades with zoom-out; clusters resolve to individual photos as users zoom in.
- Casual and Off privacy rules remain binding; mutuals never become identifiable person pins.
- Venue/event markers use consistent category forms with event-specific skins.
- Visible friend = profile photo + emerald heartbeat halo.
- Premium = same heartbeat + permanent neutral-silver chrome ring.
- Interface = true black, dark glass, neutral liquid-silver chrome, controlled electric palette.
- Emerald is reserved for genuinely live energy/actions.
- Event information is formal and readable; candid/high-energy imagery is secondary.
- No emoji glyphs as interface iconography; no mascot; no forced slang.
- Motion is springy; micro interactions fast, hero transitions slower.
- Sound/haptics enhance but never replace visual feedback.
- Every colour state has a non-colour cue.
- Reduced-motion mode uses fades/state changes.
- The prototype is simulated and must not be described as production-secure.

## Architecture guardrails

- Preserve `src/domain/` for pure rules.
- Preserve `src/data/` as the raw-state and safe-view projection seam.
- Preserve `src/ui/` and `app/` as renderers of allowed views.
- Do not move privacy decisions into screens.
- Do not duplicate status or visibility logic in individual components.
- Do not reach past the existing viewer projection boundary to obtain data.
- Add shared tokens/primitives before broad screen-specific styling.
- Prefer small, independently verifiable slices over a broad visual rewrite.
- Keep each development session bounded. End with changed files, checks run, evidence, unresolved decisions, and the next-session prompt.

## Recommended development sequence after audit approval

1. shared visual tokens and materials
2. map foundation and multi-scale transitions
3. marker and clustering system
4. event cards and Browse rows
5. personal profiles and optional linked business pathway
6. motion, sound/haptic hooks, loading, onboarding hints, and accessibility
7. integration, performance, native walkthrough, and visual QA

Do not proceed to the next stage until its acceptance checks pass and the handover is written.

## Session discipline

- One bounded objective per session.
- Read the current handover and the relevant source files before acting.
- Keep implementation plans and source edits separate when the design is still under review.
- Use a fresh chat when the current context becomes large, after a milestone, or when unrelated concerns begin to mix.
- The outgoing session must write a handover containing: objective, decisions, evidence, files changed, commands/results, remaining risks, and the exact next prompt.
- Never silently change Tier 0 or Tier 1 product rules.

## Definition of success for this first session

The first session succeeds when Phoenix has a trustworthy, evidence-backed, file-level plan for the visual foundation and can see exactly how it protects Func’s wider product vision. A pile of attractive screen edits without this audit is not success.
