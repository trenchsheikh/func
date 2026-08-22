# Func. — Context Handoff + Product Requirements

**Written 2026-08-07.** Hand this to a fresh session as the starting point.
It contains everything decided so far, what is built, and where to push next.

> **Read this first, then `Func/CLAUDE.md` → `team/README.md` → `team/standing-orders.md`.**
> Standing orders can pause or redirect what you are about to do.

---

# PART 1 — CONTEXT

## Who you are working with

**Phoenix Barnes** — founder and CEO of Func, on a gap year (2025–26), based in the UK.
Final decision-maker on everything.

- **He does not read code.** Explain what is right and what is wrong plainly, and say
  which one you think it is. Never soften a correction into a compliment.
- **He has ADHD.** One obvious next action beats a comprehensive list. Keep responses
  scannable. Do the work rather than describing the work.
- **He wants directness and ambition.** His words: *"Do not accept mediocrity make every
  aspect impressive, desirable and easy to use."* He believes Func will be *"the next
  pillar in social media"*. Take that seriously; do not flatter it.
- **He wants to be asked.** He explicitly asked to be consulted on every feature before
  building. Eight rounds of structured questions produced the decisions below — that
  process worked and is worth repeating for anything new.
- **Collaborator:** Micha / Michail, involved in ideas (the pet concept) and previously
  the intended route for prototype UI art.

## The repo

`/Users/phoenixbarnes/Library/Mobile Documents/com~apple~CloudDocs/All Files/Func/`

⚠️ **It is in iCloud Drive. Shell listings lie.** Files can be cloud-only placeholders —
tracked by git and readable by file tools, but invisible to `ls`. A directory that looks
empty may be full. On 2026-07-27 a session ran `ls team/`, saw nothing, assumed the folder
was lost, and overwrote five files. **Never conclude a file is missing from a shell
listing.** Use the file tools; check `git status`.

| Path | What |
|---|---|
| `docs/DECISION_LOG.md` | Decisions 001–016. **The source of truth for direction.** |
| `docs/PRODUCT_THESIS.md` | One-page thesis, v4.0 |
| `docs/PRD.md` | This file |
| `docs/RAW_IDEAS.md` | Every raw idea, logged verbatim, with status |
| `team/func-identity.md` | The Tier 0–3 change system. Read before assessing any idea. |
| `team/standing-orders.md` | Live founder instructions. Checking it is not optional. |
| `prototype-web/` | **The live prototype.** Real code. |
| `prototype/` | Old Expo prototype. Superseded — do not build on it. |
| `inbox/` | Drop zone for assets and transcripts |

## The governance rules that actually matter

1. **Tier 0 changes are never inferred, bundled, or auto-applied.** They require Phoenix's
   explicit instruction naming the specific thing. A Tier 0 change forces a new major spec
   version, a Decision Log entry recording what the product was before and after, and
   **marks every existing deck stale**.
2. **Contested ideas are preserved, not smoothed over.** If Phoenix contradicts himself,
   record both positions and put the conflict to him directly. Do not synthesise.
3. **Live conversation outranks a standing order** — then update the file.
4. **Write, don't advise.** If the output is a document, create the file.

## What happened in the session that produced this

1. Phoenix shared a Figma Make prototype and said it felt *"boring and generic... not a
   professional app feel"*.
2. Audit found it had drifted from the repo spec into a different product — individual and
   dating-first, a stock CartoDB basemap, emoji as the icon set, and two direct Tier 0
   violations (a "Friends" map layer showing individual locations, and a raw vouch count).
3. Eight rounds of structured questions established the product below — including a
   **Tier 0 change** (group-first retired).
4. The prototype was rebuilt from scratch as real code in `prototype-web/`.
5. A second round of feedback shifted the visual identity to **chrome on black** and set
   the base map direction to **MapLibre**.

---

# PART 2 — PRODUCT REQUIREMENTS

## The line

> **"Func is just a bridge between you and the opportunities of the night."**
> — Phoenix, 2026-08-07

Func shows you what is actually on, and gets you in. It does **not** host the conversation,
run the debate, or replace WhatsApp.

Ambition, in his words: *"a sophisticated hub for the entire world to feel connected to the
opportunities around them. not just some cheap app to access events."*

("Func" = *function* = the party. The name is the category.)

