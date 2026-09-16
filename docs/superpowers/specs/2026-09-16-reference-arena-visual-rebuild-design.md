# Mega X Reference Arena Visual Rebuild

## Acceptance target
The three user-supplied reference images in the 2026-09-16 conversation are the visual acceptance target. The playable arena must visibly reproduce their hierarchy and game-UI density rather than thin/invisible framing.

## Required desktop composition
- Large blue player identity HUD at upper left and large red opponent identity HUD at upper right.
- Mega X/VS/turn-phase hierarchy centered across the upper/middle combat axis.
- Central battlefield with cards as the primary interactive objects.
- Dedicated deck, discard and Zon X fixtures that visibly read as game objects.
- Player hand centered/fanned along lower battlefield; opponent information remains balanced at top rather than shoved to one side.
- Right-side command stack with Attack as decisive gold action, then Skill/Effect, Zon X, Move/Position and End Turn.
- Lower-left game log/effects panel and card-view/inspect affordance.
- Sector Seven/Mega X footer treatment.

## Required authored asset system
Reusable isolated transparent assets must include substantial blue/red HUD plates, deck frames, discard frame, Zon X frame, neutral/blue/red field-zone frames, turn banner, phase indicators, VS mark, command buttons, menu icons, notification banners, message panel, tags/labels, stat badges, status icons, victory/defeat/turn overlays, dialogue portrait frames, loading/transition treatment, damage numbers, corner/footer ornaments, and transparent combat FX (slash, ring, burst, impact/crack).

These assets must have visible material depth: layered metal/glass surfaces, strong silhouette, luminous edge treatment, controlled blue/red/gold identity, readable typography and iconography. Thin outline-only SVGs do not satisfy acceptance.

## Runtime requirements
- Assets are used by the real Phaser arena, not a mockup.
- Existing Mega X card images, logo/background/audio, gameplay engine, Practice logic, backend/security and online behavior remain preserved.
- Responsive layouts retain the same visual language on desktop, landscape mobile and portrait mobile.
- Low-end profile reduces particles/glow/animation cost without deleting critical UI or changing gameplay.
- True fullscreen remains available.
- Guest Practice remains playable without authentication or authenticated network calls.

## Motion/effects
Turn entry, card selection, VS entry, attack, damage, destruction, effect activation, Zon X movement, victory/defeat and loading transitions must have visible authored motion/effects. Low-end mode may shorten or simplify these but must retain feedback.

## Acceptance proof
The rebuild is not complete because files exist or tests compile. It requires real browser screenshots of the playable arena at 1920x1080, a landscape mobile viewport, and a portrait mobile viewport, plus browser verification that guest Practice enters the arena normally. The screenshots must visibly show the reference-style HUDs, fixtures, command stack, field, hand and hierarchy.