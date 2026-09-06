# MEGA-X Core Rules Revision: VS Destruction Scoring + Safe Deck Exhaustion

## Purpose
Tighten match pacing and reduce deadlock/churn while preserving the Master Deck as the match timer.

## Approved Rule Changes

### 1. Safe Master Deck exhaustion
The Master Deck reaching zero no longer interrupts an unresolved turn, round, or round-transition sequence.

When the Master Deck becomes empty:
- No further cards can be drawn from the Master Deck.
- The current action and all mandatory follow-up choices resolve.
- Any active turn/phase that still has legal progression continues normally.
- If a round has just ended, mandatory replacement-VS setup and the transition into the next actionable state are allowed to complete.
- The match ends only at the next safe endpoint where no unfinished current-round or mandatory transition action remains.
- At that safe endpoint, compare Zon X totals.
- Higher Zon X total wins.
- Equal Zon X totals enter the existing tie-breaker flow.

This preserves the Master Deck as the timer while preventing one player from losing an action opportunity merely because a refill or draw consumed the final card.

### 2. Effect-based VS destruction now scores
Whenever a card effect says `MUSNAHKAN` and the destroyed target is a VS card:
- That VS goes to the opposing player's Zon X instead of Zon Tepi.
- The player whose effect caused the destruction receives the VS as a Zon X trophy.

If the destroyed target is an Effect card or a hand card:
- It still goes to Zon Tepi unless the individual card explicitly says otherwise.

This creates a unified scoring principle:
- Combat win against a VS -> Zon X.
- Opponent VS reaches STA 0 -> Zon X.
- Card effect destroys opponent VS -> Zon X.
- Card effects that explicitly capture to Zon X continue to do so.

### 3. BLACK HOLE special case
BLACK HOLE destroys both VS simultaneously.

Resolution:
- Each player captures the opponent's destroyed VS into their own Zon X.
- Both Effect Zones are still destroyed to Zon Tepi.
- Existing BLACK HOLE round-reset behavior remains otherwise unchanged.
- If one side has no VS when BLACK HOLE resolves, only the existing opposing VS can be captured.

## Current card impact
At minimum, all existing effects that can destroy a VS must follow the new destination rule. Current examples include:
- KUDA PELONJAK LANGIT
- TIKUS KILAT ANGKASA
- BLACK HOLE

Any future card using `MUSNAHKAN` against a VS inherits the same rule automatically unless its text explicitly overrides destination.

## Non-goals
- Do not change combat comparison rules.
- Do not change STA-to-zero capture behavior.
- Do not change Zon X immunity/untouchability.
- Do not change card text effects beyond destination semantics required by this rule.
- Do not alter Main, landing, or locked VS Intro presentation.

## Engine design
Implement one shared helper/path for VS removal destination so effect-based VS destruction cannot accidentally send a VS to Zon Tepi in one code path and Zon X in another.

Deck exhaustion should be represented as a state condition, not an immediate `GAME_OVER` trigger. End-of-match evaluation should happen from explicit safe-endpoint checks after mandatory resolution completes.

## Required regression coverage
Tests must prove:
- Destroying an eligible opponent VS with KUDA sends it to the effect owner's Zon X.
- Destroying an eligible opponent VS with TIKUS sends it to the effect owner's Zon X.
- Destroying an Effect with those cards still sends the Effect to Zon Tepi.
- BLACK HOLE gives each player the opponent VS as a Zon X trophy when both VS exist.
- BLACK HOLE with only one VS awards only that one trophy.
- Emptying the Master Deck during a draw/refill does not immediately end an unresolved sequence.
- Mandatory replacement VS/setup can complete after deck exhaustion.
- Match ends at the next safe endpoint and compares Zon X.
- Equal Zon X at the safe endpoint still enters the existing tie-breaker.
- Existing 32-card engine behavior remains green except for assertions intentionally updated for the new destruction destination rule.

## Success criteria
The revised game should feel tighter because VS removal consistently advances the score, while the Master Deck still determines match length without cutting off an unfinished legitimate action sequence.