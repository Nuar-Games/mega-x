import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = fs.readFileSync('supabase/functions/match-action/engine.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const temp = path.join(os.tmpdir(), `mega-x-engine-${process.pid}-${Date.now()}.mjs`)
fs.writeFileSync(temp, compiled)
const { applyEngineAction } = await import(`${pathToFileURL(temp).href}?v=${Date.now()}`)
fs.unlinkSync(temp)

const P1 = '00000000-0000-0000-0000-000000000001'
const P2 = '00000000-0000-0000-0000-000000000002'
const meta = { player1_id: P1, player2_id: P2 }
const vs = (card = 22, position = 'ATK') => ({ card, position, staDelta: 0, positionChangedThisRound: false, spudurDiscardCount: 0 })
const effect = (card, seq = card, playedRound = 2) => ({ card, seq, spudurDiscardCount: 0, playedRound })

function makeState(options = {}) {
  const {
    p1Hand = [], p2Hand = [], p1Vs = vs(), p2Vs = vs(20),
    p1Effects = [], p2Effects = [], p1Discard = [], p2Discard = [],
    p1X = [], p2X = [], deck = Array.from({ length: 30 }, (_, i) => i + 1),
    round = 2, phase = 'EFFECT', firstPlayer = P1, effectTurn = P1,
    needsVS = [false, false], effectSeq = 40,
  } = options
  return {
    deck: [...deck],
    player1: { hand: [...p1Hand], vs: p1Vs, effects: p1Effects.map((x) => ({ ...x })), discard: [...p1Discard], x: [...p1X], attackBlocks: 0 },
    player2: { hand: [...p2Hand], vs: p2Vs, effects: p2Effects.map((x) => ({ ...x })), discard: [...p2Discard], x: [...p2X], attackBlocks: 0 },
    round, phase, firstPlayer, effectTurn, attackTurn: null,
    needsVS: [...needsVS], effectSeq, effectActionTaken: [false, false], positionSwitchLocked: [false, false],
    message: '', deckExhausted: false, winner: null,
    pendingSelfDiscard: null, pendingBoardChoice: null, pendingChoice: null,
  }
}

const act = (state, actorId, action, payload = {}) => applyEngineAction({ state, meta, actorId, action: { action, payload } })
const play = (state, cardId) => act(state, P1, 'PLAY_EFFECT', { cardId })
function endToAttack(state) {
  let s = act(state, P1, 'END_EFFECT_TURN')
  s = act(s, P2, 'END_EFFECT_TURN')
  return s
}
function expectThrow(fn, text) {
  let error = null
  try { fn() } catch (e) { error = e }
  if (!error || !String(error.message).includes(text)) throw new Error(`Expected ${text}, got ${error?.message ?? 'no error'}`)
}
function assert(ok, message) { if (!ok) throw new Error(message) }

const tests = []
const test = (name, fn) => tests.push([name, fn])

// 01 XANDER
test('01 XANDER draws one', () => {
  const s = play(makeState({ p1Hand: [1], deck: [2,3,4] }), 1)
  assert(s.player1.hand.length === 1 && s.deck.length === 2, 'XANDER did not draw exactly one')
})

// 02 SINGAU
test('02 SINGAU makes opponent ATK zero', () => {
  let s = play(makeState({ p1Hand: [2], p1Vs: vs(21, 'ATK'), p2Vs: vs(20, 'ATK') }), 2)
  s = endToAttack(s)
  s = act(s, P1, 'ATTACK')
  assert(s.player1.x.includes(20), 'SINGAU did not make low-ATK attacker beat opponent')
})

// 03 ABNER
test('03 ABNER takes one hidden hand card', () => {
  let s = play(makeState({ p1Hand: [3], p2Hand: [4,5,6] }), 3)
  assert(s.pendingChoice?.kind === 'ABNER' && s.pendingChoice.remaining === 1, 'ABNER choice missing')
  s = act(s, P1, 'RESOLVE_HIDDEN_CHOICE', { slot: 0 })
  assert(s.player1.hand.length === 1 && s.player2.hand.length === 2 && !s.pendingChoice, 'ABNER did not transfer one card')
})

// 04 TABUAN BARA
test('04 TABUAN BARA subtracts 100 ATK', () => {
  let s = play(makeState({ p1Hand: [4], p1Vs: vs(17, 'ATK'), p2Vs: vs(9, 'ATK') }), 4)
  s = endToAttack(s)
  s = act(s, P1, 'ATTACK')
  assert(!s.player1.vs && !s.player2.vs && s.player1.discard.includes(17) && s.player2.discard.includes(9), 'TABUAN -100 did not produce expected 800-800 tie')
})

// 05 ARASHMAN
test('05 ARASHMAN destroys all opponent effects', () => {
  const s = play(makeState({ p1Hand: [5], p2Effects: [effect(1), effect(20)] }), 5)
  assert(s.player2.effects.length === 0 && s.player2.discard.includes(1) && s.player2.discard.includes(20), 'ARASHMAN failed')
})

// 06 BARA NANDEZ
test('06 BARA NANDEZ forces and locks DEF', () => {
  let s = play(makeState({ p1Hand: [6], p2Vs: vs(20, 'ATK') }), 6)
  assert(s.player2.vs.position === 'DEF', 'BARA did not force DEF')
  s = act(s, P1, 'END_EFFECT_TURN')
  expectThrow(() => act(s, P2, 'SWITCH_POSITION'), 'POSITION_LOCKED')
})

// 07 KUDA PELONJAK LANGIT
test('07 KUDA destroys lower-DEF VS to Zon Tepi', () => {
  let s = play(makeState({ p1Hand: [7], p1Vs: vs(20), p2Vs: vs(1) }), 7)
  assert(s.pendingBoardChoice?.cardIds.includes(1), 'KUDA target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 1 })
  assert(s.player2.discard.includes(1) && !s.player2.vs, 'KUDA did not destroy VS to discard')
})

// 08 RATU TABUAN LANGIT
test('08 RATU TABUAN subtracts 3 STA and captures at zero', () => {
  const s = play(makeState({ p1Hand: [8], p2Vs: vs(8) }), 8)
  assert(s.player1.x.includes(8) && !s.player2.vs, 'RATU TABUAN did not resolve STA capture')
})

// 09 NAGA ANGIN
test('09 NAGA captures qualifying VS/effects', () => {
  const s = play(makeState({ p1Hand: [9], p2Vs: vs(20), p2Effects: [effect(1), effect(20)] }), 9)
  assert(s.player1.x.includes(1) && !s.player2.effects.some((e) => e.card === 1) && s.player2.effects.some((e) => e.card === 20), 'NAGA threshold effect capture wrong')
})

// 10 TIKUS KILAT ANGKASA
test('10 TIKUS destroys ATK <=800 VS', () => {
  let s = play(makeState({ p1Hand: [10], p2Vs: vs(17) }), 10)
  assert(s.pendingBoardChoice?.cardIds.includes(17), 'TIKUS eligible target missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 17 })
  assert(s.player2.discard.includes(17) && !s.player2.vs, 'TIKUS did not destroy eligible VS')
})

// 11 JENAKA FARISH
test('11 JENAKA subtracts 2 STA and captures at zero', () => {
  const s = play(makeState({ p1Hand: [11], p2Vs: vs(8) }), 11)
  assert(s.player1.x.includes(8) && !s.player2.vs, 'JENAKA did not resolve STA capture')
})

// 12 IMP BARA
test('12 IMP BARA subtracts 200 ATK', () => {
  let s = play(makeState({ p1Hand: [12], p1Vs: vs(17, 'ATK'), p2Vs: vs(9, 'ATK') }), 12)
  s = endToAttack(s)
  s = act(s, P1, 'ATTACK')
  assert(s.player1.x.includes(9), 'IMP BARA -200 ATK failed')
})

// 13 NAGA RIBUT AIS
test('13 NAGA RIBUT applies -200 DEF and one attack block', () => {
  const s = play(makeState({ p1Hand: [13] }), 13)
  assert(s.player2.attackBlocks === 1, 'NAGA RIBUT attack block missing')
})

// 14 WAKTU MEMBEKU
test('14 WAKTU blocks one attack and caps opponent effects at two', () => {
  let s = play(makeState({ p1Hand: [14], p2Hand: [3], p2Effects: [effect(1), effect(20)] }), 14)
  assert(s.player2.attackBlocks === 1, 'WAKTU attack block missing')
  s = act(s, P1, 'END_EFFECT_TURN')
  expectThrow(() => act(s, P2, 'PLAY_EFFECT', { cardId: 3 }), 'EFFECT_CAPACITY_REACHED')
})

// 15 PELUNCUR FROST
test('15 PELUNCUR counts hand plus Effect targets', () => {
  const s = play(makeState({ p1Hand: [15], p2Hand: [1], p2Effects: [effect(20)] }), 15)
  assert(s.pendingChoice?.kind === 'PELUNCUR' && s.pendingChoice.remaining === 2 && s.pendingChoice.hiddenOrder.length === 1, 'PELUNCUR target pool wrong')
})

// 16 PENGANGKAT RIMBA
test('16 PENGANGKAT draws three', () => {
  const s = play(makeState({ p1Hand: [16], deck: [1,2,3,4,5] }), 16)
  assert(s.player1.hand.length === 3 && s.deck.length === 2, 'PENGANGKAT did not draw three')
})

// 17 GRAVITIAN
test('17 GRAVITIAN preserves owner Effect Zone and resets opponent', () => {
  const s = play(makeState({ p1Hand: [17], p1Effects: [effect(20, 1)], p1Discard: [5], p2Hand: [2,3], p2Vs: vs(1), p2Effects: [effect(4, 2)], deck: [6,7,8,9,10,11,12] }), 17)
  assert(s.player1.effects.some((e) => e.card === 20) && s.player1.effects.some((e) => e.card === 17), 'GRAVITIAN cleared owner effects')
  assert(s.player1.discard.length === 1 && s.player1.discard[0] === 5, 'GRAVITIAN polluted owner discard')
  assert(!s.player2.vs && s.player2.effects.length === 0 && s.player2.hand.length === 5, 'GRAVITIAN opponent reset wrong')
  assert(s.needsVS[1] === true && s.firstPlayer === P2 && s.phase === 'SET_VS', 'GRAVITIAN next-round ownership wrong')
})

// 18 GERGASI PEDANG BESI
test('18 GERGASI reduces opponent hand/effects to two', () => {
  let s = play(makeState({ p1Hand: [18], p2Hand: [1,2,3,4,5], p2Effects: [effect(1),effect(2),effect(20),effect(24)] }), 18)
  while (s.pendingBoardChoice) s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: s.pendingBoardChoice.cardIds[0] })
  while (s.pendingChoice) s = act(s, P1, 'RESOLVE_HIDDEN_CHOICE', { slot: 0 })
  assert(s.player2.hand.length === 2 && s.player2.effects.length === 2, 'GERGASI limits wrong')
})

// 19 KAPORES
test('19 KAPORES subtracts own STA by one', () => {
  const s = play(makeState({ p1Hand: [19], p1Vs: vs(22) }), 19)
  assert(s.player1.vs.staDelta === -1, 'KAPORES STA penalty missing')
})

// 20 TINFORGE SENTINEL
test('20 TINFORGE adds 600 ATK', () => {
  let s = play(makeState({ p1Hand: [20], p1Vs: vs(1, 'ATK'), p2Vs: vs(20, 'ATK') }), 20)
  s = endToAttack(s)
  s = act(s, P1, 'ATTACK')
  assert(s.player1.x.includes(20), 'TINFORGE +600 ATK failed')
})

// 21 ULAR PELARI
test('21 ULAR PELARI sets opponent STA to zero', () => {
  const s = play(makeState({ p1Hand: [21], p2Vs: vs(20) }), 21)
  assert(s.player1.x.includes(20) && !s.player2.vs, 'ULAR PELARI did not capture at STA 0')
})

// 22 TOM
test('22 TOM returns three hidden cards then draws three', () => {
  let s = play(makeState({ p1Hand: [22], p2Hand: [1,2,3,4], deck: [5,6,7,8,9] }), 22)
  for (let i = 0; i < 3; i++) s = act(s, P1, 'RESOLVE_HIDDEN_CHOICE', { slot: 0 })
  assert(s.player2.hand.length === 1 && s.player1.hand.length === 3 && !s.pendingChoice, 'TOM resolution wrong')
})

// 23 MANUSIA ASID
test('23 MANUSIA ASID returns one Effect to Master Deck', () => {
  let s = play(makeState({ p1Hand: [23], p2Effects: [effect(20)], deck: [1,2,3] }), 23)
  assert(s.pendingBoardChoice?.purpose === 'RETURN_EFFECT', 'MANUSIA ASID choice missing')
  s = act(s, P1, 'RESOLVE_BOARD_CHOICE', { cardId: 20 })
  assert(s.player2.effects.length === 0 && s.deck.includes(20), 'MANUSIA ASID did not return Effect')
})

// 24 TEMBOK HANGUS
test('24 TEMBOK HANGUS swaps opponent ATK and DEF', () => {
  let s = play(makeState({ p1Hand: [24], p1Vs: vs(17, 'ATK'), p2Vs: vs(20, 'DEF') }), 24)
  s = endToAttack(s)
  s = act(s, P1, 'ATTACK')
  assert(s.player2.x.includes(17), 'TEMBOK HANGUS swap did not turn 600 DEF into 950 DEF')
})

// 25 KELAJUAN TANPA NAMA
test('25 KELAJUAN draws five and applies normal hand cap', () => {
  const s = play(makeState({ p1Hand: [25], deck: [1,2,3,4,5,6] }), 25)
  assert(s.player1.hand.length === 5 && !s.pendingSelfDiscard, 'KELAJUAN draw-five wrong')
})

// 26 SPUDUR
test('26 SPUDUR VS and Effect discard counters are recorded', () => {
  let s = makeState({ p1Hand: [26,1,2], p1Vs: null, phase: 'SET_VS', effectTurn: null, needsVS: [true,false] })
  s = act(s, P1, 'SET_VS', { cardId: 26, position: 'ATK' })
  s = act(s, P1, 'RESOLVE_SELF_DISCARD', { cardIds: [1,2] })
  assert(s.player1.vs.spudurDiscardCount === 2, 'SPUDUR VS counter wrong')

  s = play(makeState({ p1Hand: [26,1,2] }), 26)
  s = act(s, P1, 'RESOLVE_SELF_DISCARD', { cardIds: [1,2] })
  const e = s.player1.effects.find((x) => x.card === 26)
  assert(e?.spudurDiscardCount === 2, 'SPUDUR Effect counter wrong')
})

// 27 PENDEKAR CAHAYA PRISMA
test('27 PENDEKAR DEF captures VS and destroys opponent hand before refill', () => {
  const s = play(makeState({ p1Hand: [27], p1Vs: vs(20, 'DEF'), p2Vs: vs(17), p2Hand: [1,2,3] }), 27)
  assert(s.player1.x.includes(17) && s.player2.hand.length === 5 && s.player2.discard.includes(1) && s.player2.discard.includes(2) && s.player2.discard.includes(3) && !s.player2.vs, 'PENDEKAR resolution wrong')
})

// 28 BLACK HOLE
test('28 BLACK HOLE destroys both VS/effect fields and activator starts', () => {
  const s = play(makeState({ p1Hand: [28], p1Effects: [effect(20)], p2Effects: [effect(4)], p1Vs: vs(1), p2Vs: vs(2) }), 28)
  assert(!s.player1.vs && !s.player2.vs && s.player1.effects.length === 0 && s.player2.effects.length === 0, 'BLACK HOLE field wipe wrong')
  assert(s.needsVS[0] && s.needsVS[1] && s.firstPlayer === P1 && s.phase === 'SET_VS', 'BLACK HOLE next round wrong')
})

// 29 JUARA BARA
test('29 JUARA BARA doubles ATK with another BARA Effect', () => {
  let s = makeState({ p1Vs: vs(29, 'ATK'), p2Vs: vs(20, 'ATK'), p1Effects: [effect(4)] })
  s = endToAttack(s)
  s = act(s, P1, 'ATTACK')
  assert(s.player1.x.includes(20), 'JUARA BARA ATK did not double')
})

// 30 PIPIT
test('30 PIPIT draws five, discards exactly two, then enforces hand cap', () => {
  let s = play(makeState({ p1Hand: [30,2,3,4,5], deck: [6,7,8,9,10,11,12] }), 30)
  assert(s.pendingSelfDiscard?.reason === 'PIPIT' && s.pendingSelfDiscard.count === 2 && s.player1.hand.length === 9, 'PIPIT first discard step wrong')
  s = act(s, P1, 'RESOLVE_SELF_DISCARD', { cardIds: [2,3] })
  assert(s.pendingSelfDiscard?.reason === 'HAND_LIMIT' && s.pendingSelfDiscard.count === 2 && s.player1.hand.length === 7, 'PIPIT hand-cap follow-up wrong')
})

// Core turn/combat invariants outside individual card effects.
test('Round 1 position switching is forbidden', () => {
  const s = makeState({ round: 1 })
  expectThrow(() => act(s, P1, 'SWITCH_POSITION'), 'WRONG_PHASE')
})

test('PASS is sequential and second PASS advances round without destroying VS', () => {
  let s = makeState({ p1Vs: vs(1, 'ATK'), p2Vs: vs(20, 'DEF') })
  s = endToAttack(s)
  s = act(s, P1, 'PASS_ATTACK')
  assert(s.phase === 'ATTACK' && s.attackTurn === P2, 'first PASS did not hand attack decision to opponent')
  s = act(s, P2, 'PASS_ATTACK')
  assert(s.round === 3 && s.player1.vs && s.player2.vs, 'second PASS did not preserve both VS into next round')
})

let failures = 0
for (const [name, fn] of tests) {
  try { await fn(); console.log(`PASS ${name}`) }
  catch (error) { failures++; console.error(`FAIL ${name}: ${error instanceof Error ? error.message : error}`) }
}
console.log(`ENGINE_BEHAVIOR ${tests.length - failures}/${tests.length} passed`)
if (failures) process.exit(1)
