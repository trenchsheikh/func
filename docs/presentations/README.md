# Func presentation package

Generated 2026-08-25 from:

- `docs/FUNC_BIBLE.md` v1.0 draft;
- `docs/PRD.md` v1.0 current-truth draft;
- `docs/FEATURE_MATRIX.md` v1.0 draft;
- `docs/DESIGN_SYSTEM.md` v1.0 draft;
- `docs/PRIVACY_AND_SAFETY.md` v1.0 draft;
- `docs/OPEN_DECISIONS.md`;
- active prototype checkpoint `aac98d3`.

## Files

- `func-investor-vision-v1.0-2026-08-25.pptx` — investor/pre-seed conversation deck.
- `func-investor-vision-v1.0-2026-08-25.pdf` — shareable PDF export.
- `func-developer-vision-v1.0-2026-08-25.pptx` — developer and technical-partner handoff deck.
- `func-developer-vision-v1.0-2026-08-25.pdf` — shareable PDF export.
- `generate_func_decks.cjs` — reproducible generator.
- `qc/` — rendered slide images used for visual inspection.

The deck uses hand-authored vector concept visuals to show the intended future product world. Those are explicitly labelled as future vision. They do not claim real user density, real verification, real partnerships, production moderation, or a working backend.

The funding number is intentionally not invented. It should be added only after a technical lead and safety/operations plan cost the production foundation and controlled alpha.

To regenerate after source changes, provide `pptxgenjs` through `NODE_PATH` and run:

```bash
NODE_PATH="<runtime>/node_modules" node docs/presentations/generate_func_decks.cjs
```
