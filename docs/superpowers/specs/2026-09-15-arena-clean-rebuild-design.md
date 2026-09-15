# Mega X Clean Arena Rebuild Design

## Goal
Rebuild the match presentation as a real game surface rather than a layered website, while preserving the existing authoritative Mega X rules, online backend, player data, Practice Bot logic, cards, audio and matchmaking behavior.

## Direction
Mega X is presented as a televised underground card fight: cards are the dominant visual objects, the opponent occupies the upper arena, the player occupies the lower arena, and the central combat lane is where active VS cards physically confront each other. The interface avoids generic dashboard panels, labelled rectangles and decorative CSS boxes.

## Architecture
React remains only for the outer application shell such as landing, authentication and lobby. The actual match is owned by Phaser in one viewport-native scene. Vite is only the build pipeline.

The arena is split into focused modules under `src/game/arena/`:
- `ArenaScene.ts` owns scene composition and lifecycle.
- `ArenaLayout.ts` calculates portrait, landscape and desktop geometry from the live viewport.
- `ArenaAssets.ts` declares every image/audio asset and its loading policy.
- `ArenaStateAdapter.ts` converts existing online/practice match state into a renderer-safe snapshot.
- `ArenaCards.ts` renders hand, deck, discard, VS and Zon X cards.
- `ArenaHud.ts` renders compact names, deck counts, timer, turn state and prompts.
- `ArenaEffects.ts` renders selection, VS entry, attack, destruction, Zon X movement, effect activation and result motion.
- `ArenaInput.ts` converts pointer/touch interaction into existing legal game actions.
- `ArenaAudio.ts` maps existing Mega X sounds to arena events.
- `arena-theme.ts` contains visual constants only; there is no stack of arena CSS override files.

## Asset-first rule
Before arena implementation, all existing Mega X assets are inventoried and assigned a role. Existing cards, card backs, logo, VS art, backgrounds and audio are reused intentionally. Missing visual pieces are represented as named asset slots in the manifest before code uses them. No generic generated artwork is introduced as a substitute for missing design decisions.

## Match composition
Portrait is the primary layout. Opponent identity and hand occupy the top region. The combat lane is central. The local hand occupies the bottom region and remains large enough to read and select. Deck, discard, Effect and Zon X are compact arena fixtures around the combat lane, not large panels. Selected cards become the focus and legal actions appear contextually.

Landscape and desktop use the same semantic regions with wider geometry; they are not separate patched layouts.

## Feature coverage
The rebuilt arena must support both online and Practice mode using the same renderer. Existing behavior is preserved for challenge/match entry, turn state, tie breaker choice, draw, card selection, effect use, VS placement, attack/pass, discard choice, Zon X movement, deck exhaustion, Beginner Bot turns, reconnect/degraded states, quit/return, audio controls and win/loss results.

## Loading and performance
Landing/lobby boot must not load Phaser or arena assets. Arena code is dynamically imported only when a match is entered. Game-resolution card images are used during play; high-resolution inspection images are loaded only when a card is inspected. Large audio and visual assets are loaded by arena phase rather than at app startup. A minimal dark boot shell prevents a white screen before React mounts.

## Testing
Implementation is complete before stress testing. After the full feature surface exists, run existing rule/regression tests plus new arena adapter/layout/input tests. Practice mode is stress-simulated over many seeded matches. Browser visual QA must cover 412x915, 915x412, 1366x768 and 1920x1080, including repeated enter/quit/re-enter and network degradation. Bundle output is inspected to ensure Phaser and arena assets are absent from the initial landing bundle.

## Constraints
- `main` remains untouched.
- Existing Supabase data and migrations are not modified for this client rebuild.
- Existing authoritative game rules are not rewritten as part of the visual rebuild.
- No patch-script chain is added to the new arena path.
- No arena CSS override stack is added.
- No branch is handed to the user until the build passes, the arena loads, automated player-view QA succeeds and the result is visually worth opening.
