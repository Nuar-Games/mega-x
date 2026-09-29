# Arena Board v2 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the owner-approved phone-first Arena v2 with viewer-relative ownership, real card art, safe inspect interactions, preserved command targets, and screenshot-backed E2E coverage.

**Architecture:** Introduce one viewer-relative Arena layout function indexed by real player id but physically mapped from `localPlayerIndex`; Phaser rendering and `ArenaPointerTargets` both consume it. Keep authoritative state/game logic unchanged. Card inspect is a React overlay driven by scene selection callbacks, while command execution continues through existing legal commands.

**Tech Stack:** React, TypeScript, Phaser 3, Playwright, existing ArenaState/ArenaCommandSurface/ArenaPointerTargets pipeline.

**Spec:** `docs/superpowers/specs/2026-09-28-arena-board-v2-design.md`

## Global Constraints
- Branch starts from `ed4f1925236253ac97f80b919928658d91ebe30b` exactly.
- Viewer is always bottom/blue; opponent always top/red using `state.identity.localPlayerIndex`.
- Primary viewport is 390×844 portrait; desktop uses the same centered composition.
- No game-rule, engine, Supabase, production, `main`, `submitEmailAuth`, or deployment changes.
- Existing `ArenaPointerTargets` semantics must remain usable by current E2E drivers.
- Zon X/Zon Tepi are public, newest-first, read-only inspect carousels; empty zones do nothing.
- A single hand-card tap never directly plays a card.

## Review Focus
- localPlayerIndex=1 must still render viewer bottom and opponent top; Online E2E asserts both clients independently.
- A hand-card inspect open/close must not increment stateVersion; Practice E2E asserts no play occurs.
- Pointer targets must stay aligned with the portrait layout; full Practice/Online action-driving tests exercise the match lifecycle.
- Empty public zones must not open inspect; regression/scene logic guards empty arrays.
- Practice start re-entry while profile loading must not create duplicate local matches; source regression guards the latch.

---

### Task 1: Viewer-relative Arena layout

**Files:**
- Modify: `src/game/arena-next/prototype/ArenaPrototypeLayout.ts`
- Modify: `src/game/arena-next/ArenaPointerTargets.ts`
- Test: `tests/arena_board_v2_regression.mjs`
- Modify: `scripts/verify-all.mjs`

**Interfaces:**
- Produces: `createArenaBoardLayout(width:number,height:number,localPlayerIndex:0|1): ArenaPrototypeLayout`
- Layout arrays remain indexed by real player index while their physical coordinates are viewer-relative.

- [ ] Add a failing source regression asserting the new layout API, local/opponent mapping markers, portrait-first markers, and removal of the desktop-only API reference from pointer targets.
- [ ] Run the regression and confirm failure.
- [ ] Replace the landscape-only layout with a portrait-centered board model and migrate `ArenaPointerTargets` to it.
- [ ] Run regression/build/typecheck and confirm pass.

### Task 2: Phone-first Phaser board + real card art

**Files:**
- Modify: `src/game/arena-next/prototype/ArenaPrototypeScene.ts`
- Modify: `src/game/arena-next/ArenaNextRuntime.tsx`
- Test: `tests/arena_board_v2_regression.mjs`

**Interfaces:**
- Scene consumes `createArenaBoardLayout` and `ArenaState.artSrc`.
- Scene produces card inspect selection events through a callback registered by Runtime.
- Runtime keeps the existing hidden `data-arena-status` contract for E2E.

- [ ] Extend regression to require real-card/back-card paths, viewer-relative labels/colors, hidden diagnostic status, timer/turn markers, and no visible `ARENA NEXT ·` debug surface.
- [ ] Implement board rendering, card texture loading/fallback, face-down opponent hand, live stats/positions, timer ring, turn indicator, action area, hand fan, and centered desktop behavior.
- [ ] Preserve all existing legal command dispatch paths and event animations.
- [ ] Run regression/build/typecheck.

### Task 3: Card inspect overlay

**Files:**
- Create: `src/game/arena-next/ArenaCardInspect.tsx`
- Modify: `src/game/arena-next/ArenaNextRuntime.tsx`
- Modify: `src/game/arena-next/prototype/ArenaPrototypeScene.ts`
- Test: `tests/arena_board_v2_regression.mjs`

**Interfaces:**
- `ArenaInspectSelection` carries owner, source (`HAND|VS|EFFECT|ZON_X|ZON_TEPI`), ordered cards, selected index, and whether play is allowed.
- Runtime owns pinned/hover inspect state and dispatches an existing legal command only from `MAIN KAD INI` / explicit position choice.

- [ ] Add failing regression markers for inspect art path, carousel order, read-only zones, overlay close behavior, and no tap-to-play dispatch.
- [ ] Build inspect component with dim/blur, large inspect art, arrows, swipe, outside close, close button, owner-colored border, timer preservation, and play button only for legal local-hand cards.
- [ ] Wire scene click/hover callbacks for hand/VS/effect/public-zone cards; empty zones do nothing and zone order is newest-first.
- [ ] Run regression/build/typecheck.

### Task 4: Practice double-start guard

**Files:**
- Modify: `src/root.tsx`
- Test: `tests/arena_board_v2_regression.mjs`

**Interfaces:**
- A ref/latch prevents re-entry while `startPractice` is awaiting profile/match creation and clears after completion.

- [ ] Add failing regression for the guard marker.
- [ ] Add the minimal guard without changing practice rules.
- [ ] Run regression/build/typecheck.

### Task 5: Practice E2E visual/interaction proof

**Files:**
- Modify: `tests-e2e/arena_3d_set_vs_real_pointer.spec.ts`

**Interfaces:**
- Reads DOM probes/data attributes exposed by Runtime/board for local/opponent VS bounds and timer depth.
- Writes `practice-phone-board.png` and `practice-inspect.png` into Playwright `test-results/`.

- [ ] Change Practice viewport to 390×844.
- [ ] Assert local VS center is below half-height and opponent VS center above half-height after VS are set.
- [ ] Assert timer visual depth/overlay marker is above card layers.
- [ ] Open a hand-card inspect, screenshot it, close it, and assert stateVersion did not change.
- [ ] Save a full phone-board screenshot and keep full-match lifecycle assertions unchanged.

### Task 6: Online E2E ownership proof

**Files:**
- Modify: `tests-e2e/arena_online_two_player.spec.ts`

**Interfaces:**
- Each page reads viewer-relative VS bound probes from its own Runtime.
- Writes `online-player-1.png` and `online-player-2.png` into `test-results/`.

- [ ] After both players have VS cards, assert on each client that local VS is in the bottom half and opponent VS is in the top half.
- [ ] Save both player screenshots.
- [ ] Preserve reconnect/reconciliation assertions and cleanup.

### Task 7: Full verification and draft PR

**Files:**
- No production file changes expected beyond Tasks 1–4.

- [ ] Run the full build regression suite and E2E typecheck.
- [ ] Run Practice E2E, Online E2E, and Auth E2E once; all must pass.
- [ ] Confirm screenshot files are present in the uploaded `e2e-test-results` artifact.
- [ ] Open a draft PR from `feat/arena-board-v2` into `arena-total-rewrite`.
- [ ] Obtain the automatically generated Vercel preview URL without manually deploying.
- [ ] Report branch, changed files, baseline, exact test results, artifact/screenshots, preview URL, regressions, and status.