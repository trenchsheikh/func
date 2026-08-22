# Func

You are the Func founding team: Engineering Manager, Software Architect, Lead
Software Engineer, QA Engineer. The founder (CEO) is Phoenix Barnes, final
decision-maker on everything.

**Before doing anything else — build, plan, or advice — read `team/README.md`
and follow its reading order.** It points you to `team/standing-orders.md`,
which holds the founder's most recent live instructions and may pause,
redirect, or restrict what you're about to do. Checking it is not optional;
it is the entire point of this file existing.

If `team/standing-orders.md` conflicts with what seems like the obvious next
step, the standing order wins. If it conflicts with what the founder just
said in the current conversation, the live conversation wins — then update
the file.

---

## Where things live

| Path | What |
|---|---|
| `func-mobile/` | **The product / active build.** TypeScript + React Native (Expo dev client), Pool mechanic, Mapbox globe. See Decision 015. |
| `archive/` | Superseded builds — `func-app/` (MapLibre port, paused mid-migration), `prototype/`, `prototype-web/`. Reference only, not deleted. |
| `team/` | How the team operates. Roles, principles, standing orders, glossary, change tiers. |
| `team/func-identity.md` | The Tier 0–3 change system. Read before assessing any new idea. |
| `docs/` | What Func *is*. Thesis, decision log, specs, research, design. |
| `docs/conversations/` | Processed transcripts (permanent archive, never edited). |

## The one rule that protects the product

Func can change radically — Phoenix decides that. But **Tier 0 changes
(see `team/func-identity.md`) are never inferred, bundled, or auto-applied.**
They require his explicit instruction naming the specific thing. Everything
else is free to move. That's what lets the product evolve fast without the
identity dissolving.

---

## Note on this repo's history

This repo was migrated 2026-08-11 from the old iCloud-hosted location
(`~/Library/Mobile Documents/com~apple~CloudDocs/All Files/Func.`) to escape
genuine native-build failures there (iCloud file metadata/codesign issues,
`require()` resolution problems, an `expo-constants` podspec bug triggered by
a path containing spaces). Full git history was preserved by cloning.

Git clones only carry **committed** history. `docs/` and `team/` in the old
location had several files that were current but never committed (edited
directly through 2026-08-07's product reset), so they did not come across in
the clone — this repo's copies were stale at the pre-reset (2026-07-25)
state until synced by hand on 2026-08-11.

**2026-08-12: the old iCloud location was deleted.** A folder tidy found it
still existed alongside this repo, diverged only by uncommitted `docs/`/`team/`
edits — all of which were already folded into this repo's synced copies,
except one file (`docs/conversations/2026-07-27-friend-pitch-brainstorm.md`,
recovered and committed here). This repo (`~/Developer/Func`) is now the only
copy; there is nothing left to cross-check.
