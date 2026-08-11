# UI sketch → digital → Michail workflow

Set up 2026-08-04 at Phoenix's direction. This is a live pipeline, not a
one-off.

## The chain

1. **Phoenix draws** first UI ideas on paper.
2. **Phoenix photographs** the drawings and drops the photos into
   `Func/inbox/ui-sketches/`.
3. **Claude digitises** each one: cleans up and upscales the photo, lightly
   edits for legibility (straightening, contrast, removing paper texture/
   shadows) — not a redesign, not adding ideas that weren't drawn.
4. **Phoenix sends** the digitised versions to **Michail** (friend, Func
   co-partner).
5. **Michail** turns them into the final prototype UI art used in the slide
   decks.

## What Claude actually does at step 3 — be honest about limits

- Image cleanup (crop, straighten, contrast, upscale, background removal) is
  reliable and can be done directly.
- "Edited slightly" beyond cleanup (e.g. tidying linework, redrawing as a
  cleaner vector) depends on what tools are available in the session —
  flag capability rather than assume it. If a step can't be done to the
  quality Phoenix needs, say so plainly and hand back the cleaned photo
  rather than pass off a rough result as finished.
- Never invent UI elements that weren't in the sketch. This is a legibility
  pass, not a design pass — design judgment stays with Phoenix and Michail.

## Where things live

- `Func/inbox/ui-sketches/` — raw photos land here.
- `Func/docs/design/ui-sketches-digitised/` — cleaned-up output goes here,
  same filename stem as the source photo, so the pair is traceable.
- `Func/docs/RAW_IDEAS.md` — logs that this workflow exists and any idea
  that shows up in a sketch but isn't just UI (e.g. a feature idea scribbled
  in the margin) gets a line there too, not silently dropped.

## Rules

1. **Raw photos are never edited in place or deleted.** They stay in
   `ui-sketches/` as the source of truth; digitised versions are new files
   elsewhere.
2. **This doesn't touch the HOLD.** Digitising a photo is tooling/output
   work Phoenix directly asked for in conversation — it's not resuming the
   Map v3 build. If a sketch implies a build decision, that's a separate
   question and goes through the normal intake process, not this pipeline.
3. **No Tier 0/1 inference from a sketch.** A drawing is not founder
   instruction to change the product identity — see `func-identity.md`.
