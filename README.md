# Func

**Func is where your group finds tonight** — a map-first going-out app for people who
move in packs. The map is the product's centrepiece: a ranked instrument that tells
your crew where to go, what it costs, and lets you lock the plan on the spot. See the
full [product thesis](docs/PRODUCT_THESIS.md) and the
[Map v3 + Social Layer spec](docs/specs/map-v3-social-layer-spec.md).

**Status: prototype in active build.** The pitch demo (fictional city "Velmont") lives
in [`prototype/`](prototype/README.md) — Expo + React Native + TypeScript, fully
offline, verified working (see `prototype/QA.md`). The map-centric rebuild (Decision
009 — Beacons, Group Lens, Call It, Flares) is partially shipped; remaining scope is
tracked in the decision log and QA.md.

Func is being built as a real commercial software product with the ambition to reach
industry-leading quality and scale. Nothing about the product is sacred except the
standard we hold it to.

## How this repo is organised

| Path | Purpose |
|---|---|
| `README.md` | Current company/product status — always up to date |
| `docs/DECISION_LOG.md` | Every significant decision, its options, and its rationale |
| `docs/PRODUCT_THESIS.md` | What Func is, for whom, why now, and how it makes money |
| `docs/research/` | Market research with sources |
| `docs/specs/` | Build specs — see `map-v3-social-layer-spec.md` for the current build target |
| `docs/design/` | Design critiques and the multi-concept exploration behind Decision 009 |
| `docs/team/` | EM reviews and team operating-process notes |
| `prototype/` | The runnable pitch demo |

## Operating principles

1. **Sequence by risk.** Work on whatever most threatens the company's success next —
   right now that is "building something nobody wants", not code quality or scale.
2. **Decisions are logged, not remembered.** If it changed our direction, it goes in the
   decision log with the trade-offs we saw at the time.
3. **Documents are earned.** We create a doc when its absence starts costing us, not
   before. No empty template files.
4. **Everything reversible until validated.** Architecture and tooling choices stay cheap
   to undo until real users prove the product direction.
5. **The founder decides direction; the team decides execution.** We challenge ideas with
   evidence, then commit fully to the decision.

## Team

Founder: Phoenix Barnes (final decision-maker).
Founding team roles: Engineering Manager, Software Architect, Lead Software Engineer, QA Engineer.
