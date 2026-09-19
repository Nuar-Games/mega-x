# Mega X Arena Live Match Bridge Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Connect the isolated Phaser arena to one real Mega X active match without routing through the old DOM arena.

**Architecture:** `ActiveOnlineMatch` remains authoritative. A pure projector converts the redacted match snapshot into `ArenaState`; a pure diff derives presentation events between accepted versions; `ArenaLiveController` owns polling/realtime/action submission and feeds the Phaser scene. The scene never calls React controls or mutates gameplay state.

**Tech Stack:** TypeScript 5.9, Phaser 3.90, existing `onlineAuth` match APIs, Vite.

**Spec:** Phase 1–4 arena rewrite contract approved in chat; `arena-total-rewrite` is the isolated rewrite branch.

## Global Constraints

- Do not modify `src/App.tsx` by hand; it is generated.
- Do not use the legacy DOM bridge, `MutationObserver`, `querySelector`, or button `.click()`.
- Do not replace the live arena yet; Phase 5 stays on an isolated development page.
- Preserve hidden opponent hand identities and hidden Master Deck identities.
- Preserve server `state_version` stale-write protection.
- Renderer consumes authoritative state plus semantic events; it is never gameplay truth.
- No `transform: scale()`.
- Real online and local Practice matches must use the same projector/controller boundary.

## Review Focus

- Stale state response: refresh authoritative state and reconcile rather than replaying an optimistic mutation.
- Opponent hidden hand: expose only `handCount`, never fabricated card IDs.
- Remote opponent update: derive events from versioned snapshots or reconcile safely.
- Practice match IDs: continue using the existing `onlineAuth` action functions so the same controller works.
- Paused/reconnecting match: renderer must display the snapshot but must not invent actions.

---

### Task 1: Lock Phase 5 boundary
- [ ] Add `tests/arena_next_live_match_regression.mjs` requiring projector, event diff, live controller, and isolated live HTML entry.
- [ ] Assert forbidden DOM-bridge primitives are absent.

### Task 2: Project real match snapshots
- [ ] Add `ArenaStateProjection.ts` converting `ActiveOnlineMatch` + viewer ID to serializable `ArenaState`.
- [ ] Reproduce the current authoritative VS stat derivation from the existing game implementation.
- [ ] Generate legal commands only for the local viewer from authoritative phase/pending-choice state.

### Task 3: Derive semantic events from accepted state versions
- [ ] Add `ArenaEventDiff.ts` comparing previous/next `ArenaState` and producing ordered `ArenaEventEnvelope[]`.
- [ ] Cover VS set, draw, effect play, capture/discard/destroy moves, position/stat/phase/turn/result changes.
- [ ] Fall back to `STATE_RECONCILED` when a transition cannot be safely inferred.

### Task 4: Add live match controller
- [ ] Add `ArenaLiveController.ts` using `getSavedSession`, `getMyActiveMatch`, `submitMatchEngineAction`, `submitMatchSpecialAction`, realtime subscription, heartbeat and bounded polling.
- [ ] Submit with current `state_version`; on `STALE_MATCH_STATE`, fetch and reconcile.
- [ ] Feed state/events directly to `ArenaPrototypeScene`.

### Task 5: Add isolated real-match page
- [ ] Add `arena-next-live.html` and `prototype/live-main.ts`.
- [ ] Load the user’s currently active match only; do not create matchmaking or bypass the lobby.
- [ ] Add minimal developer controls for one real vertical thread: choose a local hand card and submit `SET_VS` ATK/DEF.
- [ ] Keep all presentation gray/programmer-art; accepted visual cloning starts in Phase 6.

### Task 6: Verify
- [ ] Vite/Vercel production build must succeed with the live page emitted.
- [ ] Fetch the deployed `arena-next-live.html` and confirm HTTP 200.
- [ ] Keep `arena-clean-rebuild` untouched and verify `arena-total-rewrite` is only ahead, not behind.
