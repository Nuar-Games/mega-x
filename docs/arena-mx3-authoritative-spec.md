# MEGA-X Arena MX3 — Authoritative 780×1110 Specification

The user-supplied 780×1110 portrait diagram is the sole Arena presentation authority.

Implementation rules:
- One fixed 780×1110 coordinate canvas, uniformly scaled as a single unit.
- No responsive rearrangement, no layout reinterpretation, no legacy Arena visual reuse.
- One Arena markup namespace: `mx3-*`.
- One Arena stylesheet: `src/arena-stage.css`.
- Preserve only nonvisual game state, card data, networking and gameplay handlers.
- FIGHT announcer remains removed.
- Compact selected-card overlay may temporarily float above the Arena but must not replace or hide the board.

Diagram module sizes are authoritative: Quit 180×70, Status 420×70, Audio 120×70, fighter panels 200×120, opponent/local hand bands 420×90, Zone X 70×110, big counter 80×70, Zon Tepi 90×130, Master Deck 90×130, Master Deck counter 90×30, position bars 180×30, phase prompt 420×80, VS frames 210×280, timer 90×90, ATK/DEF/STA 70×60, Effect slots 70×70.