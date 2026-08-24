# Privacy Model Migration — Stage 10: Documentation & Verification

**Date:** 2026-08-25
**Type:** Documentation/verification only, per Stage 10 of
`docs/superpowers/plans/2026-08-23-privacy-model-migration.md`. No feature
milestone started, no source under `src/`/`app/` touched.
**Repository:** `/Users/phoenixbarnes/Developer/Func`
**HEAD at time of writing:** `777b7921d4e94fb28a80eeccdfff28a5b107dffc` (Stage 9,
"close the module boundary — structural privacy tripwire", 2026-08-24)

## 0. Session constraints, stated up front

This session was explicitly instructed not to use iOS Simulator control,
Workflow, or subagents, and not to touch `Func-safe-map`, the protected
simulator UDID `1FFE46C0-5FAC-47E8-B09E-F10BB9425045`, port 8081, or any
pre-existing M1–M8 handoff/milestone file. All work below was done directly
(Bash/Read/Edit/Write), with no simulator interaction of any kind — including
for the native-build evidence in §3, which is reconstructed forensically from
filesystem artifacts rather than run or watched this session. That distinction
is called out explicitly in §3 rather than implied away.

## 1. README production-boundary warning (Stage 10 Step 1) — exact change

`func-mobile/README.md` already carried this change on disk (uncommitted) at
session start; verified word-for-word against Stage 10 Step 1's specified
text via `git diff -- func-mobile/README.md`. Full diff, reproduced exactly:

```diff
@@ -4,6 +4,16 @@ React Native (Expo SDK 57, TypeScript) prototype of **func**: a map-first
 night-out app. Fully mocked, in-memory data — no backend, no auth, no
 persistence. Every launch is the same pristine demo state.

+## ⚠️ Production boundary
+
+This remains a simulated prototype. Nothing in this design is production
+security. There are no real users and no real locations: identity is a
+seed constant, relationships and business verification are seeded
+simulations, and every check runs on the client. The build must not be
+used with real people or real positions until backend authentication,
+server-side redaction, government-ID and business verification, reporting,
+blocking, moderation, rate limits, and auditability exist.
+
 ## Run it

 ```bash
