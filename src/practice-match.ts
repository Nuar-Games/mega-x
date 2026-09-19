import { applyEngineAction, type EngineAction, type EngineState, type MatchMeta } from '../supabase/functions/match-action/engine.ts'
import { runBeginnerBotActions } from './beginner-bot.ts'

export const PRACTICE_BOT_ID = 'practice-beginner-bot'
const PRACTICE_PREFIX = 'practice-local:'

type PracticeMatch = {
  id: string
  player1_id: string
  player1_handle: string
  player2_id: string
  player2_handle: string
  player1_start_place: number | null
  player2_start_place: number | null
  status: 'ACTIVE' | 'COMPLETED'
  phase: string
  state_version: number
  state: any
  reconnect_deadline: null
  disconnected_player: null
}

type PracticeStore = {
  match: Omit<PracticeMatch, 'state'> & { state: EngineState }
}

let store: PracticeStore | null = null

const TIE_ATK: Record<number, number> = {
  1:600,2:999,3:500,4:500,5:700,6:600,7:700,8:500,9:900,10:600,
  11:400,12:500,13:800,14:800,15:700,16:400,17:800,18:900,19:300,20:950,
  21:50,22:700,23:400,24:0,25:800,26:815,27:800,28:700,29:750,30:200,
}

function shuffleDeck() {
  const deck = Array.from({ length: 30 }, (_, i) => i + 1)
  for (let i = deck.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[deck[i], deck[j]] = [deck[j], deck[i]]
  }
  return deck
}

function createState(humanId: string): EngineState {
  const deck = shuffleDeck()
  const player1Hand = deck.splice(0, 5)
  const player2Hand = deck.splice(0, 5)
  return {
    deck,
    player1: { hand: player1Hand, vs: null, effects: [], discard: [], x: [], attackBlocks: 0 },
    player2: { hand: player2Hand, vs: null, effects: [], discard: [], x: [], attackBlocks: 0 },
    round: 1,
    phase: 'SET_VS',
    firstPlayer: Math.random() < 0.5 ? humanId : PRACTICE_BOT_ID,
    effectTurn: null,
    attackTurn: null,
    needsVS: [true, true],
    effectSeq: 0,
    effectActionTaken: [false, false],
    positionSwitchLocked: [false, false],
    message: 'Set VS anda untuk memulakan perlawanan.',
    deckExhausted: false,
    winner: null,
    pendingSelfDiscard: null,
    pendingBoardChoice: null,
    pendingChoice: null,
    tieBreaker: null,
  }
}

function meta(): MatchMeta {
  if (!store) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  return { player1_id: store.match.player1_id, player2_id: store.match.player2_id }
}

function apply(actorId: string, action: string, payload: Record<string, unknown> = {}) {
  if (!store) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  store.match.state = applyEngineAction({
    state: store.match.state,
    meta: meta(),
    actorId,
    action: { action, payload } as EngineAction,
  })
}

function ensureTieHands(state: EngineState) {
  if (state.phase !== 'TIE_BREAKER' || !state.tieBreaker) return
  const tie = state.tieBreaker as any
  if (!Array.isArray(tie.deck) || tie.deck.length < 10) tie.deck = shuffleDeck()
  if (!Array.isArray(tie.hands)) {
    let index = Number(tie.index || 0)
    if (tie.deck.length - index < 10) {
      tie.deck = shuffleDeck()
      index = 0
    }
    tie.hands = [tie.deck.slice(index, index + 5), tie.deck.slice(index + 5, index + 10)]
    tie.index = index + 10
    tie.picks = [null, null]
    tie.pair = Math.max(1, Number(tie.pair || 0))
    tie.status = 'CHOOSING'
  }
  if (!Array.isArray(tie.picks)) tie.picks = [null, null]
  if (tie.picks[1] == null) {
    const hand = Array.isArray(tie.hands[1]) ? tie.hands[1] : []
    tie.picks[1] = [...hand].sort((a, b) => (TIE_ATK[b] || 0) - (TIE_ATK[a] || 0) || a - b)[0] ?? null
  }
}

