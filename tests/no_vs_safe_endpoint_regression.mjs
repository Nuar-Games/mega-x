import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = fs.readFileSync('supabase/functions/match-action/engine.ts', 'utf8')
const compiled = ts.transpileModule(source, {
  compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext },
}).outputText
const temp = path.join(os.tmpdir(), `mega-x-no-vs-end-${process.pid}-${Date.now()}.mjs`)
fs.writeFileSync(temp, compiled)
const { applyEngineAction } = await import(`${pathToFileURL(temp).href}?v=${Date.now()}`)
fs.unlinkSync(temp)

const P1 = '00000000-0000-0000-0000-000000000001'
const P2 = '00000000-0000-0000-0000-000000000002'
const meta = { player1_id: P1, player2_id: P2 }
const vs = (card, position = 'ATK') => ({ card, position, staDelta: 0, positionChangedThisRound: false, spudurDiscardCount: 0 })

const state = {
  deck: [],
  player1: { hand: [27], vs: vs(20, 'DEF'), effects: [], discard: [], x: [], attackBlocks: 0 },
  player2: { hand: [1, 2], vs: vs(24, 'DEF'), effects: [], discard: [], x: [], attackBlocks: 0 },
  round: 4,
  phase: 'EFFECT',
  firstPlayer: P1,
  effectTurn: P1,
  attackTurn: null,
  needsVS: [false, false],
  effectSeq: 10,
  effectActionTaken: [false, false],
  positionSwitchLocked: [false, false],
  message: '',
  deckExhausted: false,
  winner: null,
  pendingSelfDiscard: null,
  pendingBoardChoice: null,
  pendingChoice: null,
}

const next = applyEngineAction({
  state,
  meta,
  actorId: P1,
  action: { action: 'PLAY_EFFECT', payload: { cardId: 27 } },
})

if (next.phase !== 'GAME_OVER') throw new Error(`Expected GAME_OVER when required VS cannot be set, got ${next.phase}`)
if (next.winner !== P1) throw new Error('Expected Zon X leader to win at the no-VS safe endpoint')
if (!next.player1.x.includes(24)) throw new Error('Pendekar capture missing before safe-end scoring')
if (next.player2.hand.length !== 0) throw new Error('Opponent hand should remain empty after Pendekar destruction')
if (next.deck.length !== 0) throw new Error('Master Deck should remain empty')

console.log('PASS required VS + empty hand + empty Master Deck ends immediately at safe endpoint')
