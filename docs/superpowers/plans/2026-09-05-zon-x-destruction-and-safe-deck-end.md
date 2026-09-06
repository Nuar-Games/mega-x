# VS Destruction Scoring + Safe Deck Exhaustion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make every effect-based VS destruction score to the effect owner's Zon X, make BLACK HOLE exchange VS trophies symmetrically, and make Master Deck exhaustion end only at the next safe gameplay endpoint rather than interrupting unresolved progression.

**Architecture:** Keep the authoritative rule implementation in `supabase/functions/match-action/engine.ts`, with one shared helper for effect-driven VS destruction and one explicit safe-endpoint deck-exhaustion evaluator. Preserve the existing build-repair architecture by updating the gameplay patch script so generated/recovered engine state is repaired to the same semantics on every build. Deploy the resulting `match-action` Edge Function only after local regression gates pass, then verify the Vercel branch preview remains green.

**Tech Stack:** TypeScript, Deno/Supabase Edge Functions, Node-based regression scripts, Vite/React build pipeline, Vercel preview deployment.

**Spec:** `docs/superpowers/specs/2026-09-05-zon-x-destruction-and-safe-deck-end-design.md`

## Global Constraints

- Work only on branch `restore-final-ui-from-main`.
- Never modify `main`.
- Do not alter Main, landing, landing background/assets, or the locked VS Intro.
- Do not change combat comparison rules.
- Do not change STA-to-zero capture behavior.
- Do not change Zon X immunity/untouchability.
- Effect/hand cards destroyed by effects still go to Zon Tepi unless a card explicitly says otherwise.
- BLACK HOLE destroys both Effect Zones to Zon Tepi and otherwise keeps its current round-reset behavior.
- Master Deck exhaustion remains the match timer, but it must not interrupt an unresolved action, pending choice, replacement-VS setup, or mandatory transition.
- Equal Zon X totals at the safe endpoint must still enter the existing tie-breaker flow.

---

## File Structure

- `supabase/functions/match-action/engine.ts` — authoritative gameplay rules and safe-endpoint logic.
- `tests/engine_behavior_regression.mjs` — card-level and core engine regression coverage, including KUDA, TIKUS, BLACK HOLE, and safe deck exhaustion.
- `tests/gameplay_flow_regression.mjs` — flow invariants for unresolved pending choices / phase progression after deck exhaustion.
- `scripts/patch-gameplay-flow-regressions.mjs` — build-time repair layer that must preserve the revised engine behavior after recovery/patch sequencing.
- `package.json` — only modify if a new dedicated regression test file is added; otherwise leave unchanged.
- `supabase/functions/match-action/index.ts` — deploy alongside `engine.ts` as the existing Edge Function entrypoint; no semantic edits unless the current import structure requires it.

---

### Task 1: Lock the New VS-Destruction Destination Rule in Tests

**Files:**
- Modify: `tests/engine_behavior_regression.mjs`

**Interfaces:**
- Consumes: existing `applyEngineAction({ state, meta, actorId, action })` engine API.
- Produces: regression assertions that define effect-driven VS destruction as Zon X capture while Effect destruction remains Zon Tepi.

- [ ] **Step 1: Update KUDA's existing regression to require Zon X capture for a destroyed VS**

Replace the current KUDA expectation with the equivalent of:

```js
test('07 KUDA destroys lower-DEF VS to Zon X', () => {
  let s = play(makeState({ p1Hand: [7], p1Vs: vs(20), p2Vs: vs(1) }), 7)
  assert(s.pendingBoardChoice?.cardIds.includes(1), 'KUDA target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 1 })
  assert(s.player1.x.includes(1) && !s.player2.vs, 'KUDA did not capture destroyed VS to Zon X')
  assert(!s.player2.discard.includes(1), 'KUDA incorrectly sent destroyed VS to Zon Tepi')
})
```

- [ ] **Step 2: Add a KUDA Effect-target regression proving Effect cards still go to Zon Tepi**

Add:

```js
test('07b KUDA destroys lower-DEF Effect to Zon Tepi', () => {
  let s = play(makeState({ p1Hand: [7], p1Vs: vs(20), p2Vs: vs(20), p2Effects: [effect(1)] }), 7)
  assert(s.pendingBoardChoice?.cardIds.includes(1), 'KUDA Effect target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 1 })
  assert(s.player2.discard.includes(1), 'KUDA did not send destroyed Effect to Zon Tepi')
  assert(!s.player1.x.includes(1), 'KUDA incorrectly scored destroyed Effect')
})
```

