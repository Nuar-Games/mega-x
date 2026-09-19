# Mega X Arena Contract Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Define the renderer-independent ArenaState and versioned presentation-event stream that the total arena rewrite will consume without reading React DOM.

**Architecture:** The existing server/game engine remains authoritative. Each accepted server state version is projected into a serializable `ArenaState`. A separate ordered `ArenaEventEnvelope` stream describes presentation-worthy transitions between authoritative versions; the future renderer consumes events for animation and always settles to the accompanying authoritative state. Reconnect/recovery is state-only: rebuild from `ArenaState` with no special visual sync path.

**Tech Stack:** TypeScript 5.9, existing Mega X server engine, Node regression tests. Phaser remains a later renderer concern and is deliberately excluded from Phase 2.

**Spec:** Phase 1 audit approved in chat on 2026-09-19; accepted desktop/mobile mockups remain the locked visual source of truth.

## Global Constraints

- Total arena presentation rewrite; do not layer the new arena over the old arena.
- No renderer may scrape DOM, use `MutationObserver`, or synthesize state from rendered React controls.
- No direct React state mutation of future Phaser/Pixi objects.
- Server/game state remains authoritative for gameplay.
- ArenaState must be serializable and sufficient to rebuild the arena after reconnect.
- Presentation events are ordered and versioned; renderer animation must not become gameplay truth.
- No `transform: scale()` arena architecture.
- No renderer/layout/art work in Phase 2.
- Existing online rules, Practice rules, networking, auth, ranking, and server data are not redesigned here.
- Hidden opponent cards and Master Deck card identities must remain hidden exactly as server redaction intends.

---

### Task 1: Lock the contract with a regression test

**Files:**
- Create: `tests/arena_next_contract_regression.mjs`
- Test: `tests/arena_next_contract_regression.mjs`

**Interfaces:**
- Consumes: repository source files.
- Produces: regression assertions that require the new contract files, direct typed state, ordered versioned events, and prohibit DOM-bridge dependencies.

- [ ] **Step 1: Write the failing regression test**

The test must require `src/game/arena-next/ArenaState.ts`, `src/game/arena-next/ArenaEvents.ts`, and `src/game/arena-next/ArenaEventQueue.ts`, verify the required contract symbols, and reject `document`, `querySelector`, `MutationObserver`, and `.click()` in the new contract directory.

- [ ] **Step 2: Run the test and verify RED**

Run: `node tests/arena_next_contract_regression.mjs`
Expected: FAIL because `src/game/arena-next/ArenaState.ts` does not exist yet.

### Task 2: Define serializable ArenaState

**Files:**
- Create: `src/game/arena-next/ArenaState.ts`

**Interfaces:**
- Produces: `ArenaState`, `ArenaPlayerState`, `ArenaCardState`, `ArenaVsState`, `ArenaEffectState`, `ArenaStats`, `ArenaPendingChoice`, `ArenaConnectionState`, and `ArenaMatchIdentity`.

- [ ] **Step 1: Implement only serializable state types**

The types must cover match/version identity, player handles/start ranks, local player index, round/phase/turns, one Master Deck count, local visible hand/opponent hand count, VS/effects/Zon Tepi/Zon X, exactly five logical Effect slots maximum, ATK/DEF/STA, pending choices, result, and connection/reconnect state.

- [ ] **Step 2: Keep hidden information representable without fabricating identities**

Opponent hand is a count, not fake card objects. Master Deck is a count, not fake card objects.

### Task 3: Define the presentation event stream

**Files:**
- Create: `src/game/arena-next/ArenaEvents.ts`

**Interfaces:**
- Consumes: `ArenaState` identifiers and version numbers.
- Produces: `ArenaEvent`, `ArenaEventType`, and `ArenaEventEnvelope`.

- [ ] **Step 1: Define semantic presentation events**

Cover VS set, card draw, effect play/trigger, card move/capture/destroy/return/discard, position change, stat change, attack declaration/resolution, phase/turn change, tie-breaker reveal, match end, and state reconciliation.

- [ ] **Step 2: Version every envelope**

Each envelope must carry `matchId`, monotonically increasing `sequence`, `fromVersion`, `toVersion`, and the event payload.

### Task 4: Add an engine-independent event queue

**Files:**
- Create: `src/game/arena-next/ArenaEventQueue.ts`

**Interfaces:**
- Consumes: `ArenaEventEnvelope`.
- Produces: ordered `enqueue`, `peek`, `shift`, `clear`, `size`, and stale/duplicate rejection.

- [ ] **Step 1: Implement deterministic ordering**

Reject envelopes for another match, duplicate sequence numbers, versions older than the last settled version, or `toVersion < fromVersion`.

- [ ] **Step 2: Support reconnect reset**

Provide `resetForState(matchId, settledVersion)` which empties presentation events and records the authoritative version so the future renderer can rebuild directly from state.

### Task 5: Verify the Phase 2 boundary

**Files:**
- Test: `tests/arena_next_contract_regression.mjs`

**Interfaces:**
- Consumes: all Phase 2 contract files.
- Produces: a green static regression gate before renderer work begins.

- [ ] **Step 1: Run the focused regression test**

Run: `node tests/arena_next_contract_regression.mjs`
Expected: PASS.

- [ ] **Step 2: Run all regression tests**

Run: `npm test`
Expected: all existing regression tests pass unchanged.

- [ ] **Step 3: Stop before renderer work**

Phase 2 ends with the contract and queue only. Phaser scene creation starts in Phase 3, not here.
