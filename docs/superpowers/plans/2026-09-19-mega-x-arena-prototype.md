# Mega X Arena Prototype Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Prove the replacement arena renderer can render one desktop battle profile from `ArenaState`, animate a presentation event, and settle to authoritative state without React or the old arena.

**Architecture:** Phaser owns an isolated WebGL canvas and consumes only `ArenaState` plus `ArenaEventEnvelope`. The prototype uses fake data and gray programmer-art primitives at 1920×1080. A `VS_SET` event animates a temporary card from hand to VS, then the scene rebuilds from the supplied authoritative next state.

**Tech Stack:** Phaser 3.90, TypeScript 5.9, Vite, existing ArenaState/ArenaEventQueue contracts.

**Spec:** Phase 2 contract on `arena-total-rewrite`; accepted desktop/mobile mockups remain locked visual targets for later phases.

## Global Constraints

- Phase 3 is desktop prototype only.
- No App integration, networking, auth, Supabase, Practice bot, or old arena code.
- No React imports or React state in the prototype.
- No DOM state scraping, `MutationObserver`, synthetic button clicks, or old ArenaStateAdapter.
- No `transform: scale()`.
- Use Phaser WebGL canvas with resize-aware coordinates, not page scaling.
- Programmer-art gray boxes only; do not create or reinterpret final arena visuals.
- Renderer must be rebuildable from `ArenaState` alone.
- Event animation is presentation-only and must settle to authoritative `ArenaState`.

---

### Task 1: Lock Phase 3 with regression assertions

Create `tests/arena_next_prototype_regression.mjs` first. Require the isolated prototype files, Phaser WebGL/RESIZE setup, direct ArenaState consumption, a rebuild API, an event-consumption API, and forbid React/DOM bridge/global scaling primitives.

### Task 2: Define the 1920×1080 desktop anchor profile

Create `src/game/arena-next/prototype/ArenaPrototypeLayout.ts`. Return explicit anchors for one deck, two nameplates, two captured counters, two VS slots, five Effect slots per side, two Zon X, two Zon Tepi, two stat bars, and the local hand. Coordinates derive from canvas width/height; no CSS/global scale transform.

### Task 3: Add fake authoritative states and event

Create `src/game/arena-next/prototype/prototypeFixture.ts` with a before-state, after-state, and one `VS_SET` event envelope. Both states must satisfy the Phase 2 ArenaState contract.

### Task 4: Build the isolated Phaser scene

Create `src/game/arena-next/prototype/ArenaPrototypeScene.ts`. Render only programmer-art primitives and text. `rebuildFromState(state)` clears/recreates presentation from state. `consumeEvent(envelope,nextState)` animates `VS_SET` hand→VS and, on completion, calls `rebuildFromState(nextState)`.

### Task 5: Add isolated bootstrap route

Create `src/game/arena-next/prototype/ArenaPrototypeGame.ts`, `src/game/arena-next/prototype/main.ts`, and root `arena-next-prototype.html`. Use Phaser `WEBGL` and `Scale.RESIZE`, full viewport canvas, and no React mount. Start from the fake before-state, enqueue the fake event, then settle to fake after-state.

### Task 6: Verify boundary

Run `node tests/arena_next_prototype_regression.mjs`, then `npm test`, then `npm run build`. Phase 3 is complete only when the isolated prototype compiles and regressions pass. Do not integrate it into the live match yet.