- [ ] **Step 3: Update TIKUS's VS regression and add an Effect-target regression**

Use:

```js
test('10 TIKUS destroys ATK <=800 VS to Zon X', () => {
  let s = play(makeState({ p1Hand: [10], p2Vs: vs(17) }), 10)
  assert(s.pendingBoardChoice?.cardIds.includes(17), 'TIKUS eligible VS target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 17 })
  assert(s.player1.x.includes(17) && !s.player2.vs, 'TIKUS did not capture destroyed VS')
  assert(!s.player2.discard.includes(17), 'TIKUS incorrectly sent destroyed VS to Zon Tepi')
})

test('10b TIKUS destroys ATK <=800 Effect to Zon Tepi', () => {
  let s = play(makeState({ p1Hand: [10], p2Vs: vs(20), p2Effects: [effect(1)] }), 10)
  assert(s.pendingBoardChoice?.cardIds.includes(1), 'TIKUS eligible Effect target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 1 })
  assert(s.player2.discard.includes(1), 'TIKUS did not send destroyed Effect to Zon Tepi')
  assert(!s.player1.x.includes(1), 'TIKUS incorrectly scored destroyed Effect')
})
```

- [ ] **Step 4: Strengthen BLACK HOLE regressions for simultaneous VS trophies**

Replace/extend card 28 coverage with:

```js
test('28 BLACK HOLE gives each player the opponent VS as a Zon X trophy', () => {
  const s = play(makeState({ p1Hand: [28], p1Effects: [effect(20)], p2Effects: [effect(4)], p1Vs: vs(1), p2Vs: vs(2) }), 28)
  assert(!s.player1.vs && !s.player2.vs, 'BLACK HOLE did not remove both VS')
  assert(s.player1.x.includes(2), 'BLACK HOLE did not award P2 VS to P1 Zon X')
  assert(s.player2.x.includes(1), 'BLACK HOLE did not award P1 VS to P2 Zon X')
  assert(!s.player1.discard.includes(1) && !s.player2.discard.includes(2), 'BLACK HOLE incorrectly discarded destroyed VS')
  assert(s.player1.effects.length === 0 && s.player2.effects.length === 0, 'BLACK HOLE field wipe wrong')
  assert(s.player1.discard.includes(20) && s.player2.discard.includes(4), 'BLACK HOLE Effect cards did not go to Zon Tepi')
  assert(s.needsVS[0] && s.needsVS[1] && s.firstPlayer === P1 && s.phase === 'SET_VS', 'BLACK HOLE next round wrong')
})

test('28b BLACK HOLE with one VS awards only the existing opposing VS', () => {
  const s = play(makeState({ p1Hand: [28], p1Vs: vs(1), p2Vs: null }), 28)
  assert(!s.player1.vs && !s.player2.vs, 'BLACK HOLE one-VS wipe wrong')
  assert(s.player2.x.includes(1), 'BLACK HOLE did not award the only destroyed VS')
  assert(s.player1.x.length === 0, 'BLACK HOLE invented a trophy for an empty VS zone')
})
```

- [ ] **Step 5: Run the engine regression and confirm RED before implementation**

Run:

```bash
node tests/engine_behavior_regression.mjs
```

Expected: KUDA/TIKUS/BLACK HOLE destination assertions fail under the current engine.

- [ ] **Step 6: Commit the failing tests**

```bash
git add tests/engine_behavior_regression.mjs
git commit -m "test: define VS destruction as Zon X scoring"
```

---

### Task 2: Implement One Shared Effect-VS Destruction Path

**Files:**
- Modify: `supabase/functions/match-action/engine.ts`
- Modify: `scripts/patch-gameplay-flow-regressions.mjs`

**Interfaces:**
- Produces: a shared helper such as `destroyEffectTarget(...)` or equivalent that knows whether a destroyed target is a VS or Effect card.
- Consumes: `EngineState`, `MatchMeta`, effect owner index, target index, and card id.
- Rule contract: opponent VS destroyed by an effect -> owner's `x`; Effect destroyed by an effect -> target's `discard`.

- [ ] **Step 1: Add a focused helper in the authoritative engine**

Implement a helper with semantics equivalent to:

