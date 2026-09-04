import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = fs.readFileSync('supabase/functions/match-action/engine.ts', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const temp = path.join(os.tmpdir(), `mega-x-flow-${process.pid}-${Date.now()}.mjs`)
fs.writeFileSync(temp, compiled)
const { applyEngineAction } = await import(`${pathToFileURL(temp).href}?v=${Date.now()}`)
fs.unlinkSync(temp)

const P1='00000000-0000-0000-0000-000000000001'
const P2='00000000-0000-0000-0000-000000000002'
const meta={player1_id:P1,player2_id:P2}
const vs=(card=22,position='ATK')=>({card,position,staDelta:0,positionChangedThisRound:false,spudurDiscardCount:0})
function state({p1Hand=[],p2Hand=[],p1Vs=vs(),p2Vs=vs(20),p1Effects=[],p2Effects=[]}={}){
 return {deck:[1,2,3,4,5,6,7,8,9,10],player1:{hand:[...p1Hand],vs:p1Vs,effects:[...p1Effects],discard:[],x:[],attackBlocks:0},player2:{hand:[...p2Hand],vs:p2Vs,effects:[...p2Effects],discard:[],x:[],attackBlocks:0},round:2,phase:'EFFECT',firstPlayer:P1,effectTurn:P1,attackTurn:null,needsVS:[false,false],effectSeq:40,effectActionTaken:[false,false],positionSwitchLocked:[false,false],message:'',deckExhausted:false,winner:null,pendingSelfDiscard:null,pendingBoardChoice:null,pendingChoice:null}
}
const act=(s,actor,action,payload={})=>applyEngineAction({state:s,meta,actorId:actor,action:{action,payload}})
const play=(s,id)=>act(s,P1,'PLAY_EFFECT',{cardId:id})
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)}

// Kapores must pay its own -1 STA without evicting itself from Effect Zone.
{
 const s=play(state({p1Hand:[19],p1Vs:vs(4)}),19 // TABUAN BARA VS has STA 2
 )
 assert(s.player1.vs.staDelta===-1,'KAPORES own STA penalty missing')
 assert(s.player1.effects.some(e=>e.card===19),'KAPORES removed itself from Effect Zone')
 assert(!s.player1.discard.includes(19),'KAPORES sent itself to Zon Tepi')
 assert(!s.pendingBoardChoice?.cardIds?.includes(19),'KAPORES incorrectly created a self-removal capacity choice')
}

// Persistent effect cards must remain actionable after play; Tembok may not dead-end the effect turn.
{
 let s=play(state({p1Hand:[24],p1Vs:vs(17),p2Vs:vs(20,'DEF')}),24)
 assert(s.phase==='EFFECT'&&s.effectTurn===P1,'TEMBOK lost the current Effect turn after play')
 assert(s.player1.effects.some(e=>e.card===24),'TEMBOK did not remain in Effect Zone')
 assert(!s.pendingSelfDiscard&&!s.pendingBoardChoice&&!s.pendingChoice,'TEMBOK created an unexpected blocking choice')
 s=act(s,P1,'END_EFFECT_TURN')
 assert(s.phase==='EFFECT'&&s.effectTurn===P2,'TEMBOK turn cannot advance to opponent')
}

// Hidden-choice effects with no valid target must never leave an impossible pending state.
for(const id of [3,15,22]){
 const s=play(state({p1Hand:[id],p2Hand:[],p2Effects:[]}),id)
 assert(!s.pendingChoice,`Card ${id} created a zero-target pending choice and deadlocked the match`)
}

// Arena action prompts must use the authoritative local player, not display orientation.
const blueprint=fs.readFileSync('src/arena-blueprint.fragment','utf8')
assert(blueprint.includes("game.phase === 'EFFECT' && game.effectTurn === localViewer"),'Effect-turn prompt is not keyed to localViewer')
assert(blueprint.includes("game.phase === 'ATTACK' && game.attackTurn === localViewer"),'Attack prompt is not keyed to localViewer')
assert(blueprint.includes("game.phase === 'SET_VS' && game.needsVS[activeOnlineMatch ? localViewer : bottomPlayer]"),'SET_VS prompt is still keyed only to display orientation')
assert(blueprint.includes("actionTimerIndex === localViewer || localViewer === game.firstPlayer"),'Begin-round prompt does not honor the authoritative online action deadline')

console.log('PASS gameplay flow invariants: Kapores persistence, Tembok progression, zero-target choices, authoritative local prompts')
