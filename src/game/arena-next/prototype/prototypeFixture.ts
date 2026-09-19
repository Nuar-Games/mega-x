import type { ArenaCardState, ArenaEffectSlots, ArenaState } from '../ArenaState'
import type { ArenaEventEnvelope } from '../ArenaEvents'

const card=(id:number,name:string,atk:number,def:number,sta:number):ArenaCardState=>({
  id,name,artSrc:'',baseAtk:atk,baseDef:def,baseSta:sta,
})

const emptyEffects=():ArenaEffectSlots=>[null,null,null,null,null]

const pendekar=card(27,'PENDEKAR CAHAYA PRISMA',800,700,5)
const gravitian=card(17,'GRAVITIAN',800,750,5)
const singau=card(2,'SINGAU',999,900,5)
const nandez=card(6,'BARA NANDEZ',600,550,3)
const blackHole=card(28,'BLACK HOLE',700,650,4)
const xander=card(1,'XANDER SI TUKANG CANGKUL',600,400,3)

const basePlayer=(playerId:string,handle:string,startRank:number|null)=>({
  playerId,handle,startRank,hand:null as ArenaCardState[]|null,handCount:0,vs:null,effects:emptyEffects(),zonTepi:[],zonX:[],capturedCount:0,stats:null,attackBlocks:0,
})

export const prototypeStateBefore:ArenaState={
  schemaVersion:1,
  identity:{
    matchId:'prototype-match',mode:'online',localPlayerIndex:0,
    players:[
      {playerId:'p1',handle:'AKIRA',startRank:17},
      {playerId:'p2',handle:'RIVAL',startRank:12},
    ],
  },
  stateVersion:10,
  phase:'SET_VS',round:1,firstPlayerIndex:0,effectTurnIndex:null,attackTurnIndex:null,needsVS:[true,false],deckCount:20,
  players:[
    {...basePlayer('p1','AKIRA',17),hand:[pendekar,singau,nandez,blackHole,gravitian],handCount:5,effects:emptyEffects()},
    {...basePlayer('p2','RIVAL',12),hand:null,handCount:5,effects:emptyEffects(),vs:{card:gravitian,position:'ATK',staDelta:0,positionChangedThisRound:false,spudurDiscardCount:0},stats:{atk:800,def:750,sta:5}},
  ],
  pendingChoice:null,
  legalCommands:[{action:'SET_VS',cardId:27,position:'ATK'}],
  message:'Set VS anda untuk memulakan perlawanan.',winnerIndex:null,
  connection:{status:'online',disconnectedPlayerId:null,reconnectDeadline:null,networkBusy:false,lastError:null},
}

export const prototypeStateAfter:ArenaState={
  ...prototypeStateBefore,
  stateVersion:11,
  needsVS:[false,false],
  players:[
    {...prototypeStateBefore.players[0],hand:[singau,nandez,blackHole,gravitian],handCount:4,vs:{card:pendekar,position:'ATK',staDelta:0,positionChangedThisRound:false,spudurDiscardCount:0},stats:{atk:800,def:700,sta:5}},
    prototypeStateBefore.players[1],
  ],
  legalCommands:[{action:'BEGIN_ROUND'}],
  message:'AKIRA set PENDEKAR CAHAYA PRISMA dalam posisi ATK.',
}

export const prototypeVsSetEvent:ArenaEventEnvelope={
  matchId:'prototype-match',sequence:1,fromVersion:10,toVersion:11,
  event:{type:'VS_SET',player:0,cardId:27,position:'ATK'},
}

const drawState:ArenaState={
  ...prototypeStateAfter,stateVersion:12,deckCount:19,
  players:[
    {...prototypeStateAfter.players[0],hand:[...(prototypeStateAfter.players[0].hand??[]),xander],handCount:5},
    prototypeStateAfter.players[1],
  ],
  message:'AKIRA draws 1 card.',
}

const effectPhaseState:ArenaState={...drawState,stateVersion:13,phase:'EFFECT',message:'Effect phase.'}
const effectTurnState:ArenaState={...effectPhaseState,stateVersion:14,effectTurnIndex:0,message:'AKIRA effect turn.'}

