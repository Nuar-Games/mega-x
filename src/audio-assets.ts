export type MegaXSfx = 'card' | 'draw' | 'enter' | 'vsEnter' | 'attack' | 'destroy' | 'zonX' | 'prompt'

const SFX_REV = '20260905-final-audio'

export const SFX_ASSETS: Record<MegaXSfx, string> = {
  card: `/audio/replacements/card-selected.opus?v=${SFX_REV}`,
  draw: `/audio/replacements/card-draw.opus?v=${SFX_REV}`,
  enter: `/audio/replacements/effect-enter-field.opus?v=${SFX_REV}`,
  vsEnter: `/audio/replacements/card-enter-vs.opus?v=${SFX_REV}`,
  attack: `/audio/replacements/card-attacking.opus?v=${SFX_REV}`,
  destroy: `/audio/replacements/card-destroyed.opus?v=${SFX_REV}`,
  zonX: `/audio/replacements/card-goes-to-zon-x.opus?v=${SFX_REV}`,
  prompt: `/audio/replacements/prompt-needed.opus?v=${SFX_REV}`,
}

export const LOBBY_TRACK = '/audio/replacements/lobby.opus' as const

export const ARENA_TRACKS = [
  '/audio/arena/arena-c2-v1.opus',
  '/audio/arena/arena-c3-v1.opus',
] as const

export const MUSIC_ASSETS = {
  coinToss: '/audio/coin-toss/mega-x-coin-toss-v1.opus',
  winLose: '/audio/replacements/win-lose-screen.opus',
} as const
