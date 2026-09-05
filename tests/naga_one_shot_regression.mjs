import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = fs.readFileSync('supabase/functions/match-action/engine.ts', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const temp = path.join(os.tmpdir(), `mega-x-naga-${process.pid}-${Date.now()}.mjs`)
fs.writeFileSync(temp, compiled)
const { applyEngineAction } = await import(`${pathToFileURL(temp).href}?v=${Date.now()}`)
fs.unlinkSync(temp)

const P1='00000000-0000-0000-0000-000000000001'
const P2='00000000-0000-0000-0000-000000000002'
const meta={player1_id:P1,player2_id:P2}
const vs=(card=22,position='ATK')=>({card,position,staDelta:0,positionChangedThisRound:false,spudurDiscardCount:0})
const effect=(card,seq=card,playedRound=2)=>({card,seq,spudurDiscardCount:0,playedRound})
const state={
  deck:[2,3,4,5,6],
  player1:{hand:[9],vs:vs(20),effects:[],discard:[],x:[],attackBlocks:0},
  player2:{hand:[1],vs:vs(20),effects:[effect(3),effect(20)],discard:[],x:[],attackBlocks:0},
  round:2,phase:'EFFECT',firstPlayer:P1,effectTurn:P1,attackTurn:null,needsVS:[false,false],effectSeq:40,effectActionTaken:[false,false],positionSwitchLocked:[false,false],message:'',deckExhausted:false,winner:null,pendingSelfDiscard:null,pendingBoardChoice:null,pendingChoice:null
}
const act=(s,actor,action,payload={})=>applyEngineAction({state:s,meta,actorId:actor,action:{action,payload}})
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)}

let s=act(state,P1,'PLAY_EFFECT',{cardId:9})
assert(s.player1.effects.some(e=>e.card===9),'NAGA must remain in its owner Effect Zone after resolving')
assert(s.player1.x.includes(3),'NAGA must capture qualifying opponent cards already on the field when played')
assert(!s.player2.effects.some(e=>e.card===3),'NAGA failed to remove qualifying pre-existing Effect')
assert(s.player2.effects.some(e=>e.card===20),'NAGA must leave non-qualifying pre-existing Effect alone')

s=act(s,P1,'END_EFFECT_TURN')
s=act(s,P2,'PLAY_EFFECT',{cardId:1})
assert(s.player2.effects.some(e=>e.card===1),'NAGA must not capture a qualifying Effect played after NAGA already resolved')
assert(!s.player1.x.includes(1),'NAGA incorrectly behaved as a continuous capture effect')
assert(s.player2.hand.includes(2),'the later Effect must resolve normally after being played')

assert(!source.includes('Effect tangkapan berterusan aktif'),'NAGA must not describe itself as a continuous effect')
console.log('PASS NAGA ANGIN is one-shot on entry: captures existing qualifying field cards only, then expires')
