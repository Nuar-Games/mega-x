# Arena Board v2 Design

## Goal
Replace the current desktop-landscape Arena prototype with the owner-approved phone-first Arena board while preserving authoritative game rules, state projection, ArenaPointerTargets behavior, and existing Practice/Online/Auth flows.

## Non-negotiable ownership model
- The viewer is always rendered at the bottom in blue.
- The opponent is always rendered at the top in red.
- This mapping is derived only from `state.identity.localPlayerIndex`; raw player 1/player 2 order never determines screen ownership.
- The same viewer-relative layout model is consumed by both Phaser rendering and `ArenaPointerTargets` so E2E click coordinates match the visible board.

## Responsive layout
- Primary reference viewport: 390×844 portrait.
- Desktop keeps the same portrait composition, centered and wider; there is no landscape-only alternate arrangement.
- Top-to-bottom order: opponent bar, opponent Effect row + Zon Tepi, center combat area, viewer Effect row + Zon Tepi, viewer bar/action area, hand fan.
- Opponent bar includes red Zon X counter, LAWAN + handle, and face-down hand count using `/cards/back-game.webp`.
- Center contains opponent KAD VS above the center line and viewer KAD VS below it, each with live ATK/DEF/STA and current ATK/DEF position in its owner's color.
- One shared Master Deck appears left of center with its count. A draining timer ring sits on the center line above both VS cards. A large turn indicator sits right of center.
- Viewer bar includes blue Zon X counter, KAMU + handle, and the current action control without covering either VS card.
- Hand cards fan along the bottom.
- The visible debug label `ARENA NEXT · ...` is removed; the hidden status element remains for E2E/state diagnostics.

## Card art
- Board cards render the projected `ArenaCardState.artSrc` (`/cards/game/NN.webp`).
- Face-down opponent-hand cards use `/cards/back-game.webp`.
- Inspect art uses `/cards/inspect/NN.webp`, derived from the card id.

## Card inspect
- A single tap/click on a viewer hand card opens inspect and never directly plays that card.
- The inspect overlay dims and blurs the board and shows a card at roughly 70% of phone width.
- Viewer hand inspect shows `KAD DI TANGAN · x / n`, keeps the timer visible, supports swipe and arrow navigation, provides `MAIN KAD INI`, and provides `TUTUP`; clicking outside also closes.
- `MAIN KAD INI` dispatches the card's existing legal play command; if more than one SET_VS position is legal, the overlay exposes the legal position choices instead of guessing.
- VS, Effect, Zon X and Zon Tepi cards open the same inspect presentation without a play button.
- Both players' Zon X and Zon Tepi are public. Zone carousel order is newest card first. Empty zones do nothing. Viewer-owned zone cards have a blue border; opponent-owned zone cards have a red border.
- Opponent visible VS/Effect cards use a red inspect border; viewer-owned visible board cards use blue.
- On pointer-capable desktop, hovering a visible card shows its enlarged inspect art without committing a command; click still pins/selects the inspect view.

## Pointer-target compatibility
- Every existing `ArenaPointerTargets` command target remains available.
- Pointer target coordinates are computed from the same viewer-relative layout used by rendering.
- Existing E2E drivers continue to click command hit targets rather than relying on raw screen guesses.
- If a command control moves, the target coordinate moves with the shared layout; game rules are unchanged.

## Timer and turn display
- Timer is presentation-only and does not change authoritative game timing/rules.
- It resets on relevant state-version/turn transitions and visually drains as a ring.
- It remains visible above the board and inspect overlay.
- Turn indicator resolves from `effectTurnIndex` / `attackTurnIndex` against `localPlayerIndex` and displays `GILIRAN KAMU` or `GILIRAN LAWAN`.

## Practice start guard
- `root.tsx` prevents a second `mega-x:start-practice-match` request while the first request is still loading the profile/creating the practice route.
- This is a one-line guard/state latch change only; practice game rules remain unchanged.

## Tests and evidence
- Practice E2E runs at 390×844, proves viewer VS is in the bottom half, timer is above both VS cards, inspect opens/closes without playing, signed-in fighter name remains correct, and saves phone-board + inspect screenshots to `test-results/`.
- Online E2E proves each of the two clients sees its own VS in the bottom half and the opponent VS in the top half, and saves one screenshot per player.
- Existing regressions, Practice, Online and Auth E2E remain green.
- CI artifact upload supplies screenshots.
- Draft PR targets `arena-total-rewrite`; no merge, production deployment, `main`, Supabase, or engine changes.