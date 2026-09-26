import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = fs.readFileSync('supabase/functions/match-action/engine.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const temp = path.join(os.tmpdir(), `mega-x-deck-exhaustion-${process.pid}-${Date.now()}.mjs`)
fs.writeFileSync(temp, compiled)
const { applyEngineAction } = await import(`${pathToFileURL(temp).href}?v=${Date.now()}`)
fs.unlinkSync(temp)

const P1 = '00000000-0000-0000-0000-000000000001'
const P2 = '00000000-0000-0000-0000-000000000002'
const meta = { player1_id: P1, player2_id: P2 }
const vs = (card = 22, position = 'ATK') => ({ card, position, staDelta: 0, positionChangedThisRound: false, spudurDiscardCount: 0 })

function makeState(options = {}) {
  const {
    deck = [], p1Hand = [], p2Hand = [], p1Vs = vs(20), p2Vs = vs(21),
    p1X = [], p2X = [], round = 2, phase = 'EFFECT', firstPlayer = P1,
    effectTurn = phase === 'EFFECT' ? P1 : null, attackTurn = phase === 'ATTACK' ? P1 : null,
  } = options
  return {
    deck: [...deck],
    player1: { hand: [...p1Hand], vs: p1Vs, effects: [], discard: [], x: [...p1X], attackBlocks: 0 },
    player2: { hand: [...p2Hand], vs: p2Vs, effects: [], discard: [], x: [...p2X], attackBlocks: 0 },
    round, phase, firstPlayer, effectTurn, attackTurn,
    needsVS: [false, false], effectSeq: 40, effectActionTaken: [false, false], positionSwitchLocked: [false, false],
    message: '', deckExhausted: false, winner: null,
    pendingSelfDiscard: null, pendingBoardChoice: null, pendingChoice: null, tieBreaker: null,
  }
}

const act = (state, actorId, action, payload = {}) => applyEngineAction({ state, meta, actorId, action: { action, payload } })
const assert = (ok, message) => { if (!ok) throw new Error(message) }
const tests = []
const test = (name, fn) => tests.push([name, fn])

test('empty deck with no required draw lets a full round continue', () => {
  let s = makeState({ deck: [], p1Hand: [1,2,3,4,5], p2Hand: [6,7,8,9,10] })
  s = act(s, P1, 'END_EFFECT_TURN')
  s = act(s, P2, 'END_EFFECT_TURN')
  assert(s.phase === 'ATTACK' && s.attackTurn === P1, 'empty deck ended match before attack')
  s = act(s, P1, 'PASS_ATTACK')
  s = act(s, P2, 'PASS_ATTACK')
  assert(s.phase === 'EFFECT' && s.round === 3 && s.effectTurn === P1, 'round without a draw did not continue normally')
  assert(s.winner === null && !s.deckExhausted, 'empty deck alone marked the match terminal')
})

test('failed winner refill ends immediately with correct scoring', () => {
  const s = act(makeState({ phase: 'ATTACK', deck: [], p1Hand: [1,2,3,4], p2Hand: [5,6,7,8], p1X: [], p2X: [] }), P1, 'ATTACK')
  assert(s.phase === 'GAME_OVER', 'failed refill did not end match')
  assert(s.winner === P1, 'Zon X scoring did not select the correct winner')
  assert(s.player1.x.length === 1 && s.player2.x.length === 0, 'capture scoring changed before termination')
})

test('partial refill takes remaining cards then ends', () => {
  const s = act(makeState({ phase: 'ATTACK', deck: [1], p1Hand: [2,3], p2Hand: [4,5,6,7], p1X: [], p2X: [] }), P1, 'ATTACK')
  assert(s.player1.hand.includes(1), 'partial draw did not give the remaining card')
  assert(s.player1.hand.length === 3 && s.deck.length === 0, 'partial draw count is wrong')
  assert(s.phase === 'GAME_OVER' && s.winner === P1, 'partial draw failure did not terminate with scoring')
})

test('drawing the exact last card completes normally', () => {
  const s = act(makeState({ deck: [2], p1Hand: [1], p1Vs: vs(22), p2Vs: vs(20), p1X: [], p2X: [] }), P1, 'PLAY_EFFECT', { cardId: 1 })
  assert(s.player1.hand.length === 1 && s.player1.hand[0] === 2 && s.deck.length === 0, 'exact final draw did not complete')
  assert(s.phase === 'EFFECT' && s.winner === null && !s.deckExhausted, 'exact final draw incorrectly ended the match')
})

test('failed winner refill prevents loser refill', () => {
  const s = act(makeState({ phase: 'ATTACK', deck: [], p1Hand: [1,2,3,4], p2Hand: [5,6], p1X: [], p2X: [] }), P1, 'ATTACK')
  assert(s.phase === 'GAME_OVER', 'winner refill failure did not terminate')
  assert(s.player2.hand.length === 2, 'loser refilled after winner refill had already failed')
})

test('XANDER and PENGANGKAT RIMBA terminate when their required draws fail', () => {
  for (const cardId of [1,16]) {
    const s = act(makeState({ deck: [], p1Hand: [cardId], p1Vs: vs(22), p2Vs: vs(20), p1X: [2], p2X: [] }), P1, 'PLAY_EFFECT', { cardId })
    assert(s.phase === 'GAME_OVER' && s.winner === P1, `effect ${cardId} failed draw did not terminate with scoring`)
  }
})

test('failed draw uses TIE_BREAKER for equal Zon X and GAME_OVER for unequal Zon X', () => {
  const tied = act(makeState({ deck: [], p1Hand: [1], p1Vs: vs(22), p2Vs: vs(20), p1X: [], p2X: [] }), P1, 'PLAY_EFFECT', { cardId: 1 })
  assert(tied.phase === 'TIE_BREAKER' && tied.winner === null, 'equal Zon X did not enter TIE_BREAKER')
  assert(tied.tieBreaker?.status === 'WAITING' && tied.tieBreaker?.pair === 0 && tied.tieBreaker?.deck?.length === 30, 'existing tieBreaker structure was not created')
  const unequal = act(makeState({ deck: [], p1Hand: [1], p1Vs: vs(22), p2Vs: vs(20), p1X: [2,3], p2X: [4] }), P1, 'PLAY_EFFECT', { cardId: 1 })
  assert(unequal.phase === 'GAME_OVER' && unequal.winner === P1 && unequal.tieBreaker === null, 'unequal Zon X did not end with the correct winner')
})

test('draw failure overrides pending discard created by the same action', () => {
  const s = act(makeState({ deck: [], p1Hand: [30], p1Vs: vs(22), p2Vs: vs(20), p1X: [2], p2X: [] }), P1, 'PLAY_EFFECT', { cardId: 30 })
  assert(s.phase === 'GAME_OVER' && s.winner === P1, 'PIPIT failed draw did not terminate')
  assert(!s.pendingSelfDiscard && !s.pendingBoardChoice && !s.pendingChoice, 'termination left a pending choice or discard')
})

let passed = 0
for (const [name, fn] of tests) {
  fn()
  passed += 1
  console.log(`PASS ${name}`)
}
console.log(`DECK_EXHAUSTION_RULE_REGRESSION_PASS ${passed}/${tests.length}`)
