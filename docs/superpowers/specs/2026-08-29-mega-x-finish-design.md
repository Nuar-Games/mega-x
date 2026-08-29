# MEGA-X Finish Design

## Goal
Bring MEGA-X from the current degraded online prototype state to a finished browser game whose online play, Arena presentation, audio, landing screen, lobby, results, and leaderboard feel cohesive and release-ready.

## Release Gates

### Gate 1 — Online Core + Arena Recovery
The recovered offline build is the visual/interaction baseline. Online play remains server-authoritative while the browser provides immediate local presentation feedback.

Requirements:
- Restore intended Arena proportions on mobile and desktop, including VS and hand-card sizing.
- Replace emergency low-resolution card assets with the recovered high-resolution gameplay and inspect assets.
- Restore card travel, set, attack wind-up, clash, impact, stat-change, destruction, capture, round-transition, and active-turn presentation.
- Remove artificial client delays and avoid waiting for server round-trips before showing safe local input feedback.
- Preserve backend authority for semantic actions and match outcomes.
- Add an authoritative active-turn deadline and visible countdown so a connected player cannot stall indefinitely.
- Preserve reconnect behavior and integrate it cleanly with the turn deadline.
- Verify the complete hosted flow before declaring Gate 1 complete.

### Gate 2 — Battle Presentation + Audio
Build one centralized audio/presentation layer rather than scattered one-off sounds.

Requirements:
- Separate Music and SFX channels with independent volume and mute controls.
- Source only zero-cost assets whose licenses explicitly allow commercial use; prefer CC0/public-domain/no-attribution. Keep a license manifest in-repo.
- Music states: landing, lobby, battle, countdown/tension, victory, defeat.
- SFX states: UI hover/click/confirm/back, card pick, set, effect play, challenge received/accepted/rejected, matchmaking found, attack wind-up, clash, impact, destruction, capture, round start, victory, defeat.
- Audio transitions follow screen/game state and do not restart unnecessarily.
- Respect browser autoplay restrictions by activating audio only after the first user gesture.

### Gate 3 — Full Audiovisual Shell
The non-battle screens must feel like the same game as the Arena.

Requirements:
- Landing screen: cinematic/looping video or animated hero background, MEGA-X logo treatment, responsive motion, clear PLAY NOW action.
- Lobby: animated environment/background, live matchmaking/challenge feedback, meaningful transitions, challenge notification animation plus SFX.
- Leaderboard: strong Top 3 hierarchy, readable Top 10, current-player highlight, separated handle/points, animated rank/score updates.
- Results: explicit win/loss presentation, score change, rematch/lobby continuation, music/SFX transition.
- Screen-to-screen transitions must be consistent across Landing → Auth → Lobby → Coin Toss → Arena → Results → Leaderboard.

## Technical Boundaries
- Browser remains presentation/input only; backend remains authoritative for gameplay outcomes.
- No client-only gameplay timer that can be bypassed.
- No paid assets, royalties, subscriptions, revenue-share obligations, or unclear licenses.
- Prefer assets requiring no attribution. If attribution is unavoidable, it must be explicit in the license manifest before integration.
- Existing MEGA-X rules, terminology, coin-toss flow, card data, and visual identity are not redesigned by this finishing work.
- Mobile-first browser support remains mandatory.

## Completion Standard
MEGA-X is not called finished until all three release gates are complete and the hosted production build passes end-to-end online verification, including match start, normal turns, timer expiry, effects, attack/pass, round resolution, reconnect, surrender, result, score update, leaderboard, and return to lobby.
