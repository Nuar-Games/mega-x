import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import ts from 'typescript'

const source = fs.readFileSync('supabase/functions/match-action/engine.ts', 'utf8')
const compiled = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext } }).outputText
const temp = path.join(os.tmpdir(), `mega-x-core-rules-${process.pid}-${Date.now()}.mjs`)
fs.writeFileSync(temp, compiled)
const { applyEngineAction } = await import(`${pathToFileURL(temp).href}?v=${Date.now()}`)
fs.unlinkSync(temp)

const P1='00000000-0000-0000-0000-000000000001'
const P2='00000000-0000-0000-0000-000000000002'
const meta={player1_id:P1,player2_id:P2}
const vs=(card=22,position='ATK')=>({card,position,staDelta:0,positionChangedThisRound:false,spudurDiscardCount:0})
const effect=(card,seq=card,playedRound=2)=>({card,seq,spudurDiscardCount:0,playedRound})
const player=(hand,vsCard,effects=[],x=[],discard=[])=>({hand:[...hand],vs:vsCard,effects:[...effects],discard:[...discard],x:[...x],attackBlocks:0})
function state(o={}){
  return {
    deck:[...(o.deck??[1,2,3,4,5,6])],
    player1:player(o.p1Hand??[],o.p1Vs===undefined?vs(20):o.p1Vs,o.p1Effects??[],o.p1X??[],o.p1Discard??[]),
    player2:player(o.p2Hand??[],o.p2Vs===undefined?vs(1):o.p2Vs,o.p2Effects??[],o.p2X??[],o.p2Discard??[]),
    round:o.round??2,phase:o.phase??'EFFECT',firstPlayer:o.firstPlayer??P1,effectTurn:o.effectTurn??P1,attackTurn:o.attackTurn??null,
    needsVS:o.needsVS??[false,false],effectSeq:40,effectActionTaken:[false,false],positionSwitchLocked:[false,false],message:'',deckExhausted:o.deckExhausted??false,winner:null,
    pendingSelfDiscard:null,pendingBoardChoice:null,pendingChoice:null,
  }
}
const act=(s,id,action,payload={})=>applyEngineAction({state:s,meta,actorId:id,action:{action,payload}})
const play=(s,id)=>act(s,P1,'PLAY_EFFECT',{cardId:id})
const assert=(ok,msg)=>{if(!ok)throw new Error(msg)}

// KUDA: destroyed VS scores; destroyed Effect does not.
{
  let s=play(state({p1Hand:[7],p1Vs:vs(20),p2Vs:vs(1),deck:[2,3,4,5,6,8,9,10,11,12]}),7)
  s=act(s,P1,'RESOLVE_BOARD_CHOICE',{cardId:1})
  assert(s.player1.x.includes(1),'KUDA destroyed VS must go to effect owner Zon X')
  assert(!s.player2.discard.includes(1),'KUDA destroyed VS must not go to Zon Tepi')
}
{
  let s=play(state({p1Hand:[7],p1Vs:vs(20),p2Vs:vs(20),p2Effects:[effect(1)],deck:[2,3,4,5]}),7)
  s=act(s,P1,'RESOLVE_BOARD_CHOICE',{cardId:1})
  assert(s.player2.discard.includes(1),'KUDA destroyed Effect must still go to Zon Tepi')
  assert(!s.player1.x.includes(1),'KUDA destroyed Effect must not score')
}

// TIKUS: same destination rule.
{
  let s=play(state({p1Hand:[10],p2Vs:vs(17),deck:[2,3,4,5,6,7,8]}),10)
  s=act(s,P1,'RESOLVE_BOARD_CHOICE',{cardId:17})
  assert(s.player1.x.includes(17),'TIKUS destroyed VS must go to effect owner Zon X')
  assert(!s.player2.discard.includes(17),'TIKUS destroyed VS must not go to Zon Tepi')
}

// BLACK HOLE: simultaneous VS trophies, Effects still discarded.
{
  const s=play(state({p1Hand:[28],p1Vs:vs(1),p2Vs:vs(2),p1Effects:[effect(20)],p2Effects:[effect(4)],deck:[3,5,6,7,8,9,10,11,12,13]}),28)
  assert(s.player1.x.includes(2),'BLACK HOLE must award P2 VS to P1 Zon X')
  assert(s.player2.x.includes(1),'BLACK HOLE must award P1 VS to P2 Zon X')
  assert(!s.player1.discard.includes(1)&&!s.player2.discard.includes(2),'BLACK HOLE must not discard VS')
  assert(s.player1.discard.includes(20)&&s.player2.discard.includes(4),'BLACK HOLE Effects must still go Zon Tepi')
}
{
  const s=play(state({p1Hand:[28],p1Vs:vs(1),p2Vs:null,deck:[3,5,6,7,8,9,10,11,12,13]}),28)
  assert(s.player2.x.includes(1),'BLACK HOLE with one VS must award only that VS to opponent')
  assert(s.player1.x.length===0,'BLACK HOLE must not invent a trophy for an empty VS zone')
}

// Deck exhaustion during a draw is only a state flag, never an immediate mid-round finish.
{
  const s=play(state({p1Hand:[1],deck:[2],p1X:[9],p2X:[]}),1)
  assert(s.deckExhausted&&s.deck.length===0,'XANDER scenario did not exhaust Master Deck')
  assert(s.phase==='EFFECT'&&s.winner===null,'Master Deck exhaustion interrupted active Effect phase')
}

// Exhaustion during round-end refill must preserve mandatory replacement VS setup.
let exhaustedTransition
{
  let s=state({p1Hand:[3,4,5,6],p2Hand:[7,8,9,10,11],p1Vs:vs(20,'ATK'),p2Vs:vs(1,'ATK'),deck:[12],p1X:[2],p2X:[],phase:'EFFECT',effectTurn:P1})
  s=act(s,P1,'END_EFFECT_TURN')
  s=act(s,P2,'END_EFFECT_TURN')
  s=act(s,P1,'ATTACK')
  assert(s.deckExhausted,'combat refill scenario did not exhaust Master Deck')
  assert(s.phase==='SET_VS'&&s.needsVS[1]===true,'deck exhaustion must preserve loser replacement-VS setup')
  assert(s.winner===null,'deck exhaustion ended match before mandatory setup')
  exhaustedTransition=s
}

// Replacement setup and BEGIN_ROUND must not end the match. Both Effect turns complete;
// with no draw required, play continues to the attack decision.
{
  let s=act(exhaustedTransition,P2,'SET_VS',{cardId:7,position:'ATK'})
  assert(s.phase==='SET_VS'&&s.winner===null,'match ended before mandatory round transition')
  s=act(s,P2,'BEGIN_ROUND')
  assert(s.phase==='EFFECT'&&s.effectTurn===P2&&s.winner===null,'BEGIN_ROUND must not terminate an exhausted-deck match')
  s=act(s,P2,'END_EFFECT_TURN')
  assert(s.phase==='EFFECT'&&s.effectTurn===P1&&s.winner===null,'active Effect turn did not hand control to non-active player')
  s=act(s,P1,'END_EFFECT_TURN')
  assert(s.phase==='ATTACK','exhausted Master Deck without a required draw must continue to attack')
  assert(s.winner===null,'exhausted Master Deck without a failed draw must not choose a winner')
}

console.log('PASS core rules revision: VS destruction scores, BLACK HOLE symmetry, deck exhaustion ends the match only on a failed draw')
