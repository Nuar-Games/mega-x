# MEGA-X Total Arena Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the MEGA-X Arena presentation completely with a new portrait Arena and remove the FIGHT announcer entirely.

**Architecture:** Keep existing game state, networking, handlers, and card data, but replace the legacy Arena board with one newly authored `mx2-*` fragment and one matching stylesheet. Render VS cards, Effect cards, piles, counters, and stats directly from existing data instead of invoking legacy Arena presentation components.

**Tech Stack:** React 19, TypeScript, Vite, CSS, existing build-time recovery/patch pipeline.

**Spec:** `docs/superpowers/specs/2026-09-01-total-arena-redesign-design.md`

## Global Constraints
- No legacy Arena visual component/class may survive in the replacement fragment or Arena stylesheet.
- Do not reuse `VSZone`, `LiveStats`, `pile-cluster`, `effect-card-slot`, `fighter-identity`, `v9-vs-card`, or `arena-wrap` as Arena presentation.
- Preserve game rules, engine state, networking, card data, and existing action handlers.
- Remove the FIGHT announcer completely; do not patch its once-per-match behavior.
- Portrait layout follows the approved Arena diagram.

---

### Task 1: Add a hard regression contract for zero legacy Arena presentation

**Files:**
- Modify: `tests/arena_portrait_stage_regression.mjs`
- Modify: `tests/arena_viewport_regression.mjs`
- Test: those same files

**Interfaces:**
- Consumes: `src/arena-blueprint.fragment`, `src/arena-stage.css`, `src/audio.ts`
- Produces: build-breaking assertions that reject prohibited legacy Arena tokens and FIGHT announcer logic.

- [ ] **Step 1: Write failing assertions**

Add checks that the new Arena fragment/style include `mx2-arena`, `mx2-vs-frame`, `mx2-effect-rail`, `mx2-score-core`, and reject `VSZone`, `LiveStats`, `pile-cluster`, `effect-card-slot`, `fighter-identity`, `v9-vs-card`, `.mx-vs-module`, `.mx-effect-column`. Add an audio assertion rejecting `playSfx('fight')` and FIGHT mutation detection.

- [ ] **Step 2: Run tests and confirm failure**

Run the existing Arena regression scripts in the build. Expected: failure because the current fragment/style still contain legacy tokens and audio still contains the FIGHT path.

- [ ] **Step 3: Keep the failing tests for Tasks 2–4**

No production implementation in this task.

### Task 2: Replace the Arena fragment with direct new markup

**Files:**
- Replace: `src/arena-blueprint.fragment`
- Modify: `scripts/patch-arena-blueprint-structure.mjs`

**Interfaces:**
- Consumes: existing `game`, `activePlayer`, `playerDisplayName`, `currentStats`, `CardView`, `setFocusedCard`, `setPileView`, `visiblePileTop`, `displayedPileCount`, `displayedDeckCount`, `impactFx`, `motionFx`, `motionStyle`, `isCardArriving`, phase state.
- Produces: one `mx2-arena` DOM tree with new classes only.

- [ ] **Step 1: Remove legacy component calls from fragment**

Render VS cards directly with `CardView card={game.players[n].vs!.card}` when visible. Render stats directly from `currentStats[n]`. Render Effect cards directly with `CardView`. Keep existing inspect/pile click handlers.

- [ ] **Step 2: Introduce new class system**

Use only new presentation classes: `mx2-arena`, `mx2-fighter-bar`, `mx2-upper-zone`, `mx2-score-core`, `mx2-discard-core`, `mx2-deck-core`, `mx2-effect-rail`, `mx2-effect-slot`, `mx2-vs-side`, `mx2-vs-frame`, `mx2-position-bar`, `mx2-stats`, `mx2-stat`, `mx2-command`, `mx2-impact`, `mx2-motion`.

- [ ] **Step 3: Make the structural patch validate new tokens and reject old ones**

After replacement, throw if any prohibited legacy presentation token remains inside the authored fragment.

### Task 3: Replace Arena geometry and visual language completely

**Files:**
- Replace: `src/arena-stage.css`
- Modify: `src/arena-stage.ts`

**Interfaces:**
- Consumes: new `mx2-*` DOM tree plus runtime hand roots.
- Produces: full-height portrait layout with no legacy Arena selector authority.

- [ ] **Step 1: Replace stylesheet with `mx2-*` selectors**

Define one portrait coordinate map: HUD 0–7%, fighter bars 8–13%, opponent hand 14–22%, upper zones 23–33%, battlefield 34–70%, command area 70–79%, local hand 80–99%. Use new visual shapes/counters rather than legacy boxes.

- [ ] **Step 2: Retarget runtime helpers**

Keep inspector/hand classification/phase feedback but have it add `mx2-opponent-hand` and `mx2-local-hand` classes. Remove legacy field-side/geometry dependencies.

- [ ] **Step 3: Verify five Effect slots, two VS frames, three stats each, and both hands are structurally protected**

Ensure no selector in `arena-stage.css` contains prohibited legacy Arena geometry classes.

### Task 4: Delete the FIGHT announcer path

**Files:**
- Modify: `src/audio.ts`
- Modify or delete behavior from: `scripts/patch-single-fight.mjs`
- Modify: `package.json` only if the obsolete patch should be removed from the build chain.

**Interfaces:**
- Consumes: existing audio scene/music/SFX system.
- Produces: audio system with no FIGHT announcer trigger or SFX playback path.

- [ ] **Step 1: Remove FIGHT state and mutation detection**

Delete `fightPlayedForMatch` and the `/\bFIGHT\b/` mutation branch.

- [ ] **Step 2: Remove FIGHT playback from normalized SFX handling**

Remove `fight` from any Arena ducking condition and stop `patch-single-fight.mjs` from reintroducing it. Prefer removing that patch from the build script if nothing else depends on it.

- [ ] **Step 3: Run audio regression**

Expected: no FIGHT announcer path exists; other card/attack/destroy/Zon X/win audio remains.

### Task 5: Build verification and production deployment

**Files:**
- Modify only if failures reveal real defects.

**Interfaces:**
- Consumes: Tasks 1–4.
- Produces: successful Vercel deployment with new Arena architecture.

- [ ] **Step 1: Run full build pipeline**

Expected: all Arena, audio, engine, networking, lobby, and gameplay regression tests pass; TypeScript passes; Vite builds.

- [ ] **Step 2: Inspect build errors if any**

Fix only the reported defect; do not add legacy compatibility classes or geometry.

- [ ] **Step 3: Verify production commit status**

Do not call the Arena visually correct from CI alone. Confirm only that the new zero-legacy architecture is deployed; visual correctness requires live screenshot/browser verification.
