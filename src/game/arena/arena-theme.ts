export const ARENA_THEME = {
  colors: {
    background: 0x05070b,
    metalDark: 0x0d1118,
    metalMid: 0x1a202a,
    text: 0xf4f7fb,
    mutedText: 0x98a2b3,
    player: 0x2f8cff,
    opponent: 0xff3b4f,
    decisive: 0xd7b35a,
  },
  alpha: {
    fixtureIdle: 0.38,
    fixtureActive: 0.88,
    dimmed: 0.18,
  },
  motion: {
    fast: 140,
    normal: 220,
    impact: 320,
    result: 520,
  },
  card: {
    aspect: 59 / 86,
    handScale: 1,
    vsScale: 1.2,
    inspectScale: 1.65,
  },
} as const
