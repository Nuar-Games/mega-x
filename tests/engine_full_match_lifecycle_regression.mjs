import { applyEngineAction } from '../supabase/functions/match-action/engine.ts'

const P1='engine-regression-p1'
const P2='engine-regression-p2'
const META={player1_id:P1,player2_id:P2}
const MATCHES=256
const MAX_STEPS=320

const TIE_ATK={
  1:600,2:999,3:500,4:500,5:700,6:600,7:700,8:500,9:900,10:600,
  11:400,12:500,13:800,14:800,15:700,16:400,17:800,18:900,19:300,20:950,
  21:50,22:700,23:400,24:0,25:800,26:815,27:800,28:700,29:750,30:200,
}

function seededRandom(seed){
  let value=seed>>>0
  return()=>{
    value=(Math.imul(value,1664525)+1013904223)>>>0
    return value/0x100000000
  }
}

function shuffledDeck(random){
  const deck=Array.from({length:30},(_,index)=>index+1)
  for(let index=deck.length-1;index>0;index-=1){
    const swap=Math.floor(random()*(index+1))
    ;[deck[index],deck[swap]]=[deck[swap],deck[index]]
  }
  return deck
}

function initialState(random){
  const deck=shuffledDeck(random)
  const player1Hand=deck.splice(0,5)
  const player2Hand=deck.splice(0,5)
  return {
    deck,
    player1:{hand:player1Hand,vs:null,effects:[],discard:[],x:[],attackBlocks:0},
    player2:{hand:player2Hand,vs:null,effects:[],discard:[],x:[],attackBlocks:0},
    round:1,
    phase:'SET_VS',
    firstPlayer:random()<.5?P1:P2,
    effectTurn:null,
    attackTurn:null,
    needsVS:[true,true],
    effectSeq:0,
    effectActionTaken:[false,false],
    positionSwitchLocked:[false,false],
    message:'Set VS anda untuk memulakan perlawanan.',
    deckExhausted:false,
    winner:null,
    pendingSelfDiscard:null,
    pendingBoardChoice:null,
    pendingChoice:null,
    tieBreaker:null,
  }
}

function player(state,index){return index===0?state.player1:state.player2}
function actorId(index){return index===0?P1:P2}
function actorIndex(id){return id===P1?0:id===P2?1:null}

function apply(state,actor,action,payload={}){
  return applyEngineAction({state,meta:META,actorId:actor,action:{action,payload}})
}

function chooseVs(hand){
  return hand.find(cardId=>cardId!==26)??hand[0]
}

function resolveTieBreakerToGameOver(state,random){
  let deck=Array.isArray(state.tieBreaker?.deck)?[...state.tieBreaker.deck]:shuffledDeck(random)
  let index=Math.max(0,Number(state.tieBreaker?.index??0))
  for(let pair=1;pair<=64;pair+=1){
    if(deck.length-index<10){deck=shuffledDeck(random);index=0}
    const left=deck.slice(index,index+5)
    const right=deck.slice(index+5,index+10)
    index+=10
    const leftCard=[...left].sort((a,b)=>(TIE_ATK[b]??0)-(TIE_ATK[a]??0)||a-b)[0]
    const rightCard=[...right].sort((a,b)=>(TIE_ATK[b]??0)-(TIE_ATK[a]??0)||a-b)[0]
    const leftAtk=TIE_ATK[leftCard]??0
    const rightAtk=TIE_ATK[rightCard]??0
    if(leftAtk===rightAtk)continue
    return {
      ...state,
      phase:'GAME_OVER',
      winner:leftAtk>rightAtk?P1:P2,
      effectTurn:null,
      attackTurn:null,
      tieBreaker:{...state.tieBreaker,deck,index,left:leftCard,right:rightCard,status:'DECIDED',pair},
      message:`Penentuan Seri: ATK ${leftAtk}-${rightAtk}. ${leftAtk>rightAtk?'X Fighter 1':'X Fighter 2'} menang.`,
    }
  }
  throw new Error('tie breaker did not resolve within deterministic pair budget')
}

