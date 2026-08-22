# Func Identity & Change Tiers

**Purpose:** let Func change radically without the identity dissolving.

The failure mode this prevents: every conversation adds ideas, the spec bloats,
each pitch describes a slightly different app, and eventually nobody — including
Phoenix — can say in one sentence what Func is. Decks generated from a drifting
spec are incoherent, and investors notice immediately.

The mechanism is **not** "block changes." Phoenix is the founder and can change
anything. The mechanism is: **make the weight of a change visible before it's
made**, so a radical change is a deliberate act rather than an accident that
accumulated from ten small edits.

---

## The four tiers

Every proposed change gets exactly one tier. The tier determines what has to
happen before it lands.

### Tier 0 — Constitution
*If this changes, it is a different product.*

*Updated 2026-08-22 — v4.0. See Decision 016 (safe by construction, additive) and Decision 012 (the v3.0 reset) for what changed and why.*

- **The line:** "Func is just a bridge between you and the opportunities of the
  night." Func shows you what is on and gets you in. It does not host the
  conversation, run the debate, or replace WhatsApp.
- **Map-first.** The map is the product's centrepiece and primary interface, not
  a feature inside it.
- **Func never rushes or tracks you.** No timers, no imposed schedule, no streak
  pressure, no voting. The map shows everything; you filter or search if you want.
- **Party size, not group objects.** There is nothing to create, name or
  administrate. "Out with 4" is an attribute of a request, like booking a
  restaurant.
- **Presence is opt-in, per night, and expires by itself.** Nobody is ever on the
  map without having turned it on for tonight.
- **18+ with government-ID verification**; women-first safety review of every social
  feature before it ships.
- **Safe by construction.** Every feature that connects people is built to resist scams
  and predatory behaviour, and ships only after that review. *(Added 2026-08-22,
  Decision 016 — founder: "the entire app needs to be extremely secure and trustworthy
  to prevent scams or creeps.")*
- **A night out is the success metric,** not time-in-app.
- **B2B2C: free for users, venues pay — but Func must work without any venue.**
  Promotion and connection only; no payments, no ticketing (Decision 013).

> **Superseded (v1.0–v2.1, retired 2026-08-07):** "Func is where your group finds
> tonight"; group-first as the unit of the product; aggregate-only heat with no
> individual ever visible; "groups are opt-in, always". Retained in the tracker
> with status `Superseded`, per the supersession rule.

**To change a Tier 0 item:** requires Phoenix's explicit, unambiguous instruction
naming the specific item. Never inferred from a conversation, never bundled with
other changes, never auto-applied. When one changes, the master spec gets a new
major version (v2.0, v3.0…), a Decision Log entry recording what the product was
before and after, and **every existing deck is marked stale** — because the story
they tell is no longer true.

### Tier 1 — Architecture
*Core systems. Reshaping these is real work but doesn't change what Func is.*

Map, Pool, Events, Sparks, Func ID / Profiles, Backing.

Adding, removing, merging, or fundamentally re-scoping one of these systems.

**To change:** Decision Log entry with options considered and rationale. Minor
version bump (v2.1). Decks regenerate.

### Tier 2 — Features
*Things inside a system. Free to add, change, or cut.*

Beacons, Group Lens, Call It, Convoy, Flares, Plan Flags, Night Tide, cost
breakdowns, account types, monetisation mechanics, etc.

**To change:** tracker row + status. No Decision Log entry needed unless it's
load-bearing for a Tier 1 system.

### Tier 3 — Detail
*Colour, copy, motion, naming, iconography, ordering.*

**To change:** just do it, note it in the tracker. Cheap and reversible.

---

## The supersession rule

**The master spec only ever states current truth.** It never accumulates
contradictory statements from different eras.

When something changes, the old version is **marked superseded, not deleted** —
it moves to the tracker with status `Superseded` and a pointer to what replaced
it. The spec itself always reads as one coherent, current description.

This is the difference between a spec that stays sharp and one that becomes an
archaeological dig. Decks generate from the spec, so the spec must never contain
two answers to the same question.

## The contested-idea rule

If a conversation contains genuine disagreement (two people arguing opposite
sides, or Phoenix contradicting himself), the output is **`Unresolved` with both
positions preserved** — never a smoothed-over synthesis that pretends consensus
existed. False consensus is how a spec ends up asserting something nobody
actually decided.

## The idea-provenance rule

Every item in the tracker carries where it came from (which conversation, which
date). When an idea resurfaces in a later conversation, it does not become a new
row — it **strengthens the existing row** and the recurrence is noted. Ideas that
keep coming back are signal; ideas mentioned once in passing are not.

---

## Version header

The master spec carries a version and a date at the top. Format:

```
Version 2.1 — 2026-07-27
Tier 0 last changed: never (v1.0 baseline, 2026-07-24)
```

Any deck records which spec version it was generated from. When the spec's major
version increments, every deck built from an earlier major version is stale by
definition.
