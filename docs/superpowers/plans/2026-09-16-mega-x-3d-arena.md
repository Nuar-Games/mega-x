# Mega X 3D Arena Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build an opt-in React Three Fiber 3D Mega X arena that can complete a real Practice match using the existing authoritative game logic, then prove visuals, responsiveness, fullscreen, and low-end performance before any default replacement decision.

**Architecture:** Keep the existing game engine and DOM action controls authoritative. Add a React Three Fiber presentation/input layer mounted only for `?arena=3d`, with a DOM HUD for prompts/commands and a graceful fallback to the existing arena if 3D boot fails. Drive camera, cards, zones, effects, and quality profiles from a normalized arena state bridge.

**Tech Stack:** React 19, Vite 7, TypeScript 5.9, three, @react-three/fiber, @react-three/drei, @react-three/postprocessing.

**Spec:** `docs/superpowers/specs/2026-09-16-mega-x-3d-arena-design.md`

## Global Constraints

- Work only on `arena-clean-rebuild`.
- Do not modify or merge into `main`.
- Existing Mega X game logic remains authoritative.
- The existing working arena stays default until Gates 1–4 pass.
- 3D development is opt-in with `?arena=3d`.
- No fake screenshots or mockups count as proof.
- Real card textures, real game state, and real legal actions are required.
- Desktop, landscape mobile, portrait mobile, fullscreen, and low-quality mode are required.
- Free-tier deployment must remain viable.

---

### Task 1: Add 3D runtime dependencies and opt-in boot gate

**Files:**
- Modify: `package.json`
- Modify: `src/arena-loader.ts`
- Create: `src/game/arena3d/Arena3DBoot.tsx`
- Test: `tests/arena_3d_boot_regression.mjs`

**Interfaces:**
- Consumes: existing `.duel-shell` and current arena fallback.
- Produces: `shouldUseArena3D(search:string): boolean` and `mountArena3D(shell:HTMLElement): Promise<() => void>`.

- [ ] Write a failing regression test that requires the 3D loader to activate only when `arena=3d` is present and requires imports for React Three Fiber dependencies.
- [ ] Run `node tests/arena_3d_boot_regression.mjs`; expect FAIL because the 3D boot module and dependencies do not exist.
- [ ] Add `three`, `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing` to dependencies.
- [ ] Implement `shouldUseArena3D` and dynamic 3D mounting in `arena-loader.ts`; default path must leave the fallback untouched.
- [ ] Implement `Arena3DBoot.tsx` with a protected React root that removes itself and restores fallback visibility on unmount or boot failure.
- [ ] Re-run the regression test; expect PASS.
- [ ] Commit `feat: add opt-in Mega X 3D arena boot path`.

### Task 2: Build authoritative state/action bridge for 3D

**Files:**
- Create: `src/game/arena3d/Arena3DStateBridge.ts`
- Reuse/read: `src/game/arena/ArenaStateAdapter.ts`
- Test: `tests/arena_3d_state_bridge_regression.mjs`

**Interfaces:**
- Produces: `readArena3DState(shell): ArenaRenderState`, `dispatchArena3DAction(shell, actionId): boolean`, and `subscribeArena3DState(shell, listener): () => void`.

- [ ] Write a failing test requiring reuse of the existing normalized arena state and stable `data-arena-action-id` dispatch.
- [ ] Run the test; expect FAIL.
- [ ] Implement the bridge without creating a second rules/state model.
- [ ] Ensure disabled controls never dispatch and DOM mutations trigger debounced state refresh.
- [ ] Re-run the test; expect PASS.
- [ ] Commit `feat: bridge authoritative Mega X state into 3D arena`.

### Task 3: Build Gate 1 perspective arena shell with real cards and DOM HUD

**Files:**
- Create: `src/game/arena3d/Arena3DRoot.tsx`
- Create: `src/game/arena3d/Arena3DScene.tsx`
- Create: `src/game/arena3d/Arena3DTable.tsx`
- Create: `src/game/arena3d/Arena3DCard.tsx`
- Create: `src/game/arena3d/Arena3DZones.tsx`
- Create: `src/game/arena3d/Arena3DHUD.tsx`
- Create: `src/game/arena3d/arena3d.css`
- Test: `tests/arena_3d_shell_regression.mjs`

**Interfaces:**
- `Arena3DRoot({shell})` owns Canvas and state subscription.
- `Arena3DCard` consumes real card image URLs and optional action ids.
- `Arena3DHUD` consumes phase, prompt, timer, legal actions and dispatch callback.

- [ ] Write a failing structural test requiring perspective camera, Canvas, real card texture loading, visible DOM prompt, command rail/strip, and no opaque full-screen command overlay.
- [ ] Run test; expect FAIL.
- [ ] Implement dark physical battle table geometry with recessed side fixtures and central combat line.
- [ ] Render player/opponent hands, VS slots, deck, discard, Zon X, and effects from real `ArenaRenderState` card URLs.
- [ ] Implement touch-first card click priority: primary action -> chooser -> inspect.
- [ ] Implement always-visible DOM prompt and legal commands outside card regions.
- [ ] Add fullscreen control and responsive Canvas sizing.
- [ ] Re-run test; expect PASS.
- [ ] Commit `feat: render real Mega X match state in 3D arena`.

