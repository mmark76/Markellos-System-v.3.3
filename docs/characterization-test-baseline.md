# Phase 1A Characterization-Test Baseline

## Purpose

Phase 1A records the current browser behavior and appearance before any production refactoring. The tests describe what the repository does now, including behavior that may appear surprising or inconsistent.

No production HTML, CSS, JavaScript, data, assets, text, identifiers, selectors, dependencies, or workflows are changed by this baseline.

## Initial scope

The first baseline contains exactly five browser tests:

1. Landing-page smoke test.
2. Main-application initial-render smoke test.
3. Main-application desktop screenshot at `1440 × 1000`.
4. Main-application mobile screenshot at `390 × 844`.
5. One representative legal PGN paste-and-parse scenario.

## Recorded current behavior

The initial-render test explicitly records:

- the page title and main table headings,
- the selected table and section visibility,
- the current main-table default of full-move loci,
- the existing Epic Story fallback to half-move loci when no stored choice exists,
- empty initial table bodies,
- dynamically created modals and controls,
- removal of the HTML `TXT` export options at runtime,
- the default-library status text,
- table column-control creation.

The representative PGN test records:

- the pasted textarea value,
- SAN sequence and row counts,
- full-move locus placement,
- SAN, Associations, Shortnames, PAO 0–9, and PAO 00–99 table text,
- each rendered cell's inline visibility state,
- the current castling output,
- SAN-to-text button enablement after parsing.

## Representative PGN

The fixture `tests/fixtures/pgn/representative-legal-game.pgn` contains ten legal plies and kingside castling:

```text
1. e4 e5 2. Nf3 Nc6 3. Bb5 a6 4. Ba4 Nf6 5. O-O Be7 *
```

This is a characterization fixture, not a complete chess-rule test suite.

## Snapshot policy

Text/DOM snapshots and screenshots are stored under `tests/snapshots/` through the configured snapshot path template.

The existing desktop and mobile screenshots were originally generated with installed Google Chrome `150.0.7871.101` and are local provisional baselines. They become eligible for the authoritative baseline only after successful regeneration with Playwright-managed Chromium in the controlled environment defined in `docs/characterization-environment.md` and visual review of the resulting images.

Snapshot updates require all of the following:

1. An intentional baseline change approved by the owner.
2. Review of the textual diff.
3. Visual inspection of desktop and mobile images.
4. Confirmation that no mnemonic output, visible wording, identifier, selector, workflow, or appearance changed unexpectedly.

## Deferred coverage

The following are intentionally deferred beyond Phase 1A:

- invalid and partial PGN behavior,
- PGN file import,
- castling variants, en passant, promotion, underpromotion, check and checkmate matrices,
- 80-locus wrapping,
- manual anchors,
- user-library JSON/CSV/XLS/XLSX flows,
- export download contents,
- complete modal interaction coverage,
- Flashcards Trainer behavior,
- standalone TTS behavior,
- full Web Speech API tests,
- Android packaging.

Deferred behavior must be recorded as it exists before related production code is refactored or corrected.
