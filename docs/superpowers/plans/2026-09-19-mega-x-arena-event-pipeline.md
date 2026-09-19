# Mega X Arena Event Pipeline Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Prove the isolated Phaser renderer can consume an ordered sequence of gameplay presentation events and always settle to the supplied authoritative ArenaState.

**Architecture:** Phase 4 remains isolated from App/network code. A deterministic prototype fixture supplies successive authoritative ArenaState snapshots paired with versioned ArenaEventEnvelope entries. Phaser animates semantic transitions only; after each animation it calls `rebuildFromState(nextState)`. Unsupported or reconciliation events immediately rebuild from state rather than creating a special sync path.

**Tech Stack:** TypeScript 5.9, Phaser 3.90, existing ArenaState/ArenaEvents/ArenaEventQueue, Vite multi-page prototype build.

**Spec:** Phase 1 audit approved in chat; Phase 2 contract and Phase 3 isolated renderer are already on `arena-total-rewrite`.

## Global Constraints

- Remain on `arena-total-rewrite`; do not modify `arena-clean-rebuild` or `main`.
- No React arena state, DOM scraping, MutationObserver, synthetic clicks, or old-arena presentation reuse.
- No networking/App integration in Phase 4.
- No visual redesign; gray programmer art remains intentional.
- Every presentation event must settle to the paired authoritative `ArenaState`.
- State reconciliation/reconnect must rebuild from state rather than replaying guessed animations.
- No global `transform: scale()` layout technique.
- Continue using one desktop profile only in Phase 4.

---

### Task 1: Lock Phase 4 with a regression gate

**Files:**
- Create: `tests/arena_next_event_pipeline_regression.mjs`

**Interfaces:**
- Consumes: Phase 4 fixture, scene, and prototype driver.
- Produces: static regression assertions for required semantic events and authoritative settlement.

- [ ] Require fixture coverage for `CARD_DRAWN`, `EFFECT_PLAYED`, `EFFECT_TRIGGERED`, `ATTACK_DECLARED`, `CARD_CAPTURED`, `CARD_DESTROYED`, `CARD_DISCARDED`, `STAT_CHANGED`, `PHASE_CHANGED`, `TURN_CHANGED`, and `STATE_RECONCILED`.
- [ ] Require scene handlers for draw/effect/attack/move/stat/reconciliation families.
- [ ] Require every animated path to end in `rebuildFromState(nextState)`.
- [ ] Reject React, MutationObserver, querySelector, click bridges, and global transform scaling.

### Task 2: Build a deterministic event/state sequence

**Files:**
- Modify: `src/game/arena-next/prototype/prototypeFixture.ts`

**Interfaces:**
- Produces: `prototypeEventSequence: Array<{ envelope: ArenaEventEnvelope; state: ArenaState }>`.

- [ ] Start from the existing VS_SET transition.
- [ ] Add successive versioned snapshots for draw, effect play, effect trigger/stat change, attack, capture, discard/destroy, phase/turn change, and reconciliation.
- [ ] Keep opponent hidden-hand identities absent throughout.

### Task 3: Add semantic Phaser event animations

**Files:**
- Modify: `src/game/arena-next/prototype/ArenaPrototypeScene.ts`

**Interfaces:**
- Consumes: `ArenaEventEnvelope` + authoritative `ArenaState`.
- Produces: event-specific animation promises that always settle to `nextState`.

- [ ] Add helpers for locating hand, deck, VS, Effect, Zon X, Zon Tepi, stats, and phase anchors.
- [ ] Animate draw from Master Deck toward hand.
- [ ] Animate effect play from hand to first matching/open Effect slot and pulse effect trigger.
- [ ] Animate attack as a short VS lunge/impact.
- [ ] Animate capture toward Zon X and destroy/discard toward Zon Tepi.
- [ ] Animate stat/phase/turn changes as short panel pulses.
- [ ] Handle `STATE_RECONCILED` with immediate authoritative rebuild and no guessed transition.
- [ ] Any unsupported event must also rebuild immediately.

### Task 4: Drive the full sequence through ArenaEventQueue

**Files:**
- Modify: `src/game/arena-next/prototype/main.ts`

**Interfaces:**
- Consumes: `prototypeEventSequence` and `ArenaEventQueue`.
- Produces: sequential queue-driven playback with no overlapping event mutations.

- [ ] Enqueue the full ordered event sequence.
- [ ] Consume one envelope at a time and await `scene.consumeEvent()` before the next event.
- [ ] Keep the current authoritative state in the driver only to select the correct paired next snapshot; renderer remains presentation-only.

### Task 5: Verify production build/deployment

**Files:**
- Test: `tests/arena_next_event_pipeline_regression.mjs`
- Build: existing Vite multi-page setup.

- [ ] Run focused regression when an execution runner is available.
- [ ] Run all regressions when an execution runner is available.
- [ ] Verify Vercel preview reaches READY.
- [ ] Fetch `/arena-next-prototype.html` and require HTTP 200.
- [ ] Stop before real online/practice match integration; that begins in Phase 5.
