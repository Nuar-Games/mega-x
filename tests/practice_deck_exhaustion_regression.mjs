import { preservePracticeExhaustedDeckTurnCompletion } from '../src/practice-match.ts'

const previous = {
  deckExhausted: true,
  firstPlayer: 'human',
}

const next = {
  phase: 'ATTACK',
  firstPlayer: 'human',
  effectTurn: null,
  attackTurn: 'human',
  winner: null,
  tieBreaker: null,
  player1: { x: [1] },
  player2: { x: [2, 3] },
}

preservePracticeExhaustedDeckTurnCompletion(next, previous, 'END_EFFECT_TURN', 'bot', 'human', 'bot')

if (next.phase !== 'GAME_OVER') {
  throw new Error(`Practice must conclude after the non-active Effect turn when Master Deck is exhausted; got ${next.phase}`)
}
if (next.winner !== 'bot') {
  throw new Error(`Practice must decide by Zon X after deck exhaustion; got winner ${next.winner}`)
}
if (next.attackTurn !== null || next.effectTurn !== null) {
  throw new Error('Practice conclusion must clear turn ownership')
}

console.log('PASS Practice concludes after deck exhaustion at the same safe endpoint as online matches')