## The problem

Deciding what to do tonight means checking Instagram, TikTok, Google, group chats,
Eventbrite, club sites and promoter DMs — and still not knowing what a place is actually
like right now, what it really costs, or whether anyone you know is there. The information
exists; it is scattered across apps built for other jobs.

## Principles — what Func refuses to do

These are load-bearing. Breaking one is a product change, not a detail.

1. **Func never rushes or tracks you.** No timers, no imposed schedule, no streaks, no
   voting. Phoenix on why he rejected both a time-morphing map and a night timeline:
   *"it means you have no commitment to the app - you dont feel tracked or rushed at all."*
   He values that. The map just shows everything; you filter or search if you want.
2. **No voting, ever.** *"no voting on the app for things to do thats dumb - people use
   other apps to communicate."*
3. **Func never takes your money.** Promotion and connection only — no payments, no
   ticketing. *"I want func. to be able to work without depending on clubs or venues."*
4. **Nobody appears on the map who did not turn it on for tonight.** Opt-in, per night,
   self-expiring.
5. **Emerald means life.** The interface is chrome; the only coloured thing in the entire
   app is the city being alive. If everything is coloured, nothing means anything.
6. **No emoji as iconography, anywhere.** This was the single loudest "AI prototype" tell
   in the version Phoenix rejected.

## ⚠️ TIER 0 — the constitution (do not change without Phoenix naming the thing)

- The line: **Func is a bridge to the opportunities of the night.**
- **Map-first.** The map is the centrepiece and primary interface, not a feature inside it.
- **Never rushes or tracks you.**
- **Party size, not group objects.** *"no groups. forget about that. any group system might
  just create extra noise which deters people from wanting to use func."*
  Resolved as: groups are a *number on a request*, like booking a restaurant —
  "out with 4, looking for a table". Nothing to create, name or administrate.
- **Presence is opt-in, per night, and expires by itself.**
- **18+ with government-ID verification.** Women-first safety review of every social feature.
- **B2B2C: free for users, venues pay — but Func must work without any venue.**

### What the Tier 0 change retired (2026-08-07, Decision 012)

Pool · Call It · In/Nah voting · Plan Flag · Convoy · the 10-minute auto-lock · the old line
*"Func is where your group finds tonight"*. **Backing/vouches are deferred, not deleted** —
*"We can fine tune vouches another time once the app is built."*

**Cost Phoenix accepted knowingly:** market research had positioned the moat as "nobody owns
groups-meeting-groups." That moat is gone. The differentiators are now the map, the traffic
light, the pet and the brand. **This remains the sharpest open question** — see Part 4.

## Users

- **Primary:** 18–25, going out in San Francisco and Los Angeles. Launch cities, in dollars.
- **Secondary:** promoters and venues, via business accounts.
- Phoenix on user motivation, verbatim: *"stories show the vibe youre on to others and
  profiles prove you are real and show who you are to others. A good profile = easier to
  see girls for example."* Take this at face value — it is a real driver of the category
  and the product should serve it honestly rather than pretend otherwise.

## Structure — five tabs, map dead centre

`Browse · Plans+Chats · MAP · Inbox · Profile`

Phoenix's words: *"map (middle - app revolves around this), swipe/browse, profile, inbox +
notifications (email style), chats + plans page."*

## Features

### 1. The map — the centrepiece
- Real streets, rendered entirely in Func's own language. **Never a stock basemap.**
- **Heat shown as glow only.** No numbers, no words on the map itself. Phoenix chose this
  knowing the legibility trade-off; the words live in the venue sheet.
- Venues with cost, vibe, and live stories posted from inside.
- Friends and mutuals (friends-of-friends) if they chose to be visible tonight.
- Local spots, after-parties (in afters mode), and the pet.
- **Must be detailed when you zoom in** — buildings, texture, real geography.
- **Must feel physically alive** — *"way more animated with physical activity and things to
  do creating a physical change to the map of some sort like building popping up and the
  glow."* Currently only half-delivered.
- **Zooming out shows more city.** Never yanks you to the globe. Standard map behaviour.
- The globe is reachable deliberately (button or deep pinch-out) and shows every Func city.

