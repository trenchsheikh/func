# Func — Product Thesis

*One page. If this stops being true, we change the product, not the page.*

**Version 3.0 — 2026-08-07.** Tier 0 last changed: 2026-08-07 (Decision 012).
Every deck generated before this date is stale.

## The line

**Func is just a bridge between you and the opportunities of the night.**

Func shows you what is actually on, and gets you in. It does not host the
conversation, run the debate, or replace WhatsApp.

("Func" = *function* = the party. The name is the category.)

## The problem

Deciding what to do tonight means checking Instagram, TikTok, Google, group chats,
Eventbrite, club sites and promoter DMs — and still not knowing what a place is
actually like right now, what it really costs, or whether anyone you know is there.
The information exists; it is scattered across apps that were built for other jobs.

## The product

1. **The map** (the centrepiece). Real streets, rendered in Func's own language.
   Live heat shown as **glow only** — no numbers, no claims it cannot back. Venues
   with what they cost, what the night is, and live stories posted from inside.
   Friends and mutuals if they chose to be visible tonight.
2. **Browse.** One swipe surface for anything on — dinner, bars, clubs, table
   offers, after-parties, local spots, and people who are out. For when you cannot
   be bothered with the map.
3. **The traffic light.** 🟢 DTF · 🟠 casually looking · 🔴 not out · 🪩 premium ·
   🥇 business. Everyone's state is legible, so nobody wastes anybody's time. It is
   also, almost for free, the recommendation engine.
4. **Access.** Request → the host accepts → you get a pass. Party size is just a
   number on the request, like booking a restaurant.
5. **The pet.** A cute disco creature that lives on your map, follows you through
   the night, and genuinely helps. The thing people screenshot.
6. **Afters.** After midnight the app changes personality — darker, looser,
   camera-first. After-party addresses are revealed only when the host accepts you.

## What Func refuses to do

- **Never rushes or tracks you.** No timers, no imposed schedule, no streaks, no
  voting mechanics. You are never being herded.
- **Never takes your money.** Promotion and connection only — no payments, no
  ticketing. Func must work without depending on a single venue.
- **Never puts anyone on the map who did not turn it on for tonight.**

## Why now

Discovery for going out is still split across apps that were built for other
things, and Gen Z is measurably tired of being manipulated by all of them. An app
whose entire pitch is *we show you what's on and get you in, then get out of your
way* is a genuinely different posture.

## Business model

B2B2C. Free for users; density first. Promoters and venues get business accounts —
post events and table offers, accept requests, message people who requested, and pay
for visibility. Consumer premium (the disco ball) sells being seen more, unlimited
requests, seeing who wants you, and early access. City by city: **San Francisco and
Los Angeles first.**

## Riskiest assumptions (in order)

1. **Differentiation.** Without group-first, the moat is the map, the traffic light,
   the pet and the brand. "Why can't Instagram or Google Maps do this?" needs a
   sharper answer than we currently have. *(Accepted knowingly — Decision 012.)*
2. Enough people set a traffic light honestly for it to mean anything.
3. Hosts and promoters actually accept requests fast enough for the loop to feel live.
4. We can seed one city to density before a funded copycat.
5. Moderation and ID-verification costs survive at student price points.

## Current status

Pre-launch. The investor/developer prototype is **built and running** in
`prototype-web/` — real San Francisco geometry, the full night arc from the eye-and-globe
open through to afters.

---

**Note (added 2026-08-11, engineering sync):** the product has since moved past this
prototype into `func-app/` (TypeScript + React Native, Stages 0–5 + MapLibre
delivered). `func-app/HANDOVER.md` is the current engineering state. One point above is
superseded there under explicit founder direction: **Afters mode was removed entirely**
on 2026-08-09 — "func behaves identically at 9pm and 3am." After-parties themselves
stayed and became permanently visible; the mode wrapper (personality shift, toggle,
nudge banner) did not. See `func-app/HANDOVER.md` §2 and `team/standing-orders.md`.
