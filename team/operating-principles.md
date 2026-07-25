# Operating Principles

These are the durable rules — the ones that don't change from week to week.
Project-specific facts (what Func *is*) live in `docs/`, not here. Live,
currently-changing instructions live in `standing-orders.md`, not here.

## Direction and decisions

1. **The founder decides direction; the team decides execution.** Challenge
   ideas with evidence, then commit fully once the founder has decided. Don't
   quietly relitigate a settled call because a new session doesn't remember
   the discussion — check `docs/DECISION_LOG.md` first.
2. **Decisions are logged, not remembered.** If something changed the
   product's direction, architecture, or process, it goes in
   `docs/DECISION_LOG.md` with the options considered and why. A decision
   that isn't written down doesn't exist for the next session.
3. **Sequence by risk.** Work on whatever most threatens the company's
   success next. Early on that's "building something nobody wants," not code
   quality or scale — but check `standing-orders.md`, because what's riskiest
   changes over time and the founder may have already told us what it is
   right now.

## Building

4. **Documents are earned.** Create a doc when its absence starts costing
   something, not before. No empty template files, no scaffolding nobody
   asked for.
5. **Everything reversible until validated.** Architecture and tooling
   choices stay cheap to undo until real users — or the founder — have
   confirmed the direction. Don't over-invest in permanence early.
6. **Design before build, for anything that matters.** A written
   interaction-path note before implementation, for any feature that mixes
   input handling, animation, or a new surface. For centrepiece or
   high-stakes features, run independent design explorations and judge them
   against each other before committing — one designer's first idea is not
   a design process.
7. **Innovation over imitation.** When the founder names a benchmark
   (Snap Map, for instance), it's a floor for usability, not a target to
   copy. The question is never "how do we match this," it's "what would make
   this unnecessary to compare against."
8. **Simplicity over complexity, but not at the cost of the mechanic that
   makes Func Func.** Cut scope before cutting the thing that's actually
   differentiated.

## Verification

9. **Native verification is the standard (Decision 010).** Physical device
   or iOS Simulator. Browser builds are a fast sanity check and nothing more
   — never the sole basis for calling a feature done.
10. **The walkthrough is the test suite.** Drive the feature by hand
    (or by automated tap/screenshot) before claiming it works. A clean
    typecheck is necessary, not sufficient.
11. **No silent loose ends.** Every report to the founder ends with an
    explicit list of what's unfinished, what's unverified, and what needs a
    founder-level decision. Don't bury it in prose; don't let it drop.

## Safety and trust (non-negotiable, not up for casual reinterpretation)

12. **Aggregate-only heat, always.** No individual's live location is ever
    exposed by the product, at any zoom level, under any feature name.
13. **Groups and presence are opt-in-by-act**, never a default-on toggle
    buried in settings.
14. **18+, ID-verified, women-first safety review** before any feature that
    changes how strangers can find or contact each other ships for real.
15. Changes to the Backing/vouch system's gating logic, or anything else that
    changes how users are gated from or exposed to each other, need explicit
    founder sign-off before shipping — don't guess on this category.

## Money

16. **B2B2C.** Venues pay for demand; users stay free while the product is
    building density. Consumer premium is a later lever, not a launch one.
