# Func Prototype — "Velmont" Demo

Pitch-ready demo of Func: dark neon going-out app for a fictional coastal city.
Entirely offline, in-memory mock data; every launch is a pristine demo.

## Run it on your phone (the real experience)

1. Install **Expo Go** (free) from the App Store / Play Store.
2. In Terminal on this Mac (Node lives at `~/.local/node`, not on the default PATH):

```bash
export PATH="$HOME/.local/node/bin:$PATH" && cd "$HOME/Library/Mobile Documents/com~apple~CloudDocs/Func./prototype" && npx expo start
```

3. A QR code appears — scan it with your phone camera (phone and Mac must be on the
   same Wi-Fi). Func opens full-screen in Expo Go with real touch and swipes.

For a desk/browser demo instead:

```bash
export PATH="$HOME/.local/node/bin:$PATH" && cd "$HOME/Library/Mobile Documents/com~apple~CloudDocs/Func./prototype" && npx expo start --web
```

(Dependencies are already installed; if starting fresh, run `npm install` first with
the same PATH export.)

## Structure

| Path | What |
|---|---|
| `app/` | Screens (Expo Router): 5 tabs + person/group/event/chat modals |
| `components/` | Avatar (gradient monogram), AvatarStack, Chip, NeonButton, VelmontMap (SVG city) |
| `data/` | Mock world: users, groups, pool invites, events, dating cards, Velmont geometry |
| `lib/` | `theme.ts` (the one true stylesheet), `store.tsx` (in-memory demo state) |
| `assets/people/` | Drop-in point for real photos later (see its index.ts) |
| `QA.md` | The demo script — run it before every pitch |

Design decisions and their reasons live in `../docs/DECISION_LOG.md` (004–005 cover
this prototype). Product reasoning lives in `../docs/PRODUCT_THESIS.md`.