function driveMatch(seed){
  const random=seededRandom(seed)
  const originalRandom=Math.random
  Math.random=random
  let state=initialState(random)
  let enteredTieBreaker=false
  let actions=0
  try{
    for(let step=0;step<MAX_STEPS;step+=1){
      if(state.phase==='GAME_OVER')return {state,enteredTieBreaker,actions,steps:step}
      if(state.phase==='TIE_BREAKER'){
        enteredTieBreaker=true
        state=resolveTieBreakerToGameOver(state,random)
        continue
      }

      if(state.pendingSelfDiscard){
        const pending=state.pendingSelfDiscard
        const hand=player(state,pending.player).hand
        const cardIds=pending.mode==='EXACT'?hand.slice(0,pending.count):[]
        state=apply(state,actorId(pending.player),'RESOLVE_SELF_DISCARD',{cardIds})
        actions+=1
        continue
      }

      if(state.pendingBoardChoice){
        const pending=state.pendingBoardChoice
        const cardId=pending.cardIds[0]
        if(cardId===undefined)throw new Error(`seed=${seed} board choice has no target`)
        state=apply(state,actorId(pending.chooser),'RESOLVE_BOARD_CHOICE',{cardId})
        actions+=1
        continue
      }

      if(state.pendingChoice){
        const pending=state.pendingChoice
        if(!pending.hiddenOrder?.length)throw new Error(`seed=${seed} hidden choice has no slot`)
        state=apply(state,actorId(pending.chooser),'RESOLVE_HIDDEN_CHOICE',{slot:0})
        actions+=1
        continue
      }

      if(state.phase==='SET_VS'){
        let acted=false
        for(const index of [0,1]){
          if(!state.needsVS[index])continue
          const own=player(state,index)
          const cardId=chooseVs(own.hand)
          if(cardId===undefined)continue
          state=apply(state,actorId(index),'SET_VS',{cardId,position:'ATK'})
          actions+=1
          acted=true
          break
        }
        if(acted)continue
        if(!state.needsVS[0]&&!state.needsVS[1]&&state.player1.vs&&state.player2.vs){
          state=apply(state,state.firstPlayer,'BEGIN_ROUND')
          actions+=1
          continue
        }
        throw new Error(`seed=${seed} SET_VS dead state deck=${state.deck.length} exhausted=${state.deckExhausted}`)
      }

      if(state.phase==='EFFECT'){
        if(!state.effectTurn)throw new Error(`seed=${seed} EFFECT has no effectTurn`)
        state=apply(state,state.effectTurn,'END_EFFECT_TURN')
        actions+=1
        continue
      }

      if(state.phase==='ATTACK'){
        if(!state.attackTurn)throw new Error(`seed=${seed} ATTACK has no attackTurn`)
        const index=actorIndex(state.attackTurn)
        if(index===null)throw new Error(`seed=${seed} unknown attack actor`)
        const vs=player(state,index).vs
        state=apply(state,state.attackTurn,vs?.position==='ATK'?'ATTACK':'PASS_ATTACK')
        actions+=1
        continue
      }

      throw new Error(`seed=${seed} unsupported phase ${state.phase}`)
    }
    throw new Error(`seed=${seed} exceeded ${MAX_STEPS} direct engine steps`)
  }finally{
    Math.random=originalRandom
  }
}

let directGameOver=0
let tieBreakerGameOver=0
let deckExhausted=0
let actionCount=0
let maxSteps=0

for(let seed=1;seed<=MATCHES;seed+=1){
  const result=driveMatch((0x9e3779b9^seed)>>>0)
  if(result.state.phase!=='GAME_OVER')throw new Error(`seed=${seed} did not reach GAME_OVER`)
  if(!result.state.winner)throw new Error(`seed=${seed} GAME_OVER has no winner`)
  if(result.state.deckExhausted)deckExhausted+=1
  if(result.enteredTieBreaker)tieBreakerGameOver+=1
  else directGameOver+=1
  actionCount+=result.actions
  maxSteps=Math.max(maxSteps,result.steps)
}

if(deckExhausted!==MATCHES)throw new Error(`expected every deterministic full match to exhaust Master Deck; got ${deckExhausted}/${MATCHES}`)
if(directGameOver===0)throw new Error('seeded full-match coverage never exercised direct deck-exhaustion GAME_OVER')
if(tieBreakerGameOver===0)throw new Error('seeded full-match coverage never exercised deck-exhaustion tie-breaker')

console.log(`ENGINE_FULL_MATCH_PASS matches=${MATCHES} directGameOver=${directGameOver} tieBreakerGameOver=${tieBreakerGameOver} deckExhausted=${deckExhausted} actions=${actionCount} maxSteps=${maxSteps}`)