```ts
function destroyEffectTarget(s: EngineState, owner: PlayerIndex, target: PlayerIndex, cardId: number) {
  const vs = player(s, target).vs
  if (vs?.card === cardId) {
    player(s, owner).x.push(cardId)
    player(s, target).vs = null
    return 'VS' as const
  }

  const effectIndex = player(s, target).effects.findIndex((e) => e.card === cardId)
  if (effectIndex >= 0) {
    const [removed] = player(s, target).effects.splice(effectIndex, 1)
    player(s, target).discard.push(removed.card)
    return 'EFFECT' as const
  }

  throw new Error('BOARD_TARGET_MISSING')
}
```

Use the existing engine's error naming conventions if a more specific target error already exists.

- [ ] **Step 2: Route `RESOLVE_BOARD_CHOICE` destruction purposes through the helper**

For `purpose === 'DESTROY_ELIGIBLE'`, replace any direct VS-to-discard handling and direct Effect removal with the shared helper. Preserve current choice validation and any post-destruction round progression behavior.

- [ ] **Step 3: Change BLACK HOLE to exchange VS trophies before clearing fields**

Implement the resolution in this order:

```ts
const p1Vs = player(s, 0).vs?.card ?? null
const p2Vs = player(s, 1).vs?.card ?? null
if (p2Vs !== null) player(s, 0).x.push(p2Vs)
if (p1Vs !== null) player(s, 1).x.push(p1Vs)
player(s, 0).vs = null
player(s, 1).vs = null
```

Then move both Effect Zones to each owner's discard as before, refill as allowed, increment round, set `firstPlayer` to the BLACK HOLE owner, require both replacement VS slots, and keep all other BLACK HOLE semantics unchanged.

- [ ] **Step 4: Update the build repair script to reproduce the same semantics**

In `scripts/patch-gameplay-flow-regressions.mjs`, add exact anchor-based replacements that:
- install the shared effect-destruction helper if the recovered engine lacks it,
- patch the relevant `RESOLVE_BOARD_CHOICE` path,
- patch BLACK HOLE's VS destination.

The patch must fail loudly if its expected source anchor is missing; do not silently continue with partially repaired gameplay logic.

- [ ] **Step 5: Run the focused regression**

Run:

```bash
node tests/engine_behavior_regression.mjs
```

Expected: KUDA, TIKUS, BLACK HOLE destination tests pass, and all previously passing card tests remain green except any explicitly renamed expectation text.

- [ ] **Step 6: Run gameplay-flow regressions**

```bash
node tests/gameplay_flow_regression.mjs
```

Expected: PASS.

- [ ] **Step 7: Commit the implementation**

```bash
git add supabase/functions/match-action/engine.ts scripts/patch-gameplay-flow-regressions.mjs
git commit -m "feat: score effect-destroyed VS cards in Zon X"
```

---

### Task 3: Define Safe Deck-Exhaustion Endpoints with Failing Tests

**Files:**
- Modify: `tests/engine_behavior_regression.mjs`
- Modify: `tests/gameplay_flow_regression.mjs`

**Interfaces:**
- Consumes: existing `deckExhausted` flag and engine phases.
- Produces: a precise test contract for when `GAME_OVER` / `TIE_BREAKER` may occur after the deck reaches zero.

- [ ] **Step 1: Add a regression proving a draw that empties the deck does not immediately end an active Effect turn**

Add a scenario equivalent to:

```js
test('Deck exhaustion during an Effect draw does not interrupt the active round', () => {
  const s = play(makeState({ p1Hand: [1], deck: [2], phase: 'EFFECT', effectTurn: P1 }), 1)
  assert(s.deck.length === 0 && s.deckExhausted, 'test did not exhaust the Master Deck')
  assert(s.phase === 'EFFECT', 'deck exhaustion interrupted the active Effect phase')
  assert(s.winner === null, 'deck exhaustion declared a winner mid-round')
})
```

- [ ] **Step 2: Add a regression proving end-of-round refill exhaustion still allows mandatory replacement VS setup**

Construct a combat outcome with a nearly empty deck such that `finishRound()` consumes the final card during refill. Assert:

```js
assert(s.deckExhausted, 'round-end refill did not exhaust deck')
assert(s.phase === 'SET_VS', 'deck exhaustion skipped mandatory replacement VS setup')
assert(s.needsVS[loserIndex] === true, 'loser was not allowed to replace VS after deck exhaustion')
assert(s.winner === null, 'match ended before replacement VS transition completed')
```

- [ ] **Step 3: Add a regression proving the match ends at the next safe endpoint after replacement setup / transition**

Continue the state from Step 2 by setting the required replacement VS and invoking the normal begin-round transition. Assert the engine then evaluates the exhausted deck at the first safe point where there is no pending choice or mandatory setup and enters `GAME_OVER` using Zon X totals.

