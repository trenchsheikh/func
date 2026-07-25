# Func — Product Thesis

*One page. If this stops being true, we change the product, not the page.*

## The line

**Func is where your group finds tonight.** The going-out app for people who move in
packs: see where the city is alive, find another group to join forces with, and end
the night with people you actually met.

("Func" = *function* = the party. The name is the category.)

## The problem

Going out is a group activity, but every social app is built for individuals. A group
of mates has three unsolved problems on a Saturday: **where is actually good tonight**
(reviews are stale, stories are ads), **who else is out** (their wider social graph is
invisible), and **how to meet new people without the weirdness of cold 1:1 approaches**
(dating apps produce chats, not nights out — and most of Gen Z reports being burned
out on them).

## The product

1. **Map** — live, aggregate-only heat of the city's nightlife. Context layer and
   single-player utility: useful on day one with zero friends on the app (venue data,
   events, crowd signals), which is our answer to cold-start.
2. **Pool** (the hero) — your group posts an open invite ("4 of us, Arches, Saturday")
   or browses other groups'. Group accepts group; Func suggests the venue/event.
   Meeting as groups in public venues is simultaneously the product mechanic *and* the
   trust & safety architecture.
3. **Events** — the pipeline of reasons to go out; where venues pay us (promotion,
   ticketing rev-share, line-skip).
4. **Sparks** (dating) — deliberately downstream of real life: after your groups met,
   mark who you'd see again; mutual = match. More meetings, not more matches. (The
   prototype demos a classic swipe deck for legibility; the post-night mutual-reveal
   is the V2 design.)
5. **Profiles** — public by design, verified badges, group-affiliated.

## Why now

Dating-app fatigue is measurably peaking; the IRL-social wave (Timeleft, Thursday,
222) is the fastest-growing consumer social category; incumbents are pivoting toward
events; live nightlife heatmaps have been validated by half a dozen single-city
launches. Nobody owns groups-meeting-groups — the one famous attempt (Tinder Social)
died of self-inflicted privacy and positioning wounds, documented in
[research](research/2026-07-market-research.md).

## Business model

B2B2C. Free for users (density first). Venues pay: promoted placement on the map,
event ticketing revenue-share, cover/line-skip passes, demand analytics. Consumer
premium tier later (unlimited pool invites, early event access). City-by-city
playbook — win one city's Saturday night, then replicate.

## Non-negotiable design constraints

- **Aggregate-only heat.** No individual's live location is ever visible. Ever.
- **Groups are opt-in, always.** No auto-enrolment of your friends (Tinder Social's
  fatal mistake).
- **18+ with real age verification** at launch (third-party ID check); women-first
  safety review of every social feature before it ships.
- **A night out is the success metric,** not time-in-app. We optimise for closed
  loops: invite → accept → attended.

## Riskiest assumptions (in order)

1. Groups will post/accept open invites from strangers (liquidity of the Pool).
2. We can seed one city to critical density before copycats with funding do.
3. Venues will pay for demand they can measure.
4. Verification + moderation costs don't break unit economics at student price points.

## Current status

Pre-launch. Deliverable in progress: pitch-ready prototype ("Velmont" demo) — see
[prototype spec](specs/prototype-spec.md).