const singauEffect={card:singau,sequence:1,spudurDiscardCount:0,playedRound:1}
const effectPlayedState:ArenaState={
  ...effectTurnState,stateVersion:15,
  players:[
    {...effectTurnState.players[0],hand:[nandez,blackHole,gravitian,xander],handCount:4,effects:[singauEffect,null,null,null,null]},
    effectTurnState.players[1],
  ],
  message:'AKIRA plays SINGAU to Effect Zone.',
}

const effectTriggeredState:ArenaState={...effectPlayedState,stateVersion:16,message:'SINGAU effect triggered.'}
const statChangedState:ArenaState={
  ...effectTriggeredState,stateVersion:17,
  players:[
    effectTriggeredState.players[0],
    {...effectTriggeredState.players[1],stats:{atk:0,def:750,sta:5}},
  ],
  message:'RIVAL VS ATK becomes 0.',
}

const attackPhaseState:ArenaState={...statChangedState,stateVersion:18,phase:'ATTACK',effectTurnIndex:null,message:'Attack phase.'}
const attackTurnState:ArenaState={...attackPhaseState,stateVersion:19,attackTurnIndex:0,message:'AKIRA attack turn.'}
const attackDeclaredState:ArenaState={...attackTurnState,stateVersion:20,message:'AKIRA attacks RIVAL.'}

const captureState:ArenaState={
  ...attackDeclaredState,stateVersion:21,
  players:[
    {...attackDeclaredState.players[0],zonX:[gravitian],capturedCount:1},
    {...attackDeclaredState.players[1],vs:null,stats:null},
  ],
  message:'AKIRA captures GRAVITIAN to ZON X.',
}

const destroyState:ArenaState={
  ...captureState,stateVersion:22,
  players:[
    {...captureState.players[0],effects:emptyEffects(),zonTepi:[singau]},
    captureState.players[1],
  ],
  message:'SINGAU is destroyed to ZON TEPI.',
}

const discardState:ArenaState={
  ...destroyState,stateVersion:23,
  players:[
    {...destroyState.players[0],hand:[nandez,blackHole,gravitian],handCount:3,zonTepi:[singau,xander]},
    destroyState.players[1],
  ],
  message:'XANDER discarded to ZON TEPI.',
}

const reconciledState:ArenaState={...discardState,stateVersion:24,message:'Authoritative state reconciled.'}

const step=(sequence:number,fromVersion:number,toVersion:number,event:ArenaEventEnvelope['event'],state:ArenaState)=>({
  envelope:{matchId:'prototype-match',sequence,fromVersion,toVersion,event} as ArenaEventEnvelope,
  state,
})

export const prototypeEventSequence:Array<{envelope:ArenaEventEnvelope;state:ArenaState}>=[
  {envelope:prototypeVsSetEvent,state:prototypeStateAfter},
  step(2,11,12,{type:'CARD_DRAWN',player:0,cardId:1,count:1},drawState),
  step(3,12,13,{type:'PHASE_CHANGED',from:'SET_VS',to:'EFFECT'},effectPhaseState),
  step(4,13,14,{type:'TURN_CHANGED',effectTurn:0,attackTurn:null},effectTurnState),
  step(5,14,15,{type:'EFFECT_PLAYED',player:0,cardId:2,effectSequence:1},effectPlayedState),
  step(6,15,16,{type:'EFFECT_TRIGGERED',player:0,cardId:2,targetPlayer:1},effectTriggeredState),
  step(7,16,17,{type:'STAT_CHANGED',player:1,before:{atk:800,def:750,sta:5},after:{atk:0,def:750,sta:5}},statChangedState),
  step(8,17,18,{type:'PHASE_CHANGED',from:'EFFECT',to:'ATTACK'},attackPhaseState),
  step(9,18,19,{type:'TURN_CHANGED',effectTurn:null,attackTurn:0},attackTurnState),
  step(10,19,20,{type:'ATTACK_DECLARED',attacker:0,defender:1},attackDeclaredState),
  step(11,20,21,{type:'CARD_CAPTURED',player:0,cardId:17,fromPlayer:1},captureState),
  step(12,21,22,{type:'CARD_DESTROYED',owner:0,cardId:2,from:'EFFECT',destination:'ZON_TEPI'},destroyState),
  step(13,22,23,{type:'CARD_DISCARDED',player:0,cardId:1,count:1},discardState),
  step(14,23,24,{type:'STATE_RECONCILED',reason:'RECOVERY'},reconciledState),
]
