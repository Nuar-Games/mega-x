import fs from 'node:fs'
import {
  startPracticeMatch,
  submitPracticeAction,
} from '../src/practice-match.ts'

const HUMAN = 'practice-regression-human'
let match = startPracticeMatch(HUMAN, 'TEST FIGHTER')

function step(action, payload = {}) {
  const next = submitPracticeAction(HUMAN, match.id, match.state_version, action, payload)
  match = { ...match, ...next }
}

for (let guard = 0; guard < 300 && match.phase !== 'GAME_OVER' && match.phase !== 'TIE_BREAKER'; guard += 1) {
  const s = match.state

  if (s.pendingSelfDiscard?.player === 0) {
    const count = Number(s.pendingSelfDiscard.count || 0)
    step('RESOLVE_SELF_DISCARD', { cardIds: s.player1.hand.slice(0, count) })
    continue
  }

  if (s.phase === 'SET_VS' && s.needsVS?.[0]) {
    const cardId = s.player1.hand[0]
    if (cardId == null) throw new Error('Practice reached SET_VS with no human card before conclusion')
    step('SET_VS', { cardId, position: 'ATK' })
    continue
  }

  if (s.phase === 'SET_VS' && !s.needsVS?.[0] && !s.needsVS?.[1] && s.firstPlayer === HUMAN) {
    step('BEGIN_ROUND')
    continue
  }

  if (s.phase === 'EFFECT' && s.effectTurn === HUMAN) {
    step('END_EFFECT_TURN')
    continue
  }

  if (s.phase === 'ATTACK' && s.attackTurn === HUMAN) {
    step(s.player1.vs?.position === 'ATK' ? 'ATTACK' : 'PASS_ATTACK')
    continue
  }

  throw new Error(`Practice dead state before conclusion: phase=${s.phase} effectTurn=${s.effectTurn} attackTurn=${s.attackTurn} deck=${s.deckCount ?? s.deck?.length ?? 'hidden'} deckExhausted=${s.deckExhausted}`)
}

if (match.phase !== 'GAME_OVER' && match.phase !== 'TIE_BREAKER') {
  throw new Error(`Practice failed to conclude after full lifecycle; final phase=${match.phase}`)
}

if (!match.state.deckExhausted) {
  throw new Error('Practice lifecycle concluded before exercising Master Deck exhaustion')
}

const arena = fs.readFileSync('src/App.tsx', 'utf8')
if (!arena.includes("activeOnlineMatch?.state?.effectTurn === onlineSession?.userId")) {
  throw new Error('Practice human Effect turn has no UUID Arena fallback')
}
if (!arena.includes("activeOnlineMatch?.state?.effectTurn === 0")) {
  throw new Error('Practice local Effect control can disappear when the displayed match has already normalized effectTurn to player index 0')
}

console.log(`PASS real Practice lifecycle concludes after Master Deck exhaustion via ${match.phase} and Arena accepts both UUID and normalized player-index Effect ownership`)
