# Mega X 3D Arena Design

## Goal

Build a real 3D Mega X battle arena inside the existing React/Vite application using React Three Fiber, while preserving the current game rules, authoritative DOM/game state, player data, and working arena fallback. The 3D arena must not replace the fallback until a complete Practice match is proven playable from start to finish.

## Non-negotiable constraints

- Work only on `arena-clean-rebuild`.
- Do not modify or merge into `main` during development.
- Existing Mega X game logic remains authoritative; the 3D renderer is a presentation/input layer, not a rules rewrite.
- The working arena remains the default fallback until 3D acceptance gates pass.
- No fake screenshots or concept-only mockups count as progress.
- The 3D arena must use real game cards, real state, and real legal actions.
- Desktop, mobile landscape, mobile portrait, fullscreen, and low-end quality modes must be supported.
- The branch must remain deployable on the existing free-tier hosting setup.

## Runtime architecture

Mega X remains a React 19 + Vite application. Add `three`, `@react-three/fiber`, `@react-three/drei`, and `@react-three/postprocessing`. Do not introduce physics unless a concrete gameplay need appears; card motion, impact, camera, and particles can be deterministic animation systems without Rapier.

Create a dedicated 3D arena root mounted only when the user explicitly enables the 3D arena during development. The root reads a normalized `ArenaRenderState` derived from the existing game DOM/state bridge and dispatches actions back through stable `data-arena-action-id` controls. This keeps the current game engine authoritative.

The 3D renderer is split into focused systems:

- `Arena3DRoot`: Canvas lifecycle, quality profile, suspense/loading, fallback handling.
- `Arena3DStateBridge`: authoritative state snapshot and action dispatch boundary.
- `Arena3DScene`: scene composition and update orchestration.
- `Arena3DCameraRig`: perspective framing, phase transitions, hit shake, cinematic movement.
- `Arena3DTable`: battlefield platform, rails, recessed zones, environment geometry.
- `Arena3DCard`: textured card plane/mesh with hover/select/inspect states.
- `Arena3DZones`: deck, discard, Zon X, effects, hand, VS positions.
- `Arena3DHUD`: minimal DOM overlay for prompts, timer, status, commands, fullscreen, quality toggle during development.
- `Arena3DFX`: attack trails, impact flashes, particles, card summon/draw/discard transitions, victory/defeat sequences.
- `Arena3DQuality`: high/medium/low profiles controlling DPR, shadows, bloom, particles, texture filtering, and animation density.

## Visual direction

The arena should read as a physical futuristic battle table rather than a website board. Cards dominate the composition. The combat line occupies the visual center. Peripheral piles and effect zones are physically present but recede through scale, lighting, depth, and opacity until relevant.

Use a dark industrial/sci-fi arena with metallic black surfaces, restrained blue/red fighter accents, gold action emphasis, emissive edge lighting, subtle volumetric-looking particles, and localized bloom only on important events. Avoid giant boxed panels, generic rectangles, and large opaque overlays covering play.

Cards remain readable first. UI chrome must never reduce card legibility.

## Camera and composition

Use a perspective camera with a stable default three-quarter view of the full table. Camera changes are event-driven, not constantly moving.

Required camera states:

- `overview`: normal battle view.
- `set-vs`: tighter framing on the two combat card slots.
- `attack`: quick push toward attacker, then impact recoil.
- `inspect`: isolated close-up without losing command access.
- `result`: wider cinematic framing for victory/defeat.

Camera shake must be short, amplitude-limited, and disabled/reduced on low quality or reduced-motion settings.

## Card interaction

Every playable card surface in 3D must map to an authoritative action id. Input priority is:

1. If a card has a primary legal game action, click/tap dispatches it.
2. If the card has multiple semantic card actions and no immediate primary action, open a compact action chooser.
3. Otherwise, inspect the card.

No interaction may depend on hover. Touch must be first-class.