function resolveTiePick(cardId: number) {
  if (!store) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  const state = store.match.state
  ensureTieHands(state)
  const tie = state.tieBreaker as any
  if (!tie || state.phase !== 'TIE_BREAKER') throw new Error('NO_TIE_BREAKER')
  const humanHand: number[] = Array.isArray(tie.hands?.[0]) ? tie.hands[0] : []
  if (!humanHand.includes(cardId)) throw new Error('TIE_CARD_NOT_IN_YOUR_HAND')
  if (tie.picks[0] != null) throw new Error('TIE_PICK_ALREADY_LOCKED')
  tie.picks[0] = cardId
  const botCard = Number(tie.picks[1])
  const leftAtk = TIE_ATK[cardId] || 0
  const rightAtk = TIE_ATK[botCard] || 0
  const pair = Math.max(1, Number(tie.pair || 1))
  ;(state as any).tiePublic = { left: cardId, right: botCard, pair, status: leftAtk === rightAtk ? 'TIED' : 'DECIDED' }
  if (leftAtk === rightAtk) {
    tie.hands = null
    tie.picks = [null, null]
    tie.pair = pair + 1
    tie.status = 'WAITING'
    ensureTieHands(state)
    state.message = `PENENTUAN SERI ${pair}: ATK ${leftAtk}-${rightAtk} — SERI. Pilih kad baharu.`
    return
  }
  const winner = leftAtk > rightAtk ? store.match.player1_id : store.match.player2_id
  state.phase = 'GAME_OVER'
  state.winner = winner
  state.effectTurn = null
  state.attackTurn = null
  state.message = `Penentuan Seri: ATK ${leftAtk}-${rightAtk}. ${winner === store.match.player1_id ? 'X Fighter 1' : 'X Fighter 2'} menang.`
}

function resolveVisibleEffectChoice(cardId: number) {
  if (!store) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  const state = store.match.state
  const choice = state.pendingChoice
  if (!choice || choice.kind !== 'PELUNCUR' || choice.chooser !== 0) throw new Error('NO_VISIBLE_EFFECT_CHOICE_PENDING')
  const target = choice.target === 0 ? state.player1 : state.player2
  const index = target.effects.findIndex((effect) => effect.card === cardId)
  if (index < 0) throw new Error('INVALID_EFFECT_CHOICE')
  target.discard.push(target.effects.splice(index, 1)[0].card)
  choice.remaining = Math.max(0, choice.remaining - 1)
  if (choice.remaining === 0 || (!choice.hiddenOrder.length && !target.effects.length)) {
    state.pendingChoice = null
    state.message = `${choice.sourceCardName}: pemilihan selesai.`
  }
}

function advanceBot(maxSteps = 24) {
  if (!store || store.match.state.phase === 'GAME_OVER' || maxSteps <= 0) return
  ensureTieHands(store.match.state)
  if (store.match.state.phase === 'TIE_BREAKER') return
  const result = runBeginnerBotActions(
    store.match.state,
    meta(),
    PRACTICE_BOT_ID,
    (state, actorId, candidate) => applyEngineAction({ state, meta: meta(), actorId, action: candidate as EngineAction }),
    maxSteps,
  )
  store.match.state = result.state

  if (
    store.match.state.phase === 'SET_VS' &&
    !store.match.state.needsVS[0] &&
    !store.match.state.needsVS[1] &&
    !store.match.state.pendingSelfDiscard &&
    !store.match.state.pendingBoardChoice &&
    !store.match.state.pendingChoice &&
    store.match.state.firstPlayer === store.match.player1_id
  ) {
    apply(store.match.player1_id, 'BEGIN_ROUND')
  }

  ensureTieHands(store.match.state)
}

function syncMatch() {
  if (!store) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  store.match.phase = store.match.state.phase
  store.match.status = store.match.state.phase === 'GAME_OVER' ? 'COMPLETED' : 'ACTIVE'
}

function redactForHuman(state: EngineState) {
  const visible: any = structuredClone(state)
  visible.player2.handCount = state.player2.hand.length
  visible.player2.hand = []
  visible.deckCount = state.deck.length
  visible.deck = []
  if (state.round === 1 && state.phase === 'SET_VS' && state.needsVS[0]) {
    visible.player2.vsCommitted = Boolean(state.player2.vs)
    visible.player2.vs = null
  }
  if (state.pendingChoice) {
    visible.pendingChoice = { ...visible.pendingChoice, hiddenCount: state.pendingChoice.hiddenOrder.length }
    delete visible.pendingChoice.hiddenOrder
  }
  if (state.phase === 'TIE_BREAKER' && state.tieBreaker) {
    const tie: any = state.tieBreaker
    visible.tieChoice = {
      hand: Array.isArray(tie.hands?.[0]) ? tie.hands[0] : [],
      picked: tie.picks?.[0] != null,
      opponentPicked: tie.picks?.[1] != null,
      pair: Math.max(1, Number(tie.pair || 1)),
    }
    visible.tieBreaker = { status: tie.status || 'CHOOSING', pair: Math.max(1, Number(tie.pair || 1)) }
  }
  return visible
}