### 2. Browse — swipe for anything
*"a page where you can swipe for literally anything from cool dinner spots to after parties
and hang outs. You set the filter and the app's future algorithm will recommend too based on
age, profile type (traffic light profile system) and you can swipe through looking for things
to do when you cant be bothered to use the map."*
Cards cover: venues, tables, after-parties, local spots, and green-status people.

### 3. The traffic light (canonical — Phoenix's exact definition)
- 🟢 **Green** = DTF (down to func) — down to do anything, on the app to have fun
- 🟠 **Amber** = checking things out casually, not ready to commit
- 🔴 **Red** = inactive, not out at all
- 🪩 **Disco ball** = premium account (super DTF)
- 🥇 **Gold disco ball** = business account *(he flagged this as not fully decided)*

This is also, almost for free, the recommendation engine — a green user at 11pm should see a
visibly different city than an amber one.

### 4. Access — the commitment mechanic
**Request → host accepts → pass.** Party size is just a number on the request. Money changes
hands at the door; Func never touches it. The accept is one of the four dopamine moments.

### 5. Stories
Postable from anywhere, but posts genuinely from inside a venue get a **verified mark** and
appear on that venue. Attached to both the person and the place.

### 6. Profile
Photos + traffic light + bio (with Instagram link) + **government-ID verification**. Tokens.
Vouches deferred. Keep it simple — this is what he asked for.

### 7. After-parties
**The address is revealed only when the host accepts you.** Safety and exclusivity in one
mechanic, and the accept lands like a hit.

### 8. Afters mode
After midnight the app visibly changes personality — darker, looser, camera-first.

### 9. Local spots + tokens
Anyone drops a spot; they earn tokens when people actually visit it. Turns local knowledge
into currency and gives Func something to do on a Tuesday.

### 10. Night rating
Quick, private-feeling. Feeds the map's accuracy rather than being a public review — Func
should not pick a fight with Google Maps and TripAdvisor.

### 11. The pet — "a very cute and friendly disco creature"
*"micha and i were playing around with the idea of having a customisable pet that doubles as
an ai assistant - a super helpful and intelligent assistant that is a genuinely impressive
model but also fun and jumps around the screen with you and follows you on the map maybe -
just a fun idea right now not complete."*
Lives on the map, follows you through the night, reacts, genuinely helps. Customisable.
Build it properly or not at all — Duolingo owl, not Clippy.

### 12. Business accounts
Post events and table offers · see and accept requests · message people who requested ·
pay for visibility. Phoenix: *"once func. is big event managers and clubs will want func. to
promote whatever they like."*

### 13. Premium (disco ball)
Be seen more · unlimited requests · see who wants you · early and exclusive access.

## Deferred, not deleted

Concierge subscription ladder · paid local-knowledge answers · calendar integration ·
Backing/vouches · the time-of-night morphing map · the night timeline · bottle-service map
markers. Phoenix on the map/timeline: *"start with neither and then we can build up from
there"* — he wants them back later.

## Design system

- **Chrome / liquid metal on true black.** Sophisticated, cinematic, Apple-premium.
- **Emerald only for life** — heat, traffic light, live stories. Nothing else is coloured.
- **The eye is the motif.** Official logo: chrome `func.` lockup with an eye replacing the
  "n", and a little person with arms raised whose head is the pupil.
- Condensed uppercase display type + a clean UI sans.
- **Zero emoji as iconography.** Custom icon set.
- Real spring physics on every gesture. Nothing linear, nothing instant.
- Designed empty, loading and pressed states.

## The opening animation — must be followed closely

Phoenix supplied a six-beat storyboard and said it *"must be copied as closely as possible in
terms of storyline and featured animation points."* He called it vital: *"func.'s image is
what will make it rise to the top immediately."*

1. **Home Screen** — the func. app icon on the home screen
2. **Logo Appears** — app opens to black, the chrome func. logo appears
3. **Into the Eye** — the letters smoothly retract into the pupil, becoming one
4. **Blink & Transform** — the eye blinks, the pupil becomes planet Earth
5. **Expand & Zoom** — Earth fills the screen, zoom rapidly toward the city
6. **Live Map** — land in the city, the live map appears

## The demo — one whole night

Phoenix: *"For the pitch we will go through the whole night e.g. starting off with early
drinks/dinner then bar then club then after the club looking for a group of people hosting
after party."*

