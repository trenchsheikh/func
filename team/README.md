# The Func Team Folder

This folder is the team's operating memory. It exists so that every session —
whether it's a live conversation with the founder or an autonomous build run —
starts from the same understanding of who we are, how we work, and what we're
allowed to do right now.

**Read these files, in this order, before doing anything else:**

1. **[roles.md](roles.md)** — who's on the team and what each role owns.
2. **[operating-principles.md](operating-principles.md)** — the durable rules
   for how we work. These don't change often.
3. **[standing-orders.md](standing-orders.md)** — what's true *right now*.
   This is the file that changes most often and the one most likely to
   override your default instinct. Always check it before starting build
   work, enabling automation, or making a judgment call.
4. **[glossary.md](glossary.md)** — Func-specific vocabulary (Beacon, Flare,
   Call It, Backing, and the rest), so you don't have to re-derive it from
   the full spec every time.
5. **[func-identity.md](func-identity.md)** — the change-tier system (Tier 0
   Constitution through Tier 3 Detail). Governs how radical a proposed change
   is and what has to happen before it lands. Read before assessing any new
   idea against the product.
6. **[intake-process.md](intake-process.md)** — how raw conversations and
   notes become assessed proposals. Companion to the `func-intake` skill.

## Why this folder exists

The founder is the CEO and the final decision-maker. Everything this team
builds should trace back to a decision the founder made, explicitly. This
folder is how we keep that true even across sessions that don't share
conversation history: it's the difference between "the team remembers its
orders" and "the team politely reinvents itself every time and hopes it
lands in the same place."

If something in here ever conflicts with what the founder just said in a
live conversation, **the live conversation wins** — then update the file so
the conflict doesn't happen again next time.

## What doesn't live here

- **The Func Bible** (`docs/FUNC_BIBLE.md`, once written) — the founder's own
  essay on Func's ultimate vision. That's founder-authored, not team-authored.
  Once it exists, it outranks everything in this folder on questions of
  product direction.
- **Decisions and their rationale** — `docs/DECISION_LOG.md`.
- **What Func is, for whom, why now** — `docs/PRODUCT_THESIS.md`.
- **Build specs** — `docs/specs/`.
- **Historical reviews and retros** — `team/reviews/`.
- **Raw notes, transcripts, and unprocessed material** — `inbox/` (unprocessed)
  and `docs/conversations/` (processed).

This folder is about *how the team behaves*, not *what Func is*. Keep it
that way — if a file here starts accumulating product facts, they've
probably drifted from where they belong.

---

**Note (added 2026-08-11, engineering sync):** the product's build has since moved
into `func-app/` (TypeScript + React Native). For anything touching that repo, also
read `func-app/HANDOVER.md` and `func-app/FUNCTIONAL-INVENTORY.md` — they carry the
current engineering state and are kept current by commit; this folder governs process
and product-direction, not build status.

**Note (added 2026-08-21, superseding the above):** the active build moved again, to
`func-mobile/` — see Decision 015. `func-app/` is archived (`archive/func-app/`), its
`HANDOVER.md`/`FUNCTIONAL-INVENTORY.md` now describe a paused, not current, build.
`func-mobile/` doesn't have equivalent handover docs yet — just a `README.md`. Worth
writing one before the next session picks this up, so this same gap doesn't repeat a
third time.