```

Matches the plan's specified banner text verbatim, no paraphrase.

## 2. Automated verification (Stage 10 Step 2)

Ran directly this session, from `func-mobile/`:

```
npm run typecheck
```
→ **1 pre-authorized error**, unchanged from the Stage 9 baseline recorded in
[[func-mobile-state]]:
```
src/data/__tests__/repository.test.ts(5,10): error TS2305: Module '"../../domain/liveStatus"' has no exported member 'livePinFor'.
```
`livePinFor` was removed at Stage 2 (`73eac7d`); this test file's import
becomes real when Stage 4 (`viewFor` projection) lands — not this stage's job.

```
npm test
```
→ **97/100**, 3 pre-authorized failures, all confirmed by direct re-run, not
assumed from memory:
1. `src/data/__tests__/repository.test.ts` — "business profile removes live
   status; switching back restores access" — `TypeError:
   (0 , import_liveStatus.livePinFor) is not a function`
2. `src/data/__tests__/repository.test.ts` — "live pins: off fades after 48h,
   premium never auto-sets dtf" — same `livePinFor` `TypeError`
3. `src/data/__tests__/views.types.test.ts` — `ReferenceError: card is not
   defined` at line 8. This file is a compile-only `@ts-expect-error`
   assertion file (`declare const card: InviteCardView; card.requests;`,
   header comment: "Compiled by `npm run typecheck` only — this file asserts
   shapes, it has no runtime"). `tsc --noEmit` validates it correctly and
   raises no error on it; the `npm test` glob also executes it as a runtime
   test file and it throws on the erased `declare const`, a pre-existing
   test-runner/file-purpose mismatch, not a regression.

```
git diff --check
```
→ **exit 0**, no whitespace errors, run from the repo root against the full
working tree (not just `func-mobile/`).

All three results match this session's pre-authorization exactly — no new
failure, no fixed-forward change made to any of the three.

## 3. Native build and launch — reconstructed evidence, not run this session

Per §0, this session could not invoke iOS Simulator control to build, launch,
or screenshot anything. What follows is independent forensic verification —
reading artifacts a prior native-build session left on this Mac's
filesystem — done because the task asked this evidence to be recorded, and
because [[func-engineering-engagement]]'s bar is "watch it work," not "assume
the code is right." Where I could not independently corroborate a claim from
disk, that is stated as a gap in §5, not papered over.

**Confirmed, with direct evidence:**

- **Target device:** `func-mobile/.expo/xcodebuild.log` (mtime 2026-08-24
  17:59:46) records the exact invocation:
  `xcodebuild -workspace .../func.xcworkspace -configuration Debug -scheme func
  -destination id=5AF60EA3-DE04-4883-93AC-707093299449` — the allowed iPhone
  17 Pro Max, never the protected `1FFE46C0-…`. The same device ID appears as
  `TARGET_DEVICE_IDENTIFIER` inside the matching Xcode `.xcactivitylog`
  (`~/Library/Developer/Xcode/DerivedData/func-diagwvxgsvrbevhhzfwayacrzzyy/Logs/Build/92C8348C-BD37-4C0D-A211-D2647499926D.xcactivitylog`).
- **Build result:** `.expo/xcodebuild.log` ends with `** BUILD SUCCEEDED **`.
  Exactly 2 warnings, 0 errors, found by exhaustive grep of the full log —
  `[CP-User] [Hermes] Replace Hermes for the right configuration` and
  `[Expo Dev Launcher] Strip Local Network Keys for Release`, both benign
  script-dependency-analysis notices, no privacy or functionality relevance.
- **Install:** `~/Library/Logs/CoreSimulator/5AF60EA3-…/MobileInstallation/mobile_installation.log.0`
  records `Install successful for (Developer:app.func.mobile)` at
  `Mon Aug 24 18:01:19 2026`, immediately following the build. The installed
  bundle (`.../Bundle/Application/9B638051-…/func.app`) has
  `CFBundleIdentifier = app.func.mobile`, `CFBundleShortVersionString = 0.1.0`,
  mtime `Aug 24 18:01:17`.
- **Launch / cold open:** the app's Data container
  (`.../Data/Application/9654BF94-…/`) shows real runtime activity starting
  within minutes of install and continuing for roughly 50 minutes:
  `Library/Application Support/.mapbox/deferred_delivery/*.db` at `18:04:42`
  (Mapbox SDK initializing — only happens once the map screen actually
  renders), a Metal shader cache (`Library/Caches/app.func.mobile/com.apple.metal/{functions,libraries}.{data,list}`)
  written at `18:54:39` (only generated when the GPU pipeline actually draws
  frames), `HTTPStorages`/`Cache.db` write-ahead-log activity through
  `18:54:35`, and a `Saved Application State` file consistent with the app
  having been foregrounded and backgrounded. No crash report for `func` in
  `~/Library/Logs/DiagnosticReports` or the simulator's own `CrashReporter`
  directory for this date (one retired crash exists, dated 2026-08-23, a day
  earlier, unrelated).
- **Protected resources confirmed untouched, both before and after this
  reconstruction:** `1FFE46C0-…` shows `Shutdown` in the current
  `xcrun simctl list devices` output (read-only listing only, no interaction
  sent). Neither port 8081 nor 8082 has a listener right now — expected, since
  no Metro process is active in this session; this session started no Metro
  and killed nothing.

**Not independently confirmed:** the exact Metro port (8082, per this
project's established convention and the plan's own Stage 10 Step 3
instruction) is not provable from the filesystem artifacts above — no
surviving log records the dev-server invocation itself, only the native
build/install/runtime side. Stated as a gap, not asserted as verified.

## 4. Cold-open evidence paths from existing scratchpads

Checked every session scratchpad directory under
`/private/tmp/claude-501/-Users-phoenixbarnes/` present on this Mac right now
(14 directories, spanning today's sessions). None contain screenshot or
evidence files — each is either empty or holds only this session's own
housekeeping (`tasks/*.output`). The specific path cited by the most recent
prior native walkthrough,
`docs/handoffs/2026-08-23-native-verification-reconciliation.md` §9
(`/private/tmp/claude-501/-Users-phoenixbarnes/f6409699-4a57-4df6-ab9a-5fcc1a2723be/scratchpad/native-verification/`,
19 numbered PNGs), **no longer exists on disk** — that session directory is
gone entirely, consistent with scratchpad being explicitly ephemeral/
session-scoped storage that gets cleaned up, not a durable evidence store.
No comparable screenshot set exists for this Stage 10 walkthrough either —
§3's evidence is filesystem-forensic, not visual. **This is a real residual
gap, not glossed over**: no image evidence survives for either the M-series
native pass or Stage 10's, only the reconstructible artifacts in §3. If
durable visual evidence matters going forward, screenshots need to be copied
out of scratchpad into the repo or another persistent location before the
session ends — noted here so it isn't rediscovered the same way next time.

## 5. Simulator-control blocker — remaining Stage 10 Step 3 walkthrough states

Stage 10 Step 3 specifies six things to walk through and screenshot on the
allowed device. Status of each, honestly:

| Walkthrough state | Status |
|---|---|
| Cold open | Circumstantially confirmed (§3) — app installed, launched, rendered (Mapbox + Metal activity), ran ~50 min, no crash. Not visually confirmed (no screenshot). |
| Map pins for eligible friends only (no Rosa/Kai/Amara-style non-qualifying pins) | **Not verified this session** |
| A venue glow with no visible number | **Not verified this session** |
| An area-redacted private invite showing "exact spot shared once the host accepts you" copy | **Not verified this session** |
| Switching demo persona and confirming the view changes | **Not verified this session** |
| Host-review-accept end to end | **Not verified this session** |
| Off immediately clearing your own pin | **Not verified this session** |

**Blocker, stated precisely:** this session was explicitly instructed not to
use iOS Simulator control. Since no MCP simulator tool call was made, none of
the six specific-state screenshots Stage 10 Step 3 calls for could be
captured or verified this session, and no such evidence survives from an
earlier session either (§4). Completing Stage 10 Step 3 in full requires a
future session with iOS Simulator control tools available, targeting only
`5AF60EA3-DE04-4883-93AC-707093299449` / Metro 8082 per the established
pattern, with screenshots copied out of the scratchpad into a durable
location before that session ends.

## 6. Protected resources — confirmed untouched this session

- `Func-safe-map` — never opened, read, or referenced by path; no command
  this session touched anything under that directory.
- Simulator UDID `1FFE46C0-5FAC-47E8-B09E-F10BB9425045` — only appeared in a
  read-only `xcrun simctl list devices` listing (confirms `Shutdown`); no
  screenshot, tap, boot, install, or launch sent to it.
- Port 8081 — only checked read-only via `lsof -nP -iTCP:8081`; nothing
  listening, nothing started or killed on it.
- Pre-existing M1–M8 handoff/milestone files — read only, for context; none
  edited.

## 7. Stage 11 — explicitly out of scope

Stage 11 ("Post-review hardening — reviewer findings R1–R7, re-review
blockers A–H") is, per the plan's own text, "deliberately unspecified here,"
pending either the actual addendum text from the `safe-map-pool` worktree's
review or explicit authorization to design it fresh (ADR-017 action item 4).
Nothing in this session started, scoped, or implied progress on Stage 11.

## 8. Commit

```
git add func-mobile/README.md docs/handoffs/2026-08-25-privacy-model-migration-verification.md
git commit -m "docs: production-boundary warning and migration verification record"
```

Only these two paths staged. All other modified/untracked files shown by
`git status` at session start (Stage 1–9 migration work, M1–M8-era
untracked files, the unrelated pre-existing `DECISION_LOG.md`/`selectors.ts`
diffs already flagged in earlier Stage 2 notes) are left exactly as found —
none of it belongs to Stage 10's own scope, and mixing it in would violate
this project's "commit only this stage's changes" convention.
