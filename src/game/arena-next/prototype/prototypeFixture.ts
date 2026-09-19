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