Audiences: **investors** (must believe the vision) and **app developers** (must understand
the depth of what they would build). Delivered as a **shareable link** that opens
full-screen on a phone.

### The four dopamine moments — all built to full quality
1. The open — eye → globe → dive, the city lighting up beneath you
2. Getting accepted — the pass materialising, with weight and haptics
3. The swipe — fast, physical, real spring throws
4. Watching the city go live — heat rising, stories appearing, friends turning green

---

# PART 3 — WHAT IS BUILT

`prototype-web/` — real code, no build step, no dependencies.

```bash
cd "$HOME/Library/Mobile Documents/com~apple~CloudDocs/All Files/Func/prototype-web" && python3 -m http.server 8778
```

| File | What |
|---|---|
| `index.html` | Shell |
| `styles.css` | Design system — chrome tokens, type, components |
| `data/sfmap.js` | Real SF geometry: streets, water, parks, **3,449 buildings with heights** |
| `data/seed.js` | Real venues at real coordinates, people, stories, tables, after-parties |
| `app.js` | Map renderer, camera, opening animation, the pet, router |
| `screens.js` | Venue sheet, browse deck, request→pass, afters, profile, globe |
| `build_map.py`, `build_bld.py` | Regenerate map data from OpenStreetMap |

**Verified working by clicking through:** the opening (all six beats), the map with heat and
extruding buildings, the venue sheet, request → "You're in" → QR pass, Browse swipe deck,
Profile, the globe screen.

**Built but not clicked through:** Plans, Inbox, the story reel, Afters mode, rate-the-night.
No console errors.

`FUNC.replayOpen()` in the console re-runs the opening animation.

---

# PART 4 — WHERE TO TAKE IT NEXT

Phoenix asked for this handoff to *"take this in a slightly different direction (making it
better)"*. Treat Tier 0 as fixed and everything else as open to being made better.

## Committed next steps

1. **MapLibre + a custom Func style.** Phoenix's call. Use **OpenFreeMap** for tiles — free,
   no API key, no billing account. Gives global coverage, native 3D building extrusions and
   standard zoom. Explicitly **not** Google Maps: it needs billing and cannot be
   art-directed far enough — it would look generic again, which is the original complaint.
2. **Real logo assets.** Phoenix is dropping the official chrome logo and app icon into
   `inbox/`. Use the real artwork for icon and splash; keep vector only where it animates.
3. **Make the map physically alive.** Currently buildings rise and heat glows, but nothing
   *moves*. This is an explicit, unmet request.

## Known gaps

- The chrome identity is applied to the map, tab bar, buttons and sheets, but not yet
  everywhere.
- The Earth in the opening is stylised vector, not photoreal.
- The pet is charming but does not yet do anything genuinely intelligent.

## The open strategic question — worth solving properly

Without group-first, the honest answer to **"why can't Instagram or Google Maps just do
this?"** is the map, the traffic light, the pet and the brand. That is defensible —
Snapchat won on less — but investors will ask it directly and the deck does not have a
sharp answer. Phoenix accepted this knowingly. **Sharpening it is probably the highest-value
strategic work available**, and a good candidate for the "slightly different direction".

Places worth pushing, none of them agreed yet:
- The traffic light is more original than it currently looks. A city that visibly re-sorts
  itself around your state is something no competitor has.
- "Bridge, not host" is a genuinely contrarian position in a market built on engagement
  farming. It could be the whole brand rather than an internal principle.
- The pet as an actual AI concierge is the most defensible moat on the table, and the least
  developed.

## ⚠️ Every deck generated before 2026-08-22 is stale

Decks from before 2026-08-07 tell a story about groups that is no longer true. Decks from
2026-08-07 to 2026-08-21 predate the Tier 0 "safe by construction" item (Decision 016) and
are stale by the identity doc's rule. Do not send one.

---

**Note (added 2026-08-11, engineering sync):** MapLibre (committed next step #1 above) has
since shipped — see `func-app/HANDOVER.md` and commit `cf39f79`. The engineering side of the
product has moved from `prototype-web/` into `func-app/` (TypeScript + React Native).
`func-app/HANDOVER.md` and `func-app/FUNCTIONAL-INVENTORY.md` are the current build state;
this document remains the product-requirements record.
