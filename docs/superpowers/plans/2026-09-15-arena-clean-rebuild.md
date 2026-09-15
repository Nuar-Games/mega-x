# Mega X Clean Arena Rebuild Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the patch-layered match presentation with one asset-driven Phaser arena that supports all current Mega X match features and loads only when a match begins.

**Architecture:** Keep the existing authoritative rules/backend and outer React shell. Introduce a self-contained `src/game/arena/` runtime with one scene, one layout system, one state adapter, one input adapter, one asset manifest and one effects/audio pipeline. The landing/lobby path dynamically imports the arena only when `.duel-shell` exists, so Phaser and arena assets stay out of startup.

**Tech Stack:** TypeScript, Phaser 3, React 19 outer shell, Vite 7, existing Supabase client/backend, Node regression tests.

**Spec:** `docs/superpowers/specs/2026-09-15-arena-clean-rebuild-design.md`

## Global Constraints
- `main` remains untouched.
- Existing Supabase data and migrations are not modified.
- Existing authoritative game rules remain authoritative.
- No new patch-script chain is added to the arena.
- No stack of arena CSS override files is introduced.
- Portrait mobile is primary; landscape and desktop use the same semantic layout.
- Phaser and arena assets must not load on landing/lobby.
- Existing Mega X cards, backs, logo, VS art and audio are reused intentionally.

---

### Task 1: Establish the clean arena package and asset manifest

**Files:**
- Create: `src/game/arena/ArenaAssets.ts`
- Create: `src/game/arena/arena-theme.ts`
- Create: `tests/arena_clean_asset_manifest_regression.mjs`
- Modify: `package.json`

**Interfaces:**
- Produces: `ARENA_ASSETS`, `cardGameUrl(id)`, `cardInspectUrl(id)`, `ARENA_THEME`.

- [ ] **Step 1:** Add a regression test that requires exactly one asset manifest, all 30 game card paths, inspection paths, both card backs, logo, VS art and existing event audio mappings.
- [ ] **Step 2:** Add Phaser as an explicit dependency and make the test runnable from the normal test pipeline without adding patch scripts.
- [ ] **Step 3:** Implement `ArenaAssets.ts` with typed static paths and helper functions for 01-30 card IDs.
- [ ] **Step 4:** Implement `arena-theme.ts` with layout-independent constants for black/metal/white, player blue, opponent red and decisive gold only.
- [ ] **Step 5:** Run the new regression test and existing card/audio regressions.

### Task 2: Build one viewport-native layout system

**Files:**
- Create: `src/game/arena/ArenaLayout.ts`
- Create: `tests/arena_clean_layout_regression.mjs`

**Interfaces:**
- Consumes: viewport width/height.
- Produces: `computeArenaLayout(width:number,height:number): ArenaLayoutSnapshot` with semantic regions `opponent`, `opponentHand`, `combat`, `localHand`, `deck`, `discard`, `effectLeft`, `effectRight`, `zonXLeft`, `zonXRight`, `hud`, `prompt`.

- [ ] **Step 1:** Write regression assertions for 412x915, 915x412, 1366x768 and 1920x1080 ensuring every required region stays inside the viewport and local hand/combat area receive the largest useful share.
- [ ] **Step 2:** Implement `computeArenaLayout` with portrait and wide branches based on aspect ratio only, not device names.
- [ ] **Step 3:** Verify no fixed 780x1110 scaling contract exists in the new arena path.
- [ ] **Step 4:** Run the layout test.

### Task 3: Define a renderer-safe match state adapter

**Files:**
- Create: `src/game/arena/ArenaStateAdapter.ts`
- Create: `tests/arena_clean_state_adapter_regression.mjs`

**Interfaces:**
- Produces: `ArenaRenderState` containing player/opponent identities, hands, VS cards, deck counts, discard cards, effect slots, Zon X cards, phase, prompt, timer, legal actions, result and connection state.
- Produces: `readArenaRenderState(shell: HTMLElement): ArenaRenderState` as the bridge from the existing match DOM/state contract without changing backend rules.

- [ ] **Step 1:** Write fixtures for Practice and online shell states and assert equivalent renderer output.
- [ ] **Step 2:** Implement a conservative DOM adapter that reads existing data attributes/classes and image sources but never mutates rules state.
- [ ] **Step 3:** Add safe defaults for reconnect/degraded/partial state so the arena never crashes on missing optional UI.
- [ ] **Step 4:** Run the adapter test.

### Task 4: Implement the complete Phaser arena scene before polish

**Files:**
- Create: `src/game/arena/ArenaScene.ts`
- Create: `src/game/arena/ArenaCards.ts`
- Create: `src/game/arena/ArenaHud.ts`
- Create: `src/game/arena/ArenaEffects.ts`
- Create: `tests/arena_clean_scene_regression.mjs`

**Interfaces:**
- `ArenaScene` consumes `ArenaRenderState` and `ArenaLayoutSnapshot`.
- `ArenaCards.render(state,layout)` owns all card/deck/discard/VS/Zon X visual objects.
- `ArenaHud.render(state,layout)` owns compact names, deck count, phase, timer and prompt.
- `ArenaEffects.transition(prev,next)` owns selection, VS entry, attack, destruction, effect, Zon X, turn and result motion.

