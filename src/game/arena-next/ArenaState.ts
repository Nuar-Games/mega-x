export type ArenaPhase = 'SET_VS' | 'EFFECT' | 'ATTACK' | 'TIE_BREAKER' | 'GAME_OVER'
export type ArenaPosition = 'ATK' | 'DEF'
export type ArenaMode = 'online' | 'practice'

export type ArenaCardState = {
  id: number
  name: string
  artSrc: string
  baseAtk: number
  baseDef: number
  baseSta: number
}

export type ArenaStats = {
  atk: number
  def: number
  sta: number
}

export type ArenaVsState = {
  card: ArenaCardState
  position: ArenaPosition
  staDelta: number
  positionChangedThisRound: boolean
  spudurDiscardCount: number
}

export type ArenaEffectState = {
  card: ArenaCardState
  sequence: number
  spudurDiscardCount: number
  playedRound: number
}

/** Five physical Effect slots are always represented. Empty slots are null. */
export type ArenaEffectSlots = [
  ArenaEffectState | null,
  ArenaEffectState | null,
  ArenaEffectState | null,
  ArenaEffectState | null,
  ArenaEffectState | null,
]

export type ArenaPlayerState = {
  playerId: string
  handle: string
  startRank: number | null
  /** Visible only for the local player. Opponent hidden identities remain null. */
  hand: ArenaCardState[] | null
  handCount: number
  vs: ArenaVsState | null
  effects: ArenaEffectSlots
  zonTepi: ArenaCardState[]
  zonX: ArenaCardState[]
  capturedCount: number
  stats: ArenaStats | null
  attackBlocks: number
}

export type ArenaHiddenChoice = {
  kind: 'ABNER' | 'PELUNCUR' | 'TOM' | 'GERGASI'
  chooser: 0 | 1
  target: 0 | 1
  remaining: number
  hiddenCount: number
  sourceCardName: string
}

export type ArenaBoardChoice = {
  chooser: 0 | 1
  target: 0 | 1
  purpose: 'DESTROY_ELIGIBLE' | 'STA_CAPACITY' | 'GERGASI_EFFECT' | 'RETURN_EFFECT'
  title: string
  cardIds: number[]
}

export type ArenaSelfDiscardChoice = {
  player: 0 | 1
  count: number
  mode: 'EXACT' | 'ANY'
  reason: 'HAND_LIMIT' | 'PIPIT' | 'SPUDUR_VS' | 'SPUDUR_EFFECT'
  sourceEffectSequence?: number
}

export type ArenaTieChoice = {
  hand: ArenaCardState[]
  picked: boolean
  opponentPicked: boolean
  pair: number
  reveal: { left: ArenaCardState; right: ArenaCardState; status: 'TIED' | 'DECIDED' } | null
}

export type ArenaPendingChoice =
  | { kind: 'HIDDEN'; value: ArenaHiddenChoice }
  | { kind: 'BOARD'; value: ArenaBoardChoice }
  | { kind: 'SELF_DISCARD'; value: ArenaSelfDiscardChoice }
  | { kind: 'TIE'; value: ArenaTieChoice }

export type ArenaConnectionState = {
  status: 'online' | 'practice' | 'degraded' | 'paused'
  disconnectedPlayerId: string | null
  reconnectDeadline: string | null
  networkBusy: boolean
  lastError: string | null
}

export type ArenaFighterIdentity = {
  playerId: string
  handle: string
  startRank: number | null
}

export type ArenaMatchIdentity = {
  matchId: string
  mode: ArenaMode
  localPlayerIndex: 0 | 1
  players: [ArenaFighterIdentity, ArenaFighterIdentity]
}

export type ArenaLegalCommand = {
  action:
    | 'SET_VS'
    | 'BEGIN_ROUND'
    | 'SWITCH_POSITION'
    | 'PLAY_EFFECT'
    | 'END_EFFECT_TURN'
    | 'ATTACK'
    | 'PASS_ATTACK'
    | 'RESOLVE_SELF_DISCARD'
    | 'RESOLVE_BOARD_CHOICE'
    | 'RESOLVE_HIDDEN_CHOICE'
    | 'RESOLVE_VISIBLE_EFFECT_CHOICE'
    | 'TIE_PICK'
  cardId?: number
  position?: ArenaPosition
  slot?: number
  cardIds?: number[]
}

export type ArenaState = {
  schemaVersion: 1
  identity: ArenaMatchIdentity
  stateVersion: number
  phase: ArenaPhase
  round: number
  firstPlayerIndex: 0 | 1
  effectTurnIndex: 0 | 1 | null
  attackTurnIndex: 0 | 1 | null
  needsVS: [boolean, boolean]
  deckCount: number
  players: [ArenaPlayerState, ArenaPlayerState]
  pendingChoice: ArenaPendingChoice | null
  legalCommands: ArenaLegalCommand[]
  message: string
  winnerIndex: 0 | 1 | null
  connection: ArenaConnectionState
}