### Task 4: Add camera rig and deterministic card motion

**Files:**
- Create: `src/game/arena3d/Arena3DCameraRig.tsx`
- Create: `src/game/arena3d/Arena3DTransitions.ts`
- Modify: `src/game/arena3d/Arena3DScene.tsx`
- Modify: `src/game/arena3d/Arena3DCard.tsx`
- Test: `tests/arena_3d_motion_regression.mjs`

**Interfaces:**
- Produces camera modes `overview | set-vs | attack | inspect | result`.
- Produces transition events for draw, VS placement, discard, Zon X, effect activation, and result.

- [ ] Write a failing test requiring all camera modes and named transition events.
- [ ] Run test; expect FAIL.
- [ ] Implement damped camera transitions with reduced-motion handling.
- [ ] Animate deck-to-hand draw, hand-to-VS placement, field-to-discard/Zon X movement, and inspect lift.
- [ ] Keep animation deterministic from previous/current state snapshots; do not mutate rules state.
- [ ] Re-run test; expect PASS.
- [ ] Commit `feat: add cinematic 3D camera and card transitions`.

### Task 5: Add visible combat/effect FX and result presentation

**Files:**
- Create: `src/game/arena3d/Arena3DFX.tsx`
- Modify: `src/game/arena3d/Arena3DScene.tsx`
- Modify: `src/game/arena3d/Arena3DRoot.tsx`
- Test: `tests/arena_3d_fx_regression.mjs`

**Interfaces:**
- Consumes state deltas and quality profile.
- Produces attack trail, impact flash, particle burst, camera impulse, stat pulse, effect activation, phase transition, victory/defeat presentation.

- [ ] Write a failing test requiring all mandated FX event names and quality/reduced-motion gates.
- [ ] Run test; expect FAIL.
- [ ] Implement attack lunge/trail and impact burst with localized emissive geometry/particles.
- [ ] Implement bounded camera shake for heavy impacts.
- [ ] Add stat/score feedback, effect activation pulse, turn transition treatment, and result sequence.
- [ ] Ensure low/reduced-motion mode limits or disables expensive layers.
- [ ] Re-run test; expect PASS.
- [ ] Commit `feat: add Mega X 3D combat effects and result sequences`.

### Task 6: Add quality profiles and low-end safeguards

**Files:**
- Create: `src/game/arena3d/Arena3DQuality.ts`
- Modify: `src/game/arena3d/Arena3DRoot.tsx`
- Modify: `src/game/arena3d/Arena3DFX.tsx`
- Modify: `src/game/arena3d/Arena3DHUD.tsx`
- Test: `tests/arena_3d_quality_regression.mjs`

**Interfaces:**
- Produces `high | medium | low` with DPR, shadow, bloom, particle, trail, shake settings.

- [ ] Write a failing test requiring exact profile ceilings: High DPR <=1.75, Medium <=1.25, Low =1.0 and no bloom.
- [ ] Run test; expect FAIL.
- [ ] Implement heuristic default and manual override stored only as presentation preference.
- [ ] Wire DPR, shadows, postprocessing, particles, trails, and shake to profiles.
- [ ] Add WebGL capability fallback to the working arena.
- [ ] Re-run test; expect PASS.
- [ ] Commit `perf: add scalable 3D arena quality profiles`.

### Task 7: Prove full Practice match interaction and responsive layouts

**Files:**
- Create/modify: `scripts/arena-3d-visual-qa.mjs`
- Create/modify: `tests/arena_3d_full_match_regression.mjs`
- Modify affected 3D files from failures only.

**Interfaces:**
- Browser QA must exercise real authoritative controls through `?arena=3d`.

- [ ] Add a browser QA flow that enters Practice as guest and plays through all reachable phases using visible 3D/DOM controls.
- [ ] Capture desktop, landscape mobile, and portrait mobile screenshots from the deployed branch.
- [ ] Assert prompt visibility, action reachability, no command/card overlap, fullscreen recovery, and result exit.
- [ ] Run the full-match QA; fix only observed failures, adding a regression assertion for each.
- [ ] Commit `qa: prove complete Practice match in Mega X 3D arena`.

### Task 8: Acceptance gate report and replacement hold

**Files:**
- Create: `docs/arena-3d-acceptance.md`
- Modify: none of the default arena selection unless the user explicitly approves after playtesting.

**Interfaces:**
- Produces identified commit SHA, deployed branch URL, screenshots/artifacts, build/test evidence, and gate-by-gate result.

- [ ] Run `npm test` and `npm run build`; require zero failures.
- [ ] Verify deployment READY for the exact commit.
- [ ] Record screenshots/evidence for desktop, landscape mobile, portrait mobile, attack/impact, transition, and result states.
- [ ] Document Gates 1–4 as pass/fail with concrete evidence.
- [ ] Keep 3D opt-in even if all gates pass until direct user playtesting and explicit approval.
- [ ] Commit `docs: record Mega X 3D arena acceptance evidence`.
