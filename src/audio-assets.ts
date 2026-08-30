export type MegaXSfx = 'ready' | 'ui' | 'card' | 'draw' | 'enter' | 'attack' | 'pass' | 'blocked' | 'destroy'
export type MegaXVoice = 'ready' | 'fight' | 'round1' | 'round2' | 'round3' | 'round4' | 'round5' | 'winner' | 'youWin' | 'youLose' | 'gameOver'

const KENNEY_SFX = 'https://cdn.jsdelivr.net/gh/euuuuuuan/voidclad-public@main/assets/sfx/kenney/'
const KENNEY_UI = 'https://cdn.jsdelivr.net/gh/ETdoFresh/kenney.nl@master/kenney_interfacesounds/Audio/'
const KENNEY_VOICE = 'https://cdn.jsdelivr.net/gh/ETdoFresh/kenney.nl@master/kenney_voiceoverfighter/Audio/'

export const SFX_ASSETS: Record<MegaXSfx, string> = {
  ready: `${KENNEY_SFX}laserLarge_000.ogg`,
  ui: `${KENNEY_UI}confirmation_001.ogg`,
  card: `${KENNEY_UI}select_003.ogg`,
  draw: `${KENNEY_UI}pluck_002.ogg`,
  enter: `${KENNEY_UI}drop_002.ogg`,
  attack: 'https://cdn.jsdelivr.net/gh/euuuuuuan/voidclad-public@main/assets/sfx/core_boom.wav',
  pass: `${KENNEY_UI}back_002.ogg`,
  blocked: `${KENNEY_SFX}impactMetal_heavy_001.ogg`,
  destroy: `${KENNEY_SFX}explosionCrunch_003.ogg`,
}

export const VOICE_ASSETS: Record<MegaXVoice, string> = {
  ready: `${KENNEY_VOICE}ready.ogg`, fight: `${KENNEY_VOICE}fight.ogg`, round1: `${KENNEY_VOICE}round_1.ogg`, round2: `${KENNEY_VOICE}round_2.ogg`, round3: `${KENNEY_VOICE}round_3.ogg`, round4: `${KENNEY_VOICE}round_4.ogg`, round5: `${KENNEY_VOICE}round_5.ogg`, winner: `${KENNEY_VOICE}winner.ogg`, youWin: `${KENNEY_VOICE}you_win.ogg`, youLose: `${KENNEY_VOICE}you_lose.ogg`, gameOver: `${KENNEY_VOICE}game_over.ogg`,
}

export const LOBBY_PLAYLIST = [
  '/audio/lobby/soft-lights-v1.opus',
  '/audio/lobby/high-clouds-v1.opus',
  '/audio/lobby/wishing-star-v1.opus',
] as const

export const ARENA_TRACKS = [
  '/audio/arena/arena-c2-v1.opus',
  '/audio/arena/arena-c3-v1.opus',
] as const

export const MUSIC_ASSETS = {
  coinToss: '/audio/coin-toss/mega-x-coin-toss-v1.opus',
} as const
