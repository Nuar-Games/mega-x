# Mega X Reference Arena Visual Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the rejected thin arena treatment with the full game-grade visual system shown in the approved user references and prove it in the playable branch.

**Architecture:** Keep the existing game/state/backend contract and Phaser arena boundary. Replace the authored visual layer and composition: substantial transparent SVG/WebP fixtures feed ArenaAssets; ArenaLayout allocates reference-style desktop/mobile regions; ArenaHud/ArenaCards/ArenaInput/ArenaEffects compose and animate them. Browser QA is an acceptance gate, not optional evidence.

**Tech Stack:** React, TypeScript, Phaser 3, SVG/WebP assets, Vite, Playwright/GitHub Actions.

**Spec:** `docs/superpowers/specs/2026-09-16-reference-arena-visual-rebuild-design.md`

## Global Constraints
- Work only on `arena-clean-rebuild`; never update `main`.
- Preserve gameplay engine, Practice behavior, backend/security and existing Mega X cards/audio.
- Do not substitute concept screenshots for implementation.
- Guest Practice must enter without authentication.
- Low-end mode must retain critical UI while reducing effects cost.
- Visual acceptance requires real playable browser screenshots.

---

### Task 1: Reference-grade authored asset pack
**Files:** Modify `src/game/arena/ArenaAssets.ts`; replace/create files under `public/ui/arena/v3/`; Test `tests/arena_reference_asset_pack_regression.mjs`.
**Produces:** `arenaUiV3` manifest containing HUD, piles, zones, commands, phases, overlays, message/log/inspect, status and FX assets.
- [ ] Write a failing manifest test requiring every asset family and rejecting outline-only assets.
- [ ] Run the test and confirm failure.
- [ ] Author substantial isolated transparent assets with layered surfaces, fills, glow/filter treatment and reference blue/red/gold hierarchy.
- [ ] Wire them into `ArenaAssets.ts`.
- [ ] Run manifest test and existing asset regression; require PASS.
- [ ] Commit.

### Task 2: Desktop battlefield composition
**Files:** Modify `src/game/arena/ArenaLayout.ts`, `ArenaScene.ts`, `ArenaHud.ts`, `ArenaCards.ts`, `ArenaInput.ts`; Test `tests/arena_reference_desktop_layout_regression.mjs`.
**Produces:** reference-style 16:9 layout with top identity HUDs, centered turn/VS axis, central field, visible pile fixtures, bottom centered hand, right command stack and lower-left log.
- [ ] Write layout assertions for 1920x1080 regions and non-overlap/card dominance.
- [ ] Run and confirm failure against current composition.
- [ ] Implement new geometry and render hierarchy.
- [ ] Ensure opponent hand/identity are balanced and never left-stacked.
- [ ] Run layout and existing engine/arena regressions.
- [ ] Commit.

### Task 3: HUD, commands, log and inspect integration
**Files:** Modify `ArenaHud.ts`, `ArenaInput.ts`, `ArenaInspect.ts`, `ArenaStateAdapter.ts`; Test `tests/arena_reference_hud_regression.mjs`.
**Produces:** visible player/opponent HUD plates, turn/phase banner, command stack, log/effects panel, card view and contextual notification/message surfaces.
- [ ] Write failing state/render contract assertions.
- [ ] Implement asset-backed HUD/command/log surfaces and readable labels/stats.
- [ ] Keep actions dispatching through existing DOM/game events.
- [ ] Run tests and commit.

### Task 4: Field fixtures and card presentation
**Files:** Modify `ArenaCards.ts`, `ArenaScene.ts`, `ArenaTexturePool.ts`; Test `tests/arena_reference_field_regression.mjs`.
**Produces:** visible deck stacks, discard/Zon X/field zones, active/inactive states, card fan/selection/target emphasis.
- [ ] Write failing fixture/card hierarchy assertions.
- [ ] Implement field assets and state-dependent emphasis without obscuring cards.
- [ ] Verify existing card images and card backs are reused.
- [ ] Run tests and commit.

### Task 5: Authored animation and FX pass
**Files:** Modify `ArenaEffects.ts`, `arena-theme.ts`; add FX assets under `public/ui/arena/v3/fx/`; Test `tests/arena_reference_fx_regression.mjs`.
**Produces:** turn entry, selection, VS entry, attack slash/burst, damage numbers, destruction, effect activation, Zon X transition, victory/defeat and loading feedback.
- [ ] Write failing effect-event coverage test.
- [ ] Implement tweens/particles/camera feedback and transparent authored FX assets.
- [ ] Make low-end profile reduce counts/glow/shake duration while preserving event feedback.
- [ ] Run tests and commit.

### Task 6: Responsive mobile variants
**Files:** Modify `ArenaLayout.ts`, `ArenaHud.ts`, `ArenaInput.ts`; create mobile-specific assets only where geometry cannot reuse desktop; Test `tests/arena_reference_responsive_regression.mjs`.
**Produces:** landscape and portrait compositions retaining blue/red HUD identity, field clarity, hand dominance and accessible commands.
- [ ] Add assertions for 915x412 and 412x915.
- [ ] Implement responsive geometry and mobile command tray.
- [ ] Verify no overlap/cropping of critical controls/cards.
- [ ] Run tests and commit.

### Task 7: Performance/fullscreen/guest preservation gate
**Files:** Modify only as failures require `ArenaPerformance.ts`, `bootstrapArena.ts`, guest Practice routing; Test existing performance/fullscreen/guest regressions.
**Produces:** unchanged functional promises after visual rebuild.
- [ ] Run guest Practice no-network test, fullscreen test and low-end profile test.
- [ ] Run 32/32 engine behavior and 1000 seeded Practice stress test.
- [ ] Fix only regressions caused by visual work.
- [ ] Commit if changes are needed.

### Task 8: Real browser acceptance proof
**Files:** Update `.github/workflows/arena-visual-qa.yml` and QA script if needed; no game-code shortcuts.
**Produces:** screenshots from the real playable arena at desktop, landscape mobile and portrait mobile.
- [ ] Build production bundle.
- [ ] Start preview and enter Practice through the visible guest button with a normal click.
- [ ] Assert `.duel-shell` and Phaser canvas are mounted.
- [ ] Capture 1920x1080, 915x412 and 412x915 after arena settles.
- [ ] Fail QA if reference HUDs, command controls or arena canvas are absent.
- [ ] Upload screenshots as workflow artifacts.
- [ ] Run full regression suite and commit QA changes.