Selected/actionable cards use geometry/light emphasis rather than large black panels. Invalid cards remain visible but visually subdued.

## Prompts and commands

Critical gameplay prompts remain DOM-based until proven safe to move into 3D. The prompt layer must always show the current phase instruction and legal commands when required.

Command buttons must never cover the card hand or combat cards. On wide layouts they use a compact right-side rail. On portrait layouts they become a bottom command strip above the hand.

Fullscreen is a first-class control using the browser Fullscreen API with responsive canvas resizing.

## Effects and animation acceptance

The 3D path is not considered visually complete without all of the following visible in a real Practice match:

- card draw movement from deck to hand;
- card placement into VS;
- attack lunge/travel;
- impact flash and particle burst;
- short camera shake on heavy impact;
- score/stat change feedback;
- card movement to discard/Zon X;
- effect-card activation pulse/trail;
- turn/phase transition banner animation;
- victory and defeat presentation;
- hover/tap/select response;
- fullscreen transition without layout breakage.

High quality may use bloom, richer shadows, more particles, and higher DPR. Medium reduces those costs. Low disables expensive post-processing, uses DPR near 1, reduces particles, limits dynamic shadows, and targets stable play on low-end integrated graphics.

## Performance profiles

### High
- DPR up to 1.75.
- Soft shadows for key objects.
- Bloom enabled with restrained threshold/intensity.
- Full particles and trails.
- High anisotropy where supported.

### Medium
- DPR up to 1.25.
- Limited shadows.
- Reduced bloom and particles.
- Shorter trail lifetimes.

### Low
- DPR 1.0.
- No post-processing bloom.
- No dynamic soft shadows except essential contact treatment.
- Minimal particles.
- Reduced texture resolution where possible.
- Reduced camera shake and animation layering.

Quality selection must be user-overridable and can default from device capability heuristics.

## Asset strategy

Reuse existing card art and approved Mega X branding. New 3D environment geometry should be procedural/simple mesh composition first so the game does not wait on a heavy external-model pipeline. Any later GLB assets must be optimized and optional.

Existing v3 UI assets may only be reused if they survive visual inspection at target resolutions. Placeholder-looking, low-resolution, or generic assets are rejected rather than carried forward.

## Development safety

During development, the 3D renderer must be opt-in only (for example `?arena=3d`). The default branch preview continues using the working arena. If 3D initialization fails, the app must automatically fall back without blocking the match.

The 3D path must not mutate Supabase data differently from the existing game flow. It dispatches the same authoritative actions the working arena uses.

## Acceptance gates

### Gate 1 — 3D shell
A real Practice match state renders in a perspective 3D arena with real card textures, readable HUD, correct zones, fullscreen, and no broken overlay collisions.

### Gate 2 — full interaction
A player can complete every phase of a Practice match through the 3D presentation, including selecting cards, VS setup, movement/position choices, effects, attacks, target selection, discard/Zon X decisions, tie-breaker flows if reached, and result exit.

### Gate 3 — presentation
All required animation/effect events above are visibly present and coherent. No placeholder black rectangles, missing prompts, low-resolution UI, or silent state changes.

### Gate 4 — responsive/performance
Desktop, landscape mobile, and portrait mobile are playable. High/medium/low profiles work. Low mode remains functional on weak integrated-GPU-class hardware.

### Gate 5 — replacement decision
Only after Gates 1–4 pass in the deployed branch may the 3D arena become the default on `arena-clean-rebuild`. `main` remains untouched until explicit user approval after direct playtesting.

## Proof required

Completion claims require all of the following:

- deployed branch URL tied to an identified commit SHA;
- screenshots from the actual running branch at desktop, landscape mobile, and portrait mobile;
- recorded test/QA evidence that a full Practice match completes;
- visible proof of attack, impact, transition, and result effects;
- build/test results;
- no claim of production readiness before direct user playtesting.