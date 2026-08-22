# func — visual direction and backlog

**Written 2026-08-12.** Companion to `HANDOVER.md`, which covers engineering
state. This file covers *what func should look like*, what has been built
toward that, and what is left — with the reasoning, so the next session does
not re-derive it.

Compatibility claims here were verified against the real npm registry, the
installed tree and upstream changelogs, then **adversarially re-checked** by
independent agents instructed to refute them. All four survived. Nothing here
was compiled, though — see §6.

---

## 1. The direction

**Chrome is the frame. The night is the colour.**

Three layers, kept strictly apart. Mixing them is what made the pre-reset build
read as a well-built settings screen for nightlife.

| Layer | Rule |
|---|---|
| **Shell** | Achromatic. True black, matte black surfaces, chrome hairlines, white type. Navigation, sheets, headers and buttons carry no hue at all. |
| **World** | Colour only ever by meaning. Heat is a temperature ramp; emerald is **people and nothing else**; venue *kind* is carried by silhouette, never by hue. |
| **Moments** | Tiered. Small moments get `spring.press`; a pass gets `spring.elevate` and a full-screen celebration. |

Tier 0 constraints that bound all of this: heat is **glow only** — never a
number, never a word. No emoji as iconography, ever. The product name is
**`func`**, never `func.`, in prose *and* in the mark.

---

## 2. Built

- **`src/ui/colour.ts`** — OKLCH ramp with chroma-bisection gamut mapping, an
  unwrapped hue path (264°→455°, so the blue→gold arc cannot flip), strictly
  increasing L, a 129-entry bake, linear-light addition, and `glowStops()`.
- **`src/ui/theme.ts`** — every spring derived from **ζ and ω₀**, not from
  stiffness/damping. Five differentiated classes: `press` ζ=1.0, `snap` ζ=0.85,
  `arrive` ζ=0.62, `elevate` ζ=0.42, `dismiss` ζ=1.25.
- **`src/ui/mapStyle.ts`** — hand-authored dark MapLibre style. Near-black
  ground, silver-circuitry roads, silhouette buildings, sparse labels, all
  vendor ornaments off.
- **`src/ui/components/ColdOpen.tsx`** — one master clock in ms on the UI
  thread with derived overlapping beats. This *is* the GSAP-timeline topology,
  already built. Scale interpolates geometrically (`geom()`), because perceived
  zoom is logarithmic.
- **`src/ui/components/FuncMark.tsx`** — seven-stop chrome plus a travelling
  specular clipped to glyph geometry by redrawing the same paths.
- **`src/ui/components/FuncMap.tsx`** — heat/silhouette/emerald on three
  separate channels; marker entrance staggered by distance from camera centre;
  label density tiered by zoom.
- **`src/ui/components/Celebrate.tsx` / `PassCard.tsx`** — the pass as a
  physical object on a blackout.

---

## 3. Substrate — verified

**Add two, both need one native rebuild:**