function publicMatch(): PracticeMatch | null {
  if (!store) return null
  syncMatch()
  return { ...store.match, state: redactForHuman(store.match.state) }
}

export function isPracticeMatchId(matchId: string | null | undefined) {
  return typeof matchId === 'string' && matchId.startsWith(PRACTICE_PREFIX)
}

export function startPracticeMatch(userId: string, fighterHandle: string) {
  const state = createState(userId)
  store = {
    match: {
      id: `${PRACTICE_PREFIX}${userId}`,
      player1_id: userId,
      player1_handle: fighterHandle || 'X FIGHTER',
      player2_id: PRACTICE_BOT_ID,
      player2_handle: 'BEGINNER BOT',
      player1_start_place: null,
      player2_start_place: null,
      status: 'ACTIVE',
      phase: state.phase,
      state_version: 1,
      state,
      reconnect_deadline: null,
      disconnected_player: null,
    },
  }
  advanceBot()
  return publicMatch()!
}

export function getPracticeMatchForUser(userId: string) {
  if (!store || store.match.player1_id !== userId) return null
  return publicMatch()
}

export function submitPracticeAction(userId: string, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {
  if (!store || store.match.id !== matchId || store.match.player1_id !== userId) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  if (store.match.state_version !== expectedVersion) throw new Error('STALE_MATCH_STATE')
  apply(userId, action, payload)
  advanceBot(0)
  store.match.state_version += 1
  const current = publicMatch()!
  return { state: current.state, state_version: current.state_version, phase: current.phase, status: current.status }
}

export function submitPracticeSpecialAction(userId: string, matchId: string, expectedVersion: number, action: string, payload: Record<string, unknown> = {}) {
  if (!store || store.match.id !== matchId || store.match.player1_id !== userId) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  if (store.match.state_version !== expectedVersion) throw new Error('STALE_MATCH_STATE')
  const normalized = action.toUpperCase()
  if (normalized === 'TIE_PICK') resolveTiePick(Number(payload.cardId))
  else if (normalized === 'RESOLVE_VISIBLE_EFFECT_CHOICE') resolveVisibleEffectChoice(Number(payload.cardId))
  else apply(userId, normalized, payload)
  advanceBot(0)
  store.match.state_version += 1
  const current = publicMatch()!
  return { state: current.state, state_version: current.state_version, phase: current.phase, status: current.status }
}

export function tickPracticeBot(userId: string, matchId: string) {
  if (!store || store.match.id !== matchId || store.match.player1_id !== userId) return null
  if (store.match.state.phase === 'GAME_OVER' || store.match.state.phase === 'TIE_BREAKER') return null
  const before = structuredClone(store.match.state)
  advanceBot(1)
  if (JSON.stringify(store.match.state) === JSON.stringify(before)) return null
  store.match.state_version += 1
  return publicMatch()
}

export function surrenderPracticeMatch(userId: string, matchId: string) {
  if (!store || store.match.id !== matchId || store.match.player1_id !== userId) return
  store.match.state.phase = 'GAME_OVER'
  store.match.state.winner = PRACTICE_BOT_ID
  store.match.state.effectTurn = null
  store.match.state.attackTurn = null
  store.match.state.message = 'X Fighter surrender. BEGINNER BOT menang.'
  store.match.state_version += 1
  syncMatch()
}

export function getPracticeResultSummary(userId: string, matchId: string) {
  if (!store || store.match.id !== matchId || store.match.player1_id !== userId) return null
  const winner = store.match.state.winner || PRACTICE_BOT_ID
  const loser = winner === store.match.player1_id ? PRACTICE_BOT_ID : store.match.player1_id
  return {
    winner_id: winner,
    loser_id: loser,
    winner_points_delta: 0,
    loser_points_delta: 0,
    scored: false,
    my_points: 0,
    my_place: 0,
    my_start_points: 0,
    my_start_place: 0,
  }
}

export function clearPracticeMatch(userId: string, matchId: string) {
  if (store?.match.id === matchId && store.match.player1_id === userId) store = null
}
