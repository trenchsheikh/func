# Func Intake Process

How raw conversations turn into changes the team actually acts on. Added
2026-07-27 at Phoenix's direction.

## The pipeline

1. **Capture.** Phoenix records a conversation (with a friend, a collaborator,
   himself thinking out loud) about Func — features, pitch strategy, anything.
2. **Clean-up.** Phoenix runs the transcription through ChatGPT for a summary/
   reconstruction (fixes the messy parts of raw speech-to-text).
3. **Drop.** The summary (and ideally the raw transcript alongside it) goes
   into `docs/conversations/` as a new dated file.
4. **Intake review.** An agent — invoked on demand by Phoenix (see below) —
   reads the new file and:
   - Reads the current state first: `docs/PRODUCT_THESIS.md`,
     `docs/DECISION_LOG.md`, the specs in `docs/specs/`, and
     `prototype/QA.md`. It does not review a conversation in isolation.
   - Sorts every idea in the new conversation into exactly one of:
     **Already decided** (matches an existing accepted decision — no action,
     but note it as reinforcement), **Superseded** (the conversation's idea
     was an earlier/rougher version of something the team has since resolved
     differently — say what changed and why the newer version won),
     **Conflicts** (the conversation contradicts a current accepted decision
     — flag this explicitly, do not quietly pick a side), or **New/unresolved**
     (a genuinely new idea, or an old open question the conversation
     re-raises, not currently captured anywhere).
   - For the New/unresolved pile, applies real judgment: app-development
     feasibility (is this buildable, what would it take), business/monetisation
     reasoning (does this fit the B2B2C model or compete with it — general
     business-strategy reasoning, not personalised financial advice), and
     product taste (does this serve the core thesis — "Func is where your
     group finds tonight" — or dilute it).
   - Is expected to **push back and propose alternatives**, not just log
     things neutrally. If an idea is weak, say so and say why. If a
     half-formed idea in the conversation has a stronger version, propose the
     stronger version. Creative additions are wanted, not just filtering.
   - Writes its findings to the tracker (Google Sheet — see below) and drafts
     the specific edits it would make to the master spec (Google Doc), but
     **does not silently overwrite the master spec.** Product-direction
     changes go through Phoenix.
5. **Phoenix reviews.** Approve, deny, or redirect ("other") each proposed
   change. Accepted changes get written into the master Doc/Sheet and, for
   anything decision-worthy, logged as a new entry in
   `docs/DECISION_LOG.md` so the engineering side of the repo stays in sync
   with the living spec.

## Where things live and why

- **`docs/conversations/`** (local, git-tracked) — permanent raw archive.
  Never edited after the fact; it's history, not a working document.
- **Google Doc "Func — Master Product Spec (Living)"** — the polished,
  always-current full description. Shareable with a co-founder, app
  developers, promoters, investors without giving them repo access.
- **Google Sheet "Func — Feature & Decision Tracker"** — every discrete
  idea/feature as a row: status (Proposed / Accepted / Rejected / Building /
  Shipped / Superseded), source conversation, date, and which "team lens"
  flagged it. This is the queue Phoenix triages.
- **`docs/DECISION_LOG.md`** (local) — stays the engineering-side permanent
  record of what was decided and why, once something graduates from
  "proposed" to "accepted." The Google Doc and this file should never
  meaningfully disagree — if they do, that's a bug in the process, fix it
  immediately rather than letting both stand.

## How to run it

This is currently a manually-triggered review, not an automatic background
job — Phoenix asked to hold off on scheduled/automatic runs until the rest of
his infrastructure is settled. To run a review: ask Claude (in Cowork) to
"run the Func intake review on [new conversation file]." Once Phoenix is
ready to automate this (e.g. run automatically whenever a new file appears in
`docs/conversations/`), that's a one-line change to set up as a scheduled
task — flag it to him as an option rather than turning it on unasked.

## Explicit non-goals

- This process does not give personalised financial or investment advice.
  "Business/financial reasoning" here means startup strategy reasoning about
  Func specifically (pricing, unit economics, monetisation fit) — not advice
  about Phoenix's personal finances or investments.
- This process does not replace the adversarial multi-concept process for
  genuinely centrepiece-level features (see `operating-principles.md` #6).
  Intake review is for triage and synthesis; a feature that clears intake as
  "worth doing" but is centrepiece-scale still deserves the fuller process
  before being built.
