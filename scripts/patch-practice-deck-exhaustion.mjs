import fs from 'node:fs'

const path = 'src/practice-match.ts'
let source = fs.readFileSync(path, 'utf8')

const applyAnchor = `function apply(actorId: string, action: string, payload: Record<string, unknown> = {}) {
  if (!store) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  store.match.state = applyEngineAction({
    state: store.match.state,
    meta: meta(),
    actorId,
    action: { action, payload } as EngineAction,
  })
}`

const applyReplacement = `export function preservePracticeExhaustedDeckTurnCompletion(nextState: any, previousState: any, action: string, actorId: string, player1Id: string, player2Id: string) {
  if (!previousState.deckExhausted) return
  const normalized = action.toUpperCase()

  if (normalized === 'BEGIN_ROUND' && (nextState.phase === 'GAME_OVER' || nextState.phase === 'TIE_BREAKER')) {
    nextState.phase = 'EFFECT'
    nextState.effectTurn = nextState.firstPlayer
    nextState.attackTurn = null
    nextState.winner = null
    nextState.tieBreaker = null
    const firstLabel = nextState.firstPlayer === player1Id ? 'X Fighter 1' : 'X Fighter 2'
    nextState.message = \`Pusingan \${nextState.round}: giliran Effect \${firstLabel}.\`
    return
  }

  if (normalized !== 'END_EFFECT_TURN' || nextState.phase !== 'ATTACK') return
  const nonActiveId = nextState.firstPlayer === player1Id ? player2Id : player1Id
  if (actorId !== nonActiveId) return

  const x1 = nextState.player1.x.length
  const x2 = nextState.player2.x.length
  nextState.effectTurn = null
  nextState.attackTurn = null
  if (x1 !== x2) {
    nextState.phase = 'GAME_OVER'
    nextState.winner = x1 > x2 ? player1Id : player2Id
    nextState.tieBreaker = null
    nextState.message = \`Master Deck habis. Zon X \${x1}-\${x2}.\`
  } else {
    nextState.phase = 'TIE_BREAKER'
    nextState.winner = null
    nextState.tieBreaker = { deck: shuffleDeck(), index: 0, left: null, right: null, status: 'WAITING', pair: 0 }
    nextState.message = 'PENENTUAN SERI'
  }
}

function apply(actorId: string, action: string, payload: Record<string, unknown> = {}) {
  if (!store) throw new Error('PRACTICE_MATCH_NOT_FOUND')
  const previousState = store.match.state
  const nextState = applyEngineAction({
    state: previousState,
    meta: meta(),
    actorId,
    action: { action, payload } as EngineAction,
  })
  preservePracticeExhaustedDeckTurnCompletion(nextState, previousState, action, actorId, store.match.player1_id, store.match.player2_id)
  store.match.state = nextState
}`

if (!source.includes(applyAnchor)) throw new Error('practice deck exhaustion apply anchor missing')
source = source.replace(applyAnchor, applyReplacement)

const botAnchor = `(state, actorId, candidate) => applyEngineAction({ state, meta: meta(), actorId, action: candidate as EngineAction }),`
const botReplacement = `(state, actorId, candidate) => {
      const nextState = applyEngineAction({ state, meta: meta(), actorId, action: candidate as EngineAction })
      preservePracticeExhaustedDeckTurnCompletion(nextState, state, candidate.action, actorId, store!.match.player1_id, store!.match.player2_id)
      return nextState
    },`

if (!source.includes(botAnchor)) throw new Error('practice deck exhaustion bot anchor missing')
source = source.replace(botAnchor, botReplacement)

fs.writeFileSync(path, source)
console.log('Patched Practice deck exhaustion to match online safe-endpoint conclusion behavior')
