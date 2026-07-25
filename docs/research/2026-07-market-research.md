# Market Research — Social Nightlife Apps (July 2026)

Purpose: validate/refine the founder's product direction (Decision 003) before the
prototype spec is finalised. Conclusions feed `docs/PRODUCT_THESIS.md`.

## Finding 1 — Nightlife heatmaps are becoming table stakes, not a moat

At least six apps shipped live venue-crowd heatmaps in 2025–26, each launched
city-by-city:

| App | Angle | Footprint |
|---|---|---|
| Auro | Heatmap + crowd levels + AI nightlife assistant | US |
| Current | Venue-partnered live foot traffic ("packed / chill / dead") | US |
| HotSpot | Community-reported covers, waits, crowd ratios | US |
| Lines | Live video of queues + city buzz heatmap | London, Sydney, Melbourne, Brisbane |
| afterhours | Area-level liveliness heatmap | London |
| Crowds | Venue crowd levels + heat map | Philadelphia |

**Implications:** (a) demand for "where is it busy tonight" is validated; (b) the
heatmap alone cannot be Func's differentiator — it is our context layer; (c) every
competitor launches single-city first, which validates a Velmont-style density
narrative for the pitch.

## Finding 2 — Group-to-group is unowned, and the graveyard is an execution story

Tinder Social (2016–17) is the famous failure in groups-going-out. Post-mortems
attribute it to execution, not concept: it force-enrolled users and exposed Tinder
usage to their Facebook friends (privacy disaster), was bolted onto a 1:1 dating app
whose users often lacked available friends, and had no coherent usage pattern. No
current major player owns groups-meeting-groups.

**Implications:** build group features **opt-in and privacy-first**; build a
**standalone going-out product**, not a dating feature; design the group as the atomic
social unit from day one.

## Finding 3 — The why-now: dating-app fatigue → IRL wave (peaking now)

- 2025 survey data: more than half of Gen Z feels burned out "often or always" on
  dating apps — the highest of any age group; near-half of Gen Z is single and
  increasingly looking to meet IRL.
- Tinder launched IRL events + virtual speed dating (March 2026) — the incumbent is
  chasing this trend.
- The winners of the wave: Timeleft (dinners with strangers), Thursday (singles
  events), 222 (curated meetups), Breeze; Partiful added post-event mutual-crush
  reveals.
- Recurring line in 2026 coverage: users don't want more matches, they want more
  meetings.

**Implications:** Func is positioned with the wave, not against it. The strongest
differentiators are mechanics that *end in a real night out*, not in a chat. The
Partiful crush mechanic points at a superior dating design for Func V2: mutual-reveal
**after** co-attendance ("who did you actually meet last night?") rather than
cold swiping.

## Finding 4 — Monetisation is proven on the venue side

- Mobile-first nightlife ticketing (e.g. BuzzPass): tickets, cover charges, line-skip
  passes sold in-app on commission/revenue-share.
- Venues buy: promoted placement, dynamic pricing tooling, VIP/tiered packages, and
  analytics on attendance and spend.
- Consumer premium tiers exist across nightlife/dating apps but are secondary.

**Implications:** B2B2C model — free for users to build density; venues pay for
demand (promotions, ticketing rev-share, analytics). Consumer premium (e.g. early
event access, unlimited pool invites) only after liquidity exists.

## Net assessment

Founder's direction survives contact with the market, with one strategic reframe:
**the Pool (groups meeting groups) is the company; the heatmap is context; events are
the pipeline; dating is an outcome.** Nobody owns the group-first going-out graph, the
category's one famous failure was self-inflicted, and the IRL wave gives it a
credible why-now. Group-first is simultaneously the safety story (meeting as groups,
in public venues) — the answer to the investor duty-of-care question flagged in
Decision 003.

## Sources

- [TechCrunch — Tinder Social launches globally (2016)](https://techcrunch.com/2016/07/21/tinder-social-helping-friend-groups-plan-their-night-out-launches-globally/)
- [Photofeeler — What happened to Tinder Social](https://blog.photofeeler.com/tinder-social/)
- [The Dating Truth — Tinder Social failed](https://thedatingtruth.com/tinder-social-failed-duh/)
- [Bustle — Tinder Social is gone](https://www.bustle.com/p/is-tinder-social-gone-yes-but-here-are-other-dating-apps-to-try-with-friends-78549)
- [Auro](https://www.joinauro.com/) · [Current](https://apps.apple.com/us/app/current-nightlife-app/id6759845245) · [HotSpot](https://www.hotspotfinder.app/) · [Lines](https://play.google.com/store/apps/details?id=com.bondilines.app&hl=en_US) · [afterhours](https://apps.apple.com/gb/app/afterhours-london-nightlife/id6741483254) · [Crowds](https://apps.apple.com/us/app/crowds-nightlife/id1581473830)
- [TechCrunch — Tinder adds IRL events & speed dating (Mar 2026)](https://techcrunch.com/2026/03/12/tinder-tries-to-lure-people-back-to-online-dating-with-irl-events-virtual-speed-dating/)
- [CNBC — Dating apps dial up in-person events (2025)](https://www.cnbc.com/2025/03/26/dating-apps-are-dialing-up-in-person-events-as-gen-z-loneliness-persists.html)
- [Morning Brew — IRL meetup services woo dating-app defectors (Mar 2026)](https://www.morningbrew.com/stories/2026/03/19/irl-meetup-services-woo-dating-app-defectors)
- [nss G-Club — Dating-app fatigue and the return to IRL](https://www.nssgclub.com/en/lifestyle/43759/dating-app-fatigue-irl-dating-trend)
- [Ticket Fairy — Nightclub ticketing technology 2026](https://www.ticketfairy.com/blog/the-future-of-technology-in-nightclub-ticketing-shaping-the-nightlife-experience)
- [Dealroom — BuzzPass](https://app.dealroom.co/companies/buzzpass)
- [UrVenue — Venue monetisation technology](https://www.urvenue.com/news/smart-venue-monetization-technology/)