- [ ] **Step 4: Add a tie regression at the safe endpoint**

Use equal `player1.x.length` and `player2.x.length`, exhaust the deck, complete mandatory setup/transition, and assert:

```js
assert(s.phase === 'TIE_BREAKER', 'equal Zon X did not enter tie-breaker at safe deck endpoint')
assert(s.winner === null, 'tie-breaker incorrectly assigned a winner')
assert(s.tieBreaker?.status === 'WAITING', 'tie-breaker state was not initialized')
```

- [ ] **Step 5: Add pending-choice protection to gameplay-flow regression**

Create a state with `deckExhausted=true` and one of `pendingSelfDiscard`, `pendingBoardChoice`, or `pendingChoice` active. Resolve the choice and assert the engine does not evaluate `GAME_OVER` before the mandatory choice completes.

- [ ] **Step 6: Run both tests and verify RED**

```bash
node tests/engine_behavior_regression.mjs
node tests/gameplay_flow_regression.mjs
```

Expected: current `finishIfDeckExpired()` behavior causes at least the mid-round / replacement-setup assertions to fail.

- [ ] **Step 7: Commit the failing tests**

```bash
git add tests/engine_behavior_regression.mjs tests/gameplay_flow_regression.mjs
git commit -m "test: define safe Master Deck exhaustion endpoints"
```

---

### Task 4: Replace Immediate Deck Termination with Explicit Safe-Endpoint Evaluation

**Files:**
- Modify: `supabase/functions/match-action/engine.ts`
- Modify: `scripts/patch-gameplay-flow-regressions.mjs`

**Interfaces:**
- Produces: helper(s) equivalent to `hasMandatoryResolution(state)` and `finishIfDeckExpiredAtSafeEndpoint(state, meta)`.
- Consumes: `deckExhausted`, `phase`, `needsVS`, pending-choice fields, `effectTurn`, `attackTurn`, and Zon X totals.

- [ ] **Step 1: Split deck exhaustion detection from game-over evaluation**

Keep `draw()` responsible only for:

```ts
if (s.deck.length === 0) s.deckExhausted = true
```

Do not let `draw()` itself transition to `GAME_OVER`.

- [ ] **Step 2: Replace `finishIfDeckExpired` with a safe-endpoint evaluator**

Implement semantics equivalent to:

```ts
function hasMandatoryResolution(s: EngineState) {
  return Boolean(
    s.pendingSelfDiscard ||
    s.pendingBoardChoice ||
    s.pendingChoice ||
    s.needsVS[0] ||
    s.needsVS[1]
  )
}

function finishIfDeckExpiredAtSafeEndpoint(s: EngineState, m: MatchMeta) {
  if (!s.deckExhausted) return false
  if (hasMandatoryResolution(s)) return false
  if (s.phase === 'EFFECT' || s.phase === 'ATTACK') return false

  const x1 = player(s, 0).x.length
  const x2 = player(s, 1).x.length
  s.effectTurn = null
  s.attackTurn = null

  if (x1 !== x2) {
    s.phase = 'GAME_OVER'
    s.winner = idFor(m, x1 > x2 ? 0 : 1)
    s.message = `Master Deck habis. Zon X ${x1}-${x2}.`
  } else {
    s.phase = 'TIE_BREAKER'
    s.winner = null
    s.tieBreaker = {
      deck: shuffle(Object.keys(cards).map(Number)),
      index: 0,
      left: null,
      right: null,
      status: 'WAITING',
      pair: 0,
    }
    s.message = 'PENENTUAN SERI'
  }
  return true
}
```

Adapt the exact safe-phase conditions to the engine's real phase machine discovered while implementing; the required invariant is that active turns and mandatory transition/setup are never interrupted.

- [ ] **Step 3: Remove unsafe calls from `finishRound`, `finishNoWinner`, BLACK HOLE, GRAVITIAN, and similar transition helpers**

Any helper that currently invokes immediate `finishIfDeckExpired()` must instead preserve its normal transition state. The safe-endpoint evaluator should be invoked only after the transition reaches a stable state.

- [ ] **Step 4: Call the evaluator after actions that can complete the final mandatory transition**

Candidate action boundaries include:
- completion of required `SET_VS`,
- `BEGIN_ROUND` after all required VS setup is complete,
- completion of any pending mandatory discard/board/hidden choice,
- end of a no-winner round transition,
- any other engine action that leaves no active current-round action and no mandatory transition pending.

Do not call it before returning from an action that still leaves the player with a required choice.

