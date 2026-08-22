# Func

**Func is where your group finds tonight** — a map-first going-out app for people who
move in packs. The map is the product's centrepiece: a ranked instrument that tells
your crew where to go, what it costs, and lets you lock the plan on the spot. See the
full [product thesis](docs/PRODUCT_THESIS.md) and the
[Map v3 + Social Layer spec](docs/specs/map-v3-social-layer-spec.md).

**Status: prototype in active build.** The active build is
[`func-mobile/`](func-mobile/README.md) — Expo + React Native + TypeScript, Pool as
the hero mechanic, a Mapbox globe (`@rnmapbox/maps`). See Decision 015 in the decision
log for how this supersedes the earlier group-first-retired, MapLibre-based direction.
Earlier builds — `func-app/`, `prototype/`, `prototype-web/` — are superseded and live
in [`archive/`](archive/), kept for reference, not deleted.

Func is being built as a real commercial software product with the ambition to reach
industry-leading quality and scale. Nothing about the product is sacred except the
standard we hold it to.

## How this repo is organised

| Path | Purpose |
|---|---|
| `README.md` | Current company/product status — always up to date |
| **`team/`** | **Start here.** Team roles, operating principles, and current standing orders — read before doing any work |
| `docs/DECISION_LOG.md` | Every significant decision, its options, and its rationale |
| `docs/PRODUCT_THESIS.md` | What Func is, for whom, why now, and how it makes money |
| `docs/FUNC_BIBLE.md` | The founder's own essay on Func's ultimate vision (once written) — outranks everything else on product direction |
| `docs/research/` | Market research with sources |
| `docs/specs/` | Build specs — see `map-v3-social-layer-spec.md` for the current build target |
| `docs/design/` | Design critiques and the multi-concept exploration behind Decision 009 |
| `func-mobile/` | **The active build.** Expo + React Native + TypeScript, Pool mechanic, Mapbox globe |
| `archive/` | Superseded builds — `func-app/`, `prototype/`, `prototype-web/` — kept for reference, not deleted |

## Team

Founder: Phoenix Barnes (final decision-maker). Founding team: Engineering
Manager, Software Architect, Lead Software Engineer, QA Engineer — all
operating under the roles and rules in [`team/`](team/README.md), which is
the source of truth for how this team works. **Check
[`team/standing-orders.md`](team/standing-orders.md) before starting any
build work** — it holds whatever the founder's most recent live instruction
was, and it overrides everything else here.
