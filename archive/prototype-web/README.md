# Func. — investor / developer prototype

The live prototype. Real code, real San Francisco, full pixel control.
Built 2026-08-07 (Decision 014). Supersedes the Figma Make file and the Expo
`prototype/` — that one is kept only as the record of the previous direction.

## Run it

```bash
cd "$HOME/Library/Mobile Documents/com~apple~CloudDocs/All Files/Func/prototype-web" && python3 -m http.server 8778
```

Then open **http://localhost:8778** — full-screen on a phone, or in a phone frame
on a desktop browser. No build step, no dependencies, no install.

## What's in it

| File | What |
|---|---|
| `index.html` | Shell |
| `styles.css` | Design system — emerald/black/white tokens, type, components |
| `data/sfmap.js` | Real San Francisco street geometry (121KB of vector paths) |
| `data/seed.js` | Venues, people, stories, table offers, after-parties, spots |
| `app.js` | Map renderer, camera, cold open, the pet, tab router |
| `screens.js` | Venue sheet, browse deck, request→pass, afters, profile, globe |
| `build_map.py` | Regenerates `data/sfmap.js` from OpenStreetMap |

## The demo (the whole night)

1. **Cold open** — eye opens → iris becomes the globe → spins to SF → dive to your street.
2. **The map** — real streets, emerald glow heat, story rings, friends, the pet.
3. **Tap a venue** — the words live here: how busy, what it costs in, what a night costs,
   live stories from inside, who's there, tables tonight.
4. **Request a table** — party size is just a number. Send it.
5. **"You're in"** — the pass materialises with a QR code. This is the payoff moment.
6. **Browse** — swipe anything: dinner, tables, after-parties, local spots, people.
7. **Afters** — after ~25s the app offers Afters mode; it changes personality.
8. **After-party** — the address is revealed *only* when the host accepts you.
9. **Profile** — photos, traffic light, ID verified, tokens, Go Disco.
10. **The globe** — tap the globe icon: SF and LA live, six cities with waitlists.

## Rules this prototype encodes

- **Glow only** on the map — no numbers, no words. Words live in the venue sheet.
- **No emoji as iconography.** Every icon is drawn.
- **Nothing rushes you.** No timers, no schedule, no voting.
- **Func never takes payment.** You sort money with the host at the door.
- **Party size, not groups.** Nothing to create or administrate.

## The map

Real OpenStreetMap geometry for the SF core — the Mission, SoMa, Hayes Valley,
Castro, Potrero — projected to Web Mercator and simplified with Ramer–Douglas–Peucker
into five street tiers, plus water and parks. Rendered entirely in Func's own
language: no stock tiles anywhere, ever.

Venue pins and labels keep a **constant screen size** as you zoom (like every real
map app). The heat wash stays in **world units**, because heat is a geographic
footprint rather than a label.

To regenerate or extend to LA: edit the bounding box in `build_map.py`, re-run the
Overpass queries, then `python3 build_map.py`.

## Honest about what is faked

No backend, no real location, no camera, no payments, no real QR validation, no
algorithm. Accepts are on timers. Everything else — the map geometry, the streets,
the venues and their coordinates — is real.
