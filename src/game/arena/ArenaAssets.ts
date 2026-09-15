export type ArenaCardId = number

const twoDigit = (id: ArenaCardId) => String(id).padStart(2, '0')

export const cardGameUrl = (id: ArenaCardId) => `/cards/game/${twoDigit(id)}.webp`
export const cardInspectUrl = (id: ArenaCardId) => `/cards/inspect/${twoDigit(id)}.webp`

export const ARENA_ASSETS = {
  logo: '/ui/landing/logo.avif',
  background: '/ui/landing/main-background.webp',
  backgroundFallback: '/ui/landing/background.avif',
  arenaUi: {
    hudPlayer: '/ui/arena/v2/hud-player.svg',
    hudOpponent: '/ui/arena/v2/hud-opponent.svg',
    commandControl: '/ui/arena/v2/command-control.svg',
    mobileCommandTray: '/ui/arena/v2/mobile-command-tray.svg',
    effectFixture: '/ui/arena/v2/zone-effect.svg',
    zonXFixture: '/ui/arena/v2/zone-zonx.svg',
    pileFixture: '/ui/arena/v2/pile-fixture.svg',
    turnBanner: '/ui/arena/v2/turn-banner.svg',
    resultFrame: '/ui/arena/v2/result-frame.svg',
    inspectFrame: '/ui/arena/v2/inspect-frame.svg',
    loadingMark: '/ui/arena/v2/loading-mark.svg',
    fxShard: '/ui/arena/v2/fx-shard.svg',
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