- [ ] **Step 1:** Write static scene regressions requiring all semantic render modules and forbidding dependency on `arena-stage.css`, `arena-premium.css`, `arena-mobile-priority.css`, `arena-usability.css`, `arena-player-role.css` from the new arena package.
- [ ] **Step 2:** Implement background and arena framing using Phaser graphics plus real Mega X background/VS assets, with cards kept as the largest interactive objects.
- [ ] **Step 3:** Implement opponent hand, local hand, VS cards, deck, discard, Effect and Zon X fixtures from `ArenaRenderState`.
- [ ] **Step 4:** Implement contextual prompt/HUD and full-screen result state.
- [ ] **Step 5:** Implement transition hooks for draw, selection, VS entry, attack, destruction, Zon X, turn change and result.
- [ ] **Step 6:** Run the scene regression.

### Task 5: Wire touch/input and existing actions

**Files:**
- Create: `src/game/arena/ArenaInput.ts`
- Create: `tests/arena_clean_input_regression.mjs`

**Interfaces:**
- Produces: `bindArenaInput(scene,state,getHitTarget,dispatch)`.
- Dispatches existing DOM actions only: card selection, effect, VS placement, attack, pass, discard choice, tie-breaker choice, quit/return and audio toggle.

- [ ] **Step 1:** Write tests that map renderer actions to existing semantic DOM controls instead of duplicating game rules.
- [ ] **Step 2:** Implement card-first interaction: tap a card to focus, then expose only legal contextual actions from `ArenaRenderState.legalActions`.
- [ ] **Step 3:** Implement safe no-op behavior when an action disappears between render and tap.
- [ ] **Step 4:** Run input tests plus existing gameplay-flow regressions.

### Task 6: Add arena audio and lazy bootstrap

**Files:**
- Create: `src/game/arena/ArenaAudio.ts`
- Create: `src/game/arena/bootstrapArena.ts`
- Create: `src/arena-loader.ts`
- Modify: `src/main.tsx`
- Modify: `index.html`
- Create: `tests/arena_clean_lazy_load_regression.mjs`

**Interfaces:**
- `bootstrapArena(shell)` creates/destroys one Phaser game for the active `.duel-shell`.
- `arena-loader.ts` dynamically imports the arena package only when `.duel-shell` appears.

- [ ] **Step 1:** Write a regression test asserting `main.tsx` has no eager Phaser/arena runtime/CSS imports and that the loader uses dynamic import.
- [ ] **Step 2:** Implement one MutationObserver in `arena-loader.ts` that mounts on shell appearance, destroys on shell removal and never creates duplicate games.
- [ ] **Step 3:** Implement `ArenaAudio` using existing Mega X event sounds and user audio state.
- [ ] **Step 4:** Add a tiny inline dark boot background to `index.html` so Android never shows a white application canvas while JS starts.
- [ ] **Step 5:** Replace eager arena imports in `main.tsx` with only `./arena-loader.ts`.
- [ ] **Step 6:** Run lazy-load regressions.

### Task 7: Remove the rebuilt path from the patch pile and make build deterministic

**Files:**
- Modify: `package.json`
- Create: `scripts/verify-clean-arena.mjs`
- Create: `tests/arena_clean_build_pipeline_regression.mjs`

**Interfaces:**
- Produces: a deterministic build path where the new arena source is not rewritten by patch scripts.

- [ ] **Step 1:** Add a regression that fails if any `patch-arena-*` script is required to produce or rewrite files under `src/game/arena/`.
- [ ] **Step 2:** Keep legacy recovery/patch scripts only where the old outer shell still depends on them; explicitly verify they cannot modify the new arena package.
- [ ] **Step 3:** Add `verify-clean-arena.mjs` to check file ownership, imports and absence of forbidden arena override dependencies.
- [ ] **Step 4:** Run full build and fix compile/test failures until green without adding compatibility patches to the new arena package.

### Task 8: Finish first, then stress test and fix real defects

**Files:**
- Create: `tests/arena_clean_practice_stress.mjs`
- Modify: `.github/workflows/visual-qa.yml` if present
- Modify only clean arena source files for defects found during this task.

**Interfaces:**
- Stress runner uses existing Practice match functions and seeded runs.
- Visual QA captures the branch preview at 412x915, 915x412, 1366x768 and 1920x1080.

- [ ] **Step 1:** Run all existing regressions after the entire arena feature surface is integrated.
- [ ] **Step 2:** Run at least 1000 seeded Practice matches, including deck exhaustion, immediate quit, effect-heavy turns and repeated enter/quit/re-enter lifecycles.
- [ ] **Step 3:** Build production bundle and record initial JS/CSS versus dynamic arena/Phaser chunks; verify Phaser is absent from initial landing payload.
- [ ] **Step 4:** Deploy the clean branch preview only after build is green.
- [ ] **Step 5:** Run automated visual QA at all four target viewports and inspect screenshots.
- [ ] **Step 6:** Fix only defects revealed by stress/visual QA; do not redesign architecture during this phase.
- [ ] **Step 7:** Repeat build, stress and visual QA until all gates pass.

## Completion Gate
The branch is not considered deliverable until: build passes; initial landing path does not load Phaser; arena mounts/dismounts reliably; Practice and online use the same renderer; all existing gameplay regressions pass; 1000 seeded Practice matches complete without renderer failure; automated screenshots show a filled, readable game composition on phone/landscape/desktop; and `main` remains untouched.
