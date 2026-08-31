export type MegaXSfx = 'card' | 'draw' | 'enter' | 'attack' | 'destroy' | 'zonX' | 'prompt' | 'arenaAppear' | 'fight' | 'win'

export const SFX_ASSETS: Record<MegaXSfx, string> = {
  card: '/audio/replacements/card-selected.opus',
  draw: '/audio/replacements/card-draw.opus',
  enter: '/audio/replacements/effect-enter-field.opus',
  attack: '/audio/replacements/card-attacking.opus',
  destroy: '/audio/replacements/card-destroyed.opus',
  zonX: '/audio/replacements/card-goes-to-zon-x.opus',
  prompt: '/audio/replacements/prompt-needed.opus',
  arenaAppear: '/audio/replacements/arena-appear.opus',
  fight: '/audio/replacements/fight.opus',
  win: '/audio/replacements/player-win.opus',
}

export const LOBBY_TRACK = '/audio/replacements/lobby.opus' as const

export const ARENA_TRACKS = [
  '/audio/arena/arena-c2-v1.opus',
  '/audio/arena/arena-c3-v1.opus',
] as const

export const MUSIC_ASSETS = {
  coinToss: '/audio/coin-toss/mega-x-coin-toss-v1.opus',
} as const