- [ ] **Step 5: Preserve tie-breaker initialization exactly**

Reuse the existing tie-breaker object shape and shuffle behavior. Do not invent a new tie-breaker system.

- [ ] **Step 6: Mirror the safe-endpoint patch in `scripts/patch-gameplay-flow-regressions.mjs`**

Add strict replacements that remove the old immediate end calls and install the safe-endpoint evaluator. Keep the patch idempotent for the build pipeline and fail if a required anchor is missing.

- [ ] **Step 7: Run the focused regressions**

```bash
node tests/engine_behavior_regression.mjs
node tests/gameplay_flow_regression.mjs
```

Expected: all new deck-exhaustion tests pass.

- [ ] **Step 8: Commit the safe-endpoint implementation**

```bash
git add supabase/functions/match-action/engine.ts scripts/patch-gameplay-flow-regressions.mjs
git commit -m "feat: finish exhausted deck only at safe gameplay endpoints"
```

---

### Task 5: Full Regression Gate and Build Verification

**Files:**
- Modify only if a regression exposes a rule-specific issue in files already listed above.

**Interfaces:**
- Consumes: all implemented engine changes.
- Produces: evidence that the revised rules do not regress existing gameplay, Main/landing, or locked VS intro behavior.

- [ ] **Step 1: Run the two focused engine suites**

```bash
node tests/engine_behavior_regression.mjs
node tests/gameplay_flow_regression.mjs
```

Expected: all tests pass. The engine test count will be higher than the previous 32 because of added rule regressions; every legacy test must remain green except assertions intentionally updated from Zon Tepi to Zon X.

- [ ] **Step 2: Run the full production build**

```bash
npm run build
```

Expected output includes successful:
- VS intro identity regression,
- landing/main regression,
- Arena regressions,
- audio regressions,
- gameplay flow regression,
- engine behavior regression,
- `GATE1_VERIFY_PASS`,
- TypeScript compile,
- Vite production build.

- [ ] **Step 3: If build-time patching changes the generated engine, re-run focused tests after the patch sequence**

Because `npm run build` executes `scripts/patch-gameplay-flow-regressions.mjs`, confirm the post-build `supabase/functions/match-action/engine.ts` still passes:

```bash
node tests/engine_behavior_regression.mjs
node tests/gameplay_flow_regression.mjs
```

Expected: PASS.

- [ ] **Step 4: Commit any required build-repair adjustment**

If no adjustment is required, skip this commit. If required:

```bash
git add scripts/patch-gameplay-flow-regressions.mjs supabase/functions/match-action/engine.ts tests/engine_behavior_regression.mjs tests/gameplay_flow_regression.mjs
git commit -m "fix: preserve revised core rules through build repair"
```

---

### Task 6: Deploy the Authoritative Match Engine and Verify the Branch Preview

**Files:**
- Deploy: `supabase/functions/match-action/index.ts`
- Deploy dependency: `supabase/functions/match-action/engine.ts`
- Include any existing `deno.json` / relative dependency files required by the function.

**Interfaces:**
- Produces: a new `match-action` Edge Function version containing the revised authoritative rules.
- Consumes: the already-tested repo engine implementation.

- [ ] **Step 1: Fetch the complete current Edge Function source set from the target branch**

Read `index.ts`, `engine.ts`, and any relative dependency/config files before deployment. Do not deploy a partial or stale function bundle.

- [ ] **Step 2: Deploy `match-action` with its existing JWT/auth posture unchanged**

Use the existing function's authentication configuration. Do not weaken authorization while deploying the rules revision.

- [ ] **Step 3: Verify the Supabase deployment reports a new active function version**

Confirm deployment success before testing the web preview.

- [ ] **Step 4: Wait for the target-branch Vercel deployment and verify READY**

Use the branch alias:

```text
https://mega-x-git-restore-final-ui-from-main-nuargita96-2452.vercel.app
```

Confirm the newest deployment for `restore-final-ui-from-main` is `READY` and corresponds to the final rules commit.

- [ ] **Step 5: Inspect build logs for the required regression evidence**

Confirm the final deployment logs contain:
- revised engine regression PASS,
- revised gameplay flow PASS,
- Main/landing PASS,
- locked VS intro PASS,
- `GATE1_VERIFY_PASS`,
- successful Vite build.

- [ ] **Step 6: Final commit/report**

Report the final commit SHA, Supabase Edge Function version/deployment result, Vercel deployment ID, and branch preview URL. Do not claim the rules are live until both Supabase and Vercel are verified.
