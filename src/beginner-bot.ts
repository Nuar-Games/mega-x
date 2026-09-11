export type BotAction = {
  action: string
  payload?: Record<string, unknown>
  reason: string
}

type PlayerIndex = 0 | 1

type PlayerState = {
  hand: number[]
  vs: { card: number; position: 'ATK' | 'DEF' } | null
  effects: Array<{ card: number }>
  discard: number[]
  x: number[]
  attackBlocks: number
}

type PracticeState = {
  player1: PlayerState
  player2: PlayerState
  round: number
  phase: string
  firstPlayer: string
  effectTurn: string | null
  attackTurn: string | null
  needsVS: [boolean, boolean]
  effectActionTaken: [boolean, boolean]
  pendingSelfDiscard?: { player: PlayerIndex; count: number } | null
  pendingBoardChoice?: { chooser: PlayerIndex; cardIds: number[] } | null
  pendingChoice?: { chooser: PlayerIndex; hiddenOrder: number[] } | null
}

type MatchMeta = { player1_id: string; player2_id: string }

const CARD_STATS: Record<number, { atk: number; def: number; sta: number }> = {
  1:{atk:600,def:400,sta:3},2:{atk:999,def:900,sta:5},3:{atk:500,def:300,sta:4},4:{atk:500,def:450,sta:2},5:{atk:700,def:650,sta:3},6:{atk:600,def:550,sta:3},7:{atk:700,def:300,sta:5},8:{atk:500,def:450,sta:2},9:{atk:900,def:850,sta:5},10:{atk:600,def:300,sta:4},
  11:{atk:400,def:200,sta:4},12:{atk:500,def:450,sta:3},13:{atk:800,def:500,sta:4},14:{atk:800,def:750,sta:5},15:{atk:700,def:650,sta:4},16:{atk:400,def:200,sta:3},17:{atk:800,def:750,sta:5},18:{atk:900,def:300,sta:2},19:{atk:300,def:100,sta:3},20:{atk:950,def:600,sta:5},
  21:{atk:50,def:30,sta:2},22:{atk:700,def:300,sta:6},23:{atk:400,def:350,sta:6},24:{atk:0,def:999,sta:4},25:{atk:800,def:300,sta:4},26:{atk:800,def:600,sta:5},27:{atk:800,def:700,sta:5},28:{atk:700,def:650,sta:4},29:{atk:750,def:300,sta:4},30:{atk:200,def:150,sta:2},
}

const SIMPLE_EFFECT_PRIORITY = [1, 16, 20, 5, 8, 11, 13, 6, 21, 4, 12, 14, 24, 25, 27, 29, 19]

function indexFor(meta: MatchMeta, id: string): PlayerIndex {
  if (id === meta.player1_id) return 0
  if (id === meta.player2_id) return 1
  throw new Error('BOT_NOT_MATCH_PLAYER')
}

function player(state: PracticeState, index: PlayerIndex) {
  return index === 0 ? state.player1 : state.player2
}

function vsScore(cardId: number) {
  const s = CARD_STATS[cardId]
  return s ? s.atk + s.def + s.sta * 120 : 0
}

function preferredPosition(cardId: number): 'ATK' | 'DEF' {
  const s = CARD_STATS[cardId]
  return s && s.def > s.atk ? 'DEF' : 'ATK'
}

function orderedHandForVS(hand: number[]) {
  return [...hand].sort((a, b) => vsScore(b) - vsScore(a) || a - b)
}

function orderedHandForEffect(hand: number[]) {
  const rank = new Map(SIMPLE_EFFECT_PRIORITY.map((id, i) => [id, i]))
  return hand.filter((id) => rank.has(id)).sort((a, b) => (rank.get(a) ?? 999) - (rank.get(b) ?? 999) || a - b)
}

export function beginnerBotCandidates(state: PracticeState, meta: MatchMeta, botId: string): BotAction[] {
  const bot = indexFor(meta, botId)
  const own = player(state, bot)

  if (state.pendingSelfDiscard?.player === bot) {
    const count = Math.max(0, state.pendingSelfDiscard.count)
    return [{ action: 'RESOLVE_SELF_DISCARD', payload: { cardIds: own.hand.slice(0, count) }, reason: 'Complete the required discard so the lesson can continue.' }]
  }

  if (state.pendingBoardChoice?.chooser === bot) {
    const cardId = state.pendingBoardChoice.cardIds[0]
    return cardId === undefined ? [] : [{ action: 'RESOLVE_BOARD_CHOICE', payload: { cardId }, reason: 'Choose the first legal visible target for predictable beginner play.' }]
  }

  if (state.pendingChoice?.chooser === bot) {
    return state.pendingChoice.hiddenOrder.length
      ? [{ action: 'RESOLVE_HIDDEN_CHOICE', payload: { slot: 0 }, reason: 'Choose the first hidden slot consistently.' }]
      : []
  }

  if (state.phase === 'SET_VS' && state.needsVS[bot]) {
    return orderedHandForVS(own.hand).map((cardId) => ({
      action: 'SET_VS',
      payload: { cardId, position: preferredPosition(cardId) },
      reason: preferredPosition(cardId) === 'ATK'
        ? 'Set a strong, easy-to-understand attacker.'
        : 'Use a naturally defensive card in DEF position.',
    }))
  }

  if (state.phase === 'SET_VS' && !state.needsVS[0] && !state.needsVS[1] && state.firstPlayer === botId) {
    return [{ action: 'BEGIN_ROUND', reason: 'Both VS cards are ready; begin the round.' }]
  }

  if (state.phase === 'EFFECT' && state.effectTurn === botId) {
    const actions: BotAction[] = []
    if (!state.effectActionTaken[bot]) {
      for (const cardId of orderedHandForEffect(own.hand)) {
        actions.push({ action: 'PLAY_EFFECT', payload: { cardId }, reason: 'Play one straightforward legal Effect when possible.' })
      }
    }
    actions.push({ action: 'END_EFFECT_TURN', reason: 'End the Effect turn instead of forcing an advanced combo.' })
    return actions
  }

  if (state.phase === 'ATTACK' && state.attackTurn === botId) {
    if (own.vs?.position === 'ATK') {
      return [
        { action: 'ATTACK', reason: 'Attack with an ATK-position VS so the player sees combat resolution.' },
        { action: 'PASS_ATTACK', reason: 'Fallback if an attack is not legal.' },
      ]
    }
    return [{ action: 'PASS_ATTACK', reason: 'A DEF-position VS cannot attack; demonstrate PASS.' }]
  }

  return []
}

export type ApplyBotAction<S extends PracticeState> = (state: S, actorId: string, action: BotAction) => S

export function runBeginnerBotActions<S extends PracticeState>(
  initialState: S,
  meta: MatchMeta,
  botId: string,
  applyAction: ApplyBotAction<S>,
  maxSteps = 24,
): { state: S; actions: BotAction[] } {
  let state = initialState
  const actions: BotAction[] = []

  for (let step = 0; step < maxSteps; step += 1) {
    const candidates = beginnerBotCandidates(state, meta, botId)
    if (!candidates.length) break

    let advanced = false
    for (const candidate of candidates) {
      try {
        const next = applyAction(state, botId, candidate)
        state = next
        actions.push(candidate)
        advanced = true
        break
      } catch {
        // Candidate was not legal in the authoritative engine. Try the next
        // predictable beginner fallback instead of duplicating rule logic here.
      }
    }

    if (!advanced) break
  }

  return { state, actions }
}