- `@shopify/react-native-skia@2.11.0` — install with **`npm install`**, *not*
  `npx expo install`, which pins 2.6.2 (SDK 57's `bundledNativeModules.json`).
  2.6.2 predates the `RCT_REMOVE_LEGACY_ARCH` guard fix and this Pods project
  already compiles with `-DRCT_REMOVE_LEGACY_ARCH=1`. Add `expo.install.exclude`
  so `expo-doctor` stops flagging it. ~6 MB iOS binary. No config plugin.
- `expo-haptics@57.0.1` — no config plugin, no Info.plist change.

**Do not add `expo-sensors`.** Reanimated 4.5.1 already ships
`useAnimatedSensor(SensorType.ROTATION)` — a full attitude quaternion as a
shared value written straight into the UI worklet runtime. Zero new deps, zero
rebuild. `NSMotionUsageDescription` is already in `ios/func/Info.plist` via
expo-location's plugin; adding expo-sensors would overwrite that string with
Expo boilerplate.

**Do not add `expo-blur`.** Cost scales with blurred area and with how fast the
content behind it changes — and the content behind it is MapLibre. On a palette
between `#000000` and `#1C1C21`, blurring near-black returns near-black. Depth
on black comes from the lit edge, not the blur.

**Rejected — Three.js / `@react-three/fiber`.** It resolves cleanly (R3F 9.7.0 +
expo-gl 57.0.2), but: it hard-depends on `expo-file-system/legacy`, which Expo
is retiring; it reaches into the unversioned private path
`react-native/Libraries/Blob/BlobManager.js`; its React peer ceiling `<19.3`
gates every routine Expo upgrade; and it would put a second native GPU context
alongside MapLibre. Against all that — **func has no 3D scene.** The mark is 2D
vector, the map is MapLibre's own GL, the globe is a shaded circle. Three sells
a scene graph to a product with no scene.

**Rejected — `moti`.** 18 months stale, self-describes as "powered by
Reanimated 3", open unanswered Reanimated-4 breakage report (#391) filed at RN
0.81 — older than this app's 0.86 — and a `"react-native-reanimated": "*"` peer
so npm will never warn. Drags `framer-motion@^6.5.1` into the RN bundle.

**The rebuild, precisely.** `ios/` and `android/` are gitignored and
CNG-generated with no hand edits, so prebuild is safe — and also unnecessary,
since neither package has a config plugin.

```bash
npm install @shopify/react-native-skia@2.11.0 expo-haptics@57.0.1
npx expo install --check     # Podfile.lock has RNWorklets 0.10.3 vs SDK pin 0.10.1
cd ios && pod install
npm run ios
```

Podfile deployment target 16.4, above Skia's 14.0 floor. Skia 2.10.0 shipped a
large native-layer refactor recently plus two hotfixes — budget a real-device
smoke test. Any dev-client build must be redistributed to every tester; no OTA
path carries native modules. Do not touch `@next` (Graphite/WebGPU).

---

## 4. Backlog — no rebuild, ranked by visual impact per unit of risk

1. **Tilt-driven chrome specular.** Highest ratio available. What makes chrome
   read as machined rather than printed is that the highlight is welded to the
   geometry. Drive `gradientTransform` on `fm-chrome` / `pass-chrome` from
   `useAnimatedSensor(SensorType.ROTATION)` pitch/roll through a low-pass filter
   (α ≈ 0.12 — raw attitude is far too jittery; not optional). Pass
   `interval: 16` explicitly (`'auto'` resolves to 120 on ProMotion). Call
   `unregister()` on unmount. New `src/ui/useTilt.ts`; touches `FuncMark.tsx`,
   `PassCard.tsx`. **Needs a physical iPhone** — the simulator has no motion
   hardware.
2. ~~**Airlight glow falloff**~~ — **done 2026-08-12**, see `glowStops()`.
3. **Hold-to-commit radial** on the two irreversible acts (request a table,
   burn a pass). 900 ms arc on an SVG `<Circle>` via animated `strokeDashoffset`
   (`C = 2πr`, `offset = C·(1−e(u))`, rotate −90°), two-part easing so the last
   15% latches rather than glides, abort rewinds at 3×, completion hands to
   `spring.elevate`. Free win: accidental requests become impossible.
   **⚠️ Needs Phoenix's explicit yes — it changes a core-path interaction.**
4. **Chamfer the panel geometry.** The uniformly-rounded rect is what iOS hands
   you for free. Cut *two diagonal* corners at `c = clamp(0.14·min(w,h), 10, 22)`,
   leave the other two at r=2 — asymmetry does the work; chamfering all four is
   just a different rounded rect. Rule that survives contact: **systems are cut,
   people are round** — keep `radius.pill` for anything representing a person.
   One `<ChamferSurface>` in `kit.tsx`. Highest surface-area-per-line change.
5. **Blue-noise grain over near-black.** The palette spans ~28 8-bit codes; at
   code 8 one quantisation step is 12.5% Weber contrast, 12–25× above threshold,
   and glow tails band at ~8px — the spatial frequency where contrast
   sensitivity peaks. Tiled 64×64 blue-noise PNG at opacity ≈0.012,
   `pointerEvents="none"`, mounted once in `Screen()`. Honest caveat: this masks
   contours *after* quantisation. True pre-quantisation TPDF dither needs Skia.
6. **Contact shadow + rim light instead of elevation.** Material/iOS elevation
   is black blur on a light ground; on `#000000` it is invisible. `kit.tsx`
   already does half (`borderTopColor: hairlineHi`); add lower-edge AO
   `ao(d) = 0.5·exp(−d/7px)` and a 1px bottom seat line at `rgba(0,0,0,0.60)`.
7. **The glint as the achromatic success signal.** Every app flashes a colour on
   success; func can't — emerald means people and the shell is achromatic. A
   travelling specular is the truer statement anyway: the object caught the
   light because its state changed. Reuse `fm-sweep` on `PassCard` at
   activation. Never on scroll, never idle — a card that glints continuously is
   a casino, not a members' club.
8. **Map under glass.** `V(r) = 1 − 0.55·smoothstep(0.55, 1.25, r/r_max)` in
   linear light, as a screen-space SVG overlay above MapLibre. Gives the heat
   somewhere to fall off into. Screen-space, so no projection-sync risk.
9. **Rhythm quantisation.** Put every duration on one grid (u = 121 ms) and
   retune `timing.coldOpen`'s seven beats to multiples; total stays ≈4.6 s.
   `timing.quick = 180` is currently off-grid. Add a source-scan test asserting
   no numeric `duration:` literal exists outside `theme.ts`.
10. **Helmholtz–Kohlrausch correction on the heat ramp, plus a monotonicity
    test.** L is strictly increasing by construction, but saturated colours look
    brighter than their L predicts, and the effect is maximal on exactly the
    blue→gold axis. Uncorrected, per-decile *apparent* step varies by ~55% — the
    ramp visibly stalls through the magenta belly. Solve for the physical L that
    linearises apparent lightness (bisection at bake time, zero runtime cost).
    **The test is the real deliverable**: assert L strictly increases across all
    256 quantised steps and the unwrapped hue sweep is ≈187°, so a future
    endpoint tweak cannot silently break the ramp.

## 5. Backlog — needs the rebuild

1. **Haptics.** `Celebrate.tsx` documents this gap in its own header. One call
   per moment; highest value-per-line in the whole plan. Map to the existing
   motion hierarchy: `press` → `Impact.Light`, `snap` → `selectionAsync`,
   `arrive` → `Impact.Medium`, `elevate` → `Notification.Success`, plus two
   `Impact.Light` ticks at ⅓ and ⅔ of the hold ring. **Never make a haptic the
   sole feedback** — it silently no-ops in Low Power Mode, with the camera
   active, and when Taptic is off in Settings.
2. **Skia on surfaces not parented to the map**: the pass card (true TPDF dither
   at 1 LSB post-OETF; luminance-shaped film grain at **18 Hz**, not 60, or it
   reads as video noise), the cold open, and the mark's thin-film chromatic edge
   (Fresnel-gated, sub-pixel, confined to the 1px specular — one pixel wider and
   it becomes the thing we are trying not to be).
3. **Skia glow layer for the map — spike before scheduling.** Most likely item
   to fail. Markers are MapLibre `<Marker>` children repositioned *natively*
   during pan; a single Skia overlay would have to project from JS camera state
   and will lag during a pan. Glow detaching from its venue is worse than the
   SVG gradient it replaced. Prototype exactly that combination — Skia overlay +
   MapLibre pan — not a standalone canvas.
4. **The heat field** — domain-warped fBm, Kolmogorov gain `G = L^(−5/6)`,
   irrational lacunarity 1.93, per-octave rotation, quarter resolution. Five fBm
   calls at five octaves is ~4× a mid-range Android's entire per-pixel budget at
   full res. Gate as a bounded 2–4 s "big moment" burst with an asymmetric
   envelope, **never ambient** — otherwise a 60fps demo is a 40fps product at
   minute four.

---

## 6. Rejected — would cheapen the product

- **Neon-glow type** (`textShadowRadius > 0` on any glyph). Fastest route to
  generic cyberpunk. The chrome gradient fill is already the substitute.
- **Full-screen RGB channel split** (>0.6px outside the 1px specular edge).
- **Scanlines / CRT overlays.** Death Stranding's holograms use a smooth
  vertical falloff and read twenty years newer.
- **Hexagon fields, reticles, crosshairs, fake serial numbers and coordinates
  as decoration.** Cyberpunk earns redundant telemetry because it is a diegetic
  HUD inside a fiction. A func pass is a *real credential*; fake telemetry makes
  a real thing look like cosplay.
- **Persona-style skew** (any rotation on a container). Take their easing
  (quintic-out, ~5× peak-to-mean velocity); leave the costume.
- **Any UI-surface gradient with two chromatic stops.** That is the
  no-startup-gradients rule stated as geometry.
- **Purple as a default.** Cap `colour.after` and `colour.disco` at ≤8% screen
  area, after-parties only.

Worth enforcing as a `__DEV__` audit overlay: a **chroma budget**
(Σ area·C / A_total ≤ 0.004; emerald ≤3% of viewport) and an **ink budget**
(≤22% of pixels above L\*20). "Use more whitespace" loses every argument against
a feature request; "22% ink ceiling" wins.

---

## 7. Open — needs Phoenix

1. **The hold-to-commit ring** (§4.3) changes how a request is sent. Motion is
   Tier 3, but this sits on the core path, so per `HANDOVER.md` §5 rule 7 it is
   not being inferred. It also silently makes accidental requests impossible —
   a behaviour change worth naming.
2. **`Loading()` in `kit.tsx` uses `colour.em` for its spinner.** A spinner is
   not a person; by the brand rule that is emerald spent on decoration.
   Genuinely borderline neighbour: `Toggle`'s on-state also uses emerald, and
   its only instance is "let mutuals see you are out" — which *is* about your
   presence. Reading: the spinner is wrong, the toggle is defensible.

## 8. Not verified

Nothing in §3 was compiled — no `pod install`, no Xcode build. The
compatibility work is package metadata, podspecs and upstream commits, not a
green build, and there is no upstream CI pinning RN 0.86.2 with Skia 2.11.0
specifically. The Skia-overlay-plus-MapLibre interaction (§5.3) is the plan's
largest unknown. Blur perf, CoreMotion and haptics all mislead in the
simulator; every item in §5, and §4.1, needs a physical iPhone to sign off.
Web is separate work — Skia on web needs `npx setup-skia-web` and bundler
config, and the `web` script will not survive the Skia addition for free.
