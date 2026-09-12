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
  pendingSelfDiscard: null,
  pendingBoardChoice: null,
  pendingChoice: null,
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

// Once the final Effect sequence has already reached ATTACK, Practice must not
// depend on the exact action/actor that exposed that state. A missed transition
// used to leave Master Deck 0 sitting in ATTACK forever.
const stranded = {
  phase: 'ATTACK',
  firstPlayer: 'human',
  effectTurn: null,
  attackTurn: 'human',
  winner: null,
  tieBreaker: null,
  pendingSelfDiscard: null,
  pendingBoardChoice: null,
  pendingChoice: null,
  player1: { x: [1] },
  player2: { x: [2, 3] },
}

preservePracticeExhaustedDeckTurnCompletion(stranded, previous, 'RESOLVE_SELF_DISCARD', 'human', 'human', 'bot')
if (stranded.phase !== 'GAME_OVER') {
  throw new Error(`Practice exhausted-deck ATTACK dead state reproduced; got ${stranded.phase}`)
}

console.log('PASS Practice concludes whenever exhausted Master Deck reaches the post-Effect attack boundary')
