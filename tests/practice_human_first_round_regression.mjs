import { startPracticeMatch, submitPracticeAction } from '../src/practice-match.ts'

const humanId = 'practice-human-test'
let match = null
let cardId = null
for (let attempt = 0; attempt < 40; attempt += 1) {
  const candidate = startPracticeMatch(humanId, 'TEST FIGHTER')
  const nonChoiceCard = candidate.state.player1.hand.find((card) => card.id !== 26)
  if (candidate.state.firstPlayer === humanId && nonChoiceCard) {
    match = candidate
    cardId = nonChoiceCard.id
    break
  }
}

if (!match || cardId === null) throw new Error('could not produce a human-first practice match with a non-SPUDUR opening VS')
if (!match.state.player2.vsCommitted) throw new Error('Beginner Bot should commit its opening VS')
if (!match.state.needsVS[0]) throw new Error('human should still need to set opening VS')

const result = submitPracticeAction(humanId, match.id, match.state_version, 'SET_VS', { cardId, position: 'ATK' })

if (result.phase !== 'EFFECT') {
  const diag = {
    cardId,
    firstPlayer: result.state.firstPlayer,
    needsVS: result.state.needsVS,
    player1VS: result.state.player1.vs,
    player2VSCommitted: result.state.player2.vsCommitted,
    effectTurn: result.state.effectTurn,
    attackTurn: result.state.attackTurn,
    message: result.state.message,
  }
  throw new Error(`practice dead turn reproduced: expected EFFECT after both VS were set, got ${result.phase}; state=${JSON.stringify(diag)}`)
}
if (result.state.effectTurn !== humanId) {
  throw new Error(`expected human Effect turn after automatic round start, got ${result.state.effectTurn}`)
}

console.log('PASS Practice automatically begins the round when the human is first player')
