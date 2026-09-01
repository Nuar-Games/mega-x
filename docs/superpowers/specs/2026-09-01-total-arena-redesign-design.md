# MEGA-X Total Arena Redesign Design

## Goal
Replace the current Arena presentation completely so no legacy Arena visual component, class system, geometry, counter, box, announcer, or styling survives.

## Non-negotiable constraints
- Preserve only nonvisual gameplay truth: game state, card data, networking/actions, targeting/click handlers, pile/open handlers, motion event data, matchmaking state, and audio controls unrelated to FIGHT.
- Do not reuse legacy Arena presentation components or classes, including `VSZone`, `LiveStats`, `pile-cluster`, `effect-card-slot`, `fighter-identity`, `v9-vs-card`, `arena-wrap`, old Arena stat rows, old Arena pile boxes, or old Arena geometry selectors.
- Remove the FIGHT announcer completely from the audio system. There must be no FIGHT trigger, lock, detection, playback branch, or SFX event path.
- The portrait Arena layout is authoritative: HUD at top; fighter identities below; opponent hand top-center; Zon X / Zon Tepi / Master Deck / Zon Tepi / Zon X upper-middle; two VS zones side-by-side with POSISI KAD and ATK/DEF/STA; five Effect slots at each outer edge; action/clash area centered without covering gameplay; local five-card hand at bottom.
- New boxes, counters, labels, VS frames, stat presentation, Effect racks, pile presentation, and center treatment must all be newly authored.
- Existing networking and game rules must not be changed.

## Architecture
The build-time Arena transform remains only as a bridge into the recovered `App.tsx`, but it must replace the legacy gameplay board with a completely new fragment that uses new `mx2-*` presentation classes exclusively. The new fragment may read existing state and call existing handlers, but it must render card faces and values directly rather than invoking legacy Arena visual components.

`src/arena-stage.css` will be replaced by one new `mx2-*` coordinate-map stylesheet. Legacy Arena selectors will not appear in the new Arena fragment or Arena stylesheet. Runtime `arena-stage.ts` will be reduced to card inspection, phase marking, score/deck feedback, and hand classification only where needed, targeting new `mx2-*` hooks.

## Visual structure
- `mx2-arena`: full portrait board root.
- `mx2-fighter-bar`: new left/right identity bars.
- `mx2-opponent-hand` / `mx2-local-hand`: hand regions positioned by runtime classification, with no legacy Arena geometry.
- `mx2-upper-zone`: five new upper-zone modules.
- `mx2-score-core`: new Zon X numeric counter.
- `mx2-deck-core`: new Master Deck presentation and count.
- `mx2-discard-core`: new Zon Tepi presentation.
- `mx2-effect-rail`: five new slots per side.
- `mx2-vs-frame`: new side-by-side VS card frame rendered from `game.players[n].vs` using `CardView`, not `VSZone`.
- `mx2-position-bar`: new POSISI KAD bar.
- `mx2-stats`: new ATK/DEF/STA modules rendered from `currentStats[n]`, not `LiveStats`.
- `mx2-command`: new center prompt/action region.

## Verification
Build must fail if any prohibited legacy Arena presentation token remains in `src/arena-blueprint.fragment` or `src/arena-stage.css`. Regression checks must also fail if `fight` remains in the Arena announcer logic. Existing engine/network/gameplay tests must still pass.
