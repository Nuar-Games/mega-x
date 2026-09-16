export type ArenaCardId = number

const twoDigit = (id: ArenaCardId) => String(id).padStart(2, '0')

export const cardGameUrl = (id: ArenaCardId) => `/cards/game/${twoDigit(id)}.webp`
export const cardInspectUrl = (id: ArenaCardId) => `/cards/inspect/${twoDigit(id)}.webp`

export const ARENA_ASSETS = {
  logo: '/ui/landing/logo.avif',
  background: '/ui/landing/main-background.webp',
  backgroundFallback: '/ui/landing/background.avif',
  arenaUi: {
    hudPlayer: '/ui/arena/v3/hud-player.svg',
    hudOpponent: '/ui/arena/v3/hud-opponent.svg',
    deckFixture: '/ui/arena/v3/deck-fixture.svg',
    discardFixture: '/ui/arena/v3/discard-fixture.svg',
    zonXFixture: '/ui/arena/v3/zonx-fixture.svg',
    fieldBlue: '/ui/arena/v3/field-blue.svg',
    fieldRed: '/ui/arena/v3/field-red.svg',
    fieldNeutral: '/ui/arena/v3/field-neutral.svg',
    turnBanner: '/ui/arena/v3/turn-banner.svg',
    phaseBadge: '/ui/arena/v3/phase-badge.svg',
    commandAttack: '/ui/arena/v3/command-attack.svg',
    commandSkill: '/ui/arena/v3/command-skill.svg',
    commandZonX: '/ui/arena/v3/command-zonx.svg',
    commandMove: '/ui/arena/v3/command-move.svg',
    commandEnd: '/ui/arena/v3/command-end.svg',
    gameLog: '/ui/arena/v3/game-log.svg',
    messagePanel: '/ui/arena/v3/message-panel.svg',
    inspectFrame: '/ui/arena/v3/inspect-frame.svg',
    statusBadge: '/ui/arena/v3/status-badge.svg',
    resultFrame: '/ui/arena/v3/result-frame.svg',
    loadingMark: '/ui/arena/v3/loading-mark.svg',
    fxSlash: '/ui/arena/v3/fx-slash.svg',
    fxBurst: '/ui/arena/v3/fx-burst.svg',
    fxImpact: '/ui/arena/v3/fx-impact.svg',
    fxRing: '/ui/arena/v3/fx-ring.svg',
  },
  vs: {
    mark: '/ui/vs.webp',
    player: '/ui/vs-blue.webp',
    opponent: '/ui/vs-red.webp',
    user: '/ui/vs-user.webp',
  },
  cards: {
    backGame: '/cards/back-game.webp',
    backInspect: '/cards/back-inspect.webp',
    game: Array.from({ length: 30 }, (_, index) => cardGameUrl(index + 1)),
    inspect: Array.from({ length: 30 }, (_, index) => cardInspectUrl(index + 1)),
  },
  audio: {
    cardDraw: '/audio/replacements/card-draw.opus',
    cardSelected: '/audio/replacements/card-selected.opus',
    cardEnterVs: '/audio/replacements/card-enter-vs.opus',
    cardAttacking: '/audio/replacements/card-attacking.opus',
    cardDestroyed: '/audio/replacements/card-destroyed.opus',
    cardGoesToZonX: '/audio/replacements/card-goes-to-zon-x.opus',
    effectEnterField: '/audio/replacements/effect-enter-field.opus',
    promptNeeded: '/audio/replacements/prompt-needed.opus',
    winLose: '/audio/replacements/win-lose-screen.opus',
    coinToss: '/audio/coin-toss/mega-x-coin-toss-v1.opus',
    arenaMusicA: '/audio/arena/arena-c2-v1.opus',
    arenaMusicB: '/audio/arena/arena-c3-v1.opus',
  },
} as const
